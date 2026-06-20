import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

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


