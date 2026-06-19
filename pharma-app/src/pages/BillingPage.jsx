import { useState, useEffect } from "react";
import { B } from '../theme.js';
import { PageHeader, AlertBar, KPICard, Card, CardTitle, DataTable, StatusBadge } from '../components/ui.jsx';
import api from '../api/axios';

export function BillingPage({ showModal }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoices');
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        window.addEventListener('invoice-added', fetchInvoices);
        return () => window.removeEventListener('invoice-added', fetchInvoices);
    }, []);

    const totalValue = invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
    const totalGst = invoices.reduce((s, inv) => s + (inv.cgst || 0) + (inv.sgst || 0), 0);
    const pendingIrn = invoices.filter(inv => inv.irnStatus === 'Pending').length;

    const formatAmt = amt => `₹${Math.round(amt).toLocaleString('en-IN')}`;
    const formatValue = val => val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : formatAmt(val);

    const handleDownloadPdf = async (inv) => {
        try {
            const res = await api.get(`/invoices/${inv._id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${inv.invoiceNo.replace(/\//g, '-')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    const handleWhatsApp = (inv) => {
        const text = `Hello, your tax invoice ${inv.invoiceNo} for ${formatAmt(inv.totalAmount)} has been generated.`;
        // In a real app, you might use the retailer's phone number here: `https://wa.me/${inv.retailerId?.phone}?text=...`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = (inv) => {
        const subject = `Tax Invoice ${inv.invoiceNo}`;
        const body = `Hello,\n\nYour tax invoice ${inv.invoiceNo} for ${formatAmt(inv.totalAmount)} has been generated.\n\nThank you for doing business with us!`;
        const email = inv.retailerId?.email || '';
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const handleExportGSTR1 = async () => {
        try {
            const res = await api.get('/invoices/gstr1-export', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `GSTR1_B2B_Report.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download GSTR-1", err);
            alert("Failed to download GSTR-1 export.");
        }
    };

    return (
        <div>
            <PageHeader title="Billing & GST" subtitle="e-Invoice (IRP) · GSTR-1 · GSTR-3B · credit notes" action="Generate invoice" onAction={showModal} />
            <AlertBar type="warn">
                <strong>GSTR-1 due in 5 days (14 Jun 2026).</strong> &nbsp;{invoices.length} invoices recorded this month. 
                <span onClick={handleExportGSTR1} style={{ textDecoration: "underline", cursor: "pointer", marginLeft: 8, fontWeight: 500 }}>
                    Download B2B CSV →
                </span>
            </AlertBar>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-file-invoice" label="Invoices this month" value={invoices.length} sub={`${formatValue(totalValue)} total value`} accent={B.navy} />
                <KPICard icon="ti-clock" label="Pending IRP" value={pendingIrn} sub="Submit within 30 days" accent={B.red} subColor={B.red} />
                <KPICard icon="ti-receipt-refund" label="Credit notes pending" value="0" sub="₹0 value" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-currency-rupee" label="GST collected (MTD)" value={formatAmt(totalGst)} sub="Real-time collection" accent={B.green} subColor={B.green} />
            </div>

            {/* GST rate callout */}
            <AlertBar type="info">
                <strong>Corrected GST rates (56th GST Council, Sep 2025):</strong> &nbsp;Life-saving drugs (HIV/TB/cancer/vaccines/insulin) = <strong>Nil (0%)</strong> · Most medicines = <strong>5%</strong> · APIs/chemicals = <strong>18%</strong>. The 12% slab no longer applies to finished medicines.
            </AlertBar>

            <Card>
                <CardTitle>Recent invoices</CardTitle>
                <DataTable
                    headers={["Invoice no.", "Retailer", "Date", "Taxable amt.", "GST", "Total", "IRN status", "Actions"]}
                    rows={invoices.map((inv, i) => {
                        const dt = new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                        return (
                        <tr key={inv._id || i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                            <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 11, color: B.navyMid, fontWeight: 500 }}>{inv.invoiceNo}</td>
                            <td style={{ padding: "9px 10px" }}>{inv.retailerId?.name || "Unknown"}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{dt}</td>
                            <td style={{ padding: "9px 10px" }}>{formatAmt(inv.totalTaxable)}</td>
                            <td style={{ padding: "9px 10px", color: B.textSecondary }}>{formatAmt((inv.cgst || 0) + (inv.sgst || 0))}</td>
                            <td style={{ padding: "9px 10px", fontWeight: 500 }}>{formatAmt(inv.totalAmount)}</td>
                            <td style={{ padding: "9px 10px" }}><StatusBadge status={inv.irnStatus} /></td>
                            <td style={{ padding: "9px 10px" }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <i 
                                        className="ti ti-download" 
                                        style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} 
                                        aria-label="Download PDF" 
                                        title="Download Tax Invoice PDF"
                                        onClick={() => handleDownloadPdf(inv)}
                                    />
                                    <i 
                                        className="ti ti-brand-whatsapp" 
                                        style={{ fontSize: 15, color: B.green, cursor: "pointer" }} 
                                        aria-label="WhatsApp" 
                                        title="Share via WhatsApp"
                                        onClick={() => handleWhatsApp(inv)}
                                    />
                                    <i 
                                        className="ti ti-send" 
                                        style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} 
                                        aria-label="Email" 
                                        title="Send Email"
                                        onClick={() => handleEmail(inv)}
                                    />
                                </div>
                            </td>
                        </tr>
                    )})}
                />
            </Card>
        </div>
    );
}
