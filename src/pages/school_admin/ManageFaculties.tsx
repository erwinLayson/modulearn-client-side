import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { facultyApi, type FacultyRole } from "../../api/faculties";
import type { FacultyListItem, FacultyPayload, FacultyUpdatePayload } from "../../api/faculties";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

const emptyCreate: FacultyPayload = {
  first_name: "",
  last_name: "",
  email: "",
  school_id: 0,
  contact_number: "",
  faculty_role: "teacher",
};

const facultyRoleOptions: FacultyRole[] = ["teacher", "cashier", "register"];

export default function ManageFaculties() {
  const { user } = useAuth();
  const canManage = user?.role === "school_admin";
  const [faculties, setFaculties] = useState<FacultyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<FacultyListItem | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState<FacultyUpdatePayload>({});
  const [submitting, setSubmitting] = useState(false);

  const schoolId = user?.school_id ?? 0;

  const fetchFaculties = useCallback(async () => {
    if (!schoolId) return;
    try {
      const { data } = await facultyApi.getAll(schoolId);
      setFaculties(data.data || []);
    } catch {
      setToast({ message: "Failed to load faculties", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  // ---------- CREATE ----------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.school_id) return;
    setSubmitting(true);
    try {
      await facultyApi.create({
        ...createForm,
        school_id: user.school_id,
      });
      setToast({ message: "Faculty created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm(emptyCreate);
      fetchFaculties();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create faculty"
        : "Failed to create faculty";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- EDIT ----------
  const openEdit = (f: FacultyListItem) => {
    setEditing(f);
    setEditForm({ first_name: f.first_name, last_name: f.last_name, email: f.email, contact_number: f.contact_number, faculty_role: f.faculty_role });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await facultyApi.update(editing.id, editForm);
      setToast({ message: "Faculty updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      fetchFaculties();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update faculty"
        : "Failed to update faculty";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (f: FacultyListItem) => {
    if (!confirm(`Delete ${f.first_name} ${f.last_name}?`)) return;
    try {
      await facultyApi.delete(f.id);
      setToast({ message: "Faculty deleted", type: "success" });
      fetchFaculties();
    } catch {
      setToast({ message: "Failed to delete faculty", type: "error" });
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Faculties</h1>
          <p className="mgmt-subtitle">{canManage ? "Manage faculty accounts for your school." : "View faculties in your school."}</p>
        </div>
        {canManage && (
          <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm(emptyCreate); setShowCreate(true); }}>
            + Add Faculty
          </button>
        )}
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : faculties.length === 0 ? (
        <div className="mgmt-empty">No faculties yet.{canManage ? " Add one to get started." : ""}</div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                {canManage && <th className="mgmt-table-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {faculties.map((f) => (
                <tr key={f.id}>
                  <td className="mgmt-table-bold">{f.first_name} {f.last_name}</td>
                  <td>{f.email}</td>
                  <td>{f.contact_number}</td>
                  <td>{f.faculty_role ? f.faculty_role.charAt(0).toUpperCase() + f.faculty_role.slice(1) : "Teacher"}</td>
                  {canManage && (
                    <td className="mgmt-table-actions">
                      <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(f)}>Edit</button>
                      <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(f)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && canManage && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal" style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add Faculty</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Personal Information</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">First Name *</label>
                    <input className="mgmt-input" required value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Last Name *</label>
                    <input className="mgmt-input" required value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Contact Number</label>
                    <input className="mgmt-input" value={createForm.contact_number} onChange={(e) => setCreateForm({ ...createForm, contact_number: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Role *</label>
                    <select className="mgmt-input mgmt-select" required value={createForm.faculty_role} onChange={(e) => setCreateForm({ ...createForm, faculty_role: e.target.value as FacultyRole })}>
                      {facultyRoleOptions.map((role) => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
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
      {showEdit && editing && canManage && (
        <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="mgmt-modal" style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit Faculty</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Personal Information</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">First Name *</label>
                    <input className="mgmt-input" required value={editForm.first_name ?? ""} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Last Name *</label>
                    <input className="mgmt-input" required value={editForm.last_name ?? ""} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Contact Number</label>
                    <input className="mgmt-input" value={editForm.contact_number ?? ""} onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Role *</label>
                    <select className="mgmt-input mgmt-select" value={editForm.faculty_role ?? "teacher"} onChange={(e) => setEditForm({ ...editForm, faculty_role: e.target.value as FacultyRole })}>
                      {facultyRoleOptions.map((role) => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
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
