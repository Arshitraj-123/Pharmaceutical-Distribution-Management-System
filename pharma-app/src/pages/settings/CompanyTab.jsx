import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function CompanyTab({ loading, companyForm, setCompanyForm, isManager, handleSave }) {
  const inputStyle = { width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" };
  const labelStyle = { fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 };
  const readOnlyStyle = { ...inputStyle, background: `${B.surface}`, color: B.textMuted, cursor: 'not-allowed' };

  return (
                    <Card>
                        {/* GST Registration Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${B.border}` }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${B.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-certificate" style={{ fontSize: 18, color: B.green }} aria-hidden="true" />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: B.navy }}>GST Registration Details</div>
                                <div style={{ fontSize: 11, color: B.textSecondary }}>Form GST REG-06 · Registration Certificate</div>
                            </div>
                            {companyForm.registrationNumber && (
                                <div style={{ marginLeft: 'auto', background: `${B.green}15`, border: `1px solid ${B.green}30`, borderRadius: 6, padding: '4px 10px' }}>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: B.green, letterSpacing: '0.03em' }}>GSTIN: {companyForm.registrationNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid-responsive grid-2-col" style={{ marginBottom: 0 }}>
                            <div style={{ marginBottom: 20 }}>
                                {loading ? <div style={{color: B.textSecondary, fontSize: 12}}>Loading...</div> : (
                                    <>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Legal Name (Proprietor)</label>
                                            <input value={companyForm.legalName || ''} onChange={e => setCompanyForm({...companyForm, legalName: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Trade Name</label>
                                            <input value={companyForm.tradeName || ''} onChange={e => setCompanyForm({...companyForm, tradeName: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Company / Business Name</label>
                                            <input value={companyForm.businessName || ''} onChange={e => setCompanyForm({...companyForm, businessName: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Constitution of Business</label>
                                            <input value={companyForm.constitution || ''} onChange={e => setCompanyForm({...companyForm, constitution: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Mobile Number</label>
                                            <input value={companyForm.phone || ''} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Address</label>
                                            <input value={companyForm.address || ''} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>GSTIN</label>
                                            <input value={companyForm.gstin || ''} onChange={e => setCompanyForm({...companyForm, gstin: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>Drug License no.</label>
                                            <input value={companyForm.drugLicense || ''} onChange={e => setCompanyForm({...companyForm, drugLicense: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>State</label>
                                            <input value={companyForm.state || ''} onChange={e => setCompanyForm({...companyForm, state: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={labelStyle}>State Code (GST)</label>
                                            <input value={companyForm.stateCode || ''} onChange={e => setCompanyForm({...companyForm, stateCode: e.target.value})} style={inputStyle} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button disabled={!isManager} onClick={() => handleSave('company', 'companyForm', companyForm)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: isManager ? B.navy : B.border, color: B.white, fontSize: 12, fontWeight: 500, cursor: isManager ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Save changes</button>
                            </div>

                        </div>
                    </Card>
  );
}
