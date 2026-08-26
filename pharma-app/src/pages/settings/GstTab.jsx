import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function GstTab({ gstVerified, setGstVerified, eInvoiceEnabled, setEInvoiceEnabled, apiConnected, setApiConnected, eWayBillEnabled, setEWayBillEnabled, gstrReminder, setGstrReminder, itcTracking, setItcTracking, hsnMandatory, setHsnMandatory, showToast }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* CARD 1: GST Registration Details */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: B.navy, marginBottom: 20 }}>GST Registration Details</div>
        <div className="grid-responsive grid-2-col" style={{ marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>GSTIN</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input defaultValue="09MHMPK6914Q1Z5" style={{ flex: 1, minWidth: 0, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
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
            <select defaultValue="Uttar Pradesh" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }}>
              <option>Uttar Pradesh</option>
              <option>Bihar</option>
              <option>Jharkhand</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>PAN</label>
            <div style={{ position: "relative" }}>
              <input readOnly defaultValue="MHMPK6914Q" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textMuted, fontFamily: "inherit", cursor: "not-allowed" }} />
              <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Auto-derived from GSTIN</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Registered Business Name</label>
            <input defaultValue="Aadya Medicine Agencies" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: B.textSecondary, display: "block", marginBottom: 4 }}>Effective Registration Date</label>
            <input type="text" defaultValue="06 Jun 2026" style={{ width: "100%", height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, padding: "0 10px", background: B.surface, color: B.textPrimary, fontFamily: "inherit" }} />
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
          <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>Intrastate thresholds vary by state — Uttar Pradesh: ₹50,000</div>
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
  );
}
