import { useState, useEffect, useContext } from 'react';
import { B } from '../theme.js';
import { PageHeader, Card, EmptyState, DataTable, StatusBadge } from '../components/ui.jsx';
import { NewUserModal } from '../components/modals.jsx';
import api from '../api/axios.js';

import { CompanyTab } from './settings/CompanyTab.jsx';
import { UsersTab } from './settings/UsersTab.jsx';
import { GstTab } from './settings/GstTab.jsx';
import { NotifTab } from './settings/NotifTab.jsx';
import { SecurityTab } from './settings/SecurityTab.jsx';
export function SettingsPage({ currentUser }) {
    const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Manager' || currentUser?.role === 'Operations Manager';
    const isManager = isAdmin;

    const [activeTab, setActiveTab] = useState("company");
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    
    // Core Data
    const [settings, setSettings] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);

    const handleExport = async (endpoint, filename) => {
        try {
            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export error:", error);
            const errStr = error.response ? `${error.response.status} ${error.response.statusText}` : error.message;
            showToast(`Failed: ${errStr}`);
        }
    };

    // GST Form State
    const [gstVerified, setGstVerified] = useState(false);
    const [apiConnected, setApiConnected] = useState(false);
    const [eInvoiceEnabled, setEInvoiceEnabled] = useState(true);
    const [eWayBillEnabled, setEWayBillEnabled] = useState(true);
    const [gstrReminder, setGstrReminder] = useState(true);
    const [itcTracking, setItcTracking] = useState(true);
    const [hsnMandatory, setHsnMandatory] = useState(true);

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
    
    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState([]);


    // Temp Form States (populated on load)
    const [companyForm, setCompanyForm] = useState({});

    // Keep the aggregated forms for Save functionality
    const gstForm = { eInvoiceEnabled, eWayBillEnabled, gstrReminder, itcTracking, hsnMandatory };
    const notifForm = { channels, dlChips, reminderDays, digests };
    const securityForm = { pwdPolicy, accessCtrl };

    useEffect(() => {
        const loadData = async () => {
            try {
                                const [setRes, usrRes, auditRes] = await Promise.all([
                    api.get('/settings'),
                    isManager ? api.get('/users?includeInactive=true') : { data: [] },
                    isAdmin ? api.get('/audit-logs?limit=50') : { data: [] }
                ]);
                const s = setRes.data;
                setSettings(s);
                setUsers(usrRes.data);
                setAuditLogs(auditRes.data);

                
                // Init forms
                setCompanyForm({
                    businessName: s.businessName || '',
                    legalName: s.legalName || '',
                    tradeName: s.tradeName || '',
                    phone: s.phone || '',
                    constitution: s.constitution || '',
                    registrationNumber: s.registrationNumber || '',
                    registrationDate: s.registrationDate || '',
                    address: s.address || '',
                    gstin: s.gstin || '',
                    drugLicense: s.drugLicense || '',
                    state: s.state || '',
                    stateCode: s.stateCode || ''
                });
                
                if (s.gstConfig) {
                    if (s.gstConfig.eInvoiceEnabled !== undefined) setEInvoiceEnabled(s.gstConfig.eInvoiceEnabled);
                    if (s.gstConfig.eWayBillEnabled !== undefined) setEWayBillEnabled(s.gstConfig.eWayBillEnabled);
                    if (s.gstConfig.gstrReminder !== undefined) setGstrReminder(s.gstConfig.gstrReminder);
                    if (s.gstConfig.itcTracking !== undefined) setItcTracking(s.gstConfig.itcTracking);
                    if (s.gstConfig.hsnMandatory !== undefined) setHsnMandatory(s.gstConfig.hsnMandatory);
                }
                
                if (s.notificationConfig) {
                    if (s.notificationConfig.channels) setChannels(s.notificationConfig.channels);
                    if (s.notificationConfig.dlChips) setDlChips(s.notificationConfig.dlChips);
                    if (s.notificationConfig.reminderDays) setReminderDays(s.notificationConfig.reminderDays);
                    if (s.notificationConfig.digests) setDigests(s.notificationConfig.digests);
                }
                
                if (s.securityPolicy) {
                    if (s.securityPolicy.pwdPolicy) setPwdPolicy(s.securityPolicy.pwdPolicy);
                    if (s.securityPolicy.accessCtrl) setAccessCtrl(s.securityPolicy.accessCtrl);
                }
                
            } catch (error) {
                console.error("Error loading settings", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isManager]);

    const handleSave = async (endpoint, payloadKey, payloadData) => {
        try {
            await api.put(`/settings/${endpoint}`, { [payloadKey]: payloadData });
            showToast("Settings saved successfully!");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to save settings");
        }
    };

    const deactivateUser = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this user?")) return;
        try {
            await api.patch(`/users/${id}/deactivate`);
            setUsers(users.map(u => u._id === id ? { ...u, status: 'Inactive' } : u));
            showToast("User deactivated successfully");
        } catch (error) {
            console.error(error);
            showToast("Failed to deactivate user");
        }
    };

    const alertLabels = {
        orderPlaced: "Order placed / confirmed", nearExpiry: "Near-expiry stock alert",
        reorderLevel: "Stock out / Reorder level", paymentOverdue: "Payment overdue",
        dlExpiry: "Drug License expiry"
    };

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
                {activeTab === "company" && <CompanyTab loading={loading} companyForm={companyForm} setCompanyForm={setCompanyForm} isManager={isManager} handleSave={handleSave} />}
                {/* Users Tab */}
                {activeTab === "users" && <UsersTab setShowAddUserModal={setShowAddUserModal} users={users} />}
                {/* GST / Tax Settings Tab */}
                {activeTab === "gst" && <GstTab gstVerified={gstVerified} setGstVerified={setGstVerified} eInvoiceEnabled={eInvoiceEnabled} setEInvoiceEnabled={setEInvoiceEnabled} apiConnected={apiConnected} setApiConnected={setApiConnected} eWayBillEnabled={eWayBillEnabled} setEWayBillEnabled={setEWayBillEnabled} gstrReminder={gstrReminder} setGstrReminder={setGstrReminder} itcTracking={itcTracking} setItcTracking={setItcTracking} hsnMandatory={hsnMandatory} setHsnMandatory={setHsnMandatory} showToast={showToast} />}
                {/* Notifications Settings Tab */}
                {activeTab === "notif" && <NotifTab alertLabels={alertLabels} channels={channels} handleChannelToggle={handleChannelToggle} dlChips={dlChips} setDlChips={setDlChips} reminderDays={reminderDays} setReminderDays={setReminderDays} digests={digests} setDigests={setDigests} isManager={isManager} handleSave={handleSave} notifForm={notifForm} showToast={showToast} />}
                {/* Security Settings Tab */}
                {activeTab === "security" && <SecurityTab pwdPolicy={pwdPolicy} setPwdPolicy={setPwdPolicy} accessCtrl={accessCtrl} setAccessCtrl={setAccessCtrl} deleteConfirmText={deleteConfirmText} setDeleteConfirmText={setDeleteConfirmText} isManager={isManager} handleSave={handleSave} securityForm={securityForm} showToast={showToast} handleExport={handleExport} auditLogs={auditLogs} />}
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
