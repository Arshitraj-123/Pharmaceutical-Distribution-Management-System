import { useState } from 'react';
import { B } from '../theme.js';
import { NAV_SECTIONS } from '../navConfig.js';
import { NOTIFICATIONS } from '../mockData.js';

export function Sidebar({ active, setActive, collapsed, setCollapsed, sidebarOpen, onLogout }) {
    return (
        <div className={`sidebar-container ${sidebarOpen ? "open" : ""}`} style={{ width: collapsed ? 58 : 220, minHeight: "100vh", background: B.navy, flexShrink: 0, display: "flex", flexDirection: "column", zIndex: 1000 }}>
            {/* Logo */}
            <div style={{ padding: collapsed ? "14px 0" : "14px 14px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: B.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="ti ti-pill" style={{ fontSize: 16, color: B.white }} aria-hidden="true" />
                </div>
                {!collapsed && <div><div style={{ color: B.white, fontWeight: 500, fontSize: 12, lineHeight: 1.2 }}>Adhya Pharmex</div></div>}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
                {NAV_SECTIONS.map((section, si) => (
                    <div key={si} style={{ marginBottom: 4 }}>
                        {!collapsed && <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", padding: "8px 10px 4px" }}>{section.label}</div>}
                        {section.items.map(item => {
                            const isActive = active === item.id;
                            return (
                                <button key={item.id} onClick={() => setActive(item.id)} aria-current={isActive ? "page" : undefined}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 9, padding: collapsed ? "9px" : "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? "rgba(255,255,255,.14)" : "transparent", color: isActive ? B.white : "rgba(255,255,255,.58)", fontSize: 12, fontWeight: isActive ? 500 : 400, marginBottom: 1, justifyContent: collapsed ? "center" : "flex-start", position: "relative", fontFamily: "inherit" }}>
                                    <i className={`ti ${item.icon}`} style={{ fontSize: 17, flexShrink: 0 }} aria-hidden="true" />
                                    {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                                    {!collapsed && item.badge && <span style={{ background: B.red, color: B.white, fontSize: 9, fontWeight: 500, padding: "1px 5px", borderRadius: 10, minWidth: 16, textAlign: "center" }}>{item.badge}</span>}
                                    {collapsed && item.badge && <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: B.red }} />}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div style={{ display: 'flex', gap: 6, margin: "8px 6px" }}>
                <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", padding: 9, border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, background: "transparent", color: "rgba(255,255,255,.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", flexShrink: 0 }} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    <i className={`ti ${collapsed ? "ti-layout-sidebar-right" : "ti-layout-sidebar"}`} style={{ fontSize: 17 }} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export function Header({ page, onBell, showBell, onMenu, currentUser, onEditProfile, onLogout }) {
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const unread = NOTIFICATIONS.filter(n => !n.read).length;
    return (
        <div style={{ height: 54, background: B.white, borderBottom: `1px solid ${B.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", gap: 12, flexShrink: 0, position: "relative", zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <button className="mobile-menu-btn" onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", display: "none", fontSize: 20, color: B.textSecondary, padding: 0 }} aria-label="Menu">
                    <i className="ti ti-menu-2" aria-hidden="true" />
                </button>
                <style>{`@media (max-width: 768px) { .mobile-menu-btn { display: flex !important; } }`}</style>
                <div className="header-search" style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                    <i className="ti ti-search" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: B.textMuted, fontSize: 14 }} aria-hidden="true" />
                    <input placeholder="Search products, orders, retailers…" aria-label="Global search"
                        style={{ width: "100%", paddingLeft: 30, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, color: B.textPrimary, background: B.surface, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
            </div>
            <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", flexShrink: 0 }}>
                <button onClick={onBell} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", display: "flex", fontSize: 20, color: B.textSecondary }} aria-label="Notifications">
                    <i className="ti ti-bell" aria-hidden="true" />
                    {unread > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: B.red }} />}
                </button>
                <div style={{ width: 1, height: 22, background: B.border }} />
                <div style={{ position: 'relative' }}>
                    <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: B.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: B.white, fontSize: 11, fontWeight: 500 }}>
                                {currentUser && currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'AD'}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>{currentUser && currentUser.fullName ? currentUser.fullName : 'Admin'}</div>
                            <div style={{ fontSize: 10, color: B.textMuted }}>{currentUser && currentUser.role ? currentUser.role : 'Operations Manager'}</div>
                        </div>
                        <i className={`ti ${profileMenuOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 13, color: B.textMuted }} aria-hidden="true" />
                    </div>
                    {profileMenuOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setProfileMenuOpen(false)} />
                            <div style={{ position: 'absolute', top: 40, right: 0, width: 180, background: B.white, border: `1px solid ${B.border}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                                <button onClick={() => { setProfileMenuOpen(false); onEditProfile(); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${B.border}`, textAlign: 'left', fontSize: 12, color: B.textPrimary, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="ti ti-user-edit" style={{ fontSize: 16, color: B.textSecondary }} />
                                    Edit Profile
                                </button>
                                <button onClick={() => { setProfileMenuOpen(false); onLogout(); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 12, color: B.red, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="ti ti-logout" style={{ fontSize: 16 }} />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
