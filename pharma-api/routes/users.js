const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const User = require('../models/User');
const { logAction } = require('../utils/audit');

router.use(verifyToken);
router.use(requireRole('Super Admin', 'Admin', 'Manager', 'Operations Manager'));

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const query = req.query.includeInactive === 'true' ? {} : { status: { $ne: 'Inactive' } };
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { fullName, email, phone, branch, currentPassword, newPassword } = req.body;
    
    // Security Check: Verify current password
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to save changes' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Update basic details
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (branch) user.branch = branch;

    // Update password if requested
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    
    logAction({ user: req.user.email, action: 'Updated their own profile', module: 'Users', ipAddress: req.ip });
    res.json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { fullName, email, password, empId, role, branch } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password || 'Welcome@123', 12);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      empId,
      role,
      branch
    });

    const userObj = user.toObject();
    delete userObj.password;
    logAction({ user: req.user.email, action: `Created new user (${email})`, module: 'Users', ipAddress: req.ip });
    res.status(201).json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { fullName, role, branch, status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, role, branch, status },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    logAction({ user: req.user.email, action: `Updated user profile (${user.email})`, module: 'Users', ipAddress: req.ip });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/deactivate
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Inactive',
        deactivatedAt: new Date(),
        deactivatedBy: req.user.id
      },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    logAction({ user: req.user.email, action: `Deactivated user (${user.email})`, module: 'Users', ipAddress: req.ip });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
