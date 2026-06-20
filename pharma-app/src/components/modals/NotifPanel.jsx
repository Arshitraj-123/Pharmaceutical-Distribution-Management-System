import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function NotifPanel({ onClose }) {
    const [notifications, setNotifications] = useState([]);
    const unread = notifications.filter(n => !n.read).length;

    const fetchNotifs = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifs();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            fetchNotifs();
            window.dispatchEvent(new Event('notifications-read'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotifClick = async (n) => {
        if (!n.read) {
            try {
                await api.patch(`/notifications/${n._id}/read`);
                fetchNotifs();
                window.dispatchEvent(new Event('notifications-read'));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'Alert': return 'ti-alert-circle';
            case 'Warning': return 'ti-alert-triangle';
            case 'Success': return 'ti-check';
            default: return 'ti-info-circle';
        }
    };
    
    const getColor = (type) => {
        switch(type) {
            case 'Alert': return B.red;
            case 'Warning': return B.amber;
            case 'Success': return B.green;
            default: return B.navy;
        }
    };

    return (
        <div style={{ position: "absolute", top: 52, right: 60, width: 340, background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${B.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>Notifications</div>
                {unread > 0 && <span style={{ background: B.redLight, color: B.red, fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 10 }}>{unread} unread</span>}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: "center", color: B.textMuted, fontSize: 12 }}>No recent notifications</div>
                ) : (
                    notifications.map((n, i) => (
                        <div key={n._id || i} onClick={() => handleNotifClick(n)} style={{ padding: "10px 16px", borderBottom: i < notifications.length - 1 ? `1px solid ${B.border}` : "none", background: n.read ? B.white : B.navyLight, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: getColor(n.type) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <i className={`ti ${getIcon(n.type)}`} style={{ fontSize: 14, color: getColor(n.type) }} aria-hidden="true" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: B.textPrimary, lineHeight: 1.4 }}>{n.title}</div>
                                <div style={{ fontSize: 11, color: B.textSecondary, marginTop: 2, lineHeight: 1.3 }}>{n.message}</div>
                                <div style={{ fontSize: 10, color: B.textMuted, marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: B.navyMid, marginTop: 4, flexShrink: 0 }} />}
                        </div>
                    ))
                )}
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${B.border}` }}>
                <button onClick={handleMarkAllRead} style={{ width: "100%", background: "none", border: "none", fontSize: 12, color: B.navyMid, cursor: "pointer", fontFamily: "inherit" }}>Mark all as read</button>
            </div>
        </div>
    );
}


