import { B } from '../../theme.js';
import { Card, DataTable, StatusBadge } from '../../components/ui.jsx';
import { CustomToggle } from './CustomToggle.jsx';

export function UsersTab({ setShowAddUserModal }) {
  return (
                    <Card>
                        <div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                                <button onClick={() => setShowAddUserModal(true)} style={{ padding: "7px 12px", border: "none", borderRadius: 8, background: B.navy, color: B.white, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                                    <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" /> Add user
                                </button>
                            </div>
                            <DataTable
                                headers={["Name", "Email", "Role", "Branch", "Status", "Actions"]}
                                rows={[
                                    ["Rajesh Kumar", "rajesh@adhyapharma.in", "Operations Manager", "Head Office", "Active"],
                                    ["Priya Sharma", "priya@adhyapharma.in", "Accounts Executive", "Head Office", "Active"],
                                    ["Sunil Yadav", "sunil@adhyapharma.in", "Warehouse Incharge", "Head Office", "Active"],
                                    ["Rajan Kumar", "rajan@adhyapharma.in", "Delivery Staff", "Head Office", "Active"],
                                    ["Amit Singh", "amit@adhyapharma.in", "Delivery Staff", "Muzaffarpur", "Active"],
                                ].map(([name, email, role, branch, st], i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${B.border}`, background: i % 2 === 0 ? B.white : B.surface }}>
                                        <td style={{ padding: "9px 10px", fontWeight: 500 }}>{name}</td>
                                        <td style={{ padding: "9px 10px", color: B.textSecondary, fontSize: 11 }}>{email}</td>
                                        <td style={{ padding: "9px 10px" }}><span style={{ background: B.navyLight, color: B.navy, fontSize: 11, padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>{role}</span></td>
                                        <td style={{ padding: "9px 10px", color: B.textSecondary }}>{branch}</td>
                                        <td style={{ padding: "9px 10px" }}><StatusBadge status={st} /></td>
                                        <td style={{ padding: "9px 10px" }}>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <i className="ti ti-edit" style={{ fontSize: 15, color: B.navyMid, cursor: "pointer" }} aria-label="Edit" />
                                                <i className="ti ti-trash" style={{ fontSize: 15, color: B.red, cursor: "pointer" }} aria-label="Delete" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            />
                        </div>
                    </Card>
  );
}
