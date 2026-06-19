import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, FilterChips, DataTable, StatusBadge } from '../components/ui.jsx';
import { ConfirmModal } from '../components/modals.jsx';
import { ProgressBar } from '../components/charts.jsx';
import api from '../api/axios';

export function SchemesPage({ showModal }) {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [schemeToDelete, setSchemeToDelete] = useState(null);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/schemes');
            setSchemes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes();
        const handleUpdate = () => fetchSchemes();
        window.addEventListener('schemes:updated', handleUpdate);
        return () => window.removeEventListener('schemes:updated', handleUpdate);
    }, []);

    const confirmDelete = (id) => {
        setSchemeToDelete(id);
    };

    const handleDelete = async () => {
        if (!schemeToDelete) return;
        try {
            await api.delete(`/schemes/${schemeToDelete}`);
            window.dispatchEvent(new Event('schemes:updated'));
        } catch (err) {
            console.error("Failed to delete scheme", err);
            alert("Failed to delete scheme");
        } finally {
            setSchemeToDelete(null);
        }
    };

    const statuses = ["All", "Active", "Expiring", "Expired"];
    const filtered = filter === "All" ? schemes : schemes.filter(s => s.status === filter);

    const activeCount = schemes.filter(s => s.status === 'Active').length;
    const expiringCount = schemes.filter(s => s.status === 'Expiring').length;
    const expiredCount = schemes.filter(s => s.status === 'Expired').length;
    
    // Unique companies among active/expiring schemes
    const uniqueCompanies = new Set(schemes.filter(s => s.status !== 'Expired').map(s => s.companyId?._id)).size;

    return (
        <div>
            <PageHeader title="Scheme management" subtitle="Company promotions · free goods · margin tracking" action="Add scheme" onAction={showModal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-tag" label="Active schemes" value={activeCount.toString()} sub={`From ${uniqueCompanies} companies`} accent={B.navy} />
                <KPICard icon="ti-alert-circle" label="Expiring < 30 days" value={expiringCount.toString()} sub="Take action" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-currency-rupee" label="Scheme benefit MTD" value="₹0" sub="Passed on to retailers" accent={B.green} subColor={B.green} />
                <KPICard icon="ti-x" label="Expired schemes" value={expiredCount.toString()} sub="All time" accent={B.red} subColor={B.red} />
            </div>
            <Card>
                <FilterChips options={statuses} active={filter} onChange={setFilter} />
                <DataTable
                    headers={["Scheme ID", "Company", "Product / Range", "Scheme logic", "Valid until", "Utilised", "Status", "Actions"]}
                    rows={filtered.map((s, i) => (
                        <tr key={s._id || i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                            <td style={{ padding: "9px 10px", color: B.navyMid, fontWeight: 500 }}>{s.schemeId}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{s.companyId?.name || "Unknown"}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{s.productId?.tradeName || "All Products"}</td>
                            <td style={{ padding: "9px 10px" }}>
                                <span style={{ background: B.navyLight, color: B.navy, fontSize: 11, padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>
                                    {s.type === 'Free Goods' ? `Buy ${s.details?.buyQty} Get ${s.details?.freeQty}` : `${s.details?.discountPercent}% Off`}
                                </span>
                            </td>
                            <td style={{ padding: "9px 10px", color: s.status === "Expired" ? B.red : s.status === "Expiring" ? B.amber : B.textSecondary }}>
                                {new Date(s.validUntil).toLocaleDateString('en-GB')}
                            </td>
                            <td style={{ padding: "9px 10px", minWidth: 100 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <ProgressBar value={s.utilisedValue > 0 ? 100 : 0} />
                                    <span style={{ fontSize: 11, color: B.textSecondary, whiteSpace: "nowrap" }}>₹{s.utilisedValue || 0}</span>
                                </div>
                            </td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={s.status} /></td>
                            <td style={{ padding: "9px 10px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <i 
                                        className="ti ti-trash" 
                                        style={{ fontSize: 16, color: B.red, cursor: "pointer" }} 
                                        aria-label="Delete" 
                                        title="Delete scheme" 
                                        onClick={() => confirmDelete(s._id)}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                />
            </Card>
            
            {schemeToDelete && (
                <ConfirmModal 
                    title="Delete Scheme"
                    message="Are you sure you want to permanently delete this scheme? This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setSchemeToDelete(null)}
                    confirmText="Delete Scheme"
                    confirmColor={B.red}
                />
            )}
        </div>
    );
}
