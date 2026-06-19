const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.use(verifyToken);

// Get latest notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ userId: req.user.id }, { userId: null }]
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({
      $or: [{ userId: req.user.id }, { userId: null }],
      read: false
    }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
