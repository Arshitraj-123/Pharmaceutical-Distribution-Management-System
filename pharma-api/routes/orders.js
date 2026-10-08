const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const Retailer = require('../models/Retailer');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

// ── RETAILER ENDPOINTS ──────────────────────────────────────────────────

// GET /api/orders/my-orders - Get orders for the authenticated retailer
router.get('/my-orders', async (req, res) => {
  try {
    const retailerId = req.user.retailerId;
    if (!retailerId) {
      return res.status(403).json({ message: 'No retailer profile linked to this account' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { retailerId };
    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('retailerId', 'name city status')
      .populate({
        path: 'items',
        populate: [
          { path: 'productId', select: 'tradeName sku manufacturer' },
          { path: 'batchId', select: 'batchNo expiryDate' }
        ]
      });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your orders' });
  }
});

// GET /api/orders/:id/track - Get order tracking info
router.get('/:id/track', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderId status tracking statusHistory retailerId totalValue createdAt dispatchedAt deliveredAt cancelledAt cancelReason')
      .populate('retailerId', 'name city');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure user can only track their own orders (or is admin)
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!isAdmin && req.user.retailerId && order.retailerId?._id?.toString() !== req.user.retailerId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching tracking info' });
  }
});

// POST /api/orders/:id/cancel - Cancel an order (retailer or admin)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!isAdmin && req.user.retailerId && order.retailerId.toString() !== req.user.retailerId.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }

    // Business rule: Only these statuses are cancellable
    const cancellableStatuses = ['Pending', 'Confirmed', 'Processing', 'Credit Hold'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel order with status "${order.status}". Only orders that are Pending, Confirmed, Processing, or on Credit Hold can be cancelled.`
      });
    }

    // Restock inventory for each OrderItem
    const orderItems = await OrderItem.find({ orderId: order._id });
    for (const item of orderItems) {
      if (item.batchId) {
        await Inventory.findByIdAndUpdate(item.batchId, {
          $inc: { qtyAvailable: item.qtyOrdered }
        });
      }
    }

    // Update order
    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'Cancelled by user';
    order.cancelledBy = isAdmin ? 'Admin' : 'Retailer';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      comment: reason || 'Cancelled by user'
    });
    await order.save();

    // Emit Socket.IO events
    if (req.io) {
      req.io.emit('order:status-updated', { orderId: order._id, status: 'Cancelled', order });
      req.io.emit('orders:cancelled', { orderId: order._id, order });
      req.io.emit('dashboard:refresh-kpis');
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
});

// ── SHARED ENDPOINTS ────────────────────────────────────────────────────

// 1. POST /api/orders - Create order
router.post('/', [
  body('retailerId').isMongoId().withMessage('Invalid retailer ID'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.qtyOrdered').isInt({ gt: 0 }).withMessage('Quantity must be positive'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be non-negative'),
  body('items.*.discount').optional().isFloat({ min: 0 }),
  body('items.*.gstRate').optional().isFloat({ min: 0 })
], validate, async (req, res) => {
  try {
    const { retailerId, items, paymentMode } = req.body;

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      throw new Error('Retailer not found');
    }

    if (retailer.status === 'Suspended') {
      return res.status(400).json({ message: 'Retailer is suspended.' });
    }

    if (retailer.outstandingBalance >= retailer.creditLimit) {
      return res.status(400).json({ 
        message: 'Retailer is over their credit limit. New orders are blocked until payment is received.',
        retailer: {
          outstandingBalance: retailer.outstandingBalance,
          creditLimit: retailer.creditLimit
        }
      });
    }

    let totalValue = 0;
    const orderItemsToCreate = [];

    // Calculate total and prepare FEFO allocation
    for (const item of items) {
      const { productId, qtyOrdered, rate, discount = 0, gstRate = 0 } = item;
      
      const batches = await Inventory.find({ productId, qtyAvailable: { $gt: 0 } })
        .sort({ expiryDate: 1 });

      let qtyRemaining = qtyOrdered;
      
      for (const batch of batches) {
        if (qtyRemaining <= 0) break;

        const qtyToTake = Math.min(qtyRemaining, batch.qtyAvailable);
        
        // Atomic decrement with condition
        const updatedBatch = await Inventory.findOneAndUpdate(
          { _id: batch._id, qtyAvailable: { $gte: qtyToTake } },
          { $inc: { qtyAvailable: -qtyToTake } },
          { new: true }
        );

        if (!updatedBatch) {
          throw new Error(`Concurrency error: Batch ${batch.batchNo} stock changed during allocation. Please try again.`);
        }

        qtyRemaining -= qtyToTake;

        // Create an OrderItem for this batch slice
        const lineTotal = (rate - discount) * qtyToTake * (1 + gstRate / 100);
        totalValue += lineTotal;

        orderItemsToCreate.push({
          productId,
          batchId: batch._id,
          qtyOrdered: qtyToTake,
          qtySupplied: qtyToTake, // initial supplied matches ordered slice
          rate,
          discount,
          gstRate,
          lineTotal
        });
      }

      if (qtyRemaining > 0) {
        throw new Error(`Insufficient stock for product ${productId}. Short by ${qtyRemaining}.`);
      }
    }

    // Check credit limit
    let status = 'Pending';
    let statusCode = 201;
    let message = 'Order created successfully';

    if (retailer.outstandingBalance + totalValue > retailer.creditLimit) {
      status = 'Credit Hold';
      statusCode = 202;
      message = 'Order created but placed on Credit Hold due to limit breach';
    }

    // Create Order
    const orderIdStr = `ORD-${Date.now()}`;
    const [order] = await Order.create([{
      orderId: orderIdStr,
      retailerId,
      totalValue,
      paymentMode,
      status,
      statusHistory: [{ status, timestamp: new Date(), comment: 'Order placed' }]
    }]);

    // Link OrderItems to Order and save
    const orderItems = await OrderItem.create(
      orderItemsToCreate.map(oi => ({ ...oi, orderId: order._id }))
    );

    order.items = orderItems.map(oi => oi._id);
    await order.save();

    // Fully populate order before broadcasting to Admin Dashboard
    const populatedOrder = await Order.findById(order._id)
      .populate('retailerId', 'name city status tier creditLimit outstandingBalance')
      .populate({
        path: 'items',
        populate: [
          { path: 'productId', select: 'tradeName sku' },
          { path: 'batchId', select: 'batchNo expiryDate' }
        ]
      });

    // Emit event to Admin Dashboard & connected users
    if (req.io) {
      req.io.emit('dashboard:refresh-kpis');
      req.io.emit('orders:new', populatedOrder || order);
      req.io.emit('order-added');
    }

    res.status(statusCode).json({
      message,
      order,
      retailer: {
        outstandingBalance: retailer.outstandingBalance,
        creditLimit: retailer.creditLimit,
        orderTotal: totalValue
      }
    });

  } catch (err) {
    console.error(err);
    if (err.message.includes('Insufficient stock') || err.message.includes('Retailer not found')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error creating order' });
  }
});

// 2. PATCH /api/orders/:id/status - Update order status (admin)
router.patch('/:id/status', [
  body('status').isIn(['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Credit Hold']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const { status, comment } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === status) {
      return res.status(400).json({ message: `Order is already ${status}` });
    }

    // Validate state transition
    const allowedTransitions = {
      'Pending': ['Confirmed', 'Processing', 'Cancelled'],
      'Credit Hold': ['Pending', 'Confirmed', 'Processing', 'Cancelled'],
      'Confirmed': ['Processing', 'Dispatched', 'Cancelled'],
      'Processing': ['Dispatched', 'Cancelled'],
      'Dispatched': ['Out for Delivery', 'Delivered', 'Cancelled'],
      'Out for Delivery': ['Delivered'],
      'Delivered': [], // Terminal
      'Cancelled': []  // Terminal
    };

    if (!allowedTransitions[order.status] || !allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${status}` });
    }

    // If admin cancels, restock inventory
    if (status === 'Cancelled') {
      const orderItems = await OrderItem.find({ orderId: order._id });
      for (const item of orderItems) {
        if (item.batchId) {
          await Inventory.findByIdAndUpdate(item.batchId, {
            $inc: { qtyAvailable: item.qtyOrdered }
          });
        }
      }
      order.cancelledAt = new Date();
      order.cancelReason = comment || 'Cancelled by admin';
      order.cancelledBy = 'Admin';
    }

    // Guard update: ensure we only increment once when moving to Delivered
    if (status === 'Delivered' && order.status !== 'Delivered') {
      order.deliveredAt = new Date();
      // Update retailer ledger
      await Retailer.findByIdAndUpdate(order.retailerId, {
        $inc: { outstandingBalance: order.totalValue }
      });
      // TODO: Phase 2 - Trigger invoice finalization here
    }

    if (status === 'Dispatched') {
      order.dispatchedAt = new Date();
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      comment: comment || `Status updated to ${status}`
    });
    await order.save();

    if (req.io) {
      req.io.emit('dashboard:refresh-kpis');
      req.io.emit('order:status-updated', { orderId: order._id, status, order });
      if (status === 'Cancelled') {
        req.io.emit('orders:cancelled', { orderId: order._id, order });
      }
    }

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

// 3. GET /api/orders - List with filters
router.get('/', async (req, res) => {
  try {
    const { status, retailerId, startDate, endDate, city, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    if (retailerId) {
      query.retailerId = retailerId;
    } else if (city) {
      const retailersInCity = await Retailer.find({ city: new RegExp(city, 'i') }).select('_id');
      query.retailerId = { $in: retailersInCity.map(r => r._id) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('retailerId', 'name city status tier')
      .populate({
        path: 'items',
        populate: [
          { path: 'productId', select: 'tradeName sku' },
          { path: 'batchId', select: 'batchNo expiryDate' }
        ]
      });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

module.exports = router;
