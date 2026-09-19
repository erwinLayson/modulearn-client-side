import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { subjectApi, type SubjectListItem, type SubjectPayload, type SubjectFaculty } from "../../api/subjects";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageSubjects() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<SubjectListItem | null>(null);
  const [createForm, setCreateForm] = useState<SubjectPayload>({
    name: "",
    subject_code: "",
    description: "",
    school_id: schoolId,
    admin_id: user?.id ?? "",
  });
  const [editForm, setEditForm] = useState<Partial<SubjectPayload>>({});
  const [submitting, setSubmitting] = useState(false);

  // Detail view state
  const [selectedSubject, setSelectedSubject] = useState<SubjectListItem | null>(null);
  const [assignedFaculties, setAssignedFaculties] = useState<SubjectFaculty[]>([]);
  const [availableFaculties, setAvailableFaculties] = useState<SubjectFaculty[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const subjectsRes = await subjectApi.getBySchoolId(schoolId);
      setSubjects(subjectsRes.data.data || []);
    } catch {
      setToast({ message: "Failed to load subjects", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openSubjectDetail = async (subject: SubjectListItem) => {
    setSelectedSubject(subject);
    setDetailLoading(true);
    try {
      const [assignedRes, availableRes] = await Promise.all([
        subjectApi.getFaculties(subject.id),
        subjectApi.getAvailableFaculties(schoolId),
      ]);
      setAssignedFaculties(assignedRes.data.data || []);
      setAvailableFaculties(availableRes.data.data || []);
    } catch {
      setToast({ message: "Failed to load subject details", type: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeSubjectDetail = () => {
    setSelectedSubject(null);
    setAssignedFaculties([]);
    setAvailableFaculties([]);
  };

  const handleAssignFaculty = async (facultyId: string) => {
    if (!selectedSubject) return;
    try {
      await subjectApi.assignFaculty(selectedSubject.id, facultyId);
      setToast({ message: "Faculty assigned", type: "success" });
      openSubjectDetail(selectedSubject);
      setShowAssignModal(false);
    } catch {
      setToast({ message: "Failed to assign faculty", type: "error" });
    }
  };

  const handleRemoveFaculty = async (facultyId: string) => {
    if (!selectedSubject) return;
    if (!confirm("Remove this faculty from the subject?")) return;
    try {
      await subjectApi.removeFaculty(selectedSubject.id, facultyId);
      setToast({ message: "Faculty removed", type: "success" });
      openSubjectDetail(selectedSubject);
    } catch {
      setToast({ message: "Failed to remove faculty", type: "error" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await subjectApi.create({ ...createForm, school_id: schoolId, admin_id: user?.id ?? "" });
      setToast({ message: "Subject created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm({ name: "", subject_code: "", description: "", school_id: schoolId, admin_id: user?.id ?? "" });
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create subject"
        : "Failed to create subject";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s: SubjectListItem) => {
    setEditing(s);
    setEditForm({ name: s.name, subject_code: s.subject_code ?? undefined, description: s.description ?? undefined });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await subjectApi.update(editing.id, editForm);
      setToast({ message: "Subject updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update subject"
        : "Failed to update subject";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: SubjectListItem) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    try {
      await subjectApi.delete(s.id);
      setToast({ message: "Subject deleted", type: "success" });
      fetchData();
    } catch {
      setToast({ message: "Failed to delete subject", type: "error" });
    }
  };

  if (!user) return null;

  // ========== DETAIL VIEW ==========
  if (selectedSubject) {
    const notAssigned = availableFaculties.filter(
      (af) => !assignedFaculties.some((af2) => af2.id === af.id)
    );

    return (
      <div className="mgmt-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

        <div className="mgmt-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={closeSubjectDetail} style={{ padding: "0.375rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="mgmt-title">{selectedSubject.name}</h1>
              <p className="mgmt-subtitle">
                {selectedSubject.subject_code && <span className="dash-badge dash-badge--active" style={{ marginRight: "0.5rem" }}>{selectedSubject.subject_code}</span>}
                {selectedSubject.description || "No description"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={() => openEdit(selectedSubject)}>Edit Subject</button>
            <button className="mgmt-btn mgmt-btn--primary" onClick={() => setShowAssignModal(true)}>+ Assign Faculty</button>
          </div>
        </div>

        {detailLoading ? (
          <div className="mgmt-loading">Loading...</div>
        ) : (
          <div className="mgmt-section">
            <h2 className="mgmt-section-title">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "1.25rem", height: "1.25rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              Assigned Teachers ({assignedFaculties.length})
            </h2>
            {assignedFaculties.length === 0 ? (
              <div className="mgmt-empty" style={{ padding: "2rem" }}>No teachers assigned yet. Click "Assign Faculty" to get started.</div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedFaculties.map((f) => (
                    <tr key={f.id}>
                      <td className="dash-table-bold">{f.first_name} {f.last_name}</td>
                      <td>{f.email}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="mgmt-action mgmt-action--delete" onClick={() => handleRemoveFaculty(f.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ASSIGN FACULTY MODAL */}
        {showAssignModal && (
          <div className="mgmt-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mgmt-modal-header">
                <h2 className="mgmt-modal-title">Assign Faculty to {selectedSubject.name}</h2>
                <button className="mgmt-modal-close" onClick={() => setShowAssignModal(false)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="mgmt-form">
                {notAssigned.length === 0 ? (
                  <div className="mgmt-empty" style={{ padding: "1.5rem" }}>All available faculties are already assigned.</div>
                ) : (
                  <div className="mgmt-assign-list">
                    {notAssigned.map((f) => (
                      <div key={f.id} className="mgmt-assign-item">
                        <div className="mgmt-card-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", width: "2rem", height: "2rem" }}>
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "1rem", height: "1rem" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{f.first_name} {f.last_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>{f.email}</div>
                        </div>
                        <button className="mgmt-btn mgmt-btn--primary" style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }} onClick={() => handleAssignFaculty(f.id)}>Assign</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowAssignModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL (reused) */}
        {showEdit && editing && (
          <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
            <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mgmt-modal-header">
                <h2 className="mgmt-modal-title">Edit Subject</h2>
                <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="mgmt-form">
                <fieldset className="mgmt-fieldset">
                  <legend>Subject Details</legend>
                  <div className="mgmt-form-grid">
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Name *</label>
                      <input className="mgmt-input" required value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Subject Code</label>
                      <input className="mgmt-input" value={editForm.subject_code ?? ""} onChange={(e) => setEditForm({ ...editForm, subject_code: e.target.value })} placeholder="e.g. MATH101" />
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

  // ========== LIST VIEW ==========
  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Subjects</h1>
          <p className="mgmt-subtitle">Manage subjects for your school.</p>
        </div>
        <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm({ name: "", subject_code: "", description: "", school_id: schoolId, admin_id: user?.id ?? "" }); setShowCreate(true); }}>
          + Add Subject
        </button>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="mgmt-empty">No subjects yet. Add one to get started.</div>
      ) : (
        <div className="mgmt-card-grid">
          {subjects.map((s) => (
            <div key={s.id} className="mgmt-card mgmt-card--clickable" onClick={() => openSubjectDetail(s)}>
              <div className="mgmt-card-top mgmt-card-top--green" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-header">
                  <div className="mgmt-card-icon" style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mgmt-card-title">{s.name}</h3>
                    <div className="mgmt-card-badges">
                      {s.subject_code && <span className="dash-badge dash-badge--active">{s.subject_code}</span>}
                    </div>
                    <span style={{ fontSize: "0.6875rem", color: "var(--ml-text-muted)" }}>Click to view details</span>
                  </div>
                </div>

                <hr className="mgmt-card-divider" />

                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Description</span>
                      <span className="mgmt-card-detail-value" style={{ whiteSpace: "normal" }}>{s.description || "No description provided."}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mgmt-card-footer" onClick={(e) => e.stopPropagation()}>
                <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(s)}>Edit</button>
                <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add Subject</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Subject Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Name *</label>
                    <input className="mgmt-input" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject Code</label>
                    <input className="mgmt-input" value={createForm.subject_code ?? ""} onChange={(e) => setCreateForm({ ...createForm, subject_code: e.target.value })} placeholder="e.g. MATH101" />
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Description</label>
                    <textarea className="mgmt-input mgmt-textarea" rows={3} value={createForm.description ?? ""} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description" />
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
      {showEdit && editing && (
        <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit Subject</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Subject Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Name *</label>
                    <input className="mgmt-input" required value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Subject Code</label>
                    <input className="mgmt-input" value={editForm.subject_code ?? ""} onChange={(e) => setEditForm({ ...editForm, subject_code: e.target.value })} placeholder="e.g. MATH101" />
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