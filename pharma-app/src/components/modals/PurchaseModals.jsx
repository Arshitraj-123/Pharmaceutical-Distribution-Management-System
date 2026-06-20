import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function NewPurchaseModal({ onClose }) {
    const [supplier, setSupplier] = useState("");
    const [expectedDate, setExpectedDate] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>New Purchase Order</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Create a PO for a supplier</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Supplier (Company) *</label>
                        <select value={supplier} onChange={e => setSupplier(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select supplier…</option>
                            <option value="s1">Sun Pharma</option>
                            <option value="s2">Cipla Ltd</option>
                            <option value="s3">Mankind Pharma</option>
                            <option value="s4">Alkem Labs</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Expected Delivery Date *</label>
                        <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Notes / Terms (optional)</label>
                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, special instructions..."
                            style={{ width: "100%", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: B.surface }} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Create PO</button>
                    </div>
                </div>
            </div>
        </div>
    );
}



export function ViewPurchaseModal({ purchase, onClose }) {
    if (!purchase) return null;

    const formatAmt = amt => `₹${Math.round(amt).toLocaleString('en-IN')}`;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(700px,95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>Purchase Details</div>
                        <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 2 }}>Supplier Invoice: <span style={{ color: B.navyMid, fontWeight: 500 }}>{purchase.supplierInvoiceNo}</span></div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24, padding: "16px", background: B.surface, borderRadius: 8 }}>
                        <div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 4 }}>Supplier</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>{purchase.supplierId?.name || "Unknown"}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 4 }}>Invoice Date</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>{new Date(purchase.invoiceDate).toLocaleDateString('en-IN')}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 4 }}>Received On</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>{new Date(purchase.createdAt).toLocaleDateString('en-IN')}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 4 }}>Total Amount</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navyMid }}>{formatAmt(purchase.totalAmount)}</div>
                        </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 600, color: B.textPrimary, marginBottom: 12 }}>Items Received</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${B.border}`, color: B.textSecondary, textAlign: "left" }}>
                                <th style={{ padding: "8px 4px", fontWeight: 500 }}>Product</th>
                                <th style={{ padding: "8px 4px", fontWeight: 500 }}>Batch</th>
                                <th style={{ padding: "8px 4px", fontWeight: 500 }}>Expiry</th>
                                <th style={{ padding: "8px 4px", fontWeight: 500, textAlign: "right" }}>Qty</th>
                                <th style={{ padding: "8px 4px", fontWeight: 500, textAlign: "right" }}>PTR</th>
                                <th style={{ padding: "8px 4px", fontWeight: 500, textAlign: "right" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.items?.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: `1px solid ${B.surface}` }}>
                                    <td style={{ padding: "10px 4px", color: B.textPrimary, fontWeight: 500 }}>{item.productId?.tradeName || "Unknown Product"}</td>
                                    <td style={{ padding: "10px 4px", color: B.textSecondary }}>{item.batchNo}</td>
                                    <td style={{ padding: "10px 4px", color: B.textSecondary }}>{new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                                    <td style={{ padding: "10px 4px", textAlign: "right", color: B.textPrimary }}>{item.qtyReceived}</td>
                                    <td style={{ padding: "10px 4px", textAlign: "right", color: B.textPrimary }}>₹{item.ptr?.toFixed(2)}</td>
                                    <td style={{ padding: "10px 4px", textAlign: "right", color: B.textPrimary, fontWeight: 500 }}>{formatAmt(item.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", background: B.surface, borderRadius: "0 0 14px 14px" }}>
                    <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, fontWeight: 500, color: B.textPrimary, cursor: "pointer", fontFamily: "inherit" }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}


