const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchNo: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  qtyReceived: { type: Number, required: true },
  ptr: { type: Number, required: true }, // Cost price per unit
  lineTotal: { type: Number, required: true } // qtyReceived * ptr
});

const purchaseSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  supplierInvoiceNo: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  items: [purchaseItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Received', 'Cancelled'], default: 'Received' }
}, { timestamps: true });

// Prevent duplicate supplier invoices
purchaseSchema.index({ supplierId: 1, supplierInvoiceNo: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
