import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000/api/dashboard';

export function useDashboardData(token) {
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKpis = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/kpis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (err) {
      console.error('Failed to fetch KPIs', err);
    }
  }, [token]);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  }, [token]);

  const fetchSales = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales', err);
    }
  }, [token]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchKpis(), fetchAlerts(), fetchSales()]);
    setLoading(false);
  }, [fetchKpis, fetchAlerts, fetchSales]);

  useEffect(() => {
    fetchAll();

    // Setup polling
    const kpiInterval = setInterval(fetchKpis, 5 * 60 * 1000); // 5 mins
    const alertsInterval = setInterval(fetchAlerts, 10 * 60 * 1000); // 10 mins

    // Setup Socket.io
    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('Connected to WebSocket for real-time dashboard updates');
    });

    socket.on('dashboard:refresh-kpis', () => {
      console.log('Real-time event received: refreshing KPIs');
      fetchKpis();
    });

    return () => {
      clearInterval(kpiInterval);
      clearInterval(alertsInterval);
      socket.disconnect();
    };
  }, [fetchAll, fetchKpis, fetchAlerts]);

  return { kpis, alerts, sales, loading, error, refetch: fetchAll };
}
