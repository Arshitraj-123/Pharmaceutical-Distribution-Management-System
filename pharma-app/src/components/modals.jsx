import { useState, useEffect } from "react";
import { B } from '../theme.js';
import { NOTIFICATIONS } from '../mockData.js';
import api from '../api/axios';

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

export function NotifPanel({ onClose }) {
    const unread = NOTIFICATIONS.filter(n => !n.read).length;
    return (
        <div style={{ position: "absolute", top: 52, right: 60, width: 340, background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Notifications</div>
                {unread > 0 && <span style={{ background: B.redLight, color: B.red, fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 10 }}>{unread} unread</span>}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {NOTIFICATIONS.map((n, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: i < NOTIFICATIONS.length - 1 ? `1px solid ${B.border}` : "none", background: n.read ? B.white : B.navyLight, display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: n.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <i className={`ti ${n.icon}`} style={{ fontSize: 14, color: n.color }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: B.textPrimary, lineHeight: 1.4 }}>{n.title}</div>
                            <div style={{ fontSize: 10, color: B.textMuted, marginTop: 3 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.navyMid, marginTop: 4, flexShrink: 0 }} />}
                    </div>
                ))}
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${B.border}` }}>
                <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", fontSize: 12, color: B.navyMid, cursor: "pointer", fontFamily: "inherit" }}>Mark all as read</button>
            </div>
        </div>
    );
}

export function NewStockModal({ onClose }) {
    const [products, setProducts] = useState([]);
    const [product, setProduct] = useState("");
    const [batch, setBatch] = useState("");
    const [expiry, setExpiry] = useState("");
    const [qty, setQty] = useState("");
    const [rack, setRack] = useState("");
    const [ptr, setPtr] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data.products || []);
            } catch (err) {
                console.error("Failed to load products", err);
            }
        };
        fetchProducts();
    }, []);

    const selectedProduct = products.find(p => p._id === product);

    const handleSubmit = async () => {
        setError("");
        if (!product || !batch || !expiry || !qty || !ptr) {
            setError("Please fill all required fields (Product, Batch, Expiry, Qty, PTR).");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                productId: product,
                batchNo: batch,
                expiryDate: new Date(expiry + '-01'), // convert YYYY-MM to Date
                qtyReceived: Number(qty),
                rackLocation: rack,
                ptr: Number(ptr)
            };
            
            await api.post('/inventory/grn', payload);
            window.dispatchEvent(new Event('inventory-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save GRN");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add stock / GRN</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Record incoming inventory</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    
                    {/* Product select */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Product *</label>
                        <select value={product} onChange={e => {
                            setProduct(e.target.value);
                            const p = products.find(prod => prod._id === e.target.value);
                            if (p && p.ptr) setPtr(p.ptr.toString());
                        }}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select product…</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.tradeName} — {p.companyId?.name || 'Unknown'}</option>)}
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Batch No. *</label>
                            <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="e.g. BTH-9021"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Expiry Date *</label>
                            <input type="month" value={expiry} onChange={e => setExpiry(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Qty (Units) *</label>
                            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Cost Price (PTR) *</label>
                            <input type="number" step="0.01" value={ptr} onChange={e => setPtr(e.target.value)} placeholder="₹"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Rack</label>
                            <input type="text" value={rack} onChange={e => setRack(e.target.value)} placeholder="R4-A"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving..." : "Add Stock"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EditStockModal({ batchData, onClose }) {
    const [rack, setRack] = useState(batchData?.rack || "");
    const [ptr, setPtr] = useState(batchData?.ptr || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await api.patch(`/inventory/batches/${batchData._id}`, { rackLocation: rack, costPrice: ptr });
            window.dispatchEvent(new Event('inventory-updated'));
            onClose();
        } catch (err) {
            setError("Failed to update stock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Edit Batch Details</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{batchData?.name} ({batchData?.batch})</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, color: B.red, fontSize: 12 }}>{error}</div>}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Rack Location</label>
                        <input type="text" value={rack} onChange={e => setRack(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Cost Price (PTR)</label>
                        <input type="number" step="0.01" value={ptr} onChange={e => setPtr(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer" }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, cursor: "pointer" }}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ViewStockModal({ batchData, onClose }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Batch Info</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Read-only summary</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                <div style={{ padding: "16px 20px", fontSize: 13, color: B.textSecondary, lineHeight: "1.6" }}>
                    <div><strong>Product:</strong> {batchData?.name}</div>
                    <div><strong>Company:</strong> {batchData?.company}</div>
                    <div><strong>Batch No:</strong> {batchData?.batch}</div>
                    <div><strong>Stock:</strong> {batchData?.stock} units</div>
                    <div><strong>Expiry:</strong> {batchData?.expiry}</div>
                    <div><strong>PTR:</strong> ₹{batchData?.ptr || "N/A"}</div>
                    <div><strong>Rack:</strong> {batchData?.rack || "Unassigned"}</div>
                    <div style={{ marginTop: 20, textAlign: "right" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textPrimary, cursor: "pointer" }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewDispatchModal({ onClose }) {
    const [driver, setDriver] = useState("");
    const [beat, setBeat] = useState("");
    const [orders, setOrders] = useState("");
    const [vehicle, setVehicle] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>New Dispatch</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Assign orders to a driver</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {/* Driver select */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Driver *</label>
                        <select value={driver} onChange={e => setDriver(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select driver…</option>
                            <option value="d1">Rajan Kumar</option>
                            <option value="d2">Sunil Yadav</option>
                            <option value="d3">Amit Singh</option>
                            <option value="d4">Priya Kumari</option>
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat (Area) *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select area…</option>
                                <option value="b1">Patna Central</option>
                                <option value="b2">Patna South</option>
                                <option value="b3">Muzaffarpur</option>
                                <option value="b4">Nalanda</option>
                                <option value="b5">Gaya</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Vehicle No.</label>
                            <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. BR-01-PB-4281"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Assign Orders</label>
                        <select value={orders} onChange={e => setOrders(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Auto-assign all ready orders for this beat</option>
                            <option value="manual">Manually select orders...</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Start Dispatch</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewRetailerModal({ onClose }) {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [license, setLicense] = useState("");
    const [licenseExpiry, setLicenseExpiry] = useState("");
    const [credit, setCredit] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add Retailer</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Register a new pharmacy or hospital</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apollo Pharmacy"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>City / District *</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Patna"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug License No. *</label>
                            <input type="text" value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. DL-BR-1234"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>License Expiry *</label>
                            <input type="month" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Requested Credit Limit (₹)</label>
                        <input type="number" value={credit} onChange={e => setCredit(e.target.value)} placeholder="0"
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Register Retailer</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

export function NewSchemeModal({ onClose }) {
    const [company, setCompany] = useState("");
    const [product, setProduct] = useState("");
    const [type, setType] = useState("");
    const [valid, setValid] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add Scheme</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Register a new company promotion</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Company *</label>
                            <select value={company} onChange={e => setCompany(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select company…</option>
                                <option value="c1">Sun Pharma</option>
                                <option value="c2">Cipla Ltd</option>
                                <option value="c3">Mankind</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Product / Range *</label>
                            <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Volini Spray"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Scheme Type *</label>
                            <select value={type} onChange={e => setType(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select type…</option>
                                <option value="t1">10+1 Free</option>
                                <option value="t2">5% Extra Margin</option>
                                <option value="t3">Volume Discount</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Valid Until *</label>
                            <input type="date" value={valid} onChange={e => setValid(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Add Scheme</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewInvoiceModal({ onClose }) {
    const [retailer, setRetailer] = useState("");
    const [orderRef, setOrderRef] = useState("");
    const [date, setDate] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Generate Invoice</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Create tax invoice for a retailer</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer *</label>
                        <select value={retailer} onChange={e => setRetailer(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select retailer…</option>
                            <option value="r1">Apollo Pharma Retail</option>
                            <option value="r2">Shree Medicals</option>
                            <option value="r3">Medplus</option>
                            <option value="r4">Mahavir Medicos</option>
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Order Reference</label>
                            <select value={orderRef} onChange={e => setOrderRef(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select order…</option>
                                <option value="o1">ORD-2481 (Ready)</option>
                                <option value="o2">ORD-2485 (Ready)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Invoice Date *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Generate Invoice</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ProfileModal({ onClose, onLogout, currentUser }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: B.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: B.white, fontSize: 18, fontWeight: 500 }}>
                                {currentUser && currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'AD'}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>{currentUser && currentUser.fullName ? currentUser.fullName : 'Admin'}</div>
                            <div style={{ fontSize: 12, color: B.textSecondary }}>{currentUser && currentUser.email ? currentUser.email : 'admin@adhyapharma.in'}</div>
                            <div style={{ fontSize: 11, color: B.navyMid, fontWeight: 500, marginTop: 4 }}>{currentUser && currentUser.role ? currentUser.role : 'Operations Manager'}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "8px 0" }}>
                    <button style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.textPrimary, fontSize: 13, fontFamily: "inherit" }}>
                        <i className="ti ti-user-edit" style={{ fontSize: 18, color: B.textSecondary }} /> Edit Profile
                    </button>
                    <button style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.textPrimary, fontSize: 13, fontFamily: "inherit" }}>
                        <i className="ti ti-settings" style={{ fontSize: 18, color: B.textSecondary }} /> Preferences
                    </button>
                </div>
                
                <div style={{ borderTop: `1px solid ${B.border}`, padding: "8px 0" }}>
                    <button onClick={() => { onClose(); onLogout(); }} style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.red, fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                        <i className="ti ti-logout" style={{ fontSize: 18 }} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export function NewUserModal({ onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [branch, setBranch] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add New User</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Create a new system user and assign roles</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Full Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Kumar"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Email Address *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. ramesh@adhyapharma.in"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Role *</label>
                            <select value={role} onChange={e => setRole(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select role…</option>
                                <option value="Operations Manager">Operations Manager</option>
                                <option value="Accounts Executive">Accounts Executive</option>
                                <option value="Warehouse Incharge">Warehouse Incharge</option>
                                <option value="Delivery Staff">Delivery Staff</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Branch *</label>
                            <select value={branch} onChange={e => setBranch(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select branch…</option>
                                <option value="Head Office">Head Office</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Gaya">Gaya</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={() => { onClose(); }} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Create User</button>
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
