import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

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


