import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, SearchInput, FilterChips, DataTable, StatusBadge } from '../components/ui.jsx';
import { EditStockModal, ViewStockModal, NewProductModal } from '../components/modals.jsx';
import api from '../api/axios';

export function InventoryPage({ showModal }) {
    const [inventory, setInventory] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [newProdIndex, setNewProdIndex] = useState(0);
    const [isSlidePaused, setIsSlidePaused] = useState(false);
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
            const [batchRes, prodRes] = await Promise.all([
                api.get('/inventory/batches'),
                api.get('/products')
            ]);
            setInventory(batchRes.data.batches || []);
            
            // Get all newly added products
            const allProds = prodRes.data?.products || [];
            const newlyAdded = allProds.filter(p => p.isNewLaunch);
            setNewProducts(newlyAdded.length > 0 ? newlyAdded : allProds.slice(0, 4));
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

    // Automatic slide banner advance for newly added products (every 5 seconds)
    useEffect(() => {
        if (newProducts.length <= 1 || isSlidePaused) return;
        const interval = setInterval(() => {
            setNewProdIndex(prev => (prev + 1) % newProducts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [newProducts.length, isSlidePaused]);

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

    const currentNew = newProducts[newProdIndex] || newProducts[0];
    const newMargin = currentNew && currentNew.mrp > 0 && currentNew.ptr > 0
        ? (((currentNew.mrp - currentNew.ptr) / currentNew.mrp) * 100).toFixed(1)
        : null;
    const currentNewBatches = currentNew ? inventory.filter(b => b.productId?._id === currentNew._id) : [];
    const currentNewUnits = currentNewBatches.reduce((acc, b) => acc + (b.qtyAvailable || 0), 0);

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

            {/* NEWLY ADDED PRODUCTS SLIDE BANNER */}
            {newProducts.length > 0 && currentNew && (
                <div
                    onMouseEnter={() => setIsSlidePaused(true)}
                    onMouseLeave={() => setIsSlidePaused(false)}
                    style={{
                        background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)",
                        color: B.white,
                        borderRadius: 12,
                        padding: "16px 20px",
                        marginBottom: 16,
                        boxShadow: "0 6px 24px rgba(6, 78, 59, 0.22)",
                        border: "1px solid rgba(52, 211, 153, 0.35)",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    {/* Background Glow */}
                    <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "rgba(52, 211, 153, 0.18)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: -40, left: "20%", width: 140, height: 140, background: "rgba(16, 185, 129, 0.12)", borderRadius: "50%", filter: "blur(30px)", pointerEvents: "none" }} />

                    {/* Banner Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8, position: "relative", zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.28)", border: "1px solid rgba(52, 211, 153, 0.5)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A7F3D0" }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", display: "inline-block", boxShadow: "0 0 10px #34D399" }} />
                                ✨ {newProducts.length > 1 ? "Newly Added Products" : "Newly Added Product"}
                            </span>
                            <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
                                Live Catalog Showcase · Syncs Real-time with Retailer Portal
                            </span>
                        </div>

                        {newProducts.length > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 11, color: "#D1FAE5", background: "rgba(0,0,0,0.25)", padding: "3px 9px", borderRadius: 12, fontWeight: 500 }}>
                                    Slide {newProdIndex + 1} of {newProducts.length}
                                </span>
                                <div style={{ display: "flex", gap: 4 }}>
                                    <button
                                        onClick={() => setNewProdIndex(prev => (prev - 1 + newProducts.length) % newProducts.length)}
                                        title="Previous Product"
                                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: B.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                        <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
                                    </button>
                                    <button
                                        onClick={() => setNewProdIndex(prev => (prev + 1) % newProducts.length)}
                                        title="Next Product"
                                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: B.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                                    >
                                        <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Product Content Card */}
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255, 255, 255, 0.12)", position: "relative", zIndex: 2 }}>
                        {/* Left Details */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: 1 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(255, 255, 255, 0.95)", display: "flex", alignItems: "center", justifyContent: "center", color: "#065F46", fontSize: 22, boxShadow: "0 4px 10px rgba(0,0,0,0.15)", flexShrink: 0 }}>
                                <i className="ti ti-box" />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: B.white, letterSpacing: "-0.01em" }}>
                                        {currentNew.tradeName}
                                    </span>
                                    {currentNew.schedule && (
                                        <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(245, 158, 11, 0.25)", color: "#FCD34D", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "1px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                                            Sched {currentNew.schedule}
                                        </span>
                                    )}
                                    <span style={{ fontSize: 10, fontWeight: 600, background: "rgba(52, 211, 153, 0.2)", color: "#6EE7B7", border: "1px solid rgba(52, 211, 153, 0.3)", padding: "1px 6px", borderRadius: 4 }}>
                                        {currentNew.category || "Counter Products"}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: "#A7F3D0", marginTop: 2, fontWeight: 500 }}>
                                    {currentNew.genericName || "Salt composition recorded"}
                                </div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <span>Company: <strong style={{ color: B.white }}>{currentNew.companyId?.name || "Aadya Pharma"}</strong></span>
                                    <span>·</span>
                                    <span>SKU: <code style={{ color: "#E0E7FF" }}>{currentNew.sku}</code></span>
                                    <span>·</span>
                                    <span>Pack: {currentNew.packing || "Standard"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Pricing & Stock Info */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Commercials</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: B.white }}>
                                    MRP: ₹{currentNew.mrp} <span style={{ fontSize: 12, color: "#6EE7B7", marginLeft: 4 }}>PTR: ₹{currentNew.ptr}</span>
                                </div>
                                {newMargin && (
                                    <div style={{ fontSize: 10, color: "#34D399", fontWeight: 600 }}>
                                        Margin: {newMargin}%
                                    </div>
                                )}
                            </div>

                            <div style={{ textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: 14 }}>
                                <div style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Warehouse Stock</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: currentNewUnits > 0 ? "#A7F3D0" : "#FCA5A5" }}>
                                    {currentNewUnits > 0 ? `${currentNewUnits.toLocaleString()} units` : "Pending Stock"}
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                                    {currentNewBatches.length} batch{currentNewBatches.length === 1 ? "" : "es"} logged
                                </div>
                            </div>

                            <button
                                onClick={showModal}
                                style={{
                                    background: "rgba(255, 255, 255, 0.95)",
                                    color: "#065F46",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "7px 12px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontFamily: "inherit",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                }}
                            >
                                <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Batch / GRN
                            </button>
                        </div>
                    </div>

                    {/* Dot Indicators */}
                    {newProducts.length > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, position: "relative", zIndex: 2 }}>
                            {newProducts.map((p, idx) => (
                                <button
                                    key={p._id || idx}
                                    onClick={() => setNewProdIndex(idx)}
                                    title={`Slide ${idx + 1}: ${p.tradeName}`}
                                    style={{
                                        width: idx === newProdIndex ? 22 : 6,
                                        height: 6,
                                        borderRadius: 3,
                                        background: idx === newProdIndex ? "#34D399" : "rgba(255,255,255,0.3)",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        transition: "all 0.3s"
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

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
