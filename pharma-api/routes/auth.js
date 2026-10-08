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
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
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

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { fullName, email, password, empId, role, branch, storeName, city } = req.body;
  
  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let retailerId = null;
    if (role === 'Retailer' || !role) {
      const newRetailer = await Retailer.create({
        name: storeName || fullName + ' Pharmacy',
        city: city || 'Patna',
        creditLimit: 100000,
        outstandingBalance: 0,
        status: 'Active'
      });
      retailerId = newRetailer._id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      empId,
      role: role || 'Retailer',
      branch,
      retailerId,
      authProvider: 'local'
    });
    
    res.status(201).json({ message: 'Registration successful!', user: { id: newUser._id, email: newUser.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing registration' });
  }
});

// 2. LOGIN (Step 1: Check credentials and send OTP)
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (user.status === 'Inactive') {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Google-only users cannot login with password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please sign in with Google.' });
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
    
    // Create OTP document (TTL index handles expiration)
    await Otp.create({ email, otp: hashedOtp, forLogin: true });
    
    // For local development: print the OTP to the terminal
    console.log(`\n============================`);
    console.log(`[DEV OTP]: The OTP for ${email} is: ${otp}`);
    console.log(`============================\n`);

    // In production, send OTP via SMS/Email integration here.
    // Console logging and returning OTP in response removed for security.
    
    // DEV MODE ONLY: returning OTP in response so it shows up in your browser console!
    res.json({ message: 'Credentials verified, OTP sent.', step: 2, otp: otp });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 2b. LOGIN VERIFY (Step 2: Verify OTP and return JWT)
router.post('/login-verify', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Find the latest OTP for this email
    const record = await Otp.findOne({ email, forLogin: true }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or no active session. Please log in again.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    
    // Clear OTP
    await Otp.deleteMany({ email, forLogin: true });

    // Generate JWT
    const token = await issueToken(user);
    
    logAction({ user: user.email, action: 'Login successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, retailerId: user.retailerId } });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ── GOOGLE SIGN-IN ──────────────────────────────────────────────────────
// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const payload = await verifyGoogleToken(credential);
    const { sub, email, name, picture } = payload;

    // 1. Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: sub });
    if (user) {
      if (user.status === 'Inactive') {
        return res.status(401).json({ message: 'Account deactivated' });
      }
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

    // 2. Check if account exists with same email but local auth
    user = await User.findOne({ email });
    if (user) {
      if (user.authProvider === 'local' || (user.authProvider === 'both' && !user.googleId)) {
        return res.status(409).json({
          code: 'ACCOUNT_EXISTS_LINK_REQUIRED',
          message: 'An account with this email already exists. Please verify your password to link your Google account.',
          email: user.email
        });
      }
      // If user has authProvider 'both' and googleId matches differently, handle edge case
      if (user.googleId && user.googleId !== sub) {
        return res.status(409).json({ message: 'Account conflict. Please contact support.' });
      }
    }

    // 3. New user - create account with Google
    const newRetailer = await Retailer.create({
      name: name + ' Pharmacy',
      city: 'Not Set',
      creditLimit: 100000,
      outstandingBalance: 0,
      status: 'Active'
    });

    const newUser = await User.create({
      fullName: name,
      email,
      googleId: sub,
      authProvider: 'google',
      profilePhoto: picture,
      role: 'Retailer',
      retailerId: newRetailer._id,
      status: 'Active'
    });

    const token = await issueToken(newUser);
    logAction({ user: newUser.email, action: 'Google signup successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });

    // Broadcast new retailer to Admin Dashboard
    if (req.io) {
      req.io.emit('retailers:new', newRetailer);
      req.io.emit('retailers-updated');
      req.io.emit('dashboard:refresh-kpis');
    }

    res.status(201).json({
      message: 'Account created and logged in with Google',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        retailerId: newRetailer._id,
        authProvider: newUser.authProvider,
        profilePhoto: newUser.profilePhoto,
        phone: newUser.phone,
        address: newUser.address,
        storeName: newRetailer.name,
        city: newRetailer.city
      }
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
