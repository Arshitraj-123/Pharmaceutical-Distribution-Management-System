const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'aadhya_pharmex_super_secret_key_2026';

const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1] || req.query.token;
  
  if (!token) {
    return res.status(401).json({ code: 'AUTH_MISSING', message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is inactive
    const user = await User.findById(decoded.id).select('status');
    if (!user || user.status === 'Inactive') {
      return res.status(401).json({ code: 'AUTH_INACTIVE', message: 'Account deactivated.' });
    }

    req.user = decoded; // Contains id, email, role
    next();
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'AUTH_EXPIRED' : 'AUTH_INVALID';
    res.status(401).json({ code, message: 'Invalid or expired token.' });
  }
};

module.exports = { verifyToken };
