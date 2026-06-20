import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

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


