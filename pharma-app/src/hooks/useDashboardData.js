import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000/api/dashboard';

export function useDashboardData(token) {
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [sales, setSales] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [salesByCompany, setSalesByCompany] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEndpoint = async (endpoint, setter) => {
    if (!token) return;
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint} (${res.status})`);
    const data = await res.json();
    setter(data);
  };

  const fetchKpis = useCallback(() => fetchEndpoint('/kpis', setKpis), [token]);
  const fetchAlerts = useCallback(() => fetchEndpoint('/alerts', setAlerts), [token]);
  const fetchSales = useCallback(() => fetchEndpoint('/sales', setSales), [token]);
  const fetchTopProducts = useCallback(() => fetchEndpoint('/top-products', setTopProducts), [token]);
  const fetchSalesByCompany = useCallback(() => fetchEndpoint('/sales/by-company', setSalesByCompany), [token]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchKpis(),
        fetchAlerts(),
        fetchSales(),
        fetchTopProducts(),
        fetchSalesByCompany()
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchKpis, fetchAlerts, fetchSales, fetchTopProducts, fetchSalesByCompany, token]);

  useEffect(() => {
    fetchAll();

    // Polling setup (wrap in try/catch to not crash if background poll fails)
    const safePoll = (fetchFn) => {
      fetchFn().catch(err => console.error('Polling error:', err));
    };

    const kpiInterval = setInterval(() => safePoll(fetchKpis), 5 * 60 * 1000); // 5 mins
    const alertsInterval = setInterval(() => safePoll(fetchAlerts), 10 * 60 * 1000); // 10 mins

    // Socket.io setup with auth
    const socket = io('http://localhost:3000', {
      auth: { token }
    });
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket for real-time dashboard updates');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err.message);
    });

    socket.on('dashboard:refresh-kpis', () => {
      console.log('Real-time event received: refreshing KPIs');
      safePoll(fetchKpis);
      safePoll(fetchTopProducts);
    });

    return () => {
      clearInterval(kpiInterval);
      clearInterval(alertsInterval);
      socket.disconnect();
    };
  }, [fetchAll, fetchKpis, fetchAlerts, fetchTopProducts, token]);

  return { kpis, alerts, sales, topProducts, salesByCompany, loading, error, refetch: fetchAll };
}
