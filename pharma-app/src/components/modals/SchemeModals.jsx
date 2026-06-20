import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function NewSchemeModal({ onClose }) {
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [companyId, setCompanyId] = useState('');
    const [productId, setProductId] = useState(''); // Empty means all products
    const [type, setType] = useState('Free Goods');
    const [buyQty, setBuyQty] = useState('');
    const [freeQty, setFreeQty] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [validUntil, setValidUntil] = useState('');
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/products/companies').then(res => setCompanies(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (companyId) {
            api.get(`/products`).then(res => {
                const allProds = res.data.products || [];
                setProducts(allProds.filter(p => p.companyId && p.companyId._id === companyId));
            }).catch(console.error);
        } else {
            setProducts([]);
            setProductId('');
        }
    }, [companyId]);

    const handleSubmit = async () => {
        if (!companyId || !validUntil || !type) return alert("Please fill required fields");
        if (type === 'Free Goods' && (!buyQty || !freeQty)) return alert("Please enter Buy/Free quantities");
        if (type === 'Discount' && !discountPercent) return alert("Please enter Discount Percent");

        setLoading(true);
        try {
            await api.post('/schemes', {
                companyId,
                productId: productId || null,
                type,
                buyQty,
                freeQty,
                discountPercent,
                validUntil
            });
            window.dispatchEvent(new Event('schemes:updated'));
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create scheme");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: 450, display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>Add New Scheme</div>
                        <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 2 }}>Define promotional offer logic</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Company *</label>
                            <select value={companyId} onChange={e => setCompanyId(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }}>
                                <option value="">Select Company...</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Product (Optional)</label>
                            <select value={productId} onChange={e => setProductId(e.target.value)} disabled={!companyId} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13, background: !companyId ? B.surface : B.white }}>
                                <option value="">All Company Products</option>
                                {products.map(p => <option key={p._id} value={p._id}>{p.tradeName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Scheme Type *</label>
                            <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }}>
                                <option value="Free Goods">Free Goods</option>
                                <option value="Discount">Discount</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Valid Until *</label>
                            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ width: "100%", padding: "7px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                        </div>
                    </div>

                    <div style={{ padding: "16px", background: B.surface, borderRadius: 8 }}>
                        {type === 'Free Goods' ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Buy Qty</label>
                                    <input type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)} placeholder="e.g. 10" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Get Free Qty</label>
                                    <input type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)} placeholder="e.g. 1" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: B.textSecondary, marginBottom: 6 }}>Discount Percent (%)</label>
                                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="e.g. 5" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 13 }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer" }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                        {loading ? "Saving..." : "Save Scheme"}
                    </button>
                </div>
            </div>
        </div>
    );
}


