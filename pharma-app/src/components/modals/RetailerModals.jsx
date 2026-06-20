import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function NewRetailerModal({ onClose }) {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [beat, setBeat] = useState("");
    const [license, setLicense] = useState("");
    const [licenseExpiry, setLicenseExpiry] = useState("");
    const [credit, setCredit] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!name || !city || !beat || !license || !licenseExpiry) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                city,
                beat,
                drugLicense: license,
                licenseExpiry: new Date(licenseExpiry + '-01'),
                creditLimit: Number(credit) || 0
            };
            
            await api.post('/retailers', payload);
            window.dispatchEvent(new Event('retailers-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create retailer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add Retailer</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Register a new pharmacy or hospital</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apollo Pharmacy"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>City / District *</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Patna"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat / Area *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="">Select...</option>
                                <option value="Patna Central">Patna Central</option>
                                <option value="Patna South">Patna South</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Nalanda">Nalanda</option>
                                <option value="Gaya">Gaya</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug License No. *</label>
                            <input type="text" value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. DL-BR-1234"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>License Expiry *</label>
                            <input type="month" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Requested Credit Limit (₹)</label>
                        <input type="number" value={credit} onChange={e => setCredit(e.target.value)} placeholder="0"
                            style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Registering..." : "Register Retailer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function EditRetailerModal({ retailerData, onClose }) {
    const [name, setName] = useState(retailerData?.name || "");
    const [city, setCity] = useState(retailerData?.city || "");
    const [beat, setBeat] = useState(retailerData?.beat || "");
    const [license, setLicense] = useState(retailerData?.drugLicense || "");
    
    // format date for input type="month" YYYY-MM
    const initialExpiry = retailerData?.licenseExpiry ? new Date(retailerData.licenseExpiry).toISOString().slice(0, 7) : "";
    const [licenseExpiry, setLicenseExpiry] = useState(initialExpiry);
    const [credit, setCredit] = useState(retailerData?.creditLimit || "");
    const [status, setStatus] = useState(retailerData?.status || "Active");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");
        if (!name || !city || !beat || !license || !licenseExpiry) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                city,
                beat,
                drugLicense: license,
                licenseExpiry: new Date(licenseExpiry + '-01'),
                creditLimit: Number(credit) || 0,
                status
            };
            
            await api.patch(`/retailers/${retailerData._id}`, payload);
            window.dispatchEvent(new Event('retailers-updated'));
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update retailer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Edit Retailer</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>{retailerData?.name}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    {error && <div style={{ marginBottom: 14, padding: "8px 12px", background: "#FFF8F8", color: B.red, fontSize: 12, borderRadius: 6, border: `1px solid #FFE5E5` }}>{error}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Retailer Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>City / District *</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Beat / Area *</label>
                            <select value={beat} onChange={e => setBeat(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="">Select...</option>
                                <option value="Patna Central">Patna Central</option>
                                <option value="Patna South">Patna South</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Nalanda">Nalanda</option>
                                <option value="Gaya">Gaya</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug License No. *</label>
                            <input type="text" value={license} onChange={e => setLicense(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>License Expiry *</label>
                            <input type="month" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Credit Limit (₹)</label>
                            <input type="number" value={credit} onChange={e => setCredit(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option value="Active">Active</option>
                                <option value="Suspended">Credit Hold (Suspended)</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>Cancel</button>
                        <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function ViewRetailerModal({ retailerData, onClose }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Retailer Info</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Read-only summary</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                <div style={{ padding: "16px 20px", fontSize: 13, color: B.textSecondary, lineHeight: "1.6" }}>
                    <div><strong>Name:</strong> {retailerData?.name}</div>
                    <div><strong>City:</strong> {retailerData?.city}</div>
                    <div><strong>Drug License:</strong> {retailerData?.drugLicense}</div>
                    <div><strong>License Expiry:</strong> {formatDate(retailerData?.licenseExpiry)}</div>
                    <div><strong>Credit Limit:</strong> ₹{retailerData?.creditLimit?.toLocaleString('en-IN') || 0}</div>
                    <div><strong>Outstanding:</strong> ₹{retailerData?.outstandingBalance?.toLocaleString('en-IN') || 0}</div>
                    <div><strong>Tier:</strong> {retailerData?.tier || "Standard"}</div>
                    <div><strong>Status:</strong> {retailerData?.status || "Active"}</div>
                    <div style={{ marginTop: 20, textAlign: "right" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textPrimary, cursor: "pointer" }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function RetailerStatementModal({ retailerData, onClose }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: B.navy }}>Statement of Account</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }}>
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "16px", background: B.surface, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: B.textPrimary }}>{retailerData?.name}</div>
                    <div style={{ fontSize: 12, color: B.textSecondary, marginTop: 4 }}>{retailerData?.city}</div>
                    <div style={{ fontSize: 12, color: B.textSecondary }}>Drug License: {retailerData?.drugLicense}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: B.textPrimary }}>Total Outstanding:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: B.red }}>₹{retailerData?.outstandingBalance?.toLocaleString('en-IN') || 0}</span>
                </div>

                <div style={{ fontSize: 12, color: B.textMuted, textAlign: "center", marginBottom: 16, padding: "20px 0" }}>
                    Statement history details will be available in Phase 5 (Payments).
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
                    <button onClick={() => alert("Statement generation will be active in Phase 5")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                        <i className="ti ti-printer" aria-hidden="true" /> Print PDF
                    </button>
                </div>
            </div>
        </div>
    );
}


