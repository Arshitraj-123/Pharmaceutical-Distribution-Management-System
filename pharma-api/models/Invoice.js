const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  lineItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    hsnCode: String,
    batchNo: String,
    expiryDate: Date,
    qty: Number,
    rate: Number,
    taxableAmount: Number,
    gstRate: Number,
    cgst: Number,
    sgst: Number,
    lineTotal: Number
  }],
  totalTaxable: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  irn: { type: String },
  irnStatus: { type: String, enum: ['Generated', 'Failed', 'Pending'], default: 'Pending' }
}, { timestamps: true });

InvoiceSchema.index({ invoiceNo: 1 });
InvoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
