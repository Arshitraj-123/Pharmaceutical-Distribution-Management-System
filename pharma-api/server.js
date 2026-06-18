require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// Routes & Cron
const dashboardRoutes = require('./routes/dashboard');
const ordersRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const retailersRoutes = require('./routes/retailers');
const productsRoutes = require('./routes/products');
const deliveryRoutes = require('./routes/delivery');
require('./cron/jobs');

// Models
const User = require('./models/User');
const Otp = require('./models/Otp');
const Product = require('./models/Product');
const Company = require('./models/Company');
const Retailer = require('./models/Retailer');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');

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

app.use(cors());
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

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Database: pharma'))
  .catch(err => console.error('MongoDB connection error:', err));

// Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

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
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate 2FA OTP
    const otp = generateOTP();
    
    // Create OTP document (TTL index handles expiration)
    await Otp.create({ email, otp, forLogin: true });
    
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
app.post('/api/auth/login-verify', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Find the latest OTP for this email
    const record = await Otp.findOne({ email, forLogin: true }).sort({ createdAt: -1 });
    
    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or no active session. Please log in again.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.findOne({ email });
    
    // Clear OTP
    await Otp.deleteMany({ email, forLogin: true });

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// 3. FORGOT PASSWORD (Request OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, type } = req.body; 
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = generateOTP();
    await Otp.create({ email, otp, forLogin: false });
    
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

    if (record.otp !== otp) {
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
