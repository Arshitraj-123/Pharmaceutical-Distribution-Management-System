import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function NotifTab({ alertLabels, channels, handleChannelToggle, dlChips, setDlChips, reminderDays, setReminderDays, digests, setDigests, isManager, handleSave, notifForm, showToast }) {
  return (
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
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key]?.inApp || false} setEnabled={() => handleChannelToggle(key, 'inApp')} /></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key]?.email || false} setEnabled={() => handleChannelToggle(key, 'email')} /></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}><CustomToggle enabled={channels[key]?.sms || false} setEnabled={() => handleChannelToggle(key, 'sms')} /></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                                <button disabled={!isManager} onClick={() => handleSave("notifications", "notificationConfig", notifForm)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: isManager ? B.navy : B.border, color: B.white, fontSize: 12, fontWeight: 500, cursor: isManager ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Save channel preferences</button>
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
  );
}
