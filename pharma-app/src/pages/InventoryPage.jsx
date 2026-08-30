import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, SearchInput, FilterChips, DataTable, StatusBadge } from '../components/ui.jsx';
import { EditStockModal, ViewStockModal, NewProductModal } from '../components/modals.jsx';
import api from '../api/axios';

export function InventoryPage({ showModal }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [schedFilter, setSchedFilter] = useState("All");
    const [viewBatch, setViewBatch] = useState(null);
    const [editBatch, setEditBatch] = useState(null);
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const scheds = ["All", "OTC", "H", "H1", "X"];

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/batches');
            setInventory(res.data.batches || []);
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
        const handleUpdate = () => fetchInventory();
        window.addEventListener('inventory-updated', handleUpdate);
        window.addEventListener('products-updated', handleUpdate);
        return () => {
            window.removeEventListener('inventory-updated', handleUpdate);
            window.removeEventListener('products-updated', handleUpdate);
        };
    }, []);

    const mappedInventory = inventory.map(item => {
        const product = item.productId || {};
        const company = product.companyId || {};
        
        const expDate = new Date(item.expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        let status = "Active";
        if (diffDays < 0) status = "Expired";
        else if (diffDays <= 30) status = "Expiring";

        return {
            _id: item._id, // Keep the actual document ID for updating
            id: product.sku || 'N/A',
            name: product.tradeName || 'Unknown',
            company: company.name || 'Unknown',
            batch: item.batchNo,
            stock: item.qtyAvailable,
            expiry: expDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            daysToExpiry: diffDays,
            schedule: product.schedule || 'OTC',
            status: status,
            rack: item.rackLocation || 'N/A',
            ptr: item.costPrice || product.ptr || 0
        };
    });

    const filtered = mappedInventory.filter(p =>
        (schedFilter === "All" || p.schedule === schedFilter) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase()) || p.batch.toLowerCase().includes(search.toLowerCase()))
    );

    const expiring30 = mappedInventory.filter(p => p.daysToExpiry >= 0 && p.daysToExpiry <= 30).length;
    const expiring60 = mappedInventory.filter(p => p.daysToExpiry > 30 && p.daysToExpiry <= 60).length;
    const uniqueSKUs = new Set(mappedInventory.map(p => p.id)).size;

    return (
        <div>
            <PageHeader
                title="Inventory"
                subtitle="Batch-level stock · FEFO allocation · expiry tracking"
                action="Add stock / GRN"
                onAction={showModal}
                extraActions={
                    <button
                        onClick={() => setShowNewProductModal(true)}
                        style={{
                            background: "#059669",
                            color: B.white,
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 14px",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: "inherit"
                        }}
                    >
                        <i className="ti ti-box" style={{ fontSize: 13 }} /> Add New Product
                    </button>
                }
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-package" label="Total SKUs" value={uniqueSKUs} sub="in active stock" accent={B.navy} />
                <KPICard icon="ti-alert-circle" label="Expiring < 30 days" value={expiring30} sub="Immediate action" accent={B.red} subColor={B.red} />
                <KPICard icon="ti-clock" label="Expiring < 60 days" value={expiring60} sub="Plan returns" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-arrow-down" label="Below reorder level" value="0" sub="Setup required" accent={B.amber} subColor={B.amber} />
            </div>
            <Card>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search product, company, or batch no…" />
                    <button style={{ padding: "6px 12px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 11, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ti ti-download" style={{ fontSize: 12 }} aria-hidden="true" /> Export
                    </button>
                </div>
                <FilterChips options={scheds} active={schedFilter} onChange={setSchedFilter} />
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: B.textSecondary, fontSize: 14 }}>
                        <i className="ti ti-loader" style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 24, marginBottom: 10 }}></i>
                        <div>Loading inventory batches...</div>
                    </div>
                ) : (
                    <DataTable
                        headers={["SKU", "Product name", "Company", "Batch no.", "Stock", "Expiry", "Schedule", "Status", "Rack", "Actions"]}
                        emptyText="No batches found"
                        rows={filtered.map((p, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: p.status === "Expiring" || p.status === "Expired" ? "#FFF8F8" : i % 2 === 0 ? B.white : B.surface }}>
                                <td style={{ padding: "8px 10px", color: B.textMuted, fontSize: 11 }}>{p.id}</td>
                                <td style={{ padding: "8px 10px", fontWeight: 500 }}>{p.name}</td>
                                <td style={{ padding: "8px 10px", color: B.textSecondary }}>{p.company}</td>
                                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: B.textSecondary }}>{p.batch}</td>
                                <td style={{ padding: "8px 10px", fontWeight: 500, color: p.stock < 50 ? B.red : B.textPrimary }}>{p.stock.toLocaleString()}</td>
                                <td style={{ padding: "8px 10px", color: p.status === "Expired" || p.status === "Expiring" ? B.red : B.textSecondary }}>{p.expiry}</td>
                                <td style={{ padding: "8px 10px" }}><StatusBadge status={p.schedule} /></td>
                                <td style={{ padding: "8px 10px" }}><StatusBadge status={p.status} /></td>
                                <td style={{ padding: "8px 10px", color: B.textMuted, fontFamily: "monospace", fontSize: 11 }}>{p.rack}</td>
                                <td style={{ padding: "8px 10px" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <i onClick={() => setViewBatch(p)} className="ti ti-eye" style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="View" />
                                        <i onClick={() => setEditBatch(p)} className="ti ti-edit" style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} aria-label="Edit" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    />
                )}
            </Card>
            {editBatch && <EditStockModal batchData={editBatch} onClose={() => setEditBatch(null)} />}
            {viewBatch && <ViewStockModal batchData={viewBatch} onClose={() => setViewBatch(null)} />}
            {showNewProductModal && (
                <NewProductModal
                    onClose={() => setShowNewProductModal(false)}
                    onProductCreated={() => fetchInventory()}
                />
            )}
        </div>
    );
}
