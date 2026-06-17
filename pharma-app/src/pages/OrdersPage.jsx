import { useState, useEffect } from 'react';
import { B } from '../theme.js';
import { PageHeader, KPICard, Card, SearchInput, FilterChips, DataTable, StatusBadge } from '../components/ui.jsx';
import { UpdateOrderStatusModal, ViewOrderModal } from '../components/modals.jsx';
import api from '../api/axios';

export function OrdersPage({ showModal }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [editOrder, setEditOrder] = useState(null);
    const [viewOrder, setViewOrder] = useState(null);
    const statuses = ["All", "Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled", "Credit Hold"];

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const handleOrderAdded = () => fetchOrders();
        window.addEventListener('order-added', handleOrderAdded);
        return () => window.removeEventListener('order-added', handleOrderAdded);
    }, []);

    const mappedOrders = orders.map(o => ({
        id: o.orderId,
        _id: o._id,
        raw: o, // Keep original order data for the view modal
        retailer: o.retailerId?.name || 'Unknown',
        city: o.retailerId?.city || '',
        items: o.items.length,
        value: `₹${o.totalValue.toLocaleString('en-IN')}`,
        payment: o.paymentMode || 'Credit',
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }));

    const filtered = mappedOrders.filter(o =>
        (filter === "All" || o.status === filter) &&
        (o.retailer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
    );

    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const todaysValue = todaysOrders.reduce((sum, o) => sum + o.totalValue, 0);

    return (
        <div>
            <PageHeader title="Order management" subtitle="Manage and track all retailer orders" action="New order" onAction={showModal} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                <KPICard icon="ti-shopping-cart" label="Orders today" value={todaysOrders.length} sub={`₹${todaysValue.toLocaleString('en-IN')} value`} accent={B.navy} />
                <KPICard icon="ti-clock" label="Pending" value={orders.filter(o => o.status === 'Pending').length} sub="Needs action" accent={B.amber} subColor={B.amber} />
                <KPICard icon="ti-check" label="Delivered today" value={todaysOrders.filter(o => o.status === 'Delivered').length} sub="98% on-time" accent={B.green} subColor={B.green} />
                <KPICard icon="ti-alert-circle" label="Credit Hold" value={orders.filter(o => o.status === 'Credit Hold').length} sub="Requires approval" accent={B.red} subColor={B.red} />
            </div>
            <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search by order ID or retailer…" />
                    <button onClick={showModal} style={{ padding: "6px 12px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 11, color: B.textSecondary, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ti ti-download" style={{ fontSize: 12 }} aria-hidden="true" /> Export
                    </button>
                </div>
                <FilterChips options={statuses} active={filter} onChange={setFilter} />
                
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: B.textSecondary, fontSize: 14 }}>
                        <i className="ti ti-loader" style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 24, marginBottom: 10 }}></i>
                        <div>Loading orders...</div>
                    </div>
                ) : (
                    <DataTable
                        headers={["Order ID", "Retailer", "City", "Items", "Value", "Payment", "Status", "Date", "Actions"]}
                        emptyText="No orders match the current filter"
                        rows={filtered.map((o, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                <td style={{ padding: "9px 10px", color: B.navyMid, fontWeight: 500 }}>{o.id}</td>
                                <td style={{ padding: "9px 10px", fontWeight: 500 }}>{o.retailer}</td>
                                <td style={{ padding: "9px 10px", color: B.textSecondary }}>{o.city}</td>
                                <td style={{ padding: "9px 10px", color: B.textSecondary }}>{o.items}</td>
                                <td style={{ padding: "9px 10px", fontWeight: 500 }}>{o.value}</td>
                                <td style={{ padding: "9px 10px", color: B.textSecondary }}>{o.payment}</td>
                                <td style={{ padding: "9px 10px" }}><StatusBadge status={o.status} /></td>
                                <td style={{ padding: "9px 10px", color: B.textSecondary }}>{o.date}</td>
                                <td style={{ padding: "9px 10px" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <i className="ti ti-eye" onClick={() => setViewOrder({ order: o.raw, print: false })} style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="View" />
                                        <i className="ti ti-edit" onClick={() => setEditOrder(o)} style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} aria-label="Edit" />
                                        <i className="ti ti-printer" onClick={() => setViewOrder({ order: o.raw, print: true })} style={{ fontSize: 15, color: B.textSecondary, cursor: "pointer" }} aria-label="Print" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    />
                )}
            </Card>
            
            {editOrder && (
                <UpdateOrderStatusModal 
                    orderId={editOrder._id} 
                    currentStatus={editOrder.status} 
                    onClose={() => setEditOrder(null)} 
                />
            )}
            
            {viewOrder && (
                <ViewOrderModal 
                    order={viewOrder.order} 
                    autoPrint={viewOrder.print}
                    onClose={() => setViewOrder(null)} 
                />
            )}
        </div>
    );
}
