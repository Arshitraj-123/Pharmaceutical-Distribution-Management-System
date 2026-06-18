import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, CardTitle, DataTable, StatusBadge } from '../components/ui.jsx';
import { ViewDispatchModal, CompleteDispatchModal } from '../components/modals.jsx';
import api from '../api/axios.js';

export function DeliveryPage({ showModal }) {
    const [dispatches, setDispatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDispatch, setViewDispatch] = useState(null);
    const [completeDispatch, setCompleteDispatch] = useState(null);

    const fetchDispatches = async () => {
        try {
            const res = await api.get('/delivery');
            setDispatches(res.data);
        } catch (err) {
            console.error('Error fetching dispatches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDispatches();
        
        const handleUpdate = () => fetchDispatches();
        window.addEventListener('dispatches-updated', handleUpdate);
        
        return () => {
            window.removeEventListener('dispatches-updated', handleUpdate);
        };
    }, []);

    const activeCount = dispatches.filter(d => d.status === 'In Transit').length;
    const completedCount = dispatches.filter(d => d.status === 'Completed' && new Date(d.completedAt).toDateString() === new Date().toDateString()).length;
    const pendingCount = dispatches.filter(d => d.status === 'Pending').length;
    const cashTotal = dispatches.reduce((sum, d) => sum + (d.cashCollected || 0), 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div>
            <PageHeader title="Delivery management" subtitle="Route tracking · proof of delivery · collection" action="New dispatch" onAction={showModal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-truck-delivery" label="Active deliveries" value={activeCount} sub="routes in progress" accent={B.navyMid} />
                <KPICard icon="ti-check" label="Completed today" value={completedCount} sub="routes finished" accent={B.green} subColor={B.green} />
                <KPICard icon="ti-clock" label="Pending dispatch" value={pendingCount} sub="Ready to assign" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-currency-rupee" label="Cash collected" value={`₹${cashTotal.toLocaleString('en-IN')}`} sub="Today so far" accent={B.navy} />
            </div>

            <div className="grid-responsive grid-2-col">
                <Card>
                    <CardTitle>Live route overview</CardTitle>
                    <div style={{ height: 180, background: "linear-gradient(135deg,#EBF4FB 0%,#D9F2E6 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, border: `1px dashed ${B.border}` }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 32, color: B.navyMid }} aria-hidden="true" />
                        <div style={{ fontSize: 12, color: B.textSecondary }}>Google Maps integration — Phase 2</div>
                        <div style={{ fontSize: 11, color: B.textMuted }}>{activeCount} active drivers · real-time GPS tracking</div>
                    </div>
                </Card>

                <Card>
                    <CardTitle>Beat performance today</CardTitle>
                    {dispatches.slice(0, 5).map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${B.border}` : "none" }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>{d.beat}</div>
                                <div style={{ fontSize: 11, color: B.textMuted }}>{d.driver}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 11, color: B.textSecondary }}>{d.orders?.length || 0} orders</span>
                                <StatusBadge status={d.status} />
                            </div>
                        </div>
                    ))}
                    {dispatches.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: B.textMuted, fontSize: 12 }}>No dispatches today</div>}
                </Card>
            </div>

            <Card>
                <CardTitle>Delivery runs</CardTitle>
                <DataTable
                    headers={["Run ID", "Driver", "Beat", "Orders", "Status", "Dispatched", "Completed", "Cash collected", "Actions"]}
                    rows={dispatches.map((d, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                            <td style={{ padding: "9px 10px", color: B.navyMid, fontWeight: 500 }}>{d.runId}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{d.driver}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{d.beat}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{d.orders?.length || 0}</td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={d.status} /></td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{formatDate(d.dispatchedAt)}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{formatDate(d.completedAt)}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>₹{d.cashCollected?.toLocaleString('en-IN') || 0}</td>
                            <td style={{ padding: "9px 10px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <i className="ti ti-eye" style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="View" onClick={() => setViewDispatch(d)} />
                                    {d.status !== 'Completed' && (
                                        <i className="ti ti-check" style={{ fontSize: 15, color: B.green, cursor: "pointer" }} aria-label="Mark Complete" 
                                           onClick={() => setCompleteDispatch(d)} 
                                        />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                />
                {dispatches.length === 0 && !loading && (
                    <div style={{ textAlign: "center", padding: "30px", color: B.textMuted, fontSize: 13 }}>No active or past delivery runs found.</div>
                )}
            </Card>
            {viewDispatch && <ViewDispatchModal dispatchData={viewDispatch} onClose={() => setViewDispatch(null)} />}
            {completeDispatch && <CompleteDispatchModal dispatchData={completeDispatch} onClose={() => setCompleteDispatch(null)} />}
        </div>
    );
}
