import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { B } from '../theme.js';
import { PageHeader, Card, StatusBadge } from '../components/ui.jsx';

export function EditProfilePage({ setPage, currentUser }) {
    const [toastVisible, setToastVisible] = useState(false);
    
    // Form states
    const [fullName, setFullName] = useState(currentUser?.fullName || 'Admin User');
    const [branch, setBranch] = useState(currentUser?.branch || 'Head Office');
    const [workEmail, setWorkEmail] = useState(currentUser?.email || 'admin@adhyapharma.in');
    const [phone, setPhone] = useState('+91 98765 43210');
    
    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ current: false, new: false });
    
    // Security states
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToastMessage({ msg, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSave = async (isPasswordUpdate = false) => {
        if (!currentPassword) {
            showToast("Please enter your current password in the Account Security section below to authorize these changes.", "error");
            return;
        }
        if (isPasswordUpdate && newPassword !== confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                fullName,
                email: workEmail,
                phone,
                branch,
                currentPassword
            };
            if (isPasswordUpdate && newPassword) {
                payload.newPassword = newPassword;
            }
            
            const res = await api.put('/users/profile', payload);
            
            // Update local storage so Header picks it up after refresh or if we had a set user context
            const updatedUser = res.data;
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            
            showToast("Profile updated successfully!");
            
            if (isPasswordUpdate) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setLoading(false);
        }
    };

    // Password strength logic
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: B.border };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        
        switch (score) {
            case 0:
            case 1: return { score: 1, label: 'Weak', color: B.red };
            case 2: return { score: 2, label: 'Fair', color: '#F59E0B' };
            case 3: return { score: 3, label: 'Strong', color: B.green };
            case 4: return { score: 4, label: 'Very Strong', color: '#059669' };
            default: return { score: 0, label: '', color: B.border };
        }
    };
    
    const strength = getPasswordStrength(newPassword);

    return (
        <div style={{ paddingBottom: 40, position: 'relative' }}>
            <div style={{ marginBottom: 16 }}>
                <button 
                    onClick={() => setPage('dashboard')} 
                    style={{ 
                        background: 'none', border: 'none', color: B.textSecondary, 
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        padding: 0, fontFamily: 'inherit'
                    }}
                >
                    <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" />
                    Back to Dashboard
                </button>
            </div>
            
            <PageHeader 
                title="Edit Profile" 
                subtitle="Manage your personal information and account security" 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* CARD 1: Personal Information */}
                <Card>
                    <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Personal information</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: B.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: B.white, fontSize: 24, fontWeight: 500 }}>
                                {fullName ? fullName.substring(0, 2).toUpperCase() : 'AD'}
                            </span>
                        </div>
                        <div>
                            <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, fontWeight: 500, color: B.textPrimary, cursor: "pointer", fontFamily: "inherit" }}>
                                Upload photo
                            </button>
                            <div style={{ fontSize: 11, color: B.textMuted, marginTop: 6 }}>Accepts JPG/PNG, max 2MB</div>
                        </div>
                    </div>

                    <div className="grid-responsive grid-2-col" style={{ marginBottom: 24 }}>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Full Name</label>
                            <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Employee ID</label>
                            <div style={{ position: 'relative' }}>
                                <i className="ti ti-lock" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: B.textMuted, fontSize: 14 }} />
                                <input readOnly value="EMP-2024-001" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", boxSizing: "border-box", cursor: 'not-allowed' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Role</label>
                            <div style={{ position: 'relative' }}>
                                <i className="ti ti-lock" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: B.textMuted, fontSize: 14 }} />
                                <select disabled style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", boxSizing: "border-box", appearance: 'none', cursor: 'not-allowed' }}>
                                    <option>{currentUser?.role || 'Operations Manager'}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Branch</label>
                            <select value={branch} onChange={e => setBranch(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }}>
                                <option>Head Office</option>
                                <option>Muzaffarpur</option>
                                <option>Gaya</option>
                                <option>Patna South</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Work Email</label>
                            <input value={workEmail} onChange={e => setWorkEmail(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                            <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Changing email requires OTP verification</div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Phone Number</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 12, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                        <button onClick={() => handleSave(false)} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>{loading ? 'Saving...' : 'Save changes'}</button>
                    </div>
                </Card>

                {/* CARD 2: Account Security */}
                <Card>
                    <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>Account security</div>
                    
                    {/* Section: Change Password */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 12 }}>Change Password</div>
                        <div className="grid-responsive grid-2-col" style={{ marginBottom: 16 }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Current password</label>
                                <input type={showPassword.current ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                                <i className={`ti ${showPassword.current ? 'ti-eye-off' : 'ti-eye'}`} onClick={() => setShowPassword(prev => ({...prev, current: !prev.current}))} style={{ position: 'absolute', right: 10, top: 25, color: B.textMuted, fontSize: 16, cursor: 'pointer' }} aria-hidden="true" />
                            </div>
                            <div />
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>New password</label>
                                <input type={showPassword.new ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                                <i className={`ti ${showPassword.new ? 'ti-eye-off' : 'ti-eye'}`} onClick={() => setShowPassword(prev => ({...prev, new: !prev.new}))} style={{ position: 'absolute', right: 10, top: 25, color: B.textMuted, fontSize: 16, cursor: 'pointer' }} aria-hidden="true" />
                                
                                {newPassword.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 4 }}>
                                            {[1, 2, 3, 4].map(level => (
                                                <div key={level} style={{ flex: 1, background: strength.score >= level ? strength.color : B.border, borderRadius: 2 }} />
                                            ))}
                                        </div>
                                        <div style={{ fontSize: 10, color: strength.color, fontWeight: 500, textAlign: 'right' }}>{strength.label}</div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Confirm new password</label>
                                <input type={showPassword.new ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit", boxSizing: "border-box" }} />
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: B.textMuted, marginBottom: 12 }}>
                            Min 8 chars · 1 uppercase · 1 number · 1 special character · Cannot reuse last 5 passwords
                        </div>
                        <button onClick={() => handleSave(true)} disabled={loading} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 12, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>{loading ? 'Updating...' : 'Update password'}</button>
                    </div>

                    <div style={{ height: 1, background: B.border, margin: '24px 0' }} />

                    {/* Section: 2FA */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>2FA via OTP (SMS + Email)</div>
                                <StatusBadge status={twoFactorEnabled ? "Active" : "Inactive"} />
                            </div>
                            <div style={{ fontSize: 11, color: B.textSecondary, maxWidth: 400, lineHeight: 1.5 }}>
                                Required for all Aadhya Pharmex DMS users per security policy.
                                {!twoFactorEnabled && <span style={{ color: B.red, display: 'block', marginTop: 4 }}>Disabling 2FA requires admin approval.</span>}
                            </div>
                        </div>
                        {/* Custom Toggle Switch */}
                        <div onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} style={{ width: 44, height: 24, background: twoFactorEnabled ? B.green : B.border, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                            <div style={{ width: 18, height: 18, background: B.white, borderRadius: '50%', position: 'absolute', top: 3, left: twoFactorEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                    </div>

                    <div style={{ height: 1, background: B.border, margin: '24px 0' }} />

                    {/* Section: Active Sessions */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary, marginBottom: 12 }}>Active Sessions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <i className="ti ti-device-desktop" style={{ fontSize: 20, color: B.textSecondary }} />
                                <div>
                                    <div style={{ fontSize: 12, color: B.textPrimary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Chrome · Windows 11 · Patna, Bihar
                                        <span style={{ fontSize: 10, background: B.surface, color: B.textSecondary, padding: '2px 6px', borderRadius: 10 }}>This device</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: B.textSecondary, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: B.green }} />
                                        Current session
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <i className="ti ti-device-mobile" style={{ fontSize: 20, color: B.textSecondary }} />
                                <div>
                                    <div style={{ fontSize: 12, color: B.textPrimary, fontWeight: 500 }}>
                                        Mobile Safari · iPhone · Muzaffarpur
                                    </div>
                                    <div style={{ fontSize: 11, color: B.textSecondary, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }} />
                                        2 hours ago
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button style={{ padding: "8px 16px", border: `1px solid ${B.red}`, borderRadius: 8, background: 'transparent', color: B.red, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Sign out all other sessions</button>
                    </div>

                    <div style={{ height: 1, background: B.border, margin: '24px 0' }} />

                    {/* Section: Last Login Info */}
                    <div style={{ background: B.surface, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: B.textSecondary, fontSize: 11 }}>
                        <i className="ti ti-info-circle" style={{ fontSize: 16 }} />
                        Last login: 16 Jun 2026, 09:42 AM · IP: 103.112.x.x · Patna, Bihar
                    </div>
                </Card>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, background: B.white, borderLeft: `4px solid ${toastMessage.type === 'error' ? B.red : B.green}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8, padding: '12px 16px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: toastMessage.type === 'error' ? `${B.red}22` : `${B.green}22`, color: toastMessage.type === 'error' ? B.red : B.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={toastMessage.type === 'error' ? "ti ti-x" : "ti ti-check"} style={{ fontSize: 14 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: B.textPrimary }}>{toastMessage.type === 'error' ? 'Error' : 'Success'}</div>
                        <div style={{ fontSize: 11, color: B.textSecondary }}>{toastMessage.msg}</div>
                    </div>
                    <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                </div>
            )}
        </div>
    );
}
