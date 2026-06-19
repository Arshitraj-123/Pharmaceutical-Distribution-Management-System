import { useState, useEffect } from "react";
import { B } from '../theme.js';
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
    const [notifications, setNotifications] = useState([]);
    const unread = notifications.filter(n => !n.read).length;

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifs();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            fetchNotifs();
            window.dispatchEvent(new Event('notifications-read'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotifClick = async (n) => {
        if (!n.read) {
            try {
                await api.patch(`/notifications/${n._id}/read`);
                fetchNotifs();
                window.dispatchEvent(new Event('notifications-read'));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'Alert': return 'ti-alert-circle';
            case 'Warning': return 'ti-alert-triangle';
            case 'Success': return 'ti-check';
            default: return 'ti-info-circle';
        }
    };
    
    const getColor = (type) => {
        switch(type) {
            case 'Alert': return B.red;
            case 'Warning': return B.amber;
            case 'Success': return B.green;
            default: return B.navy;
        }
    };

    return (
        <div style={{ position: "absolute", top: 52, right: 60, width: 340, background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Notifications</div>
                {unread > 0 && <span style={{ background: B.redLight, color: B.red, fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 10 }}>{unread} unread</span>}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: "center", color: B.textMuted, fontSize: 12 }}>No recent notifications</div>
                ) : (
                    notifications.map((n, i) => (
                        <div key={n._id || i} onClick={() => handleNotifClick(n)} style={{ padding: "10px 16px", borderBottom: i < notifications.length - 1 ? `1px solid ${B.border}` : "none", background: n.read ? B.white : B.navyLight, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: getColor(n.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className={`ti ${getIcon(n.type)}`} style={{ fontSize: 14, color: getColor(n.type) }} aria-hidden="true" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: B.textPrimary, lineHeight: 1.4 }}>{n.title}</div>
                                <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2, lineHeight: 1.3 }}>{n.message}</div>
                                <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.navyMid, marginTop: 4, flexShrink: 0 }} />}
                        </div>
                    ))
                )}
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${B.border}` }}>
                <button onClick={handleMarkAllRead} style={{ width: "100%", background: "none", border: "none", fontSize: 12, color: B.navyMid, cursor: "pointer", fontFamily: "inherit" }}>Mark all as read</button>
            </div>
        </div>
    );
}

export function NewStockModal({ onClose }) {
    const [supplier, setSupplier] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [items, setItems] = useState([{ product: "", batch: "", expiry: "", qty: "", ptr: "", rack: "" }]);
    const [productsList, setProductsList] = useState([]);
    const [suppliersList, setSuppliersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [prodRes, compRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/products/companies')
                ]);
                setProductsList(prodRes.data.products || []);
                setSuppliersList(compRes.data || []);
            } catch (err) {
                console.error("Failed to load lookups", err);
                setError("Failed to load products or suppliers.");
            }
        };
        fetchLookups();
    }, []);

    const addItem = () => setItems([...items, { product: "", batch: "", expiry: "", qty: "", ptr: "", rack: "" }]);
    const removeItem = i => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, val) => {
        const next = [...items];
        next[i] = { ...next[i], [field]: val };
        
        // Auto-fill PTR if product changes
        if (field === 'product') {
            const p = productsList.find(prod => prod._id === val);
            if (p && p.ptr) next[i].ptr = p.ptr.toString();
        }
        
        setItems(next);
    };

    const total = items.reduce((s, it) => {
        const v = parseFloat(it.qty || 0) * parseFloat(it.ptr || 0);
        return s + (isNaN(v) ? 0 : v);
    }, 0);

    const handleSubmit = async () => {
        setError("");
        
        if (!supplier || !invoiceNo || !invoiceDate) {
            setError("Please fill all supplier invoice details.");
            return;
        }

        if (items.some(i => !i.product || !i.batch || !i.expiry || !i.qty || !i.ptr)) {
            setError("Please fill Product, Batch, Expiry, Qty, and PTR for all rows.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                supplierId: supplier,
                supplierInvoiceNo: invoiceNo,
                invoiceDate: new Date(invoiceDate),
                items: items.map(it => ({
                    productId: it.product,
                    batchNo: it.batch,
                    expiryDate: new Date(it.expiry + '-01'), // convert YYYY-MM to Date
                    qtyReceived: Number(it.qty),
                    ptr: Number(it.ptr),
                    rackLocation: it.rack
                }))
            };
            
            await api.post('/inventory/grn', payload);
            window.dispatchEvent(new Event('inventory-updated'));
            window.dispatchEvent(new Event('purchases-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save GRN");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(800px,95vw)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add stock / GRN</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Record incoming supplier inventory</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    
                    {/* Supplier Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Supplier *</label>
                            <select value={supplier} onChange={e => setSupplier(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select supplier…</option>
                                {suppliersList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Supplier Invoice No. *</label>
                            <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. CI/2026/00441"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Invoice Date *</label>
                            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary }}>Received Items *</label>
                            <button onClick={addItem} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: B.navyMid, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                                <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" /> Add row
                            </button>
                        </div>
                        <div style={{ border: `1px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: B.surface, borderBottom: `1px solid ${B.border}` }}>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11 }}>Product</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 100 }}>Batch</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 110 }}>Expiry</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 70 }}>Qty</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 80 }}>PTR (₹)</th>
                                        <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 70 }}>Rack</th>
                                        <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 500, color: B.textSecondary, fontSize: 11, width: 80 }}>Total</th>
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
                                                    {productsList.map(p => <option key={p._id} value={p._id}>{p.tradeName}</option>)}
                                                </select>
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="text" value={it.batch} onChange={e => updateItem(i, "batch", e.target.value)} placeholder="BTH"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="month" value={it.expiry} onChange={e => updateItem(i, "expiry", e.target.value)}
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="number" value={it.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="0"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="number" value={it.ptr} onChange={e => updateItem(i, "ptr", e.target.value)} placeholder="0.00"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 8px" }}>
                                                <input type="text" value={it.rack} onChange={e => updateItem(i, "rack", e.target.value)} placeholder="Rack"
                                                    style={{ width: "100%", height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 6px", background: B.white, fontFamily: "inherit" }} />
                                            </td>
                                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 500, color: B.textPrimary }}>
                                                ₹{(parseFloat(it.qty || 0) * parseFloat(it.ptr || 0) || 0).toFixed(2)}
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
                                <span style={{ fontSize: 11, color: B.textSecondary }}>Grand Total</span>
                                <span style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving GRN..." : "Add Stock & Create Purchase"}
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
    const [orders, setOrders] = useState(""); // "" means auto
    const [vehicle, setVehicle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!driver || !beat) {
            setError("Please select driver and beat.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                driver,
                beat,
                vehicle,
                assignType: orders === 'manual' ? 'manual' : 'auto',
                manualOrders: [] 
            };
            
            await api.post('/delivery', payload);
            window.dispatchEvent(new Event('dispatches-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start dispatch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
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
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Driver *</label>
                        <select value={driver} onChange={e => setDriver(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select driver…</option>
                            <option value="Rajan Kumar">Rajan Kumar</option>
                            <option value="Sunil Yadav">Sunil Yadav</option>
                            <option value="Amit Singh">Amit Singh</option>
                            <option value="Priya Kumari">Priya Kumari</option>
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat (Area) *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select area…</option>
                                <option value="Patna Central">Patna Central</option>
                                <option value="Patna South">Patna South</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Nalanda">Nalanda</option>
                                <option value="Gaya">Gaya</option>
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
                            <option value="">Auto-assign all confirmed orders for this beat</option>
                            <option value="manual">Manually select orders... (Coming Soon)</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Starting..." : "Start Dispatch"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NewRetailerModal({ onClose }) {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [beat, setBeat] = useState("");
    const [license, setLicense] = useState("");
    const [licenseExpiry, setLicenseExpiry] = useState("");
    const [credit, setCredit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!name || !city || !beat || !license || !licenseExpiry) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                city,
                beat,
                drugLicense: license,
                licenseExpiry: new Date(licenseExpiry + '-01'),
                creditLimit: Number(credit) || 0
            };
            
            await api.post('/retailers', payload);
            window.dispatchEvent(new Event('retailers-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create retailer");
        } finally {
            setLoading(false);
        }
    };

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
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
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
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat / Area *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="">Select...</option>
                                <option value="Patna Central">Patna Central</option>
                                <option value="Patna South">Patna South</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Nalanda">Nalanda</option>
                                <option value="Gaya">Gaya</option>
                            </select>
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
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Registering..." : "Register Retailer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EditRetailerModal({ retailerData, onClose }) {
    const [name, setName] = useState(retailerData?.name || "");
    const [city, setCity] = useState(retailerData?.city || "");
    const [beat, setBeat] = useState(retailerData?.beat || "");
    const [license, setLicense] = useState(retailerData?.drugLicense || "");
    
    // format date for input type="month" YYYY-MM
    const initialExpiry = retailerData?.licenseExpiry ? new Date(retailerData.licenseExpiry).toISOString().slice(0, 7) : "";
    const [licenseExpiry, setLicenseExpiry] = useState(initialExpiry);
    const [credit, setCredit] = useState(retailerData?.creditLimit || "");
    const [status, setStatus] = useState(retailerData?.status || "Active");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!name || !city || !beat || !license || !licenseExpiry) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                city,
                beat,
                drugLicense: license,
                licenseExpiry: new Date(licenseExpiry + '-01'),
                creditLimit: Number(credit) || 0,
                status
            };
            
            await api.patch(`/retailers/${retailerData._id}`, payload);
            window.dispatchEvent(new Event('retailers-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update retailer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Edit Retailer</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{retailerData?.name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>City / District *</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat / Area *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="">Select...</option>
                                <option value="Patna Central">Patna Central</option>
                                <option value="Patna South">Patna South</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Nalanda">Nalanda</option>
                                <option value="Gaya">Gaya</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug License No. *</label>
                            <input type="text" value={license} onChange={e => setLicense(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>License Expiry *</label>
                            <input type="month" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Credit Limit (₹)</label>
                            <input type="number" value={credit} onChange={e => setCredit(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="Active">Active</option>
                                <option value="Suspended">Credit Hold (Suspended)</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
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


export function NewInvoiceModal({ onClose }) {
    const [unbilledOrders, setUnbilledOrders] = useState([]);
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/invoices/unbilled-orders');
                setUnbilledOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch unbilled orders", err);
            }
        };
        fetchOrders();
    }, []);

    const selectedOrder = unbilledOrders.find(o => o._id === orderId);

    const handleSubmit = async () => {
        setError("");
        if (!orderId) {
            setError("Please select an order.");
            return;
        }

        try {
            setLoading(true);
            await api.post('/invoices', { orderId });
            window.dispatchEvent(new Event('invoice-added'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate invoice");
        } finally {
            setLoading(false);
        }
    };

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
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Order Reference *</label>
                        <select value={orderId} onChange={e => setOrderId(e.target.value)}
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                            <option value="">Select unbilled order…</option>
                            {unbilledOrders.map(o => (
                                <option key={o._id} value={o._id}>
                                    {o.orderId} — {o.retailerId?.name} ({o.retailerId?.city})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer</label>
                            <input type="text" readOnly value={selectedOrder ? selectedOrder.retailerId?.name : ''} placeholder="Auto-filled"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Invoice Date</label>
                            <input type="date" value={new Date().toISOString().split('T')[0]} readOnly
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Generating..." : "Generate Invoice"}
                        </button>
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

export function ViewRetailerModal({ retailerData, onClose }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Retailer Info</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Read-only summary</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                <div style={{ padding: "16px 20px", fontSize: 13, color: B.textSecondary, lineHeight: "1.6" }}>
                    <div><strong>Name:</strong> {retailerData?.name}</div>
                    <div><strong>City:</strong> {retailerData?.city}</div>
                    <div><strong>Drug License:</strong> {retailerData?.drugLicense}</div>
                    <div><strong>License Expiry:</strong> {formatDate(retailerData?.licenseExpiry)}</div>
                    <div><strong>Credit Limit:</strong> ₹{retailerData?.creditLimit?.toLocaleString('en-IN') || 0}</div>
                    <div><strong>Outstanding:</strong> ₹{retailerData?.outstandingBalance?.toLocaleString('en-IN') || 0}</div>
                    <div><strong>Tier:</strong> {retailerData?.tier || "Standard"}</div>
                    <div><strong>Status:</strong> {retailerData?.status || "Active"}</div>
                    <div style={{ marginTop: 20, textAlign: "right" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textPrimary, cursor: "pointer" }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RetailerStatementModal({ retailerData, onClose }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: B.navy }}>Statement of Account</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "16px", background: B.surface, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: B.textPrimary }}>{retailerData?.name}</div>
                    <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 4 }}>{retailerData?.city}</div>
                    <div style={{ fontSize: 12, color: B.textSecondary }}>Drug License: {retailerData?.drugLicense}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: B.textPrimary }}>Total Outstanding:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: B.red }}>₹{retailerData?.outstandingBalance?.toLocaleString('en-IN') || 0}</span>
                </div>

                <div style={{ fontSize: 12, color: B.textMuted, textAlign: "center", marginBottom: 16, padding: "20px 0" }}>
                    Statement history details will be available in Phase 5 (Payments).
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
                    <button onClick={() => alert("Statement generation will be active in Phase 5")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                        <i className="ti ti-printer" aria-hidden="true" /> Print PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ViewDispatchModal({ dispatchData, onClose }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(600px,95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Dispatch Details: {dispatchData?.runId}</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{dispatchData?.beat}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20, background: B.surface, padding: 12, borderRadius: 8 }}>
                        <div><span style={{ fontSize: 11, color: B.textSecondary, display: "block" }}>Driver</span><span style={{ fontSize: 13, fontWeight: 500 }}>{dispatchData?.driver}</span></div>
                        <div><span style={{ fontSize: 11, color: B.textSecondary, display: "block" }}>Vehicle</span><span style={{ fontSize: 13, fontWeight: 500 }}>{dispatchData?.vehicle || "N/A"}</span></div>
                        <div><span style={{ fontSize: 11, color: B.textSecondary, display: "block" }}>Status</span><span style={{ fontSize: 13, fontWeight: 500 }}>{dispatchData?.status}</span></div>
                        <div><span style={{ fontSize: 11, color: B.textSecondary, display: "block" }}>Dispatched At</span><span style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(dispatchData?.dispatchedAt)}</span></div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Enclosed Orders ({dispatchData?.orders?.length || 0})</div>
                    
                    <div style={{ border: `1px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead style={{ background: B.surface }}>
                                <tr>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: B.textSecondary, borderBottom: `1px solid ${B.border}` }}>Order ID</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: B.textSecondary, borderBottom: `1px solid ${B.border}` }}>Retailer</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: B.textSecondary, borderBottom: `1px solid ${B.border}` }}>City</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: B.textSecondary, borderBottom: `1px solid ${B.border}` }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dispatchData?.orders?.map((o, i) => (
                                    <tr key={i} style={{ borderBottom: i < dispatchData.orders.length - 1 ? `1px solid ${B.border}` : "none" }}>
                                        <td style={{ padding: "8px 12px", fontWeight: 500, color: B.navyMid }}>{o.orderId || "N/A"}</td>
                                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{o.retailerId?.name || "Unknown"}</td>
                                        <td style={{ padding: "8px 12px", color: B.textSecondary }}>{o.retailerId?.city || "Unknown"}</td>
                                        <td style={{ padding: "8px 12px" }}>{o.status || "N/A"}</td>
                                    </tr>
                                ))}
                                {(!dispatchData?.orders || dispatchData.orders.length === 0) && (
                                    <tr><td colSpan="4" style={{ padding: "16px", textAlign: "center", color: B.textMuted }}>No orders enclosed</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ padding: "16px 20px", borderTop: `1px solid ${B.border}`, textAlign: "right" }}>
                    <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textPrimary, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
                </div>
            </div>
        </div>
    );
}

export function CompleteDispatchModal({ dispatchData, onClose }) {
    const [cash, setCash] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.patch(`/delivery/${dispatchData._id}/status`, { status: 'Completed', cashCollected: cash || 0 });
            window.dispatchEvent(new Event('dispatches-updated'));
            
            const summary = res.data.cascadeSummary;
            if (summary && summary.failed.length > 0) {
                setResult(summary);
            } else {
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to complete dispatch");
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", padding: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: B.navy, marginBottom: 10 }}>Completion Summary</div>
                    <div style={{ fontSize: 13, color: B.textSecondary, marginBottom: 16 }}>
                        Successfully delivered {result.success.length} orders. <br/>
                        <span style={{ color: B.red, fontWeight: 500 }}>{result.failed.length} orders failed to update:</span>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto", background: B.surface, borderRadius: 8, padding: 10, marginBottom: 20 }}>
                        {result.failed.map((f, i) => (
                            <div key={i} style={{ fontSize: 12, marginBottom: 6, borderBottom: `1px solid ${B.border}`, paddingBottom: 6 }}>
                                <strong>{f.orderId}</strong>: {f.error}
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Acknowledge</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Complete Dispatch</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{dispatchData.runId}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Cash Collected (₹)</label>
                        <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0"
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.green, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Processing..." : "Confirm Completion"}
                        </button>
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

export function NewSchemeModal({ onClose }) {
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [companyId, setCompanyId] = useState('');
    const [productId, setProductId] = useState(''); // Empty means all products
    const [type, setType] = useState('Free Goods');
    const [buyQty, setBuyQty] = useState('');
    const [freeQty, setFreeQty] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [validUntil, setValidUntil] = useState('');
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/products/companies').then(res => setCompanies(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (companyId) {
            api.get(`/products`).then(res => {
                const allProds = res.data.products || [];
                setProducts(allProds.filter(p => p.companyId && p.companyId._id === companyId));
            }).catch(console.error);
        } else {
            setProducts([]);
            setProductId('');
        }
    }, [companyId]);

    const handleSubmit = async () => {
        if (!companyId || !validUntil || !type) return alert("Please fill required fields");
        if (type === 'Free Goods' && (!buyQty || !freeQty)) return alert("Please enter Buy/Free quantities");
        if (type === 'Discount' && !discountPercent) return alert("Please enter Discount Percent");

        setLoading(true);
        try {
            await api.post('/schemes', {
                companyId,
                productId: productId || null,
                type,
                buyQty,
                freeQty,
                discountPercent,
                validUntil
            });
            window.dispatchEvent(new Event('schemes:updated'));
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create scheme");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: 450, display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>Add New Scheme</div>
                        <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 2 }}>Define promotional offer logic</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Company *</label>
                            <select value={companyId} onChange={e => setCompanyId(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }}>
                                <option value="">Select Company...</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Product (Optional)</label>
                            <select value={productId} onChange={e => setProductId(e.target.value)} disabled={!companyId} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, background: !companyId ? B.surface : B.white }}>
                                <option value="">All Company Products</option>
                                {products.map(p => <option key={p._id} value={p._id}>{p.tradeName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Scheme Type *</label>
                            <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }}>
                                <option value="Free Goods">Free Goods</option>
                                <option value="Discount">Discount</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Valid Until *</label>
                            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: "100%", padding: "7px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                        </div>
                    </div>

                    <div style={{ padding: "16px", background: B.surface, borderRadius: 8 }}>
                        {type === 'Free Goods' ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Buy Qty</label>
                                    <input type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)} placeholder="e.g. 10" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Get Free Qty</label>
                                    <input type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)} placeholder="e.g. 1" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Discount Percent (%)</label>
                                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="e.g. 5" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer" }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Saving..." : "Save Scheme"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = B.navy }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
            <div style={{ background: B.white, borderRadius: 12, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", display: "flex", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: confirmColor === B.red ? "#FFF0F0" : B.navyLight, color: confirmColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`ti ${confirmColor === B.red ? 'ti-alert-triangle' : 'ti-help'}`} style={{ fontSize: 20 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary, marginBottom: 8 }}>{title}</div>
                        <div style={{ fontSize: 13, color: B.textSecondary, lineHeight: 1.5 }}>{message}</div>
                    </div>
                </div>
                <div style={{ padding: "16px 24px", background: B.surface, borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, fontWeight: 500, color: B.textSecondary, cursor: "pointer" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: confirmColor, color: B.white, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

export function NewRecallModal({ onClose }) {
    const [productName, setProductName] = useState("");
    const [batchNo, setBatchNo] = useState("");
    const [noticeDate, setNoticeDate] = useState("");
    const [affectedRetailersCount, setAffectedRetailersCount] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!productName || !batchNo || !noticeDate) return alert("Please fill required fields.");
        try {
            setLoading(true);
            await api.post('/compliance/recalls', {
                productName,
                batchNo,
                noticeDate,
                affectedRetailersCount: Number(affectedRetailersCount) || 0,
                notes
            });
            window.dispatchEvent(new Event('compliance:updated'));
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to log recall.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: 450, display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.red }}>Log CDSCO Recall</div>
                        <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 2 }}>Record a new product recall notice</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Product Name *</label>
                        <input type="text" value={productName} onChange={e => setProductName(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Batch No. *</label>
                            <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>CDSCO Notice Date *</label>
                            <input type="date" value={noticeDate} onChange={e => setNoticeDate(e.target.value)} style={{ width: "100%", padding: "7px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Affected Retailers (Count)</label>
                        <input type="number" value={affectedRetailersCount} onChange={e => setAffectedRetailersCount(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Internal Notes / Actions Taken</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }} />
                    </div>
                </div>
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, color: B.textSecondary, cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.red, color: B.white, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        {loading ? "Saving..." : "Log Alert"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ScheduleXRegisterModal({ onClose }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/compliance/schedule-x-register')
           .then(res => setRows(res.data))
           .catch(console.error)
           .finally(() => setLoading(false));
    }, []);

    const handleDownload = async () => {
        try {
            const res = await api.get('/compliance/schedule-x-register/pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Schedule_X_Register.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF");
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(900px, 95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>Schedule X Register</div>
                        <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 2 }}>Legal transaction register for narcotic and psychotropic substances</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <button onClick={handleDownload} style={{ padding: "6px 12px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, fontWeight: 500, color: B.navyMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <i className="ti ti-download" /> Export PDF
                        </button>
                        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                            <i className="ti ti-x" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                
                <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px" }}><i className="ti ti-loader" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} /></div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${B.border}`, color: B.textSecondary, textAlign: "left" }}>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Retailer</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>DL No.</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Product</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Batch</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Qty</th>
                                    <th style={{ padding: "8px 4px", fontWeight: 500 }}>Order Ref</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: B.textMuted }}>No Schedule X transactions found.</td></tr>
                                ) : rows.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${B.surface}` }}>
                                        <td style={{ padding: "10px 4px", color: B.textPrimary }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                                        <td style={{ padding: "10px 4px", color: B.navyMid, fontWeight: 500 }}>{r.retailerName}</td>
                                        <td style={{ padding: "10px 4px", color: B.textSecondary }}>{r.drugLicense || 'N/A'}</td>
                                        <td style={{ padding: "10px 4px", color: B.textPrimary }}>{r.product}</td>
                                        <td style={{ padding: "10px 4px", color: B.textSecondary }}>{r.batchNo || '-'}</td>
                                        <td style={{ padding: "10px 4px", color: B.textPrimary, fontWeight: 600 }}>{r.qtySupplied}</td>
                                        <td style={{ padding: "10px 4px", color: B.textMuted, fontSize: 11 }}>{r.orderRef}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
