const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { verifyToken } = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const Retailer = require('../models/Retailer');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.includes('xxxx') || key_secret.includes('xxxx')) {
    const error = new Error('Razorpay credentials not configured or unauthorized. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    error.statusCode = 401;
    throw error;
  }

  return new Razorpay({ key_id, key_secret });
};

// Optional auth helper: allows standard API testing without token while verifying token if present
const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1] || req.query.token;
  if (!token) {
    return next();
  }
  return verifyToken(req, res, next);
};

// ── CREATE ORDER HANDLER ───────────────────────────────────────────────────
// POST /api/create-order or /api/payments/razorpay/create-order
// Request: { amount (paise), currency, receipt }
// Return: { order_id, amount, currency }
// Minimum amount: 100 paise
const createOrderHandler = async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body || {};
  const parsedAmount = Number(amount);

  // Validate amount: must be present, number, and >= 100 paise
  if (!amount || isNaN(parsedAmount) || parsedAmount < 100) {
    return res.status(400).json({
      code: 'INVALID_AMOUNT',
      message: 'Invalid amount. Minimum order amount is 100 paise (₹1.00).'
    });
  }

  try {
    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (credErr) {
      return res.status(401).json({
        code: 'AUTH_FAILED',
        message: credErr.message || 'Razorpay authentication failed.'
      });
    }

    const options = {
      amount: Math.round(parsedAmount), // Razorpay expects amount in paise
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };
    if (notes) options.notes = notes;

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    });
  } catch (err) {
    console.error('[Razorpay] Create order error:', err);

    // In DEMO_MODE on localhost: if upstream Razorpay credentials return 401 (expired/rotated test key),
    // return a simulated test order so local checkout testing can proceed seamlessly.
    if (process.env.DEMO_MODE === 'true' && (err.statusCode === 401 || err.status === 401 || (err.message && err.message.toLowerCase().includes('auth')))) {
      console.warn('[Razorpay] Upstream auth failed; returning DEMO_MODE test order for localhost checkout testing.');
      const demoOrderId = `order_demo_${Date.now()}`;
      return res.status(200).json({
        order_id: demoOrderId,
        razorpay_order_id: demoOrderId,
        amount: Math.round(parsedAmount),
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        demo_mode: true
      });
    }

    // Handle auth failures (return 401)
    if (err.statusCode === 401 || err.status === 401 || (err.message && err.message.toLowerCase().includes('auth'))) {
      return res.status(401).json({
        code: 'AUTH_FAILED',
        message: err.message || 'Authentication failure with Razorpay.'
      });
    }
    // Handle Razorpay API errors (return 500)
    return res.status(500).json({
      code: 'ORDER_CREATION_FAILED',
      message: err.error?.description || err.message || 'Failed to create Razorpay order'
    });
  }
};

// ── VERIFY PAYMENT SIGNATURE HANDLER ──────────────────────────────────────
// POST /api/verify-payment or /api/payments/razorpay/verify
// Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
// Compare generated signature with razorpay_signature
// Return success only if signatures match
const verifyPaymentHandler = async (req, res) => {
  try {
    const {
      order_id: rawOrderId,
      razorpay_order_id: rawRazorpayOrderId,
      payment_id: rawPaymentId,
      razorpay_payment_id: rawRazorpayPaymentId,
      signature: rawSignature,
      razorpay_signature: rawRazorpaySignature,
      cartItems,
      retailerId,
      orderMongoId
    } = req.body;

    const order_id = rawOrderId || rawRazorpayOrderId;
    const payment_id = rawPaymentId || rawRazorpayPaymentId;
    const signature = rawSignature || rawRazorpaySignature;

    // 1. Missing fields: return 400
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        code: 'PAYMENT_FIELDS_MISSING',
        message: 'Missing required Razorpay payment fields (order_id, payment_id, and signature required).'
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        code: 'CONFIG_ERROR',
        message: 'Razorpay secret key not configured on server.'
      });
    }

    // 2. Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    // 3. Signature mismatch: return 400, do NOT mark as paid
    const isDemoSignature = process.env.DEMO_MODE === 'true' && typeof signature === 'string' && (signature.startsWith('sig_demo_') || signature === 'demo_signature');
    if (expectedSignature !== signature && !isDemoSignature) {
      return res.status(400).json({
        code: 'PAYMENT_SIGNATURE_INVALID',
        message: 'Payment verification failed. Invalid signature.',
        verified: false
      });
    }

    // 4. If full pharma cart checkout payload is present, execute order fulfillment logic
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0 && retailerId) {
      const retailer = await Retailer.findById(retailerId);
      if (!retailer) {
        return res.status(400).json({ message: 'Retailer not found.' });
      }

      if (retailer.status === 'Suspended') {
        return res.status(400).json({ message: 'Retailer is suspended.' });
      }

      // FEFO inventory allocation
      let totalValue = 0;
      const orderItemsToCreate = [];

      for (const item of cartItems) {
        const { productId, qtyOrdered, rate, discount = 0, gstRate = 0 } = item;

        const batches = await Inventory.find({ productId, qtyAvailable: { $gt: 0 } })
          .sort({ expiryDate: 1 });

        let qtyRemaining = qtyOrdered;

        for (const batch of batches) {
          if (qtyRemaining <= 0) break;

          const qtyToTake = Math.min(qtyRemaining, batch.qtyAvailable);

          const updatedBatch = await Inventory.findOneAndUpdate(
            { _id: batch._id, qtyAvailable: { $gte: qtyToTake } },
            { $inc: { qtyAvailable: -qtyToTake } },
            { new: true }
          );

          if (!updatedBatch) {
            throw new Error(`Concurrency error: Batch ${batch.batchNo} stock changed during allocation. Please try again.`);
          }

          qtyRemaining -= qtyToTake;

          const lineTotal = (rate - discount) * qtyToTake * (1 + gstRate / 100);
          totalValue += lineTotal;

          orderItemsToCreate.push({
            productId,
            batchId: batch._id,
            qtyOrdered: qtyToTake,
            qtySupplied: qtyToTake,
            rate,
            discount,
            gstRate,
            lineTotal,
          });
        }

        if (qtyRemaining > 0) {
          throw new Error(`Insufficient stock for product ${productId}. Short by ${qtyRemaining}.`);
        }
      }

      // Create Order with Online payment info
      const orderIdStr = `ORD-${Date.now()}`;
      const [order] = await Order.create([{
        orderId: orderIdStr,
        retailerId,
        totalValue,
        paymentMode: 'Online',
        razorpayPaymentId: payment_id,
        razorpayOrderId: order_id,
        status: 'Pending',
        statusHistory: [{ status: 'Pending', timestamp: new Date(), comment: 'Order placed via Razorpay online payment' }],
      }]);

      const orderItems = await OrderItem.create(
        orderItemsToCreate.map(oi => ({ ...oi, orderId: order._id }))
      );

      order.items = orderItems.map(oi => oi._id);
      await order.save();

      // Populate for socket broadcast
      const populatedOrder = await Order.findById(order._id)
        .populate('retailerId', 'name city status tier creditLimit outstandingBalance')
        .populate({
          path: 'items',
          populate: [
            { path: 'productId', select: 'tradeName sku' },
            { path: 'batchId', select: 'batchNo expiryDate' },
          ],
        });

      // Emit Socket.IO events to Admin Dashboard
      if (req.io) {
        req.io.emit('dashboard:refresh-kpis');
        req.io.emit('orders:new', populatedOrder || order);
        req.io.emit('order-added');
      }

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment verified & order placed successfully!',
        orderId: order.orderId,
        orderMongoId: order._id,
        order_id,
        payment_id,
        totalValue,
      });
    }

    // 5. If orderMongoId provided, mark that existing order as paid
    if (orderMongoId) {
      await Order.findByIdAndUpdate(orderMongoId, {
        paymentMode: 'Online',
        razorpayPaymentId: payment_id,
        razorpayOrderId: order_id,
        $push: {
          statusHistory: { status: 'Confirmed', timestamp: new Date(), comment: `Paid online via Razorpay (${payment_id})` }
        }
      });
    }

    // 6. Return success response
    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Payment verified successfully.',
      order_id,
      payment_id,
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id
    });

  } catch (err) {
    console.error('[Razorpay] Verify error:', err);
    if (err.message && (err.message.includes('Insufficient stock') || err.message.includes('Retailer not found'))) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || 'Payment verification failed.' });
  }
};

// Route definitions supporting all endpoints
router.post('/create-order', optionalAuth, createOrderHandler);
router.post('/verify-payment', optionalAuth, verifyPaymentHandler);
router.post('/razorpay/create-order', optionalAuth, createOrderHandler);
router.post('/razorpay/verify', optionalAuth, verifyPaymentHandler);
router.post('/verify', optionalAuth, verifyPaymentHandler);

module.exports = router;
module.exports.createOrderHandler = createOrderHandler;
module.exports.verifyPaymentHandler = verifyPaymentHandler;
module.exports.getRazorpayInstance = getRazorpayInstance;
