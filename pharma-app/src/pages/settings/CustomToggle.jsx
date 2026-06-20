import { B } from '../../theme.js';

export // Custom Toggle Component
const CustomToggle = ({ enabled, setEnabled }) => (
    <div onClick={() => setEnabled(!enabled)} style={{ width: 40, height: 22, background: enabled ? B.green : B.border, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, background: B.white, borderRadius: '50%', position: 'absolute', top: 3, left: enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
);
