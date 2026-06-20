import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function CompanyTab({ loading, companyForm, setCompanyForm, isManager, handleSave }) {
  return (
                    <Card>
                        <div className="grid-responsive grid-2-col" style={{ marginBottom: 0 }}>
                            <div style={{ marginBottom: 20 }}>
                                {loading ? <div style={{color: B.textSecondary, fontSize: 12}}>Loading...</div> : (
                                    <>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Company name</label>
                                            <input value={companyForm.businessName || ''} onChange={e => setCompanyForm({...companyForm, businessName: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Address</label>
                                            <input value={companyForm.address || ''} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>GSTIN</label>
                                            <input value={companyForm.gstin || ''} onChange={e => setCompanyForm({...companyForm, gstin: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Drug License no.</label>
                                            <input value={companyForm.drugLicense || ''} onChange={e => setCompanyForm({...companyForm, drugLicense: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>State</label>
                                            <input value={companyForm.state || ''} onChange={e => setCompanyForm({...companyForm, state: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>State Code (GST)</label>
                                            <input value={companyForm.stateCode || ''} onChange={e => setCompanyForm({...companyForm, stateCode: e.target.value})} style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
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
