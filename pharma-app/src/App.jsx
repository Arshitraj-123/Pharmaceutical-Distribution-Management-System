import { useState } from "react";
import { B } from "./theme.js";

import { Sidebar, Header } from "./components/layout.jsx";
import { PageHeader, EmptyState } from "./components/ui.jsx";
import { NewOrderModal, NewStockModal, NewDispatchModal, NewRetailerModal, NewPurchaseModal, NewSchemeModal, NewInvoiceModal, ProfileModal, NotifPanel } from "./components/modals.jsx";

import { DashboardPage } from "./pages/DashboardPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { InventoryPage } from "./pages/InventoryPage.jsx";
import { DeliveryPage } from "./pages/DeliveryPage.jsx";
import { RetailersPage } from "./pages/RetailersPage.jsx";
import { PurchasePage } from "./pages/PurchasePage.jsx";
import { SchemesPage } from "./pages/SchemesPage.jsx";
import { BillingPage } from "./pages/BillingPage.jsx";
import { CompliancePage } from "./pages/CompliancePage.jsx";
import { ReportsPage } from "./pages/ReportsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { PharmaAuth } from "./pages/PharmaAuth.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";

export default function App() {
    const [page, setPage] = useState("dashboard");
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showRetailerModal, setShowRetailerModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showSchemeModal, setShowSchemeModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));
    const [currentUser, setCurrentUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('auth_user')) || null; }
        catch(e) { return null; }
    });

    const handleLogin = (user) => {
        setIsAuthenticated(true);
        if (user) setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setPage('dashboard');
    };

    const PAGES = {
        dashboard: <DashboardPage setPage={setPage} showModal={() => setShowModal(true)} currentUser={currentUser} />,
        orders: <OrdersPage showModal={() => setShowModal(true)} />,
        inventory: <InventoryPage showModal={() => setShowStockModal(true)} />,
        delivery: <DeliveryPage showModal={() => setShowDispatchModal(true)} />,
        retailers: <RetailersPage showModal={() => setShowRetailerModal(true)} />,
        purchase: <PurchasePage showModal={() => setShowStockModal(true)} />,
        schemes: <SchemesPage showModal={() => setShowSchemeModal(true)} />,
        billing: <BillingPage showModal={() => setShowInvoiceModal(true)} />,
        compliance: <CompliancePage />,
        reports: <ReportsPage />,
        settings: <SettingsPage currentUser={currentUser} />,
        "edit-profile": <EditProfilePage setPage={setPage} currentUser={currentUser} />,
    };

    if (!isAuthenticated) {
        return <PharmaAuth onLogin={handleLogin} />;
    }

    return (
        <div style={{ display: "flex", height: "100vh", background: B.surface, fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontSize: 13 }}>
            <Sidebar active={page} setActive={p => { setPage(p); setShowNotif(false); setSidebarOpen(false); }} collapsed={collapsed} setCollapsed={setCollapsed} sidebarOpen={sidebarOpen} />
            <div className={`mobile-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Header 
                    page={page} 
                    onBell={() => setShowNotif(true)} 
                    onMenu={() => setSidebarOpen(true)}
                    onEditProfile={() => setPage('edit-profile')}
                    onLogout={handleLogout}
                    currentUser={currentUser} 
                />
                {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}

                <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }} onClick={() => setShowNotif(false)}>
                    {PAGES[page] || (
                        <div>
                            <PageHeader title="Page not found" />
                            <EmptyState icon="ti-compass-off" title="Page not found" sub="Navigate using the sidebar." />
                        </div>
                    )}
                </main>
            </div>

            {showModal && <NewOrderModal onClose={() => setShowModal(false)} />}
            {showStockModal && <NewStockModal onClose={() => setShowStockModal(false)} />}
            {showDispatchModal && <NewDispatchModal onClose={() => setShowDispatchModal(false)} />}
            {showRetailerModal && <NewRetailerModal onClose={() => setShowRetailerModal(false)} />}
            {showPurchaseModal && <NewPurchaseModal onClose={() => setShowPurchaseModal(false)} />}
            {showSchemeModal && <NewSchemeModal onClose={() => setShowSchemeModal(false)} />}
            {showInvoiceModal && <NewInvoiceModal onClose={() => setShowInvoiceModal(false)} />}
            {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} onLogout={handleLogout} currentUser={currentUser} />}
        </div>
    );
}
