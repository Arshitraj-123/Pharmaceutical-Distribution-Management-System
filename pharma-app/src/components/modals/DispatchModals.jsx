import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

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


