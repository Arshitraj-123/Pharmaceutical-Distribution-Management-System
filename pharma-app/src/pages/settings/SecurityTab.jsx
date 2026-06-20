import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function SecurityTab({ pwdPolicy, setPwdPolicy, accessCtrl, setAccessCtrl, deleteConfirmText, setDeleteConfirmText, isManager, handleSave, securityForm, showToast, handleExport, auditLogs }) {
  return (
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
                                <button onClick={() => handleExport('/audit-logs/export', 'Audit_Logs.csv')} style={{ padding: "6px 12px", border: `1px solid ${B.navy}`, borderRadius: 8, background: "transparent", color: B.navy, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
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
                                    rows={(auditLogs || []).map((log, i) => (
                                        <tr key={log._id || i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                            <td style={{ padding: "9px 10px", fontSize: 11, color: B.textSecondary }}>{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{log.user}</td>
                                            <td style={{ padding: "9px 10px" }}>{log.action}</td>
                                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{log.module}</td>
                                            <td style={{ padding: "9px 10px", color: B.textSecondary, fontSize: 11, fontFamily: "monospace" }}>{log.ipAddress}</td>
                                            <td style={{ padding: "9px 10px" }}><StatusBadge status={log.status} /></td>
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
                                    <button onClick={() => handleExport('/settings/export', 'Company_Data.json')} style={{ padding: "6px 12px", border: `1px solid ${B.navy}`, borderRadius: 8, background: "transparent", color: B.navy, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
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
  );
}
