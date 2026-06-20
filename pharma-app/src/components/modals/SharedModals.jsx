import { useState, useEffect } from "react";
import { B } from '../../theme.js';
import api from '../../api/axios';

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = B.navy }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
            <div style={{ background: B.white, borderRadius: 12, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", display: "flex", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: confirmColor === B.red ? "#FFF0F0" : B.navyLight, color: confirmColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`ti ${confirmColor === B.red ? 'ti-alert-triangle' : 'ti-help'}`} style={{ fontSize: 20 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: B.textPrimary, marginBottom: 8 }}>{title}</div>
                        <div style={{ fontSize: 13, color: B.textSecondary, lineHeight: 1.5 }}>{message}</div>
                    </div>
                </div>
                <div style={{ padding: "16px 24px", background: B.surface, borderTop: `1px solid ${B.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${B.border}`, borderRadius: 8, background: B.white, fontSize: 13, fontWeight: 500, color: B.textSecondary, cursor: "pointer" }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: confirmColor, color: B.white, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}


