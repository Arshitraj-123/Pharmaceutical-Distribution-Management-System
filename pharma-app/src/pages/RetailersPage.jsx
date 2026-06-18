import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, SearchInput, DataTable, StatusBadge } from '../components/ui.jsx';
import { EditRetailerModal, ViewRetailerModal, RetailerStatementModal } from '../components/modals.jsx';
import api from '../api/axios.js';

export function RetailersPage({ showModal }) {
    const [search, setSearch] = useState("");
    const [retailers, setRetailers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editRetailer, setEditRetailer] = useState(null);
    const [viewRetailer, setViewRetailer] = useState(null);
    const [statementRetailer, setStatementRetailer] = useState(null);

    const fetchRetailers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/retailers');
            setRetailers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch retailers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRetailers();
        const handleUpdate = () => fetchRetailers();
        window.addEventListener('retailers-updated', handleUpdate);
        return () => window.removeEventListener('retailers-updated', handleUpdate);
    }, []);

    const filtered = retailers.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) || (r.city && r.city.toLowerCase().includes(search.toLowerCase()))
    );

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    };

    const activeCount = retailers.filter(r => r.status === 'Active').length;
    const totalOutstanding = retailers.reduce((sum, r) => sum + (r.outstandingBalance || 0), 0);
    
    // License expiring in 60 days
    const now = new Date();
    const in60Days = new Date();
    in60Days.setDate(now.getDate() + 60);
    const expiringCount = retailers.filter(r => r.licenseExpiry && new Date(r.licenseExpiry) <= in60Days && new Date(r.licenseExpiry) >= now).length;
    
    // Credit hold
    const creditHoldCount = retailers.filter(r => r.status === 'Suspended').length;

    return (
        <div>
            <PageHeader title="Retailer management" subtitle="KYC · credit limits · Drug License tracking · 400+ partners" action="Add retailer" onAction={showModal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-building-store" label="Active retailers" value={activeCount.toString()} sub={`${retailers.length} total`} accent={B.navy} />
                <KPICard icon="ti-currency-rupee" label="Total outstanding" value={formatCurrency(totalOutstanding)} sub="All accounts" accent={B.red} subColor={B.red} />
                <KPICard icon="ti-file-alert" label="License expiring" value={expiringCount.toString()} sub="Within 60 days" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-ban" label="Credit hold" value={creditHoldCount.toString()} sub="Orders blocked" accent={B.red} subColor={B.red} />
            </div>
            <Card>
                <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search by name or city…" />
                    <button style={{ padding: "6px 12px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 11, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ti ti-download" style={{ fontSize: 12 }} aria-hidden="true" /> Export
                    </button>
                </div>
                <DataTable
                    headers={["ID", "Retailer", "City", "Drug License", "Lic. expiry", "Outstanding", "Credit limit", "Tier", "Status", "Actions"]}
                    rows={filtered.map((r, i) => {
                        const isExpiring = r.licenseExpiry && new Date(r.licenseExpiry) <= in60Days && new Date(r.licenseExpiry) >= now;
                        const formattedExpiry = formatDate(r.licenseExpiry);
                        const isOutstandingZero = (r.outstandingBalance || 0) === 0;
                        const displayStatus = r.status === 'Suspended' ? 'Credit Hold' : r.status;
                        const isExpired = r.licenseExpiry && new Date(r.licenseExpiry) < now;

                        return (
                        <tr key={r._id || i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                            <td style={{ padding: "9px 10px", color: B.textMuted, fontSize: 11 }}>{r._id ? r._id.substring(r._id.length - 6).toUpperCase() : `RET-${i}`}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{r.name}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{r.city}</td>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 11, color: B.textSecondary }}>{r.drugLicense}</td>
                            <td style={{ padding: "9px 10px", color: isExpired || isExpiring ? B.red : B.textSecondary }}>{formattedExpiry}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500, color: isOutstandingZero ? B.green : B.textPrimary }}>{formatCurrency(r.outstandingBalance)}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{formatCurrency(r.creditLimit)}</td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={r.tier || "Standard"} /></td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={displayStatus} /></td>
                            <td style={{ padding: "9px 10px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <i className="ti ti-eye" style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="View" onClick={() => setViewRetailer(r)} />
                                    <i className="ti-file-text" style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} aria-label="Statement" onClick={() => setStatementRetailer(r)} />
                                    <i className="ti ti-edit" style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} aria-label="Edit" onClick={() => setEditRetailer(r)} />
                                </div>
                            </td>
                        </tr>
                    )})}
                />
            </Card>
            {editRetailer && <EditRetailerModal retailerData={editRetailer} onClose={() => setEditRetailer(null)} />}
            {viewRetailer && <ViewRetailerModal retailerData={viewRetailer} onClose={() => setViewRetailer(null)} />}
            {statementRetailer && <RetailerStatementModal retailerData={statementRetailer} onClose={() => setStatementRetailer(null)} />}
        </div>
    );
}
