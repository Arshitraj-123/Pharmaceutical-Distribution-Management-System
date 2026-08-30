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
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
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
    
    // Seed or update default settings
    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          businessName: 'Aadya Medicine Agencies',
          legalName: 'RIYA KAUSHIK',
          tradeName: 'AADYA MEDICINE AGENCIES',
          phone: '7217521744',
          constitution: 'Proprietorship',
          registrationNumber: '09MHMPK6914Q1Z5',
          registrationDate: new Date('2026-06-06'),
          address: 'Nagar Nigam Number 14/1679, Kishanpura, Saharanpur, Uttar Pradesh 247001',
          gstin: '09MHMPK6914Q1Z5',
          drugLicense: 'DL-BR-PAT-123456',
          state: 'Uttar Pradesh',
          stateCode: '09',
        },
        $setOnInsert: {
          bankDetails: {
            accountName: 'Aadya Medicine Agencies Current A/C',
            accountNumber: '123456789012',
            ifsc: 'HDFC0001234',
            bankName: 'HDFC Bank, Kankarbagh Branch'
          }
        }
      },
      { upsert: true, new: true }
    );
    console.log('Default Settings verified & updated.');
  })
  .catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Initialize default Admin and Retailer users if not exist
const initDb = async () => {
  try {
    // 1. Admin User
    let admin = await User.findOne({ email: 'admin@adhyapharma.in' });
    if (!admin) {
      admin = await User.create({
        fullName: 'Admin User',
        email: 'admin@adhyapharma.in',
        password: bcrypt.hashSync('Password123!', 12),
        role: 'Admin',
        status: 'Active',
        failedLoginAttempts: 0,
        lockedUntil: null
      });
      console.log('Default Admin user created (admin@adhyapharma.in / Password123!)');
    } else {
      admin.password = bcrypt.hashSync('Password123!', 12);
      admin.status = 'Active';
      admin.failedLoginAttempts = 0;
      admin.lockedUntil = null;
      await admin.save();
      console.log('Default Admin credentials verified and refreshed');
    }

    // 2. Retailer Profile & User (Apollo Pharmacy)
    let retailer = await Retailer.findOne({ name: 'Apollo Pharmacy' });
    if (!retailer) {
      retailer = await Retailer.create({
        name: 'Apollo Pharmacy',
        city: 'Saharanpur',
        creditLimit: 200000,
        outstandingBalance: 0,
        status: 'Active'
      });
      console.log('Default Retailer profile created: Apollo Pharmacy');
    }

    let retailerUser = await User.findOne({ email: 'retailer@adhyapharma.in' });
    if (!retailerUser) {
      retailerUser = await User.create({
        fullName: 'Apollo Retailer',
        email: 'retailer@adhyapharma.in',
        password: bcrypt.hashSync('Password123!', 12),
        role: 'Retailer',
        status: 'Active',
        retailerId: retailer._id,
        failedLoginAttempts: 0,
        lockedUntil: null
      });
      console.log('Default Retailer user created (retailer@adhyapharma.in / Password123!)');
    } else {
      retailerUser.password = bcrypt.hashSync('Password123!', 12);
      retailerUser.role = 'Retailer';
      retailerUser.status = 'Active';
      retailerUser.retailerId = retailer._id;
      retailerUser.failedLoginAttempts = 0;
      retailerUser.lockedUntil = null;
      await retailerUser.save();
      console.log('Default Retailer credentials verified and refreshed');
    }
  } catch (err) {
    console.error('Error during initDb database seeding:', err);
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
