const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Dispatch = require('../models/Dispatch');
const Order = require('../models/Order');
const Retailer = require('../models/Retailer');

router.use(verifyToken);

// GET all dispatches
router.get('/', async (req, res) => {
  try {
    const dispatches = await Dispatch.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'orders',
        populate: { path: 'retailerId', select: 'name city beat' }
      });
    res.json(dispatches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching dispatches' });
  }
});

// POST create a new dispatch
router.post('/', async (req, res) => {
  try {
    const { driver, beat, vehicle, assignType, manualOrders } = req.body;
    let orderIdsToAssign = [];

    if (assignType === 'auto') {
      // Find retailers in this beat
      const retailersInBeat = await Retailer.find({ beat }).select('_id');
      const retailerIds = retailersInBeat.map(r => r._id);

      // Find confirmed orders for these retailers
      const confirmedOrders = await Order.find({
        status: 'Confirmed',
        retailerId: { $in: retailerIds }
      });
      
      if (confirmedOrders.length === 0) {
        return res.status(400).json({ message: `No confirmed orders found for beat: ${beat}` });
      }
      orderIdsToAssign = confirmedOrders.map(o => o._id);
    } else {
      if (!manualOrders || manualOrders.length === 0) {
        return res.status(400).json({ message: 'Must select at least one order for manual assignment' });
      }
      orderIdsToAssign = manualOrders;
    }

    // Update the assigned orders to Dispatched
    await Order.updateMany(
      { _id: { $in: orderIdsToAssign } },
      { $set: { status: 'Dispatched', dispatchedAt: new Date() } }
    );

    // Create Dispatch run
    const runId = `DSP-${Date.now()}`;
    const newDispatch = new Dispatch({
      runId,
      driver,
      beat,
      vehicle,
      orders: orderIdsToAssign,
      status: 'In Transit', // Auto-start the dispatch
      dispatchedAt: new Date()
    });

    await newDispatch.save();

    if (req.io) {
      req.io.emit('dashboard:refresh-kpis');
    }

    res.status(201).json({ message: 'Dispatch created and started', dispatch: newDispatch, ordersAssigned: orderIdsToAssign.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating dispatch' });
  }
});

// PATCH update dispatch status (and cascade order deliveries)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, cashCollected } = req.body;
    const dispatch = await Dispatch.findById(req.params.id).populate('orders');

    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    if (dispatch.status === status) return res.status(400).json({ message: `Dispatch is already ${status}` });

    dispatch.status = status;
    
    let summary = {
      success: [],
      failed: []
    };

    if (status === 'Completed') {
      dispatch.completedAt = new Date();
      if (cashCollected !== undefined) {
        dispatch.cashCollected = Number(cashCollected);
      }

      // Process each order independently to apply the Delivered cascade
      for (const order of dispatch.orders) {
        try {
          if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
            order.status = 'Delivered';
            order.deliveredAt = new Date();
            
            // Replicate the idempotency guard and ledger update logic from routes/orders.js
            await Retailer.findByIdAndUpdate(order.retailerId, {
              $inc: { outstandingBalance: order.totalValue }
            });
            
            await order.save();
            summary.success.push(order.orderId);
          } else {
             // Already in a terminal state
             summary.success.push(order.orderId);
          }
        } catch (err) {
          console.error(`Failed to cascade Delivered status for order ${order.orderId}`, err);
          summary.failed.push({ orderId: order.orderId, error: err.message });
        }
      }
    }

    await dispatch.save();

    if (req.io) {
      req.io.emit('dashboard:refresh-kpis');
    }

    res.json({ message: 'Dispatch status updated', dispatch, cascadeSummary: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating dispatch' });
  }
});

module.exports = router;
