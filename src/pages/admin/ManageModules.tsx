import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { moduleApi, type ModuleListItem, type ModulePayload } from "../../api/modules";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageModules() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const schoolId = user?.school_id ?? 0;
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<ModuleListItem | null>(null);
  const [createForm, setCreateForm] = useState<ModulePayload>({
    title: "",
    description: "",
    subject: "",
    subject_id: null,
    school_id: schoolId,
    admin_id: user?.id ?? "",
  });
  const [editForm, setEditForm] = useState<Partial<ModulePayload>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const modulesRes = await moduleApi.getAll();
        setModules(modulesRes.data.data || []);
      } else if (schoolId) {
        const [modulesRes, subjectsRes] = await Promise.all([
          moduleApi.getBySchoolId(schoolId),
          subjectApi.getBySchoolId(schoolId),
        ]);
        setModules(modulesRes.data.data || []);
        setSubjects(subjectsRes.data.data || []);
      }
    } catch {
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin && !schoolId) return;
    setSubmitting(true);
    try {
      await moduleApi.create({ ...createForm, school_id: schoolId, admin_id: user?.id ?? "" });
      setToast({ message: "Module created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm({ title: "", description: "", subject: "", subject_id: null, school_id: schoolId, admin_id: user?.id ?? "" });
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create module"
        : "Failed to create module";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (m: ModuleListItem) => {
    setEditing(m);
    setEditForm({
      title: m.title,
      description: m.description,
      subject: m.subject,
      subject_id: m.subject_id ?? undefined,
    });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await moduleApi.update(editing.id, editForm);
      setToast({ message: "Module updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update module"
        : "Failed to update module";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: ModuleListItem) => {
    if (!confirm(`Delete ${m.title}?`)) return;
    try {
      await moduleApi.delete(m.id);
      setToast({ message: "Module deleted", type: "success" });
      fetchData();
    } catch {
      setToast({ message: "Failed to delete module", type: "error" });
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Modules</h1>
          <p className="mgmt-subtitle">{isSuperAdmin ? "Manage all platform modules." : "Manage modules for your school."}</p>
        </div>
        {!isSuperAdmin && (
          <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm({ title: "", description: "", subject: "", subject_id: null, school_id: schoolId, admin_id: user?.id ?? "" }); setShowCreate(true); }}>
            + Add Module
          </button>
        )}
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : modules.length === 0 ? (
        <div className="mgmt-empty">No modules registered yet.{!isSuperAdmin && " Add one to get started."}</div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table mgmt-table--compact">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>School ID</th>
                <th>Description</th>
                {!isSuperAdmin && <th className="mgmt-table-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id}>
                  <td className="mgmt-table-bold">{m.title}</td>
                  <td><span className="dash-badge dash-badge--active">{m.subject}</span></td>
                  <td>{m.school_id}</td>
                  <td className="mgmt-table-address mgmt-table-address--wrap">{m.description || "—"}</td>
                  {!isSuperAdmin && (
                    <td className="mgmt-table-actions">
                      <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(m)}>Edit</button>
                      <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(m)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && !isSuperAdmin && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add Module</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Module Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Title *</label>
                    <input className="mgmt-input" required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject *</label>
                    <select className="mgmt-input mgmt-select" required value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject (Link) *</label>
                    <select className="mgmt-input mgmt-select" required value={createForm.subject_id ?? ""} onChange={(e) => setCreateForm({ ...createForm, subject_id: e.target.value || null })}>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Description</label>
                    <textarea className="mgmt-input mgmt-textarea" rows={3} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description" />
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
      {showEdit && editing && !isSuperAdmin && (
        <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit Module</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Module Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Title *</label>
                    <input className="mgmt-input" required value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject *</label>
                    <select className="mgmt-input mgmt-select" required value={editForm.subject ?? ""} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject (Link) *</label>
                    <select className="mgmt-input mgmt-select" required value={editForm.subject_id ?? ""} onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value || null })}>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Description</label>
                    <textarea className="mgmt-input mgmt-textarea" rows={3} value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional description" />
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