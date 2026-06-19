import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, FilterChips, DataTable, StatusBadge } from '../components/ui.jsx';
import { ViewPurchaseModal } from '../components/modals.jsx';
import api from '../api/axios';

export function PurchasePage({ showModal }) {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await api.get('/purchases');
            setPurchases(res.data || []);
        } catch (err) {
            console.error("Failed to fetch purchases", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();

        const handleUpdate = () => fetchPurchases();
        window.addEventListener('purchases-updated', handleUpdate);
        return () => window.removeEventListener('purchases-updated', handleUpdate);
    }, []);

    const statuses = ["All", "Received", "Cancelled"];
    const filtered = filter === "All" ? purchases : purchases.filter(p => p.status === filter);

    const formatAmt = amt => `₹${Math.round(amt).toLocaleString('en-IN')}`;
    const formatValue = val => val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : formatAmt(val);

    const totalValue = purchases.reduce((s, p) => s + p.totalAmount, 0);

    return (
        <div>
            <PageHeader title="Purchase / GRN" subtitle="Supplier orders · goods receipt · ITC register" action="Record GRN" onAction={showModal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-clipboard-list" label="Total GRNs" value={purchases.length.toString()} sub="All time" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-currency-rupee" label="Total Purchases" value={formatValue(totalValue)} sub="Value received" accent={B.navy} />
                <KPICard icon="ti-check" label="Completed" value={purchases.filter(p => p.status === 'Received').length.toString()} sub="Successfully recorded" accent={B.green} subColor={B.green} />
                <KPICard icon="ti-file-invoice" label="Suppliers" value={new Set(purchases.map(p => p.supplierId?._id)).size.toString()} sub="Unique vendors" accent={B.purple} />
            </div>
            <Card>
                <FilterChips options={statuses} active={filter} onChange={setFilter} />
                <DataTable
                    headers={["Supplier Inv No.", "Company", "Invoice Date", "Items", "PO Value", "Status", "Payment", "Actions"]}
                    rows={filtered.map((p, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                            <td style={{ padding: "9px 10px", color: B.navyMid, fontWeight: 500 }}>{p.supplierInvoiceNo}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{p.supplierId?.name || "Unknown"}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{new Date(p.invoiceDate).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{p.items?.length || 0} items</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{formatAmt(p.totalAmount)}</td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={p.status} /></td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary, fontWeight: 400 }}>Pending</td>
                            <td style={{ padding: "9px 10px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <i 
                                        className="ti ti-eye" 
                                        style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} 
                                        aria-label="View" 
                                        title="View details" 
                                        onClick={() => setSelectedPurchase(p)}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                />
            </Card>

            {selectedPurchase && (
                <ViewPurchaseModal purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} />
            )}
        </div>
    );
}
