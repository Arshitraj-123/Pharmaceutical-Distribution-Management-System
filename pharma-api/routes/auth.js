const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Settings = require('../models/Settings');
const { logAction } = require('../utils/audit');

const JWT_SECRET = process.env.JWT_SECRET || 'aadhya_pharmex_super_secret_key_2026';

// Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { fullName, email, password, empId, role, branch } = req.body;
  
  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      empId,
      role,
      branch
    });
    
    res.status(201).json({ message: 'Registration successful! Awaiting admin approval.', user: { id: newUser._id, email: newUser.email } });
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
    
    // In production, send OTP via SMS/Email integration here.
    // Console logging and returning OTP in response removed for security.

    res.json({ message: 'Credentials verified, OTP sent.', step: 2 });
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

    // Fetch dynamic session timeout
    const settings = await Settings.findOne();
    const timeoutMins = settings?.securityPolicy?.sessionTimeout || 60;

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: `${timeoutMins}m` });
    
    logAction({ user: user.email, action: 'Login successful', module: 'Auth', ipAddress: req.ip, status: 'Success' });
    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
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
    
    // In production, send OTP via SMS/Email integration here.
    // Console logging and returning OTP in response removed for security.

    res.json({ message: 'OTP sent successfully' });
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
