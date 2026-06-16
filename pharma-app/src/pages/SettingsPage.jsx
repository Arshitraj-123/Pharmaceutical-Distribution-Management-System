import { useState } from 'react';
import { B } from '../theme.js';
import { PageHeader, Card, EmptyState, DataTable, StatusBadge } from '../components/ui.jsx';
import { NewUserModal } from '../components/modals.jsx';

// Custom Toggle Component
const CustomToggle = ({ enabled, setEnabled }) => (
    <div onClick={() => setEnabled(!enabled)} style={{ width: 40, height: 22, background: enabled ? B.green : B.border, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, background: B.white, borderRadius: '50%', position: 'absolute', top: 3, left: enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
);

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState("company");
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    
    // GST Settings State
    const [gstVerified, setGstVerified] = useState(false);
    const [apiConnected, setApiConnected] = useState(false);
    const [eInvoiceEnabled, setEInvoiceEnabled] = useState(true);
    const [eWayBillEnabled, setEWayBillEnabled] = useState(true);
    const [gstrReminder, setGstrReminder] = useState(true);
    const [itcTracking, setItcTracking] = useState(true);
    const [hsnMandatory, setHsnMandatory] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);

    // Notification Settings State
    const [channels, setChannels] = useState({
        orderPlaced: { inApp: true, email: true, sms: true },
        orderDispatched: { inApp: true, email: false, sms: true },
        orderDelivered: { inApp: true, email: false, sms: true },
        invoiceGenerated: { inApp: true, email: true, sms: true },
        paymentDue: { inApp: true, email: true, sms: true },
        paymentOverdue: { inApp: true, email: true, sms: true },
        nearExpiry: { inApp: true, email: true, sms: false },
        dlExpiry: { inApp: true, email: true, sms: true },
        reorderLevel: { inApp: true, email: true, sms: false },
        productRecall: { inApp: true, email: true, sms: true },
        newScheme: { inApp: true, email: false, sms: true },
        gstrDue: { inApp: true, email: true, sms: false },
    });
    const handleChannelToggle = (key, ch) => setChannels(p => ({ ...p, [key]: { ...p[key], [ch]: !p[key][ch] } }));
    const alertLabels = {
        orderPlaced: "Order placed / confirmed", orderDispatched: "Order dispatched", orderDelivered: "Order delivered (POD)",
        invoiceGenerated: "Invoice generated", paymentDue: "Payment due reminder", paymentOverdue: "Payment overdue",
        nearExpiry: "Near-expiry stock alert", dlExpiry: "Drug License expiry (retailer)", reorderLevel: "Reorder level reached",
        productRecall: "Product recall alert", newScheme: "New scheme launched", gstrDue: "GSTR-1 filing due"
    };
    const [dlChips, setDlChips] = useState({ d90: true, d60: true, d30: true });
    const [reminderDays, setReminderDays] = useState({ d7: true, d3: true, d1: true });
    const [digests, setDigests] = useState({ dailySales: true, weeklyOut: true, weeklyExp: true, monthlyGst: true });

    // Security Settings State
    const [pwdPolicy, setPwdPolicy] = useState({
        minLen: 8, upper: true, num: true, spec: true, expiry: "90 days", reuse: 5, forceReset: true
    });
    const [accessCtrl, setAccessCtrl] = useState({
        timeout: "1 hour", concurrent: "2", lockout: 5, duration: "30 minutes", ipWhitelist: ""
    });
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const tabs = [
        { id: "company", label: "Company info", icon: "ti-building" },
        { id: "users", label: "Users & roles", icon: "ti-users" },
        { id: "gst", label: "GST / Tax", icon: "ti-file-invoice" },
        { id: "notif", label: "Notifications", icon: "ti-bell" },
        { id: "security", label: "Security", icon: "ti-shield" },
    ];
    
    return (
        <div style={{ paddingBottom: 40 }}>
            <PageHeader title="Settings" subtitle="System configuration · users · GST setup · security" />
            <div style={{ display: "flex", gap: 0, marginBottom: 14, borderBottom: `1px solid ${B.border}` }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
                        fontSize: 12, fontWeight: 500, color: activeTab === t.id ? B.navy : B.textSecondary,
                        borderBottom: activeTab === t.id ? `2px solid ${B.navy}` : "2px solid transparent",
                        display: "flex", alignItems: "center", gap: 6, marginBottom: -1
                    }}>
                        <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />{t.label}
                        {t.id === "security" && (
                            <span style={{ background: B.red, color: B.white, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, marginLeft: 4, letterSpacing: 0.5 }}>ADMIN ONLY</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div>
                {/* Company Tab */}
                {activeTab === "company" && (
                    <Card>
                        <div className="grid-responsive grid-2-col" style={{ marginBottom: 0 }}>
                            {[["Company name", "Adhya Pharmex Pvt. Ltd."], ["GSTIN", "22AABCA1234Z1Z5"], ["Drug License no.", "BR/DL/DIST/2022/00001"], ["Drug License expiry", "31 Dec 2027"], ["PAN", "AABCA1234Z"], ["State", "Bihar"], ["Head office", "Patna, Bihar — 800001"], ["Phone", "+91 98765 43210"]].map(([l, v], i) => (
                                <div key={i}>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>{l}</label>
                                    <input defaultValue={v} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                                </div>
                            ))}
                            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                                <button style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <Card>
                        <div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                                <button onClick={() => setShowAddUserModal(true)} style={{ padding: "7px 12px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                                    <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" /> Add user
                                </button>
                            </div>
                            <DataTable
                                headers={["Name", "Email", "Role", "Branch", "Status", "Actions"]}
                                rows={[
                                    ["Rajesh Kumar", "rajesh@adhyapharma.in", "Operations Manager", "Head Office", "Active"],
                                    ["Priya Sharma", "priya@adhyapharma.in", "Accounts Executive", "Head Office", "Active"],
                                    ["Sunil Yadav", "sunil@adhyapharma.in", "Warehouse Incharge", "Head Office", "Active"],
                                    ["Rajan Kumar", "rajan@adhyapharma.in", "Delivery Staff", "Head Office", "Active"],
                                    ["Amit Singh", "amit@adhyapharma.in", "Delivery Staff", "Muzaffarpur", "Active"],
                                ].map(([name, email, role, branch, st], i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                        <td style={{ padding: "9px 10px", fontWeight: 500 }}>{name}</td>
                                        <td style={{ padding: "9px 10px", color: B.textSecondary, fontSize: 11 }}>{email}</td>
                                        <td style={{ padding: "9px 10px" }}><span style={{ background: B.navyLight, color: B.navy, fontSize: 11, padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>{role}</span></td>
                                        <td style={{ padding: "9px 10px", color: B.textSecondary }}>{branch}</td>
                                        <td style={{ padding: "9px 10px" }}><StatusBadge status={st} /></td>
                                        <td style={{ padding: "9px 10px" }}>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <i className="ti ti-edit" style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="Edit" />
                                                <i className="ti ti-trash" style={{ fontSize: 15, color: B.red, cursor: "pointer" }} aria-label="Delete" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            />
                        </div>
                    </Card>
                )}

                {/* GST / Tax Settings Tab */}
                {activeTab === "gst" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* CARD 1: GST Registration Details */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>GST Registration Details</div>
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 20 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>GSTIN</label>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <input defaultValue="22AABCA1234Z1Z5" style={{ flex: 1, minWidth: 0, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <button onClick={() => setGstVerified(true)} style={{ padding: "0 12px", height: 34, border: `1px solid #0d9488`, borderRadius: 8, background: "transparent", color: "#0d9488", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                            {gstVerified ? <><i className="ti ti-check" /> Valid ✓</> : "Verify GSTIN"}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>GST Registration Type</label>
                                    <select style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>Regular Taxpayer</option>
                                        <option>Composition Dealer</option>
                                        <option>SEZ</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>State of Registration</label>
                                    <select style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>Bihar</option>
                                        <option>Uttar Pradesh</option>
                                        <option>Jharkhand</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>PAN</label>
                                    <div style={{ position: "relative" }}>
                                        <input readOnly defaultValue="AABCA1234Z" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", cursor: "not-allowed" }} />
                                        <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Auto-derived from GSTIN</div>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Registered Business Name</label>
                                    <input defaultValue="Aadhya Pharmex Pvt. Ltd." style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Effective Registration Date</label>
                                    <input type="text" defaultValue="01 Apr 2022" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                </div>
                            </div>
                            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <i className="ti ti-alert-triangle" style={{ color: "#D97706", fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                                <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
                                    <strong style={{ display: "block", marginBottom: 4 }}>⚠️ GST Rate Update — 56th GST Council (effective 22 Sep 2025):</strong>
                                    Life-saving drugs (HIV/TB/Cancer/Vaccines/Insulin) = NIL (0%) · Most finished medicines &amp; OTC = 5% · APIs &amp; chemical intermediates = 18%. The 12% slab no longer applies to finished pharmaceutical products.
                                </div>
                            </div>
                        </Card>

                        {/* CARD 2: e-Invoice Configuration */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>e-Invoice Configuration</div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>e-Invoicing enabled</div>
                                    <div style={{ fontSize: 11, color: B.textMuted }}>Mandatory for AATO &gt; ₹5 Crore</div>
                                </div>
                                <CustomToggle enabled={eInvoiceEnabled} setEnabled={setEInvoiceEnabled} />
                            </div>

                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 20 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>IRP Provider</label>
                                    <select style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>NIC (einvoice1.gst.gov.in)</option>
                                        <option>ClearTax IRP</option>
                                        <option>IRIS IRP</option>
                                        <option>Cygnet IRP</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>API Endpoint</label>
                                    <input readOnly defaultValue="https://einvoice1.gst.gov.in/api/v1.03" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", cursor: "not-allowed" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>IRN Submission Window</label>
                                    <input readOnly defaultValue="30 days from invoice date" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", cursor: "not-allowed" }} />
                                    <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>(mandatory from Apr 2025 for ₹10Cr+ turnover)</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>API Key</label>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <div style={{ position: "relative", flex: 1 }}>
                                            <input type="password" defaultValue="nic-production-api-key" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 30px 0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                            <i className="ti ti-eye" style={{ position: 'absolute', right: 10, top: 10, color: B.textMuted, fontSize: 14, cursor: 'pointer' }} aria-hidden="true" />
                                        </div>
                                        <button onClick={() => { setApiConnected(true); showToast("API Connected ✓"); }} style={{ padding: "0 12px", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, color: B.textPrimary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                                            {apiConnected ? <span style={{ color: B.green }}>Connected ✓</span> : "Test connection"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: 1, background: B.border, margin: "20px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Auto-generate e-Way Bill</div>
                                </div>
                                <CustomToggle enabled={eWayBillEnabled} setEnabled={setEWayBillEnabled} />
                            </div>

                            <div>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>e-Way Bill threshold</label>
                                <select style={{ width: "100%", maxWidth: 300, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                    <option>₹50,000 interstate (default)</option>
                                    <option>₹1,00,000 interstate</option>
                                </select>
                                <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Intrastate thresholds vary by state — Bihar: ₹1,00,000</div>
                            </div>
                        </Card>

                        {/* CARD 3: GST Filing & Reporting */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>GST Filing & Reporting</div>
                            
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 24, gap: 24 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>GSTR-1 filing frequency</label>
                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: B.textPrimary }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                            <input type="radio" name="gstr1" defaultChecked /> Monthly (default)
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                            <input type="radio" name="gstr1" /> Quarterly (QRMP)
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Default tax computation</label>
                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: B.textPrimary }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                            <input type="radio" name="taxcomp" defaultChecked /> Tax-exclusive (default)
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                            <input type="radio" name="taxcomp" /> Tax-inclusive
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>GSTR-1 due date reminder</div>
                                        {gstrReminder && <input defaultValue="3 days before due date" style={{ marginTop: 6, width: "100%", maxWidth: 200, height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 8px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />}
                                    </div>
                                    <CustomToggle enabled={gstrReminder} setEnabled={setGstrReminder} />
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>ITC tracking</div>
                                        <div style={{ fontSize: 11, color: B.textMuted }}>Track Input Tax Credit on all purchases</div>
                                    </div>
                                    <CustomToggle enabled={itcTracking} setEnabled={setItcTracking} />
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>HSN code mandatory</div>
                                        <div style={{ fontSize: 11, color: B.textMuted }}>Required on all invoices above ₹50,000</div>
                                    </div>
                                    <CustomToggle enabled={hsnMandatory} setEnabled={setHsnMandatory} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Round-off method</label>
                                <select style={{ width: "100%", maxWidth: 300, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                    <option>Round to nearest rupee (default)</option>
                                    <option>Truncate paise</option>
                                    <option>Keep paise</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                                <button onClick={() => showToast("Settings Saved successfully!")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Notifications Settings Tab */}
                {activeTab === "notif" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* CARD 1: Notification Channels */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 6 }}>Notification Channels</div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 20 }}>Choose how you receive alerts. At least one channel must be enabled.</div>
                            
                            <div style={{ width: "100%", border: `1px solid ${B.border}`, borderRadius: 8, overflow: "hidden" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "12px 16px", background: B.surface, borderBottom: `1px solid ${B.border}`, fontSize: 11, fontWeight: 600, color: B.textSecondary }}>
                                    <div>Alert Type</div>
                                    <div style={{ textAlign: "center" }}>In-App</div>
                                    <div style={{ textAlign: "center" }}>Email</div>
                                    <div style={{ textAlign: "center" }}>SMS/WhatsApp</div>
                                </div>
                                {Object.entries(alertLabels).map(([key, label], idx, arr) => (
                                    <div key={key} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: idx === arr.length - 1 ? "none" : `1px solid ${B.border}`, alignItems: "center" }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>{label}</div>
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key].inApp} setEnabled={() => handleChannelToggle(key, 'inApp')} /></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key].email} setEnabled={() => handleChannelToggle(key, 'email')} /></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key].sms} setEnabled={() => handleChannelToggle(key, 'sms')} /></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                                <button onClick={() => showToast("Channel preferences saved successfully!")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save channel preferences</button>
                            </div>
                        </Card>

                        {/* CARD 2: Alert Thresholds */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Alert Thresholds</div>
                            
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 24, gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Near-expiry stock alert</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <input type="number" defaultValue={60} style={{ width: 60, height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>days before expiry</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, color: B.textMuted }}>also alert at</span>
                                        <input type="number" defaultValue={30} style={{ width: 60, height: 28, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 8px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 11, color: B.textMuted }}>days</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Reorder level breach</div>
                                    <select style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>Alert immediately (default)</option>
                                        <option>Daily digest</option>
                                        <option>Weekly digest</option>
                                    </select>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Outstanding payment reminder</div>
                                    <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 6 }}>Send reminder X days before due date</div>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                        {['d7', 'd3', 'd1'].map(d => (
                                            <div key={d} onClick={() => setReminderDays(p => ({ ...p, [d]: !p[d] }))} style={{ padding: "4px 10px", border: `1px solid ${reminderDays[d] ? B.navy : B.border}`, borderRadius: 16, background: reminderDays[d] ? B.navyLight : B.surface, color: reminderDays[d] ? B.navy : B.textSecondary, fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                                {d.replace('d', '')} days {reminderDays[d] && "✓"}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, color: B.textSecondary }}>Send overdue alert every</span>
                                        <input type="number" defaultValue={2} style={{ width: 50, height: 28, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 8px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 11, color: B.textSecondary }}>days</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Drug License expiry advance alert</div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                        {['d90', 'd60', 'd30'].map(d => (
                                            <div key={d} onClick={() => setDlChips(p => ({ ...p, [d]: !p[d] }))} style={{ padding: "4px 10px", border: `1px solid ${dlChips[d] ? B.navy : B.border}`, borderRadius: 16, background: dlChips[d] ? B.navyLight : B.surface, color: dlChips[d] ? B.navy : B.textSecondary, fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                                {d.replace('d', '')} days {dlChips[d] && "✓"}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>GSTR-1 filing reminder</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <input type="number" defaultValue={3} style={{ width: 50, height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>days before due date</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* CARD 3: Digest & Summary Reports */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Digest & Summary Reports</div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <CustomToggle enabled={digests.dailySales} setEnabled={() => setDigests(p => ({ ...p, dailySales: !p.dailySales }))} />
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Daily sales summary email</div>
                                    </div>
                                    {digests.dailySales && <input type="time" defaultValue="07:00" style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />}
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <CustomToggle enabled={digests.weeklyOut} setEnabled={() => setDigests(p => ({ ...p, weeklyOut: !p.weeklyOut }))} />
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Weekly outstanding report</div>
                                    </div>
                                    {digests.weeklyOut && <select style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>Every Monday</option>
                                        <option>Every Friday</option>
                                    </select>}
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <CustomToggle enabled={digests.weeklyExp} setEnabled={() => setDigests(p => ({ ...p, weeklyExp: !p.weeklyExp }))} />
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Weekly near-expiry report</div>
                                    </div>
                                    {digests.weeklyExp && <select style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>Every Monday</option>
                                        <option>Every Friday</option>
                                    </select>}
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <CustomToggle enabled={digests.monthlyGst} setEnabled={() => setDigests(p => ({ ...p, monthlyGst: !p.monthlyGst }))} />
                                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Monthly GST summary</div>
                                    </div>
                                    {digests.monthlyGst && <select style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>1st of each month</option>
                                        <option>Last day of month</option>
                                    </select>}
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 6 }}>Recipient email(s)</label>
                                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, border: `1px solid ${B.border}`, borderRadius: 8, padding: "4px 8px", background: B.surface, minHeight: 38 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E2E8F0", padding: "4px 8px", borderRadius: 4, fontSize: 11, color: B.textPrimary }}>
                                        rajesh@aadhyapharma.in
                                        <i className="ti ti-x" style={{ cursor: "pointer", fontSize: 12, color: B.textSecondary }} />
                                    </div>
                                    <input placeholder="Add more emails..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, fontFamily: "inherit", color: B.textPrimary, flex: 1, minWidth: 120 }} />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                                <button onClick={() => showToast("Settings Saved successfully!")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Security Settings Tab */}
                {activeTab === "security" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* CARD 1: Password Policy */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 6 }}>Password Policy</div>
                            <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 20 }}>System-wide policy that applies to all users.</div>
                            
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 20, gap: 24 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Minimum password length</label>
                                    <input type="number" value={pwdPolicy.minLen} onChange={e => setPwdPolicy(p => ({ ...p, minLen: e.target.value }))} min={6} max={32} style={{ width: 100, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                    <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>(min 6, max 32)</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Password expiry</label>
                                    <select value={pwdPolicy.expiry} onChange={e => setPwdPolicy(p => ({ ...p, expiry: e.target.value }))} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>90 days</option>
                                        <option>60 days</option>
                                        <option>30 days</option>
                                        <option>Never</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Prevent password reuse</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>Cannot reuse last</span>
                                        <input type="number" value={pwdPolicy.reuse} onChange={e => setPwdPolicy(p => ({ ...p, reuse: e.target.value }))} style={{ width: 60, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>passwords</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Require uppercase letter</div>
                                    <CustomToggle enabled={pwdPolicy.upper} setEnabled={() => setPwdPolicy(p => ({ ...p, upper: !p.upper }))} />
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Require number</div>
                                    <CustomToggle enabled={pwdPolicy.num} setEnabled={() => setPwdPolicy(p => ({ ...p, num: !p.num }))} />
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Require special character</div>
                                    <CustomToggle enabled={pwdPolicy.spec} setEnabled={() => setPwdPolicy(p => ({ ...p, spec: !p.spec }))} />
                                </div>
                                <div style={{ height: 1, background: B.border }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Force password reset on first login</div>
                                    <CustomToggle enabled={pwdPolicy.forceReset} setEnabled={() => setPwdPolicy(p => ({ ...p, forceReset: !p.forceReset }))} />
                                </div>
                            </div>

                            <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 8, padding: "12px 16px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: B.textSecondary, marginBottom: 6 }}>Preview policy summary</div>
                                <div style={{ fontSize: 12, color: B.navy, fontWeight: 500 }}>
                                    Min {pwdPolicy.minLen} chars {pwdPolicy.upper ? "· uppercase " : ""}{pwdPolicy.num ? "· number " : ""}{pwdPolicy.spec ? "· special char " : ""}· expires in {pwdPolicy.expiry} · cannot reuse last {pwdPolicy.reuse}
                                </div>
                            </div>
                        </Card>

                        {/* CARD 2: Session & Access Control */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Session & Access Control</div>
                            
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 24, gap: 24 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Session timeout</label>
                                    <select value={accessCtrl.timeout} onChange={e => setAccessCtrl(p => ({ ...p, timeout: e.target.value }))} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>30 minutes</option>
                                        <option>1 hour</option>
                                        <option>4 hours</option>
                                        <option>8 hours</option>
                                        <option>Never</option>
                                    </select>
                                    {accessCtrl.timeout === "Never" && <div style={{ fontSize: 10, color: B.red, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><i className="ti ti-alert-triangle" /> Not recommended</div>}
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Maximum concurrent sessions per user</label>
                                    <select value={accessCtrl.concurrent} onChange={e => setAccessCtrl(p => ({ ...p, concurrent: e.target.value }))} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>Unlimited</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Login attempt lockout</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>Lock account after</span>
                                        <input type="number" value={accessCtrl.lockout} onChange={e => setAccessCtrl(p => ({ ...p, lockout: e.target.value }))} style={{ width: 60, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 12, color: B.textSecondary }}>failed attempts</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>Lockout duration</label>
                                    <select value={accessCtrl.duration} onChange={e => setAccessCtrl(p => ({ ...p, duration: e.target.value }))} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                        <option>15 minutes</option>
                                        <option>30 minutes</option>
                                        <option>1 hour</option>
                                        <option>24 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Force 2FA for all users</div>
                                    <div style={{ fontSize: 11, color: B.textMuted }}>All Aadhya Pharmex DMS users must have 2FA enabled per security policy</div>
                                </div>
                                <div style={{ opacity: 0.6, pointerEvents: "none" }}>
                                    <CustomToggle enabled={true} setEnabled={() => {}} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 8 }}>IP Whitelist</label>
                                <textarea placeholder="Enter comma-separated IPs or CIDR ranges. Leave blank to allow all." value={accessCtrl.ipWhitelist} onChange={e => setAccessCtrl(p => ({ ...p, ipWhitelist: e.target.value }))} style={{ width: "100%", height: 60, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                                <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Only restrict IPs if you have a fixed office IP. Incorrect IPs will lock out all users.</div>
                            </div>
                        </Card>

                        {/* CARD 3: Audit Log */}
                        <Card>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 4 }}>Audit Log</div>
                                    <div style={{ fontSize: 11, color: B.textSecondary }}>System audit trail — all user actions are logged and tamper-proof</div>
                                </div>
                                <button style={{ padding: "6px 12px", border: `1px solid ${B.navy}`, borderRadius: 8, background: "transparent", color: B.navy, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                                    <i className="ti ti-download" /> Export audit log
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                                <input type="date" style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                <select style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                    <option>All users</option>
                                    <option>Admin (Rajesh Kumar)</option>
                                    <option>Priya Sharma</option>
                                </select>
                                <select style={{ height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
                                    <option>All actions</option>
                                    <option>Login</option>
                                    <option>Data change</option>
                                    <option>Export</option>
                                    <option>Delete</option>
                                </select>
                                <div style={{ position: "relative", flex: 1, minWidth: 150 }}>
                                    <i className="ti ti-search" style={{ position: "absolute", left: 10, top: 9, color: B.textMuted, fontSize: 14 }} />
                                    <input placeholder="Search audit logs..." style={{ width: "100%", height: 32, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px 0 32px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                                </div>
                            </div>

                            <div style={{ margin: "0 -24px" }}>
                                <DataTable
                                    headers={["Timestamp", "User", "Action", "Module", "IP Address", "Status"]}
                                    rows={[
                                        ["16 Jun 2026 09:42 AM", "Admin (Rajesh Kumar)", "Login", "Auth", "103.21.x.x", <StatusBadge status="Success" />],
                                        ["16 Jun 2026 09:44 AM", "Admin (Rajesh Kumar)", "Updated company info", "Settings", "103.21.x.x", <StatusBadge status="Success" />],
                                        ["16 Jun 2026 08:15 AM", "Priya Sharma", "Generated invoice INV/26-27/0284", "Billing", "103.22.x.x", <StatusBadge status="Success" />],
                                        ["15 Jun 2026 06:30 PM", "Sunil Yadav", "Stock adjustment SKU-003", "Inventory", "103.23.x.x", <StatusBadge status="Success" />],
                                        ["15 Jun 2026 05:12 PM", "Unknown", "Failed login attempt", "Auth", "45.33.x.x", <StatusBadge status="Failed" />]
                                    ].map(([ts, usr, act, mod, ip, st], i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                            <td style={{ padding: "9px 10px", fontSize: 11, color: B.textSecondary }}>{ts}</td>
                                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{usr}</td>
                                            <td style={{ padding: "9px 10px" }}>{act}</td>
                                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{mod}</td>
                                            <td style={{ padding: "9px 10px", color: B.textSecondary, fontSize: 11, fontFamily: "monospace" }}>{ip}</td>
                                            <td style={{ padding: "9px 10px" }}>{st}</td>
                                        </tr>
                                    ))}
                                />
                            </div>
                            <div style={{ fontSize: 10, color: B.textMuted, marginTop: 16, textAlign: "center" }}>
                                Audit logs are retained for 8 years per Income Tax Act and cannot be deleted by any user
                            </div>
                        </Card>

                        {/* CARD 4: Data & Compliance */}
                        <Card>
                            <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Data & Compliance</div>
                            
                            <div className="grid-responsive grid-2-col" style={{ marginBottom: 24, gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Data retention policy</div>
                                    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 8, padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                            <span style={{ color: B.textSecondary }}>Financial records</span>
                                            <span style={{ fontWeight: 500 }}>8 years (Income Tax Act)</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                            <span style={{ color: B.textSecondary }}>Drug transaction records</span>
                                            <span style={{ fontWeight: 500 }}>5 years (Drugs & Cosmetics Act)</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                            <span style={{ color: B.textSecondary }}>GST records</span>
                                            <span style={{ fontWeight: 500 }}>6 years (CGST Act Sec 36)</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                            <span style={{ color: B.textSecondary }}>Personal data (DPDP)</span>
                                            <span style={{ fontWeight: 500 }}>1 year minimum</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>DPDP compliance status</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                        <span style={{ background: `${B.green}22`, color: B.green, fontSize: 11, padding: "4px 8px", borderRadius: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                            <i className="ti ti-check" /> Compliant
                                        </span>
                                        <span style={{ fontSize: 11, color: B.textSecondary }}>Rules 2025 — Deadline 13 May 2027</span>
                                    </div>

                                    <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 8 }}>Data export</div>
                                    <button style={{ padding: "6px 12px", border: `1px solid ${B.navy}`, borderRadius: 8, background: "transparent", color: B.navy, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                                        Export all company data
                                    </button>
                                    <div style={{ fontSize: 10, color: B.textMuted, marginTop: 6 }}>Generates a ZIP file of all records. DPDP Act Section 12 compliant.</div>
                                </div>
                            </div>
                            
                            <div style={{ borderTop: `1px solid ${B.border}`, margin: "24px -24px -24px", padding: "20px 24px 24px" }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: B.red, marginBottom: 8 }}>Danger Zone</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                                    <div style={{ maxWidth: 400 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>Request data deletion</div>
                                        <div style={{ fontSize: 11, color: B.textSecondary, marginBottom: 12 }}>Permanently delete individual user data to comply with DPDP requirements. Type "CONFIRM" to enable.</div>
                                        <input placeholder="Type CONFIRM" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} style={{ width: 120, height: 30, border: `1px solid ${B.border}`, borderRadius: 6, fontSize: 11, padding: "0 8px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                    </div>
                                    <button disabled={deleteConfirmText !== "CONFIRM"} onClick={() => { showToast("Deletion request submitted."); setDeleteConfirmText(""); }} style={{ padding: "8px 16px", border: `1px solid ${deleteConfirmText === "CONFIRM" ? B.red : B.border}`, borderRadius: 8, background: deleteConfirmText === "CONFIRM" ? `${B.red}11` : B.surface, color: deleteConfirmText === "CONFIRM" ? B.red : B.textMuted, fontSize: 12, fontWeight: 500, cursor: deleteConfirmText === "CONFIRM" ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.2s" }}>
                                        Request data deletion
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                            <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                            <button onClick={() => showToast("Security Settings Saved successfully!")} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, background: B.white, borderLeft: `4px solid ${B.green}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8, padding: '12px 16px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${B.green}22`, color: B.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-check" style={{ fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: B.textPrimary }}>Success</div>
                        <div style={{ fontSize: 11, color: B.textSecondary }}>{toastMessage}</div>
                    </div>
                    <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                </div>
            )}

            {showAddUserModal && <NewUserModal onClose={() => setShowAddUserModal(false)} />}
        </div>
    );
}
