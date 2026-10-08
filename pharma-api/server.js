// Polyfill globalThis.crypto for Node 18 compatibility (prevents MongoDB driver SCRAM handshake errors)
if (typeof globalThis.crypto === 'undefined') {
  try {
    globalThis.crypto = require('crypto').webcrypto;
  } catch (e) {
    globalThis.crypto = require('crypto');
  }
}

require('dotenv').config();

// Ensure safe defaults so missing optional env vars don't crash Hostinger deployment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
    console.error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please configure them in your Hostinger environment variables or .env file.');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
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

const PORT = parseInt(process.env.PORT, 10) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aadhya_pharmex_super_secret_key_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharma';
const PUBLIC_HTML_PATH = process.env.PUBLIC_HTML_PATH || '/home/u777107112/domains/aadyamedicineagencies.com/public_html';

const app = express();

// Enable trust proxy for Hostinger reverse proxy (Nginx / Passenger / Cloudflare)
app.set('trust proxy', 1);

const server = http.createServer(app);

// Parse allowed frontend origins from environment variables
const parseAllowedOrigins = () => {
  const origins = [];
  if (process.env.FRONTEND_URL) {
    origins.push(...process.env.FRONTEND_URL.split(',').map(s => s.trim()));
  }
  if (process.env.ADMIN_URL) {
    origins.push(...process.env.ADMIN_URL.split(',').map(s => s.trim()));
  }
  if (process.env.RETAILER_URL) {
    origins.push(...process.env.RETAILER_URL.split(',').map(s => s.trim()));
  }
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()));
  }
  return origins.filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, Postman)
  if (!origin) return true;

  // Allow local development origins
  if (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('https://localhost')
  ) {
    return true;
  }

  // If no origins configured, allow all (helpful during initial deployment)
  if (allowedOrigins.length === 0) return true;

  // Check against allowed list (exact or without trailing slash)
  const cleanOrigin = origin.replace(/\/$/, '');
  return allowedOrigins.some(allowed => cleanOrigin === allowed.replace(/\/$/, ''));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
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

// Helmet with crossOriginResourcePolicy configured for cross-origin assets/PDFs
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Backend status endpoint (moved from root /)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    name: 'Aadya Pharma Distribution API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for uptime monitors and load balancers
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbStatusMap[dbState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
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
app.post('/api/create-order', paymentsRoutes.createOrderHandler);
app.post('/api/verify-payment', paymentsRoutes.verifyPaymentHandler);
app.use('/api/payments', paymentsRoutes);

// Mock Order route for testing (disabled in production)
const { verifyToken } = require('./middleware/auth');
app.post('/api/orders/mock', verifyToken, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden in production' });
  }
  req.io.emit('dashboard:refresh-kpis');
  res.json({ message: 'Order placed, refreshing KPIs via socket' });
});

// Catch unhandled API requests - NEVER rewrite /api/* to a frontend index.html
app.all(/^\/api(\/.*)?$/, (req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'API endpoint not found' });
});

// Serve static files from PUBLIC_HTML_PATH (assets, images, robots.txt, etc.)
app.use(express.static(PUBLIC_HTML_PATH, { dotfiles: 'allow' }));

// Missing asset 404 handler - prevents broken asset requests from returning HTML
app.get([/^\/assets(\/.*)?$/, /^\/admin\/assets(\/.*)?$/], (req, res) => {
  res.status(404).send('Asset not found');
});

// Admin SPA routes:
// Redirect /admin to /admin/ for proper asset base resolution
app.get('/admin', (req, res) => {
  res.redirect(301, '/admin/');
});

// Admin SPA fallback: /admin/* -> public_html/admin/index.html
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  const adminIndex = path.join(PUBLIC_HTML_PATH, 'admin', 'index.html');
  if (fs.existsSync(adminIndex)) {
    res.sendFile(adminIndex, { dotfiles: 'allow' });
  } else {
    res.status(404).send('Admin frontend build not found');
  }
});

// Retailer / Landing SPA Fallback: anything else -> public_html/index.html
app.get(/^(?!\/api).*$/, (req, res) => {
  const retailerIndex = path.join(PUBLIC_HTML_PATH, 'index.html');
  if (fs.existsSync(retailerIndex)) {
    res.sendFile(retailerIndex, { dotfiles: 'allow' });
  } else {
    res.status(404).send('Retailer frontend build not found');
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
});

// Initialize default Admin and Retailer users if not exist
const initDb = async () => {
  try {
    const shouldReset = process.env.RESET_DEFAULT_USERS === 'true';

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
    } else if (shouldReset) {
      admin.password = bcrypt.hashSync('Password123!', 12);
      admin.status = 'Active';
      admin.failedLoginAttempts = 0;
      admin.lockedUntil = null;
      await admin.save();
      console.log('Default Admin credentials refreshed (RESET_DEFAULT_USERS=true)');
    } else {
      console.log('Default Admin user verified (credentials preserved).');
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
    } else if (shouldReset) {
      retailerUser.password = bcrypt.hashSync('Password123!', 12);
      retailerUser.role = 'Retailer';
      retailerUser.status = 'Active';
      retailerUser.retailerId = retailer._id;
      retailerUser.failedLoginAttempts = 0;
      retailerUser.lockedUntil = null;
      await retailerUser.save();
      console.log('Default Retailer credentials refreshed (RESET_DEFAULT_USERS=true)');
    } else {
      console.log('Default Retailer user verified (credentials preserved).');
    }
  } catch (err) {
    console.error('Error during initDb database seeding:', err);
  }
};

// Database event listeners
mongoose.connection.on('connected', () => console.log('[MongoDB] Connected successfully.'));
mongoose.connection.on('error', (err) => console.error('[MongoDB] Connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Disconnected. Waiting for reconnection...'));

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
  .catch(err => console.error('Initial MongoDB connection error:', err));

mongoose.connection.once('open', () => {
  initDb();
});

// Start HTTP Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV}]`);
  console.log(`Serving static frontends from: ${PUBLIC_HTML_PATH}`);
});

// Graceful shutdown handler for Hostinger / PM2 / Passenger
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Gracefully shutting down HTTP server and database...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    console.error('Forcefully terminating process after shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
