import { B } from '../theme.js';

const BADGE_MAP = {
    "Delivered": { bg: "#D9F2E6", color: "#1E7E4E" },
    "Dispatched": { bg: "#DBEAFE", color: "#1E40AF" },
    "Confirmed": { bg: "#EDE9FE", color: "#5B21B6" },
    "Pending": { bg: "#FFF3CD", color: "#92400E" },
    "Cancelled": { bg: "#FCEBEB", color: "#A32D2D" },
    "Active": { bg: "#D9F2E6", color: "#1E7E4E" },
    "Credit Hold": { bg: "#FCEBEB", color: "#A32D2D" },
    "License Expiring": { bg: "#FFF3CD", color: "#92400E" },
    "OK": { bg: "#D9F2E6", color: "#1E7E4E" },
    "Low": { bg: "#FFF3CD", color: "#92400E" },
    "Expiring": { bg: "#FCEBEB", color: "#A32D2D" },
    "Expired": { bg: "#FCEBEB", color: "#A32D2D" },
    "In Transit": { bg: "#DBEAFE", color: "#1E40AF" },
    "Completed": { bg: "#D9F2E6", color: "#1E7E4E" },
    "GRN Done": { bg: "#D9F2E6", color: "#1E7E4E" },
    "A": { bg: "#DBEAFE", color: "#1E40AF" },
    "B": { bg: "#EDE9FE", color: "#5B21B6" },
    "C": { bg: "#F1F5F9", color: "#475569" },
    "H": { bg: "#FFF3CD", color: "#92400E" },
    "H1": { bg: "#FEE2E2", color: "#991B1B" },
    "X": { bg: "#FCEBEB", color: "#A32D2D" },
    "OTC": { bg: "#D9F2E6", color: "#1E7E4E" },
    "Generated": { bg: "#D9F2E6", color: "#1E7E4E" },
    "Pending IRN": { bg: "#FFF3CD", color: "#92400E" },
    "Paid": { bg: "#D9F2E6", color: "#1E7E4E" },
};

export function StatusBadge({ status }) {
    const s = BADGE_MAP[status] || { bg: "#F1F5F9", color: "#475569" };
    return (
        <span style={{
            background: s.bg, color: s.color, fontSize: 11, fontWeight: 500,
            padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", display: "inline-block"
        }}>{status}</span>
    );
}

export function KPICard({ icon, label, value, sub, subColor, accent, onClick }) {
    return (
        <div onClick={onClick} style={{
            background: B.white, borderRadius: 12, border: `1px solid ${B.border}`,
            padding: "12px 14px", cursor: onClick ? "pointer" : "default",
            transition: "border-color .15s"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: B.textSecondary, fontWeight: 500, letterSpacing: "0.03em" }}>{label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 15, color: accent }} aria-hidden="true" />
                </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: B.textPrimary, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: subColor || B.textMuted, marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

export function PageHeader({ title, subtitle, action, onAction, extraActions }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: 10 }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: B.textPrimary }}>{title}</h2>
                {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: B.textSecondary }}>{subtitle}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {extraActions}
                {action && (
                    <button onClick={onAction} style={{
                        background: B.navy, color: B.white, border: "none", borderRadius: 8,
                        padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit"
                    }}>
                        <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />{action}
                    </button>
                )}
            </div>
        </div>
    );
}

export function AlertBar({ type = "warn", children }) {
    const styles = {
        warn: { bg: "#FFF3CD", border: B.amber, color: "#92400E", icon: "ti-alert-triangle" },
        info: { bg: B.navyLight, border: B.navyMid, color: B.navy, icon: "ti-info-circle" },
        success: { bg: B.greenLight, border: B.green, color: "#14532D", icon: "ti-check" },
    };
    const s = styles[type];
    return (
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: s.color }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: 15, flexShrink: 0 }} aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
}

export function DataTable({ headers, rows, emptyText = "No data found" }) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                        {headers.map(h => (
                            <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 500, color: B.textSecondary, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={headers.length} style={{ padding: "2rem", textAlign: "center", color: B.textMuted }}>{emptyText}</td></tr>
                    ) : rows}
                </tbody>
            </table>
        </div>
    );
}

export function Card({ children, style = {} }) {
    return (
        <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: "14px 16px", ...style }}>
            {children}
        </div>
    );
}

export function CardTitle({ children, action }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: B.textPrimary }}>{children}</span>
            {action}
        </div>
    );
}

export function SearchInput({ value, onChange, placeholder }) {
    return (
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: B.textMuted, fontSize: 14 }} aria-hidden="true" />
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                style={{ width: "100%", paddingLeft: 30, paddingRight: 12, height: 34, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12, color: B.textPrimary, background: B.surface, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
    );
}

export function FilterChips({ options, active, onChange }) {
    return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {options.map(o => (
                <button key={o} onClick={() => onChange(o)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${active === o ? B.navy : B.border}`,
                    background: active === o ? B.navy : B.white,
                    color: active === o ? B.white : B.textSecondary, fontFamily: "inherit"
                }}>{o}</button>
            ))}
        </div>
    );
}

export function EmptyState({ icon, title, sub }) {
    return (
        <div style={{ padding: "3rem", textAlign: "center" }}>
            <i className={`ti ${icon}`} style={{ fontSize: 40, color: B.textMuted, display: "block", marginBottom: 10 }} aria-hidden="true" />
            <div style={{ fontSize: 14, fontWeight: 500, color: B.textPrimary, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: B.textSecondary }}>{sub}</div>
        </div>
    );
}
