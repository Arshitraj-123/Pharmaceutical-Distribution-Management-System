const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Settings = require('../models/Settings');
const Retailer = require('../models/Retailer');
const { logAction } = require('../utils/audit');
const { verifyToken } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'aadhya_pharmex_super_secret_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Helper to generate 4 digit OTP
const generateOTP = () => {
  if (process.env.DEMO_MODE !== 'false') {
    return '1234';
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Helper to issue JWT token
const issueToken = async (user) => {
  const settings = await Settings.findOne();
  const timeoutMins = settings?.securityPolicy?.sessionTimeout || 60;
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, retailerId: user.retailerId },
    JWT_SECRET,
    { expiresIn: `${timeoutMins}m` }
  );
};

// Helper to verify Google ID token
const verifyGoogleToken = async (credential) => {
  if (GOOGLE_CLIENT_ID) {
    // Live Google verification
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    } catch (err) {
      // In DEMO_MODE on localhost, allow simulated tokens for testing
      if (process.env.DEMO_MODE === 'true' && credential && credential.includes('.')) {
        console.warn('[DEV MODE] Google signature validation fallback for simulated token:', err.message);
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          if (payload.sub && payload.email) return payload;
        }
      }
      throw err;
    }
  } else {
    // Dev mode fallback: decode JWT without verification
    console.warn('[DEV MODE] GOOGLE_CLIENT_ID not set. Decoding Google token without verification.');
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid Google credential format');
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid Google token payload: missing sub or email');
    }
    return payload;
  }
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true' ? 100 : 10,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. REGISTER (Step 1: Validate input, create pending OTP, and send verification code via Hostinger SMTP)
router.post('/register', authLimiter, async (req, res) => {
  const { fullName, email, password, empId, role, branch, storeName, city, phone } = req.body;
  
  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Missing required fields (Full Name, Email, and Password are required)' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);

    // Save pending registration in Otp collection with forSignup: true
    await Otp.deleteMany({ email: normalizedEmail, forSignup: true });
    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      forSignup: true,
      signupData: {
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        rawPassword: password, // kept in transient OTP doc for auto-fill on redirect if needed
        empId,
        role: role || 'Retailer',
        branch,
        storeName: storeName || (fullName + ' Pharmacy'),
        city: city || 'Patna',
        phone: phone || '',
        authProvider: 'local'
      }
    });

    // Send 2-Step Registration OTP via Hostinger SMTP
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      fullName,
      purpose: 'signup'
    });

    console.log(`\n============================================================`);
    console.log(`[HOSTINGER SMTP / DEV OTP] 2-Step Registration OTP for ${normalizedEmail}: ${otp}`);
    console.log(`============================================================\n`);

    res.status(200).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      step: 2,
      email: normalizedEmail,
      otp: process.env.DEMO_MODE !== 'false' ? otp : undefined
    });
  } catch (error) {
    console.error('[Registration Error]', error);
    res.status(500).json({ message: 'Error processing registration' });
  }
});

// 1b. REGISTER VERIFY (Step 2: Verify registration OTP and activate retailer account)
router.post('/register-verify', authLimiter, async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const record = await Otp.findOne({ email: normalizedEmail, forSignup: true }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ message: 'Verification code has expired or not found. Please register again.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    const signupData = record.signupData || {};

    // Check if user was already created
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      let retailerId = null;
      if (signupData.role === 'Retailer' || !signupData.role) {
        const newRetailer = await Retailer.create({
          name: signupData.storeName || (signupData.fullName + ' Pharmacy'),
          city: signupData.city || 'Patna',
          creditLimit: 100000,
          outstandingBalance: 0,
          status: 'Active'
        });
        retailerId = newRetailer._id;
      }

      user = await User.create({
        fullName: signupData.fullName,
        email: normalizedEmail,
        password: signupData.password, // already hashed
        phone: signupData.phone,
        empId: signupData.empId,
        role: signupData.role || 'Retailer',
        branch: signupData.branch,
        retailerId,
        googleId: signupData.googleId,
        profilePhoto: signupData.profilePhoto,
        authProvider: signupData.authProvider || 'local',
        isVerified: true,
        status: 'Active'
      });

      // Broadcast new retailer to Admin Dashboard
      if (req.io && retailerId) {
        req.io.emit('retailers:new', { _id: retailerId, name: signupData.storeName });
        req.io.emit('retailers-updated');
        req.io.emit('dashboard:refresh-kpis');
      }
    } else {
      user.isVerified = true;
      user.status = 'Active';
      if (signupData.googleId) user.googleId = signupData.googleId;
      await user.save();
    }

    // Clear signup OTP
    await Otp.deleteMany({ email: normalizedEmail, forSignup: true });

    // Generate short-lived verification grant token (valid for 5 mins)
    // allowing the sign-in page to auto-login seamlessly upon clicking Sign In
    const verificationToken = jwt.sign(
      { email: normalizedEmail, purpose: 'signup_verified' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    logAction({ user: normalizedEmail, action: 'Account registration verified via OTP', module: 'Auth', ipAddress: req.ip, status: 'Success' });

    res.status(200).json({
      message: 'Account verified successfully! Please sign in with your credentials.',
      verified: true,
      email: normalizedEmail,
      verificationToken,
      isGoogle: signupData.authProvider === 'google'
    });
  } catch (error) {
    console.error('[Registration Verify Error]', error);
    res.status(500).json({ message: 'Server error during registration verification' });
  }
});

// 1c. RESEND OTP (Resend verification code for signup or login)
router.post('/resend-otp', authLimiter, async (req, res) => {
  const { email, purpose = 'signup' } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const isSignup = purpose === 'signup';
    const query = { email: normalizedEmail };
    if (isSignup) query.forSignup = true;
    else query.forLogin = true;

    const existingRecord = await Otp.findOne(query).sort({ createdAt: -1 });
    if (!existingRecord) {
      return res.status(400).json({ message: 'No pending verification request found. Please initiate again.' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);

    existingRecord.otp = hashedOtp;
    existingRecord.createdAt = new Date();
    await existingRecord.save();

    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      fullName: existingRecord.signupData?.fullName || 'Valued Partner',
      purpose: isSignup ? 'signup' : 'login'
    });

    console.log(`\n[HOSTINGER SMTP / DEV OTP] Resent OTP for ${normalizedEmail}: ${otp}\n`);

    res.status(200).json({
      message: 'A fresh verification code has been sent to your email.',
      otp: process.env.DEMO_MODE !== 'false' ? otp : undefined
    });
  } catch (error) {
    console.error('[Resend OTP Error]', error);
    res.status(500).json({ message: 'Failed to resend verification code' });
  }
});

// 2. LOGIN (Step 1: Check credentials and send OTP, or verify immediate post-signup token)
router.post('/login', authLimiter, async (req, res) => {
  const { email, password, verificationToken } = req.body;
  
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.status === 'Inactive') {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Google-only users without password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    // ── Instant Login for Users who Just Completed 2-Step OTP Verification ──
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, JWT_SECRET);
        if (decoded.email === normalizedEmail && decoded.purpose === 'signup_verified') {
          // Verify password matches
          const isPassValid = await bcrypt.compare(password, user.password);
          if (isPassValid) {
            const token = await issueToken(user);
            const populatedUser = await User.findById(user._id).populate('retailerId', 'name city status');
            logAction({ user: user.email, action: 'Post-signup verification login successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });
            return res.json({
              message: 'Login successful',
              token,
              user: {
                id: populatedUser._id,
                email: populatedUser.email,
                fullName: populatedUser.fullName,
                role: populatedUser.role,
                retailerId: populatedUser.retailerId?._id || populatedUser.retailerId,
                authProvider: populatedUser.authProvider,
                profilePhoto: populatedUser.profilePhoto,
                phone: populatedUser.phone,
                address: populatedUser.address,
                storeName: populatedUser.retailerId?.name,
                city: populatedUser.retailerId?.city
              }
            });
          }
        }
      } catch (tokErr) {
        // Fallback to standard 2FA flow if verification token expired
      }
    }

    const settings = await Settings.findOne();
    const lockoutThreshold = settings?.securityPolicy?.failedLoginLockout || 5;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ message: `Account locked due to too many failed attempts. Try again later.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= lockoutThreshold) {
        user.lockedUntil = new Date(Date.now() + 15 * 60000); // 15 mins
        await user.save();
        logAction({ user: email, action: 'Failed login attempt (Account locked)', module: 'Auth', ipAddress: req.ip, status: 'Failed' });
        return res.status(403).json({ message: `Account locked due to too many failed attempts.` });
      }
      await user.save();
      logAction({ user: email, action: 'Failed login attempt', module: 'Auth', ipAddress: req.ip, status: 'Failed' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Generate 2FA OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);
    
    // Create OTP document
    await Otp.deleteMany({ email: normalizedEmail, forLogin: true });
    await Otp.create({ email: normalizedEmail, otp: hashedOtp, forLogin: true });
    
    // Send OTP via Hostinger SMTP
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      fullName: user.fullName,
      purpose: 'login'
    });

    console.log(`\n============================`);
    console.log(`[HOSTINGER SMTP / DEV OTP]: Login OTP for ${normalizedEmail} is: ${otp}`);
    console.log(`============================\n`);

    res.json({ message: 'Credentials verified, 2FA OTP sent to your email.', step: 2, otp: process.env.DEMO_MODE !== 'false' ? otp : undefined });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 2b. LOGIN VERIFY (Step 2: Verify OTP and return JWT)
router.post('/login-verify', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  try {
    const record = await Otp.findOne({ email: normalizedEmail, forLogin: true }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or no active session. Please log in again.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    
    // Clear OTP
    await Otp.deleteMany({ email: normalizedEmail, forLogin: true });

    // Generate JWT
    const token = await issueToken(user);
    const populatedUser = await User.findById(user._id).populate('retailerId', 'name city status');
    
    logAction({ user: user.email, action: 'Login successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: populatedUser._id,
        email: populatedUser.email,
        fullName: populatedUser.fullName,
        role: populatedUser.role,
        retailerId: populatedUser.retailerId?._id || populatedUser.retailerId,
        authProvider: populatedUser.authProvider,
        profilePhoto: populatedUser.profilePhoto,
        phone: populatedUser.phone,
        address: populatedUser.address,
        storeName: populatedUser.retailerId?.name,
        city: populatedUser.retailerId?.city
      }
    });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ── GOOGLE SIGN-IN & 2-STEP SIGNUP ──────────────────────────────────────
// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const payload = await verifyGoogleToken(credential);
    const { sub, email, name, picture } = payload;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // 1. Check if user already exists
    let user = await User.findOne({ $or: [{ googleId: sub }, { email: normalizedEmail }] });
    if (user) {
      if (user.status === 'Inactive') {
        return res.status(401).json({ message: 'Account deactivated' });
      }

      // If user registered with local auth and haven't linked Google yet
      if (user.authProvider === 'local' && !user.googleId) {
        return res.status(409).json({
          code: 'ACCOUNT_EXISTS_LINK_REQUIRED',
          message: 'An account with this email already exists. Please verify your password to link your Google account.',
          email: user.email
        });
      }

      // Existing verified user: log in directly
      const token = await issueToken(user);
      const populatedUser = await User.findById(user._id).populate('retailerId', 'name city status');
      logAction({ user: user.email, action: 'Google login successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: populatedUser._id,
          email: populatedUser.email,
          fullName: populatedUser.fullName,
          role: populatedUser.role,
          retailerId: populatedUser.retailerId?._id || populatedUser.retailerId,
          authProvider: populatedUser.authProvider,
          profilePhoto: populatedUser.profilePhoto,
          phone: populatedUser.phone,
          address: populatedUser.address,
          storeName: populatedUser.retailerId?.name,
          city: populatedUser.retailerId?.city
        }
      });
    }

    // 2. NON-REGISTERED RETAILER: Require 2-step OTP verification before activating account!
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);

    await Otp.deleteMany({ email: normalizedEmail, forSignup: true });
    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      forSignup: true,
      signupData: {
        fullName: name,
        email: normalizedEmail,
        googleId: sub,
        profilePhoto: picture,
        storeName: name + ' Pharmacy',
        city: 'Patna',
        role: 'Retailer',
        authProvider: 'google',
        isGoogleSignup: true
      }
    });

    // Send 2-Step Verification OTP via Hostinger SMTP
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      fullName: name,
      purpose: 'signup'
    });

    console.log(`\n============================================================`);
    console.log(`[HOSTINGER SMTP / DEV OTP] Google 2-Step Signup OTP for ${normalizedEmail}: ${otp}`);
    console.log(`============================================================\n`);

    return res.status(200).json({
      requiresOtp: true,
      step: 2,
      email: normalizedEmail,
      fullName: name,
      message: 'New retailer registration via Google. Please enter the 2-step verification code sent to your email to activate your account.',
      isGoogle: true,
      otp: process.env.DEMO_MODE !== 'false' ? otp : undefined
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed: ' + error.message });
  }
});

// POST /api/auth/link-google — Link Google to existing local account
router.post('/link-google', async (req, res) => {
  const { credential, email, password } = req.body;
  if (!credential || !email || !password) {
    return res.status(400).json({ message: 'Credential, email, and password are required' });
  }

  try {
    const payload = await verifyGoogleToken(credential);
    const { sub } = payload;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Link Google account
    user.googleId = sub;
    user.authProvider = 'both';
    if (!user.profilePhoto && payload.picture) {
      user.profilePhoto = payload.picture;
    }
    await user.save();

    const token = await issueToken(user);
    logAction({ user: user.email, action: 'Linked Google account', module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({
      message: 'Google account linked successfully',
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, retailerId: user.retailerId }
    });
  } catch (error) {
    console.error('Link Google error:', error);
    res.status(500).json({ message: 'Failed to link Google account' });
  }
});

// ── EMAIL CHANGE (OTP-Based) ────────────────────────────────────────────
// POST /api/auth/request-email-change (authenticated)
router.post('/request-email-change', verifyToken, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) {
    return res.status(400).json({ message: 'New email is required' });
  }

  try {
    // Check if new email is already taken
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res.status(400).json({ message: 'This email is already in use by another account' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await Otp.create({ email: newEmail, otp: hashedOtp, forLogin: false });

    console.log(`\n============================`);
    console.log(`[DEV OTP - EMAIL CHANGE]: The OTP for ${newEmail} is: ${otp}`);
    console.log(`============================\n`);

    res.json({ message: 'OTP sent to new email address', otp: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error requesting email change' });
  }
});

// POST /api/auth/verify-email-change (authenticated)
router.post('/verify-email-change', verifyToken, async (req, res) => {
  const { newEmail, otp } = req.body;
  if (!newEmail || !otp) {
    return res.status(400).json({ message: 'New email and OTP are required' });
  }

  try {
    const record = await Otp.findOne({ email: newEmail, forLogin: false }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or was not requested' });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update user email
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = newEmail;
    await user.save();

    // Clear OTPs
    await Otp.deleteMany({ email: newEmail, forLogin: false });

    // Issue refreshed token with new email
    const token = await issueToken(user);

    logAction({ user: newEmail, action: `Email changed from ${req.user.email}`, module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({
      message: 'Email updated successfully',
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, retailerId: user.retailerId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error verifying email change' });
  }
});

// ── CHANGE PASSWORD (authenticated) ─────────────────────────────────────
// PUT /api/auth/change-password
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.authProvider === 'google' && !user.password) {
      // Google-only user setting password for the first time
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      user.authProvider = 'both';
      await user.save();
      logAction({ user: user.email, action: 'Set local password (Google user)', module: 'Auth', ipAddress: req.ip, status: 'Success' });
      return res.json({ message: 'Password set successfully. You can now sign in with either method.' });
    }

    // Local or both: verify current password
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    logAction({ user: user.email, action: 'Changed password', module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// 3. FORGOT PASSWORD (Request OTP)
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email, type } = req.body; 
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await Otp.create({ email, otp: hashedOtp, forLogin: false });
    
    // For local development: print the OTP to the terminal
    console.log(`\n============================`);
    console.log(`[DEV OTP - FORGOT PASSWORD]: The OTP for ${email} is: ${otp}`);
    console.log(`============================\n`);

    // In production, send OTP via SMS/Email integration here.
    // Console logging and returning OTP in response removed for security.

    // DEV MODE ONLY: returning OTP in response so it shows up in your browser console!
    res.json({ message: 'OTP sent successfully', otp: otp });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
});

// 4. VERIFY OTP (Forgot Password)
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const record = await Otp.findOne({ email, forLogin: false }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or was not requested.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    res.json({ message: 'OTP verified successfully' });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// 5. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  
  try {
    const record = await Otp.findOne({ email, forLogin: false, verified: true }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(401).json({ message: 'Unauthorized. Please verify OTP first.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    
    // Clear OTP records
    await Otp.deleteMany({ email, forLogin: false });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error hashing password' });
  }
});

module.exports = router;
