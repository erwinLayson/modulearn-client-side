import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { classApi, type ClassListItem, type ClassPayload, type ClassUpdatePayload, type ClassFaculty } from "../../api/classes";
import { subjectApi } from "../../api/subjects";
import type { SubjectListItem, SubjectFaculty } from "../../api/subjects";
import { getApiErrorMessage } from "../../api/client";
import Toast from "../../components/Toast";
import SchedulePicker from "../../components/SchedulePicker";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageClasses() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [faculties, setFaculties] = useState<{id: string; first_name: string; last_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<ClassListItem | null>(null);
  const [createForm, setCreateForm] = useState<ClassPayload>({
    class_name: "",
    faculty_id: "",
    school_id: schoolId,
    capacity: 30,
    section: "",
    grade_level: "",
    schedule: [],
  });
  const [editForm, setEditForm] = useState<ClassUpdatePayload>({});
  const [submitting, setSubmitting] = useState(false);

  // Detail view state
  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(null);
  const [assignedFaculties, setAssignedFaculties] = useState<ClassFaculty[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assign modal state
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectFaculties, setSubjectFaculties] = useState<SubjectFaculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingTeacher, setUpdatingTeacher] = useState<ClassFaculty | null>(null);
  const [updateSubjectId, setUpdateSubjectId] = useState<string>("");
  const [updateCandidates, setUpdateCandidates] = useState<SubjectFaculty[]>([]);
  const [selectedReplacementId, setSelectedReplacementId] = useState<string>("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [classesRes, advisersRes] = await Promise.all([
        classApi.getBySchoolId(schoolId),
        classApi.getAvailableAdvisers(schoolId),
      ]);
      setClasses(classesRes.data.data || []);
      setFaculties(advisersRes.data.data || []);
    } catch {
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ========== DETAIL VIEW HELPERS ==========
  const openClassDetail = async (cls: ClassListItem) => {
    setSelectedClass(cls);
    setDetailLoading(true);
    try {
      const assignedRes = await classApi.getFaculties(cls.id);
      setAssignedFaculties(assignedRes.data.data || []);
    } catch {
      setToast({ message: "Failed to load class details", type: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeClassDetail = () => {
    setSelectedClass(null);
    setAssignedFaculties([]);
    resetAssignModal();
  };

  const resetAssignModal = () => {
    setShowAssignModal(false);
    setSelectedSubjectId("");
    setSubjectFaculties([]);
    setSelectedFacultyId("");
  };

  const handleAssignFaculty = async () => {
    if (!selectedClass || !selectedFacultyId) return;
    try {
      await classApi.assignFaculty(selectedClass.id, selectedFacultyId, selectedSubjectId || undefined);
      setToast({ message: "Teacher assigned", type: "success" });
      resetAssignModal();
      openClassDetail(selectedClass);
    } catch (err: unknown) {
      setToast({ message: getApiErrorMessage(err, "Failed to assign teacher"), type: "error" });
    }
  };

  const handleRemoveFaculty = async (facultyId: string) => {
    if (!selectedClass) return;
    if (!confirm("Remove this teacher from the class?")) return;
    try {
      await classApi.removeFaculty(selectedClass.id, facultyId);
      setToast({ message: "Teacher removed", type: "success" });
      openClassDetail(selectedClass);
    } catch (err: unknown) {
      setToast({ message: getApiErrorMessage(err, "Failed to remove teacher"), type: "error" });
    }
  };

  const openUpdateModal = async (teacher: ClassFaculty) => {
    if (!selectedClass) return;
    setUpdatingTeacher(teacher);
    setSelectedReplacementId("");
    setShowUpdateModal(true);
    const subjectId = teacher.subject_id || "";
    setUpdateSubjectId(subjectId);
    if (subjectId) {
      setUpdateLoading(true);
      try {
        const res = await subjectApi.getFaculties(subjectId);
        const candidates = (res.data.data || []).filter(
          (f) => f.id !== teacher.id && !assignedFaculties.some((af) => af.id === f.id)
        );
        setUpdateCandidates(candidates);
      } catch {
        setToast({ message: "Failed to load teachers", type: "error" });
      } finally {
        setUpdateLoading(false);
      }
    }
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdatingTeacher(null);
    setUpdateSubjectId("");
    setUpdateCandidates([]);
    setSelectedReplacementId("");
  };

  const handleReplaceFaculty = async () => {
    if (!selectedClass || !updatingTeacher || !selectedReplacementId) return;
    try {
      await classApi.replaceFaculty(selectedClass.id, updatingTeacher.id, selectedReplacementId, updateSubjectId || undefined);
      setToast({ message: "Teacher replaced successfully", type: "success" });
      closeUpdateModal();
      openClassDetail(selectedClass);
    } catch (err: unknown) {
      setToast({ message: getApiErrorMessage(err, "Failed to replace teacher"), type: "error" });
    }
  };

  // ========== CRUD HANDLERS ==========
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await classApi.create({ ...createForm, school_id: schoolId });
      setToast({ message: "Class created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm({ class_name: "", faculty_id: "", school_id: schoolId, capacity: 30, section: "", grade_level: "", schedule: [] });
      fetchData();
    } catch (err: unknown) {
      setToast({ message: getApiErrorMessage(err, "Failed to create class"), type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: ClassListItem) => {
    setEditing(c);
    setEditForm({
      class_name: c.class_name,
      faculty_id: c.faculty_id,
      capacity: c.capacity ?? undefined,
      section: c.section ?? undefined,
      grade_level: c.grade_level ?? undefined,
      schedule: c.schedule ?? undefined,
    });
    if (c.faculty_id && c.faculty_name && !faculties.some((f) => f.id === c.faculty_id)) {
      setFaculties((prev) => [...prev, { id: c.faculty_id, first_name: c.faculty_name.split(" ")[0], last_name: c.faculty_name.split(" ").slice(1).join(" ") }]);
    }
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await classApi.update(editing.id, editForm);
      setToast({ message: "Class updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      await fetchData();
      if (selectedClass && selectedClass.id === editing.id) {
        const { data } = await classApi.getById(editing.id);
        if (data.data) setSelectedClass(data.data);
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update class"
        : "Failed to update class";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: ClassListItem) => {
    if (!confirm(`Delete ${c.class_name}?`)) return;
    try {
      await classApi.delete(c.id);
      setToast({ message: "Class deleted", type: "success" });
      fetchData();
    } catch {
      setToast({ message: "Failed to delete class", type: "error" });
    }
  };

  if (!user) return null;

  // ========== DETAIL VIEW ==========
  if (selectedClass) {
    return (
      <div className="mgmt-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

        <div className="mgmt-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={closeClassDetail} style={{ padding: "0.375rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="mgmt-title">{selectedClass.class_name}</h1>
              <p className="mgmt-subtitle">
                {selectedClass.section && <span className="dash-badge dash-badge--active" style={{ marginRight: "0.5rem" }}>{selectedClass.section}</span>}
                {selectedClass.grade_level && <span className="dash-badge dash-badge--warning" style={{ marginRight: "0.5rem" }}>{selectedClass.grade_level}</span>}
                {selectedClass.faculty_name && <span>Adviser: {selectedClass.faculty_name}</span>}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={() => { openEdit(selectedClass); }}>Edit Class</button>
            <button className="mgmt-btn mgmt-btn--primary" onClick={async () => {
              setSelectedSubjectId("");
              setSubjectFaculties([]);
              setSelectedFacultyId("");
              setShowAssignModal(true);
              try {
                const res = await subjectApi.getBySchoolId(schoolId);
                setSubjects(res.data.data || []);
              } catch {
                setToast({ message: "Failed to load subjects", type: "error" });
              }
            }}>+ Assign Teacher</button>
          </div>
        </div>

        {/* Class Info Cards */}
        <div className="mgmt-card-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="mgmt-card">
            <div className="mgmt-card-top mgmt-card-top--orange" />
            <div className="mgmt-card-body">
              <div className="mgmt-card-details">
                <div className="mgmt-card-detail">
                  <div className="mgmt-card-detail-icon">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div className="mgmt-card-detail-content">
                    <span className="mgmt-card-detail-label">Capacity</span>
                    <span className="mgmt-card-detail-value">{selectedClass.capacity ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedClass.schedule && selectedClass.schedule.length > 0 && (
            <div className="mgmt-card">
              <div className="mgmt-card-top" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Schedule</span>
                      <div className="mgmt-card-schedule">
                        {Array.isArray(selectedClass.schedule) && selectedClass.schedule.map((s, i) => (
                          <span key={i} className="mgmt-schedule-chip">
                            <strong>{s.day}</strong> {s.start_time}-{s.end_time}
                            {s.room && ` (${s.room})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Teachers Section */}
        {detailLoading ? (
          <div className="mgmt-loading">Loading teachers...</div>
        ) : (
          <div className="mgmt-section">
            <h2 className="mgmt-section-title">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "1.25rem", height: "1.25rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Subject Teachers ({assignedFaculties.length})
            </h2>
            {assignedFaculties.length === 0 ? (
              <div className="mgmt-empty" style={{ padding: "2rem" }}>No subject teachers assigned yet. Click "Assign Teacher" to get started.</div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedFaculties.map((f) => (
                    <tr key={f.id}>
                      <td className="dash-table-bold">{f.first_name} {f.last_name}</td>
                      <td>{f.email}</td>
                      <td>{f.subject_name ? <span className="dash-badge dash-badge--active">{f.subject_name}</span> : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="mgmt-action mgmt-action--edit" onClick={() => openUpdateModal(f)}>Update</button>
                        <button className="mgmt-action mgmt-action--delete" onClick={() => handleRemoveFaculty(f.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ASSIGN TEACHER MODAL */}
        {showAssignModal && (
          <div className="mgmt-modal-overlay" onClick={resetAssignModal}>
            <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mgmt-modal-header">
                <h2 className="mgmt-modal-title">Assign Teacher to {selectedClass.class_name}</h2>
                <button className="mgmt-modal-close" onClick={resetAssignModal} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="mgmt-form">
                {subjects.length === 0 ? (
                  <div className="mgmt-empty" style={{ padding: "1.5rem" }}>No subjects available. Create subjects first.</div>
                ) : (
                  <fieldset className="mgmt-fieldset">
                    <legend>Select Subject & Teacher</legend>
                    <div className="mgmt-form-grid">
                      <div className="mgmt-form-row">
                        <label className="mgmt-label">Subject *</label>
                        <select
                          className="mgmt-input mgmt-select"
                          value={selectedSubjectId}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setSelectedSubjectId(val);
                            setSelectedFacultyId("");
                            setSubjectFaculties([]);
                            if (val) {
                              setAssigningLoading(true);
                              try {
                                const res = await subjectApi.getFaculties(val);
                                setSubjectFaculties(res.data.data || []);
                              } catch {
                                setToast({ message: "Failed to load teachers", type: "error" });
                              } finally {
                                setAssigningLoading(false);
                              }
                            }
                          }}
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mgmt-form-row">
                        <label className="mgmt-label">Teacher *</label>
                        <select
                          className="mgmt-input mgmt-select"
                          value={selectedFacultyId}
                          disabled={!selectedSubjectId || assigningLoading}
                          onChange={(e) => setSelectedFacultyId(e.target.value)}
                        >
                          <option value="">
                            {assigningLoading
                              ? "Loading teachers..."
                              : !selectedSubjectId
                                ? "Select a subject first"
                                : subjectFaculties.length === 0
                                  ? "No teachers assigned to this subject"
                                  : "Select a teacher"
                            }
                          </option>
                          {subjectFaculties.map((f) => (
                            <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </fieldset>
                )}
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={resetAssignModal}>Cancel</button>
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={!selectedFacultyId}
                  onClick={handleAssignFaculty}
                >
                  Assign Teacher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPDATE TEACHER MODAL */}
        {showUpdateModal && updatingTeacher && (
          <div className="mgmt-modal-overlay" onClick={closeUpdateModal}>
            <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mgmt-modal-header">
                <h2 className="mgmt-modal-title">Update Teacher</h2>
                <button className="mgmt-modal-close" onClick={closeUpdateModal} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="mgmt-form">
                <fieldset className="mgmt-fieldset">
                  <legend>
                    Replace <strong>{updatingTeacher.first_name} {updatingTeacher.last_name}</strong>
                    {updatingTeacher.subject_name && <> with another <strong>{updatingTeacher.subject_name}</strong> teacher</>}
                  </legend>
                  <div className="mgmt-form-grid">
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Current Teacher</label>
                      <input className="mgmt-input" value={`${updatingTeacher.first_name} ${updatingTeacher.last_name}`} disabled />
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Subject</label>
                      <input className="mgmt-input" value={updatingTeacher.subject_name ?? "No subject assigned"} disabled />
                    </div>
                    <div className="mgmt-form-row mgmt-form-row--full">
                      <label className="mgmt-label">Replace With *</label>
                      {updateLoading ? (
                        <div className="mgmt-loading" style={{ padding: "0.5rem" }}>Loading teachers...</div>
                      ) : !updateSubjectId ? (
                        <div className="mgmt-empty" style={{ padding: "0.75rem" }}>No subject assigned to this teacher. Remove and re-assign with a subject instead.</div>
                      ) : updateCandidates.length === 0 ? (
                        <div className="mgmt-empty" style={{ padding: "0.75rem" }}>No other teachers available for this subject.</div>
                      ) : (
                        <select
                          className="mgmt-input mgmt-select"
                          value={selectedReplacementId}
                          onChange={(e) => setSelectedReplacementId(e.target.value)}
                        >
                          <option value="">Select a replacement teacher</option>
                          {updateCandidates.map((f) => (
                            <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </fieldset>
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={closeUpdateModal}>Cancel</button>
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={!selectedReplacementId}
                  onClick={handleReplaceFaculty}
                >
                  Replace Teacher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEdit && editing && (
          <div className="mgmt-modal-overlay" onClick={() => setShowEdit(false)}>
            <div className="mgmt-modal" style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div className="mgmt-modal-header">
                <h2 className="mgmt-modal-title">Edit Class</h2>
                <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="mgmt-form">
                <fieldset className="mgmt-fieldset">
                  <legend>Class Details</legend>
                  <div className="mgmt-form-grid">
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Class Name *</label>
                      <input className="mgmt-input" required value={editForm.class_name ?? ""} onChange={(e) => setEditForm({ ...editForm, class_name: e.target.value })} />
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Adviser *</label>
                      <select className="mgmt-input mgmt-select" required value={editForm.faculty_id ?? ""} onChange={(e) => setEditForm({ ...editForm, faculty_id: e.target.value })}>
                        <option value="">Select Adviser</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                      </select>
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Section</label>
                      <input className="mgmt-input" placeholder="e.g., A, B, 1-A" value={editForm.section ?? ""} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })} />
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Grade Level</label>
                      <input className="mgmt-input" placeholder="e.g., Grade 1, Year 2" value={editForm.grade_level ?? ""} onChange={(e) => setEditForm({ ...editForm, grade_level: e.target.value })} />
                    </div>
                    <div className="mgmt-form-row">
                      <label className="mgmt-label">Capacity</label>
                      <input className="mgmt-input" type="number" min="1" max="100" value={editForm.capacity ?? 30} onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })} />
                    </div>
                    <div className="mgmt-form-row mgmt-form-row--full">
                      <label className="mgmt-label">Schedule</label>
                      <div className="schedule-picker-container">
                        <SchedulePicker value={editForm.schedule || []} onChange={(schedule) => setEditForm({ ...editForm, schedule })} />
                      </div>
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
          <h1 className="mgmt-title">Classes</h1>
          <p className="mgmt-subtitle">Manage classrooms for your school.</p>
        </div>
        <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm({ class_name: "", faculty_id: "", school_id: schoolId, capacity: 30, section: "", grade_level: "", schedule: [] }); setShowCreate(true); }}>
          + Add Class
        </button>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="mgmt-empty">No classes yet. Add one to get started.</div>
      ) : (
        <div className="mgmt-card-grid">
          {classes.map((c) => (
            <div key={c.id} className="mgmt-card mgmt-card--clickable" onClick={() => openClassDetail(c)}>
              <div className="mgmt-card-top mgmt-card-top--orange" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-header">
                  <div className="mgmt-card-icon mgmt-card-icon--orange">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mgmt-card-title">{c.class_name}</h3>
                    <div className="mgmt-card-badges">
                      {c.section && <span className="dash-badge dash-badge--active">{c.section}</span>}
                      {c.grade_level && <span className="dash-badge dash-badge--warning">{c.grade_level}</span>}
                      <span style={{ fontSize: "0.6875rem", color: "var(--ml-text-muted)", marginLeft: "0.25rem" }}>Click to view details</span>
                    </div>
                  </div>
                </div>

                <hr className="mgmt-card-divider" />

                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Adviser</span>
                      <span className="mgmt-card-detail-value">{c.faculty_name}</span>
                    </div>
                  </div>

                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Capacity</span>
                      <div className="mgmt-card-capacity">
                        {c.capacity ? (
                          <>
                            <div className="mgmt-capacity-bar">
                              <div className="mgmt-capacity-fill mgmt-capacity-fill--low" style={{ width: "100%" }} />
                            </div>
                            <span className="mgmt-capacity-text">{c.capacity}</span>
                          </>
                        ) : (
                          <span className="mgmt-card-detail-value">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(c.schedule) && c.schedule.length > 0 && (
                    <div className="mgmt-card-detail">
                      <div className="mgmt-card-detail-icon">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="mgmt-card-detail-content">
                        <span className="mgmt-card-detail-label">Schedule</span>
                        <div className="mgmt-card-schedule">
                          {c.schedule.map((s, i) => (
                            <span key={i} className="mgmt-schedule-chip">
                              <strong>{s.day}</strong> {s.start_time}-{s.end_time}
                              {s.room && ` (${s.room})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mgmt-card-footer" onClick={(e) => e.stopPropagation()}>
                <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(c)}>Edit</button>
                <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal" style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add Class</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Class Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Class Name *</label>
                    <input className="mgmt-input" required value={createForm.class_name} onChange={(e) => setCreateForm({ ...createForm, class_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Adviser *</label>
                    <select className="mgmt-input mgmt-select" required value={createForm.faculty_id} onChange={(e) => setCreateForm({ ...createForm, faculty_id: e.target.value })}>
                      <option value="">Select Adviser</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Section</label>
                    <input className="mgmt-input" placeholder="e.g., A, B, 1-A" value={createForm.section} onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Grade Level</label>
                    <input className="mgmt-input" placeholder="e.g., Grade 1, Year 2" value={createForm.grade_level} onChange={(e) => setCreateForm({ ...createForm, grade_level: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Capacity</label>
                    <input className="mgmt-input" type="number" min="1" max="100" value={createForm.capacity ?? 30} onChange={(e) => setCreateForm({ ...createForm, capacity: Number(e.target.value) })} />
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Schedule</label>
                    <div className="schedule-picker-container">
                      <SchedulePicker value={createForm.schedule || []} onChange={(schedule) => setCreateForm({ ...createForm, schedule })} />
                    </div>
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
          <div className="mgmt-modal" style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit Class</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>Class Details</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Class Name *</label>
                    <input className="mgmt-input" required value={editForm.class_name ?? ""} onChange={(e) => setEditForm({ ...editForm, class_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Adviser *</label>
                    <select className="mgmt-input mgmt-select" required value={editForm.faculty_id ?? ""} onChange={(e) => setEditForm({ ...editForm, faculty_id: e.target.value })}>
                      <option value="">Select Adviser</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Section</label>
                    <input className="mgmt-input" placeholder="e.g., A, B, 1-A" value={editForm.section ?? ""} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Grade Level</label>
                    <input className="mgmt-input" placeholder="e.g., Grade 1, Year 2" value={editForm.grade_level ?? ""} onChange={(e) => setEditForm({ ...editForm, grade_level: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Capacity</label>
                    <input className="mgmt-input" type="number" min="1" max="100" value={editForm.capacity ?? 30} onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })} />
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Schedule</label>
                    <div className="schedule-picker-container">
                      <SchedulePicker value={editForm.schedule || []} onChange={(schedule) => setEditForm({ ...editForm, schedule })} />
                    </div>
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