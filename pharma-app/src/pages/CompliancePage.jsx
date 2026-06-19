import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, AlertBar, Card, CardTitle } from '../components/ui.jsx';
import { NewRecallModal, ScheduleXRegisterModal, ConfirmModal } from '../components/modals.jsx';
import api from '../api/axios';

export function CompliancePage() {
    const [summary, setSummary] = useState(null);
    const [recalls, setRecalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRecallModal, setShowRecallModal] = useState(false);
    const [showXRegister, setShowXRegister] = useState(false);
    const [recallToDelete, setRecallToDelete] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sumRes, recRes] = await Promise.all([
                api.get('/compliance/summary'),
                api.get('/compliance/recalls')
            ]);
            setSummary(sumRes.data);
            setRecalls(recRes.data);
        } catch (err) {
            console.error("Failed to load compliance data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleUpdate = () => fetchData();
        window.addEventListener('compliance:updated', handleUpdate);
        return () => window.removeEventListener('compliance:updated', handleUpdate);
    }, []);

    const confirmDeleteRecall = (id) => {
        setRecallToDelete(id);
    };

    const handleDeleteRecall = async () => {
        if (!recallToDelete) return;
        try {
            await api.delete(`/compliance/recalls/${recallToDelete}`);
            window.dispatchEvent(new Event('compliance:updated'));
        } catch (err) {
            console.error("Failed to delete recall", err);
        } finally {
            setRecallToDelete(null);
        }
    };

    if (loading || !summary) return <div style={{ padding: 40, textAlign: "center" }}><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite", fontSize: 24 }} /></div>;

    const activeAlerts = recalls.filter(r => r.status === 'Active');

    return (
        <div>
            <PageHeader title="Compliance & regulatory" subtitle="Schedule H/H1/X · Drug License · CDSCO · DPDP Rules 2025" />
            
            {activeAlerts.map(alert => (
                <div key={alert._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#FFF8F8", border: `1px solid ${B.redLight}`, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <i className="ti ti-alert-triangle" style={{ color: B.red, fontSize: 18 }} />
                        <div style={{ fontSize: 13, color: B.red }}>
                            <strong>Urgent CDSCO Alert:</strong> {alert.productName} (Batch {alert.batchNo}). Notice Date: {new Date(alert.noticeDate).toLocaleDateString('en-IN')}.
                        </div>
                    </div>
                    <button onClick={() => confirmDeleteRecall(alert._id)} style={{ background: "none", border: "none", cursor: "pointer", color: B.red, opacity: 0.7, padding: 4 }}>
                        <i className="ti ti-trash" style={{ fontSize: 16 }} />
                    </button>
                </div>
            ))}

            <div className="grid-responsive grid-2-col">
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: B.textPrimary }}>Schedule register summary — today</div>
                        <button onClick={() => setShowXRegister(true)} style={{ padding: "4px 8px", border: `1px solid ${B.border}`, borderRadius: 6, background: B.white, fontSize: 11, cursor: "pointer", color: B.textSecondary }}>View X Register</button>
                    </div>
                    {[
                        ["ti-clipboard-list", "Schedule H transactions", `${summary.schedules.H.transactionCount} records (${summary.schedules.H.totalUnitsDispensed} units)`, B.amber],
                        ["ti-clipboard-check", "Schedule H1 register", `${summary.schedules.H1.transactionCount} entries (with patient phone + Rx)`, B.red],
                        ["ti-shield", "Schedule X dispensing", `${summary.schedules.X.transactionCount} transactions (${summary.schedules.X.totalUnitsDispensed} units)`, B.red],
                        ["ti-check", "Narcotic register status", "✓ Up to date", B.green],
                        ["ti-eye", "Next Drug Inspector visit", "Scheduled 15 Jul 2026", B.navyMid],
                    ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 4 ? `1px solid ${B.border}` : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <i className={`ti ${item[0]}`} style={{ fontSize: 15, color: item[3] }} aria-hidden="true" />
                                <span style={{ fontSize: 12, color: B.textSecondary }}>{item[1]}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: item[3] }}>{item[2]}</span>
                        </div>
                    ))}
                </Card>

                <Card>
                    <CardTitle>Retailer Drug License status</CardTitle>
                    {[
                        ["Valid (> 90 days remaining)", summary.licenses.valid, B.green, B.greenLight],
                        ["Expiring — 30 to 90 days", summary.licenses.expiring90, B.amber, B.amberLight],
                        ["Expiring — less than 30 days", summary.licenses.expiring30, B.red, B.redLight],
                        ["Expired — orders auto-blocked", summary.licenses.expired, B.red, B.redLight],
                    ].map((x, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, background: x[3], marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: x[2], fontWeight: 500 }}>{x[0]}</span>
                            <span style={{ fontSize: 16, fontWeight: 500, color: x[2] }}>{x[1]}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: B.textPrimary }}>GST & e-Invoice compliance tracker</div>
                    <button onClick={() => setShowRecallModal(true)} style={{ padding: "6px 12px", border: "none", borderRadius: 8, background: B.red, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Log CDSCO Recall</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                    {[
                        ["GSTR-1 (May 2026)", "Filed ✓", "Filed 11 May", true],
                        ["GSTR-3B (May 2026)", "Filed ✓", "Filed 20 May", true],
                        ["GSTR-1 (Jun 2026)", "Due 14 Jun", "5 days remaining", false],
                        ["e-Invoice pending IRN", "7 invoices", "30-day window applies", false],
                        ["e-Way Bills active", "4 active", "All within validity period", true],
                        ["DPDP Rules 2025", "Tracking", "Compliance deadline 13 May 2027", true],
                        ["Schedule X register", "✓ Current", "Last updated today", true],
                        ["CDSCO product recall", `${summary.activeRecalls} active recalls`, summary.activeRecalls > 0 ? "Action required" : "No active alerts", summary.activeRecalls === 0],
                    ].map((x, i) => (
                        <div key={i} style={{ padding: 12, borderRadius: 8, border: `1px solid ${x[3] ? "#D9F2E6" : "#FEE2E2"}`, background: x[3] ? "#F0FDF4" : "#FFF8F8" }}>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 3 }}>{x[0]}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: x[3] ? B.green : B.red }}>{x[1]}</div>
                            <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{x[2]}</div>
                        </div>
                    ))}
                </div>
            </Card>

            {showRecallModal && <NewRecallModal onClose={() => setShowRecallModal(false)} />}
            {showXRegister && <ScheduleXRegisterModal onClose={() => setShowXRegister(false)} />}
            
            {recallToDelete && (
                <ConfirmModal 
                    title="Delete Recall Log"
                    message="Are you sure you want to permanently delete this CDSCO recall log? This action cannot be undone."
                    onConfirm={handleDeleteRecall}
                    onCancel={() => setRecallToDelete(null)}
                    confirmText="Delete Log"
                    confirmColor={B.red}
                />
            )}
        </div>
    );
}
