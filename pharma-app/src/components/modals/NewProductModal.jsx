import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

const CATEGORY_OPTIONS = [
    { label: "Tablets", value: "tablets" },
    { label: "Capsules", value: "capsules" },
    { label: "Syrups & Suspensions", value: "syrups" },
    { label: "Injections & IV", value: "injections" },
    { label: "Counter Products", value: "counter-products" },
    { label: "Surgical Products", value: "surgical-products" },
    { label: "Ointment & Creams", value: "ointment" },
    { label: "Drops (Eye/Ear/Nasal)", value: "drops" },
    { label: "Balms & Pain Killers", value: "balms-and-pain-killers" },
    { label: "Baby Products", value: "baby-products" },
    { label: "Health Drinks & Supplements", value: "health-drinks" },
    { label: "Laxatives & Powders", value: "laxative-powders" },
    { label: "Medical Devices", value: "medical-devices" }
];

export function NewProductModal({ onClose, onProductCreated }) {
    const [tradeName, setTradeName] = useState("");
    const [genericName, setGenericName] = useState("");
    const [category, setCategory] = useState("tablets");
    const [customCategory, setCustomCategory] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [customCompany, setCustomCompany] = useState("");
    const [isNewCompany, setIsNewCompany] = useState(false);
    const [sku, setSku] = useState("");
    const [packing, setPacking] = useState("");
    const [schedule, setSchedule] = useState("OTC");
    const [hsnCode, setHsnCode] = useState("3004");
    const [gstRate, setGstRate] = useState("12");
    const [mrp, setMrp] = useState("");
    const [ptr, setPtr] = useState("");
    const [description, setDescription] = useState("");

    // Initial stock (optional)
    const [addInitialStock, setAddInitialStock] = useState(false);
    const [batchNo, setBatchNo] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [qty, setQty] = useState("");
    const [rackLocation, setRackLocation] = useState("");
    const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");

    const [suppliersList, setSuppliersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await api.get('/products/companies');
                setSuppliersList(res.data || []);
                if (res.data && res.data.length > 0) {
                    setCompanyId(res.data[0]._id);
                }
            } catch (err) {
                console.error("Failed to load companies:", err);
            }
        };
        loadCompanies();
    }, []);

    // Auto-generate SKU preview
    useEffect(() => {
        if (tradeName && !sku) {
            const prefix = tradeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'PROD';
            setSku(`SKU-${prefix}-${Math.floor(100 + Math.random() * 900)}`);
        }
    }, [tradeName, sku]);

    // Calculate Retailer Margin %
    const numMrp = parseFloat(mrp) || 0;
    const numPtr = parseFloat(ptr) || 0;
    const marginPercent = numMrp > 0 && numPtr > 0 ? (((numMrp - numPtr) / numMrp) * 100).toFixed(1) : null;

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError("");

        if (!tradeName.trim()) {
            setError("Please enter the Product Trade Name.");
            return;
        }
        if (!mrp || parseFloat(mrp) <= 0) {
            setError("Please enter a valid MRP greater than 0.");
            return;
        }
        if (!ptr || parseFloat(ptr) <= 0) {
            setError("Please enter a valid PTR greater than 0.");
            return;
        }
        if (parseFloat(ptr) > parseFloat(mrp)) {
            setError("PTR cannot be higher than MRP.");
            return;
        }
        if (isNewCompany && !customCompany.trim()) {
            setError("Please enter the new manufacturer/supplier name.");
            return;
        }
        if (!isNewCompany && !companyId) {
            setError("Please select a manufacturer/supplier.");
            return;
        }

        if (addInitialStock) {
            if (!batchNo.trim() || !expiryDate || !qty || parseInt(qty) <= 0) {
                setError("Please fill all initial stock fields (Batch, Expiry, Qty) or uncheck initial stock.");
                return;
            }
        }

        try {
            setLoading(true);

            const payload = {
                tradeName: tradeName.trim(),
                genericName: genericName.trim(),
                category: category === "other" ? customCategory.trim() : category,
                companyId: isNewCompany ? undefined : companyId,
                companyName: isNewCompany ? customCompany.trim() : undefined,
                sku: sku.trim(),
                packing: packing.trim() || "Standard Pack",
                schedule,
                hsnCode: hsnCode.trim(),
                gstRate: parseFloat(gstRate) || 0,
                mrp: parseFloat(mrp),
                ptr: parseFloat(ptr),
                description: description.trim(),
                initialBatch: addInitialStock ? {
                    batchNo: batchNo.trim(),
                    expiryDate,
                    qty: parseInt(qty),
                    rackLocation: rackLocation.trim(),
                    supplierInvoiceNo: supplierInvoiceNo.trim()
                } : undefined
            };

            const res = await api.post('/products', payload);

            // Notify app listeners to refresh inventory tables
            window.dispatchEvent(new Event('inventory-updated'));
            window.dispatchEvent(new Event('products-updated'));

            if (onProductCreated) {
                onProductCreated(res.data.product);
            }
            onClose();
        } catch (err) {
            console.error("Failed to create product:", err);
            setError(err.response?.data?.message || "Failed to create product. Please verify fields.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, backdropFilter: "blur(2px)" }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(780px, 95vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.22)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, background: "#E6F4EA", color: "#137333", fontSize: 14 }}>
                                <i className="ti ti-box" />
                            </span>
                            Add New Product to Catalog
                        </div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>
                            Create master product profile · Automatic announcement banner on Retailer Portal
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
                    {error && (
                        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 8, border: "1px solid #FFE5E5", display: "flex", alignItems: "center", gap: 8 }}>
                            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Server Announcement Guard Alert */}
                    <div style={{ marginBottom: 16, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <i className="ti ti-speakerphone" style={{ fontSize: 18, color: "#16A34A", marginTop: 1 }} />
                        <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.4 }}>
                            <strong style={{ display: "block", marginBottom: 2 }}>📢 Automatic Retailer Live Announcement</strong>
                            Saving this product will instantly publish a <strong>"NEW PRODUCT IS ADDED IN OUR CATEGORY"</strong> banner across the Retailer Portal with verified details, keeping all connected retailers up to date.
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Basic Information */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: B.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                                1. Product Master Details
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Trade Name (Brand Name) *</label>
                                    <input
                                        type="text"
                                        value={tradeName}
                                        onChange={e => setTradeName(e.target.value)}
                                        placeholder="e.g. Augmentin 625 Duo, Dolo 650"
                                        required
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Generic / Salt Formula</label>
                                    <input
                                        type="text"
                                        value={genericName}
                                        onChange={e => setGenericName(e.target.value)}
                                        placeholder="e.g. Amoxicillin + Clavulanic Acid"
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Category *</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}
                                    >
                                        {CATEGORY_OPTIONS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                        <option value="other">+ Other / Custom Category</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Packaging Size *</label>
                                    <input
                                        type="text"
                                        value={packing}
                                        onChange={e => setPacking(e.target.value)}
                                        placeholder="e.g. 10x10 Strip, 100ml Bottle"
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug Schedule</label>
                                    <select
                                        value={schedule}
                                        onChange={e => setSchedule(e.target.value)}
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}
                                    >
                                        <option value="OTC">OTC (Over The Counter)</option>
                                        <option value="H">Schedule H (Prescription)</option>
                                        <option value="H1">Schedule H1 (Controlled)</option>
                                        <option value="X">Schedule X (Narcotic)</option>
                                    </select>
                                </div>
                            </div>

                            {category === "other" && (
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Custom Category Name *</label>
                                    <input
                                        type="text"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        placeholder="Type custom category name..."
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                            )}

                            {/* Manufacturer Selection */}
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary }}>Manufacturer / Supplier *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsNewCompany(!isNewCompany)}
                                            style={{ background: "none", border: "none", color: B.navyMid, fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" }}
                                        >
                                            {isNewCompany ? "Choose Existing" : "+ New Manufacturer"}
                                        </button>
                                    </div>
                                    {isNewCompany ? (
                                        <input
                                            type="text"
                                            value={customCompany}
                                            onChange={e => setCustomCompany(e.target.value)}
                                            placeholder="Enter Manufacturer Name (e.g. Cipla, Sun Pharma)"
                                            style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                        />
                                    ) : (
                                        <select
                                            value={companyId}
                                            onChange={e => setCompanyId(e.target.value)}
                                            style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}
                                        >
                                            {suppliersList.map(s => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>SKU / Barcode</label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={e => setSku(e.target.value)}
                                        placeholder="Auto-generated or custom"
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pricing & Commercials */}
                        <div style={{ marginBottom: 18, padding: "14px", background: B.surface, borderRadius: 10, border: `1px solid ${B.border}` }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: B.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                                2. Commercial Pricing & Tax
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 12, alignItems: "center" }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>MRP (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={mrp}
                                        onChange={e => setMrp(e.target.value)}
                                        placeholder="e.g. 120.00"
                                        required
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>PTR (Retailer Price ₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={ptr}
                                        onChange={e => setPtr(e.target.value)}
                                        placeholder="e.g. 95.00"
                                        required
                                        style={{ width: "100%", height: 36, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "0 10px", background: B.white, color: B.navy, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer Margin Preview</label>
                                    <div style={{ height: 36, display: "flex", alignItems: "center", padding: "0 12px", background: marginPercent && marginPercent > 0 ? "#ECFDF5" : "#F3F4F6", borderRadius: 8, border: `1px solid ${marginPercent && marginPercent > 0 ? "#A7F3D0" : B.border}`, fontSize: 12, fontWeight: 600, color: marginPercent && marginPercent > 0 ? "#059669" : B.textMuted }}>
                                        {marginPercent ? `${marginPercent}% Retailer Margin (₹${(numMrp - numPtr).toFixed(2)})` : "Enter MRP & PTR"}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>HSN Code</label>
                                    <input
                                        type="text"
                                        value={hsnCode}
                                        onChange={e => setHsnCode(e.target.value)}
                                        placeholder="3004"
                                        style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>GST Rate (%)</label>
                                    <select
                                        value={gstRate}
                                        onChange={e => setGstRate(e.target.value)}
                                        style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, fontFamily: "inherit" }}
                                    >
                                        <option value="0">0% (Nil)</option>
                                        <option value="5">5% (Essential medicines)</option>
                                        <option value="12">12% (Standard pharma formulation)</option>
                                        <option value="18">18% (Supplements & cosmetics)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Product Description / Retailer Highlights */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>
                                Product Highlights & Indications (Visible to Retailers)
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                placeholder="e.g. Indicated for respiratory tract and soft tissue infections. 10 strips per box."
                                style={{ width: "100%", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "8px 10px", background: B.surface, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
                            />
                        </div>

                        {/* Section 4: Initial Batch / Inventory Stock (Optional) */}
                        <div style={{ marginBottom: 16, border: `1px solid ${B.border}`, borderRadius: 10, overflow: "hidden" }}>
                            <div
                                onClick={() => setAddInitialStock(!addInitialStock)}
                                style={{ padding: "12px 14px", background: addInitialStock ? "#F8FAFC" : B.white, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={addInitialStock}
                                        onChange={e => setAddInitialStock(e.target.checked)}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: B.textPrimary }}>
                                        Receive Initial Stock / Opening Batch (GRN)
                                    </span>
                                </div>
                                <span style={{ fontSize: 11, color: B.textMuted }}>
                                    {addInitialStock ? "Will create active batch & purchase record" : "Click to add initial stock batch"}
                                </span>
                            </div>

                            {addInitialStock && (
                                <div style={{ padding: "14px", borderTop: `1px solid ${B.border}`, background: "#F8FAFC" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Batch No. *</label>
                                            <input
                                                type="text"
                                                value={batchNo}
                                                onChange={e => setBatchNo(e.target.value)}
                                                placeholder="e.g. BATCH-001"
                                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Expiry (YYYY-MM) *</label>
                                            <input
                                                type="month"
                                                value={expiryDate}
                                                onChange={e => setExpiryDate(e.target.value)}
                                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Opening Qty *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={qty}
                                                onChange={e => setQty(e.target.value)}
                                                placeholder="e.g. 100"
                                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Rack Location</label>
                                            <input
                                                type="text"
                                                value={rackLocation}
                                                onChange={e => setRackLocation(e.target.value)}
                                                placeholder="e.g. R-04"
                                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Supplier Invoice / DC No. (Optional)</label>
                                        <input
                                            type="text"
                                            value={supplierInvoiceNo}
                                            onChange={e => setSupplierInvoiceNo(e.target.value)}
                                            placeholder="Leave empty for auto-generated opening invoice"
                                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.white, color: B.textPrimary, boxSizing: "border-box", fontFamily: "inherit" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ padding: "14px 20px", borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: B.surface }}>
                    <div style={{ fontSize: 11, color: B.textMuted }}>
                        * Required fields for product catalog master
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, fontWeight: 500, color: B.textPrimary, cursor: "pointer", fontFamily: "inherit" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{ padding: "8px 18px", border: "none", borderRadius: 8, background: B.navy, fontSize: 12, fontWeight: 500, color: B.white, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <>
                                    <i className="ti ti-loader" style={{ display: "inline-block", animation: "spin 1s linear infinite" }} />
                                    Saving & Announcing...
                                </>
                            ) : (
                                <>
                                    <i className="ti ti-plus" />
                                    Save Product & Broadcast
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
