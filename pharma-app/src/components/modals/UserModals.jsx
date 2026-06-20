import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function ProfileModal({ onClose, onLogout, currentUser }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(400px,95vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding: "20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: B.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: B.white, fontSize: 18, fontWeight: 500 }}>
                                {currentUser && currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'AD'}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary }}>{currentUser && currentUser.fullName ? currentUser.fullName : 'Admin'}</div>
                            <div style={{ fontSize: 12, color: B.textSecondary }}>{currentUser && currentUser.email ? currentUser.email : 'admin@adhyapharma.in'}</div>
                            <div style={{ fontSize: 11, color: B.navyMid, fontWeight: 500, marginTop: 4 }}>{currentUser && currentUser.role ? currentUser.role : 'Operations Manager'}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20 }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>
                
                <div style={{ padding: "8px 0" }}>
                    <button style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.textPrimary, fontSize: 13, fontFamily: "inherit" }}>
                        <i className="ti ti-user-edit" style={{ fontSize: 18, color: B.textSecondary }} /> Edit Profile
                    </button>
                    <button style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.textPrimary, fontSize: 13, fontFamily: "inherit" }}>
                        <i className="ti ti-settings" style={{ fontSize: 18, color: B.textSecondary }} /> Preferences
                    </button>
                </div>
                
                <div style={{ borderTop: `1px solid ${B.border}`, padding: "8px 0" }}>
                    <button onClick={() => { onClose(); onLogout(); }} style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: B.red, fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                        <i className="ti ti-logout" style={{ fontSize: 18 }} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
}


export function NewUserModal({ onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [branch, setBranch] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: B.white, borderRadius: 14, width: "min(500px,95vw)", maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>Add New User</div>
                        <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2 }}>Create a new system user and assign roles</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: B.textMuted, fontSize: 20, display: "flex" }} aria-label="Close">
                        <i className="ti ti-x" aria-hidden="true" />
                    </button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Full Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Kumar"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Email Address *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. ramesh@adhyapharma.in"
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Role *</label>
                            <select value={role} onChange={e => setRole(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select role…</option>
                                <option value="Operations Manager">Operations Manager</option>
                                <option value="Accounts Executive">Accounts Executive</option>
                                <option value="Warehouse Incharge">Warehouse Incharge</option>
                                <option value="Delivery Staff">Delivery Staff</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Branch *</label>
                            <select value={branch} onChange={e => setBranch(e.target.value)}
                                style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                <option value="">Select branch…</option>
                                <option value="Head Office">Head Office</option>
                                <option value="Muzaffarpur">Muzaffarpur</option>
                                <option value="Gaya">Gaya</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={() => { onClose(); }} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Create User</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

