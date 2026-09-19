import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { userApi, type UserRole, type UserUpdatePayload } from "../../api/users";
import type { UserListItem } from "../../api/users";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageUsers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    role: "school_admin" as UserRole,
    school_id: 0,
    status: "active" as "active" | "inactive" | "suspended",
    name: "",
  });
  const [editForm, setEditForm] = useState<UserUpdatePayload>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await userApi.getAll();
      setUsers(data.data || []);
    } catch {
      setToast({ message: "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ---------- CREATE ----------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userApi.create(createForm);
      setToast({ message: "User created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm({ email: "", password: "", role: "school_admin", school_id: 0, status: "active", name: "" });
      fetchUsers();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create user"
        : "Failed to create user";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- EDIT ----------
  const openEdit = (u: UserListItem) => {
    setEditing(u);
    setEditForm({
      email: u.email,
      role: u.role,
      school_id: u.school_id,
      status: u.status,
      name: u.name,
    });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await userApi.update(editing.id, editForm);
      setToast({ message: "User updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update user"
        : "Failed to update user";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (u: UserListItem) => {
    if (!confirm(`Delete ${u.name || u.email}?`)) return;
    try {
      await userApi.delete(u.id);
      setToast({ message: "User deleted", type: "success" });
      fetchUsers();
    } catch {
      setToast({ message: "Failed to delete user", type: "error" });
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Users</h1>
          <p className="mgmt-subtitle">{isSuperAdmin ? "Manage all platform users." : "View users."}</p>
        </div>
        {isSuperAdmin && (
          <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm({ email: "", password: "", role: "school_admin", school_id: 0, status: "active", name: "" }); setShowCreate(true); }}>
            + Add User
          </button>
        )}
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : users.length === 0 ? (
        <div className="mgmt-empty">No users yet.{isSuperAdmin ? " Add one to get started." : ""}</div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table mgmt-table--compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>School ID</th>
                {isSuperAdmin && <th className="mgmt-table-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mgmt-table-bold">{u.name || "-"}</td>
                  <td>{u.email}</td>
                  <td><span className="dash-badge dash-badge--active">{u.role}</span></td>
                  <td><span className={`dash-badge ${u.status === "active" ? "dash-badge--active" : u.status === "inactive" ? "dash-badge--completed" : "dash-badge--dropped"}`}>{u.status}</span></td>
                  <td>{u.school_id ?? "-"}</td>
                  {isSuperAdmin && (
                    <td className="mgmt-table-actions">
                      <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(u)}>Edit</button>
                      <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(u)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && isSuperAdmin && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal" style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add User</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>User Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Name</label>
                    <input className="mgmt-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Password *</label>
                    <input className="mgmt-input" type="password" required value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Role *</label>
                    <select className="mgmt-input mgmt-select" required value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}>
                      <option value="super_admin">Super Admin</option>
                      <option value="school_admin">School Admin</option>
                      <option value="faculty">Faculty</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">School ID</label>
                    <input className="mgmt-input" type="number" min="0" value={createForm.school_id} onChange={(e) => setCreateForm({ ...createForm, school_id: Number(e.target.value) })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Status</label>
                    <select className="mgmt-input mgmt-select" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as "active" | "inactive" | "suspended" })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </fieldset>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="mgmt-btn mgmt-btn--primary" disabled={submitting}>{submitting ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && editing && isSuperAdmin && (
        <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="mgmt-modal" style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit User</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>User Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Name</label>
                    <input className="mgmt-input" value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Role *</label>
                    <select className="mgmt-input mgmt-select" required value={editForm.role ?? "school_admin"} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}>
                      <option value="super_admin">Super Admin</option>
                      <option value="school_admin">School Admin</option>
                      <option value="faculty">Faculty</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">School ID</label>
                    <input className="mgmt-input" type="number" min="0" value={editForm.school_id ?? 0} onChange={(e) => setEditForm({ ...editForm, school_id: Number(e.target.value) })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Status</label>
                    <select className="mgmt-input mgmt-select" value={editForm.status ?? "active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" | "suspended" })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </fieldset>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="mgmt-btn mgmt-btn--primary" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}