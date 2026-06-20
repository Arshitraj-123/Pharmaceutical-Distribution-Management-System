require('dotenv').config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT', 'NODE_ENV'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
    console.error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Routes & Cron
const dashboardRoutes = require('./routes/dashboard');
const ordersRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const retailersRoutes = require('./routes/retailers');
const productsRoutes = require('./routes/products');
const deliveryRoutes = require('./routes/delivery');
const invoicesRoutes = require('./routes/invoices');
const purchasesRoutes = require('./routes/purchases');
const schemesRoutes = require('./routes/schemes');
const complianceRoutes = require('./routes/compliance');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const usersRoutes = require('./routes/users');
const auditLogsRoutes = require('./routes/auditLogs');
require('./cron/jobs');

// Models
const User = require('./models/User');
const Otp = require('./models/Otp');
const Product = require('./models/Product');
const Company = require('./models/Company');
const Retailer = require('./models/Retailer');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
const Dispatch = require('./models/Dispatch');
const Invoice = require('./models/Invoice');
const Settings = require('./models/Settings');
const { logAction } = require('./utils/audit');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aadhya_pharmex_super_secret_key_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharma';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: No token provided'));
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded;
    next();
  });
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/retailers', retailersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
});

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Database: pharma');
    
    // Seed default settings if not exists
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        businessName: 'Aadhya Pharmex',
        address: '123 Pharma Hub, Kankarbagh, Patna, Bihar 800020',
        gstin: '10AAAAA1234A1Z5',
        drugLicense: 'DL-BR-PAT-123456',
        state: 'Bihar',
        stateCode: '10',
        bankDetails: {
          accountName: 'Aadhya Pharmex Current A/C',
          accountNumber: '123456789012',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank, Kankarbagh Branch'
        }
      });
      console.log('Default Settings seeded.');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', authLimiter, async (req, res) => {
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
    
    console.log(`\n========================================`);
    console.log(`[LOGIN 2FA OTP]`);
    console.log(`To: ${email}`);
    console.log(`Your Adhya Pharmex 2FA OTP is: ${otp}`);
    console.log(`========================================\n`);

    res.json({ message: 'Credentials verified, OTP sent.', step: 2, otp: otp });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 2b. LOGIN VERIFY (Step 2: Verify OTP and return JWT)
app.post('/api/auth/login-verify', authLimiter, async (req, res) => {
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
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  const { email, type } = req.body; 
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await Otp.create({ email, otp: hashedOtp, forLogin: false });
    
    console.log(`\n========================================`);
    console.log(`[SIMULATED ${type ? type.toUpperCase() : 'EMAIL'} OTP DISPATCH]`);
    console.log(`To: ${email}`);
    console.log(`Your Adhya Pharmex OTP is: ${otp}`);
    console.log(`========================================\n`);

    res.json({ message: 'OTP sent successfully', otp: otp });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
});

// 4. VERIFY OTP (Forgot Password)
app.post('/api/auth/verify-otp', async (req, res) => {
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
app.post('/api/auth/reset-password', async (req, res) => {
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

// Initialize dummy admin if not exists
const initDb = async () => {
  const admin = await User.findOne({ email: 'admin@adhyapharma.in' });
  if (!admin) {
    await User.create({
      fullName: 'Admin User',
      email: 'admin@adhyapharma.in',
      password: bcrypt.hashSync('Password123!', 12),
      role: 'Admin'
    });
    console.log('Dummy Admin user created');
  }
};

// TODO: REMOVE BEFORE PRODUCTION DEPLOY
// Mock Order route to test Socket.io emission
const { verifyToken } = require('./middleware/auth');
app.post('/api/orders/mock', verifyToken, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden in production' });
  }
  req.io.emit('dashboard:refresh-kpis');
  res.json({ message: 'Order placed, refreshing KPIs via socket' });
});

mongoose.connection.once('open', () => {
  initDb();
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
