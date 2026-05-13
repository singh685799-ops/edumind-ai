const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/approve/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.paymentStatus = 'approved';
    user.plan = user.selectedPlan || 'Pro';
    await user.save();
    res.json({ message: 'Subscription activated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reject/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.paymentStatus = 'rejected';
    await user.save();
    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;