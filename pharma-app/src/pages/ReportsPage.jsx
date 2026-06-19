import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, Card, CardTitle } from '../components/ui.jsx';
import { BarChart, DonutChart, ProgressBar } from '../components/charts.jsx';
import api from '../api/axios';

const COLORS = [B.navy, B.amber, B.green, B.red, B.purple, B.navyMid];

export function ReportsPage() {
    const [monthlySales, setMonthlySales] = useState([]);
    const [companySales, setCompanySales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/dashboard/monthly-sales'),
            api.get('/dashboard/sales/by-company')
        ]).then(([monthlyRes, companyRes]) => {
            const formattedMonthly = monthlyRes.data.map(d => ({
                label: new Date(d._id + '-01').toLocaleString('default', { month: 'short' }),
                value: d.sales // Keep raw value so small test data scales correctly
            }));
            
            // Format company sales for DonutChart
            const totalCompanySales = companyRes.data.reduce((sum, d) => sum + d.totalSales, 0);
            const formattedCompany = companyRes.data.map((d, i) => ({
                name: d.companyName,
                value: totalCompanySales ? Math.round((d.totalSales / totalCompanySales) * 100) : 0,
                color: COLORS[i % COLORS.length]
            }));

            setMonthlySales(formattedMonthly);
            setCompanySales(formattedCompany);
        }).catch(err => {
            console.error("Failed to load reports data", err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const handleDownload = async (endpoint, filename, type = 'csv') => {
        try {
            setDownloading(endpoint);
            let url = endpoint;
            if (endpoint === '/reports/near-expiry') {
                const days = window.prompt("Enter days threshold for expiry report:", "60");
                if (days === null) return; // User cancelled
                url = `${endpoint}?days=${days}`;
            }

            const res = await api.get(url, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `${filename}.${type}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(`Failed to download ${filename}`, err);
            alert(`Failed to download ${filename}`);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: "center" }}><i className="ti ti-loader" style={{ animation: "spin 1s linear infinite", fontSize: 24 }} /></div>;

    const barData = monthlySales.map(m => m.value);
    const barLabels = monthlySales.map(m => m.label);
    
    const totalSalesNum = monthlySales.reduce((sum, m) => sum + m.value, 0);
    const totalFYRevenue = totalSalesNum >= 100000 ? `₹${(totalSalesNum / 100000).toFixed(2)}L` : `₹${totalSalesNum.toLocaleString('en-IN')}`;
    
    const avgMonthlyNum = monthlySales.length ? (totalSalesNum / monthlySales.length) : 0;
    const avgMonthly = avgMonthlyNum >= 100000 ? `₹${(avgMonthlyNum / 100000).toFixed(2)}L` : `₹${Math.round(avgMonthlyNum).toLocaleString('en-IN')}`;

    const REPORTS = [
        { name: "Daily sales summary", freq: "Live", icon: "ti-chart-bar", color: B.navy, endpoint: '/reports/daily-sales', filename: 'Daily_Sales_Summary', enabled: true },
        { name: "Near-expiry stock report", freq: "Custom threshold", icon: "ti-alert-circle", color: B.amber, endpoint: '/reports/near-expiry', filename: 'Near_Expiry_Report', enabled: true },
        { name: "GST monthly summary (GSTR-1)", freq: "Monthly", icon: "ti-file-invoice", color: B.green, endpoint: '/invoices/gstr1-export', filename: 'GSTR1_Export', enabled: true },
        { name: "Schedule X narcotic register", freq: "Monthly", icon: "ti-shield", color: B.red, endpoint: '/compliance/schedule-x-register/pdf', filename: 'Schedule_X_Register', type: 'pdf', enabled: true },
        { name: "Outstanding aging report", freq: "Live", icon: "ti-currency-rupee", color: B.red, endpoint: '/reports/aging', filename: 'Outstanding_Aging_Report', enabled: true },
        { name: "Company scheme utilisation", freq: "Live", icon: "ti-tag", color: B.purple, endpoint: '/reports/schemes', filename: 'Scheme_Utilisation', enabled: true },
        { name: "Profit & Loss statement", freq: "Monthly", icon: "ti-trending-up", color: B.navy, endpoint: '/reports/pnl', filename: 'Profit_and_Loss', enabled: true },
        { name: "Purchase register (ITC)", freq: "Live", icon: "ti-clipboard-list", color: B.navyMid, endpoint: '/reports/purchases', filename: 'Purchase_Register', enabled: true },
    ];
    return (
        <div>
            <PageHeader title="Reports & MIS" subtitle="Analytics · automated reports · business intelligence" />
            <div className="grid-responsive grid-2-col">
                {/* Annual trend */}
                <Card>
                    <CardTitle action={<span style={{ fontSize: 11, background: B.navyLight, color: B.navyMid, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>FY 2025–26</span>}>
                        Annual revenue trend
                    </CardTitle>
                    <BarChart data={barData} labels={barLabels} highlightIdx={barData.length - 1} height={130} color={B.navyLight} highlightColor={B.navy} />
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                        {[[totalFYRevenue, "FY Revenue"], ["---", "Growth YoY"], [avgMonthly, "Avg/Month"]].map((x, i) => (
                            <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", background: B.surface, borderRadius: 8 }}>
                                <div style={{ fontSize: 15, fontWeight: 500, color: B.textPrimary }}>{x[0]}</div>
                                <div style={{ fontSize: 10, color: B.textSecondary }}>{x[1]}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Company breakdown */}
                <Card>
                    <CardTitle>Revenue by pharma company</CardTitle>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                        {companySales.length > 0 ? <DonutChart segments={companySales} size={120} /> : <div style={{ height: 120, display: "flex", alignItems: "center", color: B.textMuted }}>No sales data</div>}
                    </div>
                    {companySales.map((c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < companySales.length - 1 ? `1px solid ${B.border}` : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                                <span style={{ fontSize: 12, color: B.textSecondary }}>{c.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <ProgressBar value={c.value * 2} color={c.color} height={5} />
                                <span style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary, width: 32, textAlign: "right" }}>{c.value}%</span>
                            </div>
                        </div>
                    ))}
                </Card>
            </div>

            {/* Available reports */}
            <Card>
                <CardTitle>Standard MIS reports</CardTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                    {REPORTS.map((r, i) => (
                        <div key={i} 
                            onClick={() => r.enabled ? handleDownload(r.endpoint, r.filename, r.type) : null}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${B.border}`, borderRadius: 8, cursor: r.enabled ? "pointer" : "not-allowed", background: r.enabled ? B.white : B.surface, opacity: r.enabled ? 1 : 0.6 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: r.color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className={`ti ${r.icon}`} style={{ fontSize: 16, color: r.color }} aria-hidden="true" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary, marginBottom: 2 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: B.textMuted }}>{r.freq}</div>
                            </div>
                            {downloading === r.endpoint ? (
                                <i className="ti ti-loader" style={{ fontSize: 14, color: B.navy, animation: "spin 1s linear infinite" }} />
                            ) : (
                                <i className="ti ti-download" style={{ fontSize: 14, color: r.enabled ? B.textMuted : 'transparent' }} aria-label="Download" />
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
