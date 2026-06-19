import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, AlertBar, KPICard, Card, CardTitle, DataTable } from '../components/ui.jsx';
import { BarChart, DonutChart } from '../components/charts.jsx';
import { StatusBadge } from '../components/ui.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import api from '../api/axios';

export function DashboardPage({ setPage, showModal, currentUser }) {
    const token = localStorage.getItem('auth_token');
    const { kpis, alerts, sales, topProducts, salesByCompany, monthlySales, loading: hookLoading } = useDashboardData(token);
    
    const [recentOrders, setRecentOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders');
                setRecentOrders(res.data.orders.slice(0, 5) || []);
            } catch (err) {
                console.error(err);
            } finally {
                setOrdersLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const loading = hookLoading || ordersLoading;

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

    // Computations from real data
    const weeklyData = sales?.weeklySales?.map(s => s.sales) || [];
    const weeklyLabels = sales?.weeklySales?.map(s => {
        const d = new Date(s._id);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }) || [];
    const totalWeekly = weeklyData.reduce((a, b) => a + b, 0);

    const totalCompanySales = salesByCompany?.reduce((sum, c) => sum + c.totalSales, 0) || 1;
    const colors = [B.navy, B.amber, B.green, B.purple, B.red, B.navyMid, B.blue];
    const realCompanySales = (salesByCompany || []).map((c, i) => ({
        name: c.companyName,
        value: Math.round((c.totalSales / totalCompanySales) * 100) || 0,
        color: colors[i % colors.length]
    }));

    // Monthly Sales
    const monthlyData = monthlySales ? monthlySales.map(m => m.sales) : [];
    const monthlyLabels = monthlySales ? monthlySales.map(m => {
        const [yy, mm] = m._id.split('-');
        const date = new Date(parseInt(yy), parseInt(mm) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
    }) : [];

    return (
        <div>
            <PageHeader title="Dashboard" subtitle={`${getDateString()} — ${getGreeting()}, ${name}`} />

            {alerts && (alerts.expiringInventory?.length > 0 || alerts.expiringLicenses?.length > 0 || alerts.gstr1Due) && (
                <AlertBar type="warn">
                    <strong>
                        {(alerts.expiringInventory?.length || 0) + (alerts.expiringLicenses?.length || 0) + (alerts.gstr1Due ? 1 : 0)} compliance alerts:
                    </strong> &nbsp;
                    {alerts.expiringInventory?.length > 0 && `${alerts.expiringInventory.length} products expiring within 30 days · `}
                    {alerts.expiringLicenses?.length > 0 && `${alerts.expiringLicenses.length} retailer Drug License expiring in 30 days · `}
                    {alerts.gstr1Due && `${alerts.gstr1Due}`}
                </AlertBar>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse" style={{ background: "#e2e8f0", borderRadius: 12, height: 96 }} />
                    ))
                ) : (
                    <>
                        <KPICard icon="ti-shopping-cart" label="Today's orders" value={kpis?.totalOrdersToday || 0} sub="Order count" subColor={B.green} accent={B.navy} onClick={() => setPage("orders")} />
                        <KPICard icon="ti-package" label="Pending orders" value={kpis?.pendingDeliveries || 0} sub="Needs dispatch" subColor={B.amber} accent={B.amber} onClick={() => setPage("orders")} />
                        <KPICard icon="ti-truck-delivery" label="Active retailers" value={kpis?.activeRetailers || 0} sub="Total accounts" subColor={B.navyMid} accent={B.navyMid} onClick={() => setPage("retailers")} />
                        <KPICard icon="ti-currency-rupee" label="Total revenue" value={`₹${(kpis?.totalRevenue || 0).toLocaleString('en-IN')}`} sub="Delivered value" subColor={B.green} accent={B.green} onClick={() => setPage("billing")} />
                        <KPICard icon="ti-alert-circle" label="Low stock items" value={kpis?.lowStockItems || 0} sub="Below threshold" subColor={B.amber} accent={B.amber} onClick={() => setPage("inventory")} />
                        <KPICard icon="ti-file-invoice" label="Today's Sales" value={`₹${(kpis?.totalSalesToday || 0).toLocaleString('en-IN')}`} sub="Value ordered today" subColor={B.navyMid} accent={B.navyMid} onClick={() => setPage("billing")} />
                    </>
                )}
            </div>

            {/* Charts row */}
            <div className="grid-responsive grid-1-6-1">
                <Card>
                    <CardTitle>
                        Weekly sales &nbsp;<span style={{ fontWeight: 400, color: B.textSecondary }}>₹{totalWeekly.toLocaleString('en-IN')} this week</span>
                    </CardTitle>
                    {weeklyData.length > 0 ? (
                        <BarChart data={weeklyData} labels={weeklyLabels} highlightIdx={weeklyData.length - 1} height={120} />
                    ) : (
                        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.textSecondary, fontSize: 12 }}>No sales data for past week</div>
                    )}
                </Card>
                <Card>
                    <CardTitle>Top products</CardTitle>
                    {topProducts && topProducts.length > 0 ? topProducts.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < (topProducts.length - 1) ? `1px solid ${B.border}` : "none" }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 500, color: B.textPrimary }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: B.textMuted }}>{p.sku}</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: B.navyMid }}>{p.totalQty} units</span>
                        </div>
                    )) : (
                        <div style={{ padding: "8px 0", color: B.textSecondary, fontSize: 12, textAlign: "center", marginTop: 20 }}>No product sales today.</div>
                    )}
                </Card>
            </div>

            {/* Company sales + recent orders */}
            <div className="grid-responsive grid-1-2">
                <Card>
                    <CardTitle>Sales by company</CardTitle>
                    {realCompanySales.length > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <DonutChart segments={realCompanySales} size={90} />
                            <div style={{ flex: 1 }}>
                                {realCompanySales.map((c, i) => (
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
                    ) : (
                        <div style={{ color: B.textSecondary, paddingTop: 20, fontSize: 12, textAlign: "center" }}>No company sales data.</div>
                    )}
                </Card>
                <Card>
                    <CardTitle action={<span style={{ fontSize: 11, color: B.navyMid, cursor: "pointer" }} onClick={() => setPage("orders")}>View all →</span>}>
                        Recent orders
                    </CardTitle>
                    {recentOrders.length > 0 ? (
                        <DataTable
                            headers={["Order ID", "Retailer", "Items", "Value", "Status", "Date"]}
                            rows={recentOrders.map((o, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                    <td style={{ padding: "8px 10px", color: B.navyMid, fontWeight: 500 }}>{o.orderId}</td>
                                    <td style={{ padding: "8px 10px" }}>{o.retailerId?.name || 'Unknown'}</td>
                                    <td style={{ padding: "8px 10px", color: B.textSecondary }}>{o.items.length}</td>
                                    <td style={{ padding: "8px 10px", fontWeight: 500 }}>₹{o.totalValue.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: "8px 10px" }}><StatusBadge status={o.status} /></td>
                                    <td style={{ padding: "8px 10px", color: B.textSecondary }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                </tr>
                            ))}
                        />
                    ) : (
                         <div style={{ padding: "8px 0", color: B.textSecondary, fontSize: 12, textAlign: "center", marginTop: 20 }}>No recent orders found.</div>
                    )}
                </Card>
            </div>

            {/* Monthly trend */}
            <Card>
                <CardTitle action={<span style={{ fontSize: 11, background: B.navyLight, color: B.navyMid, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>FY {new Date().getFullYear() - 1}–{new Date().getFullYear().toString().slice(-2)}</span>}>
                    Monthly revenue trend
                </CardTitle>
                {monthlyData.length > 0 ? (
                    <BarChart data={monthlyData} labels={monthlyLabels} highlightIdx={monthlyData.length - 1} height={130} color={B.navyLight} highlightColor={B.navy} />
                ) : (
                    <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.textSecondary, fontSize: 12 }}>No monthly sales data found.</div>
                )}
            </Card>
        </div>
    );
}
