import { B } from '../theme.js';
import { PageHeader, AlertBar, KPICard, Card, CardTitle, DataTable } from '../components/ui.jsx';
import { BarChart, DonutChart } from '../components/charts.jsx';
import { StatusBadge } from '../components/ui.jsx';
import { ORDERS, WEEKLY_SALES, MONTHLY_SALES, MONTHS, DAYS, COMPANY_SALES } from '../mockData.js';
import { useDashboardData } from '../hooks/useDashboardData.js';

export function DashboardPage({ setPage, showModal, currentUser }) {
    const token = localStorage.getItem('auth_token');
    const { loading } = useDashboardData(token);
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const getDateString = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    };

    const name = currentUser && currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Admin';

    return (
        <div>
            <PageHeader title="Dashboard" subtitle={`${getDateString()} — ${getGreeting()}, ${name}`} />

            <AlertBar type="warn">
                <strong>3 compliance alerts:</strong> &nbsp;2 products expiring within 30 days · 1 retailer Drug License expiring in 18 days · GSTR-1 filing due in 5 days
            </AlertBar>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse" style={{ background: "#e2e8f0", borderRadius: 12, height: 96 }} />
                    ))
                ) : (
                    <>
                        <KPICard icon="ti-shopping-cart" label="Today's orders" value="38" sub="↑ 6 vs yesterday" subColor={B.green} accent={B.navy} onClick={() => setPage("orders")} />
                        <KPICard icon="ti-package" label="Pending orders" value="12" sub="4 urgent" subColor={B.amber} accent={B.amber} onClick={() => setPage("orders")} />
                        <KPICard icon="ti-truck-delivery" label="Out for delivery" value="9" sub="3 beats active" subColor={B.navyMid} accent={B.navyMid} onClick={() => setPage("delivery")} />
                        <KPICard icon="ti-currency-rupee" label="Total outstanding" value="₹4.2L" sub="18 overdue accounts" subColor={B.red} accent={B.red} onClick={() => setPage("billing")} />
                        <KPICard icon="ti-alert-circle" label="Near-expiry SKUs" value="14" sub="Within 60 days" subColor={B.amber} accent={B.amber} onClick={() => setPage("inventory")} />
                        <KPICard icon="ti-file-invoice" label="e-Invoice pending" value="7" sub="IRP submission due" subColor={B.red} accent={B.red} onClick={() => setPage("billing")} />
                    </>
                )}
            </div>

            {/* Charts row */}
            <div className="grid-responsive grid-1-6-1">
                <Card>
                    <CardTitle action={<span style={{ fontSize: 11, background: B.greenLight, color: B.green, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>↑ 12% vs last week</span>}>
                        Weekly sales &nbsp;<span style={{ fontWeight: 400, color: B.textSecondary }}>₹3,79,000 this week</span>
                    </CardTitle>
                    <BarChart data={WEEKLY_SALES} labels={DAYS} highlightIdx={4} height={120} />
                </Card>
                <Card>
                    <CardTitle>Top products today</CardTitle>
                    {[["Paracetamol 500mg", "Cipla", "142 units"], ["Amoxicillin 250mg", "Dr. Reddy's", "89 units"], ["Vitamin C 500mg", "Abbott", "76 units"], ["Metformin 500mg", "Sun Pharma", "61 units"]].map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${B.border}` : "none" }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>{p[0]}</div>
                                <div style={{ fontSize: 11, color: B.textMuted }}>{p[1]}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: B.navyMid }}>{p[2]}</span>
                        </div>
                    ))}
                </Card>
            </div>

            {/* Company sales + recent orders */}
            <div className="grid-responsive grid-1-2">
                <Card>
                    <CardTitle>Sales by company</CardTitle>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <DonutChart segments={COMPANY_SALES} size={90} />
                        <div style={{ flex: 1 }}>
                            {COMPANY_SALES.map((c, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                                        <span style={{ fontSize: 11, color: B.textSecondary }}>{c.name}</span>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: B.textPrimary }}>{c.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
                <Card>
                    <CardTitle action={<span style={{ fontSize: 11, color: B.navyMid, cursor: "pointer" }} onClick={() => setPage("orders")}>View all →</span>}>
                        Recent orders
                    </CardTitle>
                    <DataTable
                        headers={["Order ID", "Retailer", "Items", "Value", "Status", "Date"]}
                        rows={ORDERS.slice(0, 5).map((o, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                <td style={{ padding: "8px 10px", color: B.navyMid, fontWeight: 500 }}>{o.id}</td>
                                <td style={{ padding: "8px 10px" }}>{o.retailer}</td>
                                <td style={{ padding: "8px 10px", color: B.textSecondary }}>{o.items}</td>
                                <td style={{ padding: "8px 10px", fontWeight: 500 }}>{o.value}</td>
                                <td style={{ padding: "8px 10px" }}><StatusBadge status={o.status} /></td>
                                <td style={{ padding: "8px 10px", color: B.textSecondary }}>{o.date}</td>
                            </tr>
                        ))}
                    />
                </Card>
            </div>

            {/* Monthly trend */}
            <Card>
                <CardTitle action={<span style={{ fontSize: 11, background: B.navyLight, color: B.navyMid, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>FY 2025–26</span>}>
                    Monthly revenue trend
                </CardTitle>
                <BarChart data={MONTHLY_SALES} labels={MONTHS} highlightIdx={11} height={130} color={B.navyLight} highlightColor={B.navy} />
            </Card>
        </div>
    );
}
