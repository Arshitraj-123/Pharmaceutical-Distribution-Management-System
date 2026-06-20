import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function NewOrderModal({ onClose }) {
    const [retailer, setRetailer] = useState("");
    const [items, setItems] = useState([{ product: "", qty: "", rate: "" }]);
    const [retailersList, setRetailersList] = useState([]);
    const [inventoryList, setInventoryList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [retRes, invRes] = await Promise.all([
                    api.get('/retailers'),
                    api.get('/inventory')
                ]);
                setRetailersList(retRes.data || []);
                setInventoryList(invRes.data || []);
            } catch (err) {
                console.error("Failed to fetch lookup data", err);
                setError("Failed to load retailers or inventory.");
            }
        };
        fetchLookups();
    }, []);

    const addItem = () => setItems([...items, { product: "", qty: "", rate: "" }]);
    const removeItem = i => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: val };
        setItems(next);
    };

    const total = items.reduce((s, it) => {
        const v = parseFloat(it.qty || 0) * parseFloat(it.rate || 0);
        return s + (isNaN(v) ? 0 : v);
    }, 0);

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(680px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>New order</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Create a manual order for a retailer</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {/* Retailer select */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer *</label>
                        <select value={retailer} onChange={e => setRetailer(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${error?.includes('Credit Limit') ? B.red : B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select retailer…</option>
                            {retailersList.map(r => <option key={r._id} value={r._id}>{r.name} — {r.city} (Limit: ₹{r.creditLimit})</option>)}
                        </select>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary }}>Order items *</label>
                            <button onClick={addItem} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: B.navyMid, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                                <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" /> Add item
                            </button>
                        </div>
                        <div style={{ border: `1px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: B.surface, borderBottom: `1px solid ${B.border}` }}>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11 }}>Product</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 70 }}>Qty</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 80 }}>Rate (₹)</th>
                                        <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 80 }}>Amount</th>
                                        <th style={{ width: 32 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it, i) => (
                                        <tr key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${B.border}` : "none" }}>
                                            <td style={{ padding: "6px 8px" }}>
                                                <select value={it.product} onChange={e => updateItem(i, "product", e.target.value)}
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }}>
                                                    <option value="">Select…</option>
                                                    {inventoryList.map(inv => <option key={inv._id} value={inv._id}>{inv.name} (Qty: {inv.totalQty})</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="number" value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="0"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="number" value={it.rate} onChange={e => updateItem(i, "rate", e.target.value)} placeholder="0.00"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 500, color: B.textPrimary }}>
                                                ₹{(parseFloat(it.qty || 0) * parseFloat(it.rate || 0) || 0).toFixed(2)}
                                            </td>
                                            <td style={{ padding: "6px 6px", textAlign: "center" }}>
                                                {items.length > 1 && (
                                                    <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: B.red, fontSize: 14, display: "flex" }} aria-label="Remove item">
                                                        <i className="ti ti-trash" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ padding: "8px 12px", borderTop: `1px solid ${B.border}`, background: B.surface, display: "flex", justifyContent: "flex-end", gap: 16 }}>
                                <span style={{ fontSize: 11, color: B.textSecondary }}>Subtotal</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Notes (optional)</label>
                        <textarea rows={2} placeholder="Delivery instructions, urgency, special requirements…"
                            style={{ width: "100%", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "8px 10px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: B.surface }} />
                    </div>

                    {/* Actions */}
                    {error && (
                        <div style={{ marginBottom: 14, padding: "10px 12px", background: "#fef2f2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 12 }}>
                            {error}
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={async () => {
                            if (!retailer || items.some(i => !i.product || !i.qty)) {
                                setError("Please fill in all required fields.");
                                return;
                            }
                            try {
                                setLoading(true);
                                setError(null);
                                const body = {
                                    retailerId: retailer,
                                    items: items.map(it => ({
                                        productId: it.product,
                                        qtyOrdered: parseInt(it.qty, 10),
                                        rate: parseFloat(it.rate)
                                    })),
                                    paymentMode: "Credit"
                                };
                                const res = await api.post('/orders', body);
                                // Success or 202 Credit Hold
                                window.dispatchEvent(new Event('order-added'));
                                onClose();
                            } catch (err) {
                                if (err.response?.status === 400 || err.response?.status === 422) {
                                    // Our custom credit limit or FEFO error message
                                    setError(err.response.data.message);
                                } else {
                                    setError("An unexpected error occurred. Please try again.");
                                }
                            } finally {
                                setLoading(false);
                            }
                        }} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Placing..." : "Place order"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function UpdateOrderStatusModal({ orderId, currentStatus, onClose }) {
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const validStatuses = ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled', 'Credit Hold'];

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Update Status</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{orderId}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Order Status *</label>
                        <select value={status} onChange={e => setStatus(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            {validStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {error && (
                        <div style={{ marginBottom: 14, padding: "10px 12px", background: "#fef2f2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 12 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={async () => {
                            try {
                                setLoading(true);
                                setError(null);
                                await api.patch(`/orders/${orderId}/status`, { status });
                                window.dispatchEvent(new Event('order-added')); // Re-fetch list
                                onClose();
                            } catch (err) {
                                setError(err.response?.data?.message || "An unexpected error occurred.");
                            } finally {
                                setLoading(false);
                            }
                        }} disabled={loading || status === currentStatus} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: (loading || status === currentStatus) ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: (loading || status === currentStatus) ? 0.7 : 1 }}>
                            {loading ? "Saving..." : "Update status"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function ViewOrderModal({ order, autoPrint, onClose }) {
    useEffect(() => {
        if (autoPrint) {
            setTimeout(() => window.print(), 100);
        }
    }, [autoPrint]);

    if (!order) return null;

    return (
        <div className="print-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: 20 }}>
            <div className="print-modal-content" style={{ background: B.white, width: "100%", maxWidth: 800, padding: 40, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, gap: 10 }}>
                    <button onClick={() => window.print()} style={{ padding: "8px 16px", background: B.navy, color: B.white, border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-printer" /> Print Invoice</button>
                    <button onClick={onClose} style={{ padding: "8px 16px", background: B.surface, border: `1px solid ${B.border}`, borderRadius: 6, cursor: "pointer" }}>Close</button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${B.border}`, paddingBottom: 20, marginBottom: 20 }}>
                    <div>
                        <h1 style={{ margin: 0, color: B.navyMid, fontSize: 24 }}>INVOICE</h1>
                        <p style={{ margin: "5px 0 0 0", color: B.textSecondary }}>Order #: {order.orderId}</p>
                        <p style={{ margin: "2px 0 0 0", color: B.textSecondary }}>Date: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>Aadhya Pharmex</h2>
                        <p style={{ margin: "5px 0 0 0", color: B.textSecondary }}>Patna, Bihar</p>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
                    <div>
                        <h3 style={{ margin: "0 0 10px 0", fontSize: 14, color: B.textSecondary, textTransform: "uppercase" }}>Bill To</h3>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.retailerId?.name || "Unknown Retailer"}</p>
                        <p style={{ margin: "5px 0 0 0", color: B.textSecondary }}>{order.retailerId?.city || "Unknown City"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: B.textSecondary }}>Status: <strong>{order.status}</strong></p>
                        <p style={{ margin: "5px 0 0 0", color: B.textSecondary }}>Payment: {order.paymentMode}</p>
                    </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                            <th style={{ padding: 10, textAlign: "left", color: B.textSecondary, fontWeight: 500 }}>Product</th>
                            <th style={{ padding: 10, textAlign: "left", color: B.textSecondary, fontWeight: 500 }}>Batch</th>
                            <th style={{ padding: 10, textAlign: "right", color: B.textSecondary, fontWeight: 500 }}>Qty</th>
                            <th style={{ padding: 10, textAlign: "right", color: B.textSecondary, fontWeight: 500 }}>Rate</th>
                            <th style={{ padding: 10, textAlign: "right", color: B.textSecondary, fontWeight: 500 }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${B.border}` }}>
                                <td style={{ padding: 10 }}>{item.productId?.tradeName || "Unknown"}</td>
                                <td style={{ padding: 10 }}>{item.batchId?.batchNo || "Unknown"}</td>
                                <td style={{ padding: 10, textAlign: "right" }}>{item.qtyOrdered}</td>
                                <td style={{ padding: 10, textAlign: "right" }}>₹{item.rate?.toFixed(2)}</td>
                                <td style={{ padding: 10, textAlign: "right" }}>₹{item.lineTotal?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 300 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${B.border}` }}>
                            <span>Subtotal</span>
                            <span>₹{order.totalValue?.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", fontWeight: "bold", fontSize: 18 }}>
                            <span>Total</span>
                            <span>₹{order.totalValue?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-modal-content, .print-modal-content * { visibility: visible; }
                    .print-modal-content { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; padding: 0; }
                    .no-print { display: none !important; }
                    .print-modal-overlay { background: none; position: absolute; padding: 0; display: block; overflow: visible; }
                }
            `}} />
        </div>
    );
}


