const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/mark-paid', auth, async (req, res) => {
  try {
    const { plan, transactionId } = req.body;
    req.user.paymentStatus = 'pending';
    req.user.selectedPlan = plan;
    req.user.transactionId = transactionId;
    await req.user.save();
    res.json({ message: 'Payment marked as pending verification' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;