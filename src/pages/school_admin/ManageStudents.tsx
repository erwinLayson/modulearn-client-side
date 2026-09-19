import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../api/students";
import type { StudentListItem, StudentPayload, StudentUpdatePayload, ImportResult, ImportPreview } from "../../api/students";

import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

const emptyCreate: StudentPayload = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension_name: "",
  email: "",
  school_id: 0,
  lrn: "",
  date_of_birth: null,
  place_of_birth: "",
  sex: "male",
  nationality: "Filipino",
  contact_number: "",
  region: "",
  province: "",
  city_municipality: "",
  barangay: "",
  purok_street: "",
};

export default function ManageStudents() {
  const { user } = useAuth();
  const canManage = user?.role === "school_admin";
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<StudentListItem | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState<StudentUpdatePayload>({});
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ImportPreview | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importOptions, setImportOptions] = useState({ skipDuplicates: true, updateExisting: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const schoolId = user?.school_id ?? 0;

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    try {
      const { data } = await studentApi.getAll(schoolId);
      setStudents(data.data || []);
    } catch {
      setToast({ message: "Failed to load students", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ---------- CREATE ----------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.school_id || !user?.id) return;
    setSubmitting(true);
    try {
      await studentApi.create({
        ...createForm,
        school_id: user.school_id,
      });
      setToast({ message: "Student created successfully", type: "success" });
      setShowCreate(false);
      setCreateForm(emptyCreate);
      fetchStudents();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create student"
        : "Failed to create student";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- EDIT ----------
  const openEdit = (s: StudentListItem) => {
    setEditing(s);
    setEditForm({
      first_name: s.first_name,
      middle_name: s.middle_name,
      last_name: s.last_name,
      extension_name: s.extension_name,
      email: s.email,
      lrn: s.lrn,
      date_of_birth: s.date_of_birth,
      place_of_birth: s.place_of_birth,
      sex: s.sex,
      nationality: s.nationality,
      contact_number: s.contact_number,
      region: s.region,
      province: s.province,
      city_municipality: s.city_municipality,
      barangay: s.barangay,
      purok_street: s.purok_street,
    });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await studentApi.update(editing.id, editForm);
      setToast({ message: "Student updated successfully", type: "success" });
      setShowEdit(false);
      setEditing(null);
      fetchStudents();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update student"
        : "Failed to update student";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async (s: StudentListItem) => {
    if (!confirm(`Delete ${s.first_name} ${s.last_name}?`)) return;
    try {
      await studentApi.delete(s.id);
      setToast({ message: "Student deleted", type: "success" });
      fetchStudents();
    } catch {
      setToast({ message: "Failed to delete student", type: "error" });
    }
  };

  // ---------- IMPORT ----------
  const [previewLoading, setPreviewLoading] = useState(false);

  const validateAndPreviewFile = async (file: File) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: "Invalid file type. Use CSV or Excel.", type: "error" });
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "File too large. Max size is 5MB.", type: "error" });
      return false;
    }

    setImportFile(file);
    setImportResult(null);
    setPreviewLoading(true);

    try {
      const { data } = await studentApi.importPreview(file);
      setImportPreviewData(data.data);
      setFileSelected(true);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to preview import"
        : "Failed to preview import";
      setToast({ message: msg, type: "error" });
    } finally {
      setPreviewLoading(false);
    }
    return true;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await validateAndPreviewFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("mgmt-drop-zone--active");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("mgmt-drop-zone--active");
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("mgmt-drop-zone--active");
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndPreviewFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) return;
    setSubmitting(true);
    setImportProgress(0);
    const progressInterval = setInterval(() => {
      setImportProgress(p => Math.min(p + 10, 90));
    }, 300);

    try {
      const { data } = await studentApi.import(importFile);
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(data.data);
      setToast({ message: `Import completed: ${data.data.success} success, ${data.data.failed} failed`, type: data.data.failed > 0 ? "error" : "success" });
      setFileSelected(false);
      setImportPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImportFile(null);
      fetchStudents();
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setImportProgress(0);
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to import students"
        : "Failed to import students";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFailedRows = () => {
    if (!importResult || importResult.errors.length === 0) return;
    const headers = ["Row", "Email", "Error", "Field", "Value", "Expected"];
    const rows = importResult.errors.map(e => [
      e.row,
      e.email || "",
      e.error,
      e.field || "",
      e.value || "",
      e.expected || ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csvContent = "first_name,middle_name,last_name,extension_name,email,lrn,date_of_birth,place_of_birth,sex,nationality,contact_number,region,province,city_municipality,barangay,purok_street\nJohn,Michael,Doe,Jr.,john@example.com,123456789012,2010-05-15,Manila,male,Filipino,555-0101,NCR,Manila,Manila,Barangay 1,Purok 1\nJane,Anne,Smith,,jane@example.com,123456789013,2009-08-22,Quezon City,female,Filipino,555-0102,NCR,Quezon City,Quezon City,Barangay 2,Purok 2";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Students</h1>
          <p className="mgmt-subtitle">{canManage ? "Manage student accounts for your school." : "View students in your school."}</p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="mgmt-btn mgmt-btn--primary" onClick={() => { setCreateForm(emptyCreate); setShowCreate(true); }}>
              + Add Student
            </button>
            <button className="mgmt-btn mgmt-btn--secondary" onClick={() => { setImportFile(null); setFileSelected(false); setImportPreviewData(null); setImportResult(null); setShowImport(true); }}>
              Import CSV/Excel
            </button>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={downloadTemplate} title="Download template">
              ↓ Template
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : students.length === 0 ? (
        <div className="mgmt-empty">No students yet.{canManage ? " Add one to get started." : ""}</div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table mgmt-table--compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Email</th>
                <th>Sex</th>
                <th>Contact</th>
                <th>LRN</th>
                <th>Address</th>
                {canManage && <th className="mgmt-table-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="mgmt-table-bold">{s.first_name} {s.middle_name && s.middle_name + ' '}{s.last_name}{s.extension_name && ' ' + s.extension_name}</td>
                  <td>{s.age ?? 'N/A'}</td>
                  <td>{s.email}</td>
                  <td>{s.sex}</td>
                  <td>{s.contact_number || '-'}</td>
                  <td>{s.lrn || '-'}</td>
                  <td className="mgmt-table-address mgmt-table-address--wrap">
                    {s.purok_street}, {s.barangay}, {s.city_municipality}, {s.province}, {s.region}
                  </td>
                  {canManage && (
                    <td className="mgmt-table-actions">
                      <button className="mgmt-action mgmt-action--edit" onClick={() => openEdit(s)}>Edit</button>
                      <button className="mgmt-action mgmt-action--delete" onClick={() => handleDelete(s)}>Delete</button>
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
          <div className="mgmt-modal" style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Add Student</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>1. Personal Information</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">LRN</label>
                    <input className="mgmt-input" value={createForm.lrn} onChange={(e) => setCreateForm({ ...createForm, lrn: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">First Name *</label>
                    <input className="mgmt-input" required value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Middle Name</label>
                    <input className="mgmt-input" value={createForm.middle_name} onChange={(e) => setCreateForm({ ...createForm, middle_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Last Name *</label>
                    <input className="mgmt-input" required value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Extension Name</label>
                    <input className="mgmt-input" placeholder="Jr., Sr., III" value={createForm.extension_name} onChange={(e) => setCreateForm({ ...createForm, extension_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Date of Birth</label>
                    <input className="mgmt-input" type="date" value={createForm.date_of_birth || ""} onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value || null })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Place of Birth</label>
                    <input className="mgmt-input" value={createForm.place_of_birth} onChange={(e) => setCreateForm({ ...createForm, place_of_birth: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Sex</label>
                    <select className="mgmt-input mgmt-select" value={createForm.sex} onChange={(e) => setCreateForm({ ...createForm, sex: e.target.value as "male" | "female" })}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Nationality</label>
                    <input className="mgmt-input" value={createForm.nationality} onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })} />
                  </div>
                </div>
              </fieldset>
              
              <fieldset className="mgmt-fieldset">
                <legend>2. Address</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Region</label>
                    <input className="mgmt-input" value={createForm.region} onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Province</label>
                    <input className="mgmt-input" value={createForm.province} onChange={(e) => setCreateForm({ ...createForm, province: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">City/Municipality</label>
                    <input className="mgmt-input" value={createForm.city_municipality} onChange={(e) => setCreateForm({ ...createForm, city_municipality: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Barangay</label>
                    <input className="mgmt-input" value={createForm.barangay} onChange={(e) => setCreateForm({ ...createForm, barangay: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Purok/Street</label>
                    <input className="mgmt-input" value={createForm.purok_street} onChange={(e) => setCreateForm({ ...createForm, purok_street: e.target.value })} />
                  </div>
                </div>
              </fieldset>
              
              <fieldset className="mgmt-fieldset">
                <legend>3. Contact & School</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Contact Number</label>
                    <input className="mgmt-input" value={createForm.contact_number} onChange={(e) => setCreateForm({ ...createForm, contact_number: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
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
          <div className="mgmt-modal" style={{ maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Edit Student</h2>
              <button className="mgmt-modal-close" onClick={() => setShowEdit(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="mgmt-form">
              <fieldset className="mgmt-fieldset">
                <legend>1. Personal Information</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">LRN</label>
                    <input className="mgmt-input" value={editForm.lrn ?? ""} onChange={(e) => setEditForm({ ...editForm, lrn: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">First Name *</label>
                    <input className="mgmt-input" required value={editForm.first_name ?? ""} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Middle Name</label>
                    <input className="mgmt-input" value={editForm.middle_name ?? ""} onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Last Name *</label>
                    <input className="mgmt-input" required value={editForm.last_name ?? ""} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Extension Name</label>
                    <input className="mgmt-input" placeholder="Jr., Sr., III" value={editForm.extension_name ?? ""} onChange={(e) => setEditForm({ ...editForm, extension_name: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Date of Birth</label>
                    <input className="mgmt-input" type="date" value={editForm.date_of_birth ?? ""} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value || null })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Place of Birth</label>
                    <input className="mgmt-input" value={editForm.place_of_birth ?? ""} onChange={(e) => setEditForm({ ...editForm, place_of_birth: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Sex</label>
                    <select className="mgmt-input mgmt-select" value={editForm.sex ?? "male"} onChange={(e) => setEditForm({ ...editForm, sex: e.target.value as "male" | "female" })}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Nationality</label>
                    <input className="mgmt-input" value={editForm.nationality ?? "Filipino"} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} />
                  </div>
                </div>
              </fieldset>
              
              <fieldset className="mgmt-fieldset">
                <legend>2. Address</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Region</label>
                    <input className="mgmt-input" value={editForm.region ?? ""} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Province</label>
                    <input className="mgmt-input" value={editForm.province ?? ""} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">City/Municipality</label>
                    <input className="mgmt-input" value={editForm.city_municipality ?? ""} onChange={(e) => setEditForm({ ...editForm, city_municipality: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Barangay</label>
                    <input className="mgmt-input" value={editForm.barangay ?? ""} onChange={(e) => setEditForm({ ...editForm, barangay: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row mgmt-form-row--full">
                    <label className="mgmt-label">Purok/Street</label>
                    <input className="mgmt-input" value={editForm.purok_street ?? ""} onChange={(e) => setEditForm({ ...editForm, purok_street: e.target.value })} />
                  </div>
                </div>
              </fieldset>
              
              <fieldset className="mgmt-fieldset">
                <legend>3. Contact & School</legend>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Contact Number</label>
                    <input className="mgmt-input" value={editForm.contact_number ?? ""} onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })} />
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Email *</label>
                    <input className="mgmt-input" type="email" required value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
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

      {/* IMPORT MODAL */}
      {showImport && canManage && (
        <div className="mgmt-modal-overlay" onClick={() => { setShowImport(false); setImportFile(null); setFileSelected(false); setImportResult(null); setImportPreviewData(null); setImportProgress(0); }}>
          <div className="mgmt-modal" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="mgmt-modal-title">Import Students (CSV/Excel)</h2>
            
            {!fileSelected && !importResult && !importPreviewData ? (
              <div className="mgmt-form">
                <p className="mgmt-subtitle" style={{ marginBottom: "16px" }}>
                  Upload a CSV or Excel file with columns:
                </p>
                <ul style={{ marginBottom: "16px", paddingLeft: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                  <li><strong>Required:</strong> first_name, last_name, email</li>
                  <li><strong>Optional:</strong> middle_name, extension_name, lrn, date_of_birth (YYYY-MM-DD), place_of_birth, sex (male/female), nationality, contact_number, region, province, city_municipality, barangay, purok_street</li>
                </ul>
                
                <div
                  ref={dropZoneRef}
                  className="mgmt-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "12px", color: "var(--text-muted)" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  <p style={{ margin: "8px 0", fontSize: "15px", fontWeight: 500 }}>Drag & drop CSV/Excel file here</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>or click to browse</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv,.xlsx,.xls" 
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    disabled={previewLoading}
                  />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Max file size: 5MB. Supported: .csv, .xlsx, .xls
                  </p>
                </div>
                
                {previewLoading && <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "12px", textAlign: "center" }}>Analyzing file...</p>}
                
                <div className="mgmt-modal-actions">
                  <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => { setShowImport(false); setImportFile(null); setFileSelected(false); setImportResult(null); setImportPreviewData(null); }}>Cancel</button>
                </div>
              </div>
            ) : importPreviewData && !importResult ? (
              <div className="mgmt-form">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <p className="mgmt-subtitle" style={{ marginBottom: 0 }}>Import Preview</p>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {importPreviewData.validRows} valid / {importPreviewData.totalRows} total rows
                  </span>
                </div>

                {/* Column Mapping Display */}
                {importPreviewData.columnMapping && Object.keys(importPreviewData.columnMapping).length > 0 && (
                  <details style={{ marginBottom: "12px", padding: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>Column Mapping ({Object.keys(importPreviewData.columnMapping).length} columns detected)</summary>
                    <div style={{ marginTop: "8px", fontSize: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                      {Object.entries(importPreviewData.columnMapping).map(([csvCol, sysField]) => (
                        <div key={csvCol} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 8px", background: "var(--bg)", borderRadius: "4px" }}>
                          <code style={{ flex: 1, fontSize: "11px", color: "var(--text-muted)" }}>{csvCol}</code>
                          <span style={{ color: "var(--primary)", fontSize: "11px" }}>→</span>
                          <code style={{ flex: 1, fontSize: "11px", fontWeight: 500 }}>{sysField}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {importPreviewData.validationErrors.length > 0 && (
                  <div style={{ marginBottom: "12px", padding: "12px", background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--danger)" }}>Validation Errors ({importPreviewData.validationErrors.length}):</strong>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Click to expand</span>
                    </div>
                    <div style={{ marginTop: "8px", maxHeight: "250px", overflow: "auto" }}>
                      {importPreviewData.validationErrors.slice(0, 20).map((e, idx) => (
                        <details key={idx} style={{ marginBottom: "8px", fontSize: "13px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                          <summary style={{ color: "var(--danger)", cursor: "pointer", fontWeight: 500, display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                            <span>Row {e.row}</span>
                            {e.email && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{e.email}</span>}
                            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{e.error}</span>
                          </summary>
                          <div style={{ marginTop: "4px", paddingLeft: "16px", color: "var(--text-muted)", fontSize: "12px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            {e.field && <div><strong>Field:</strong> {e.field}</div>}
                            {e.value !== undefined && <div><strong>Value:</strong> "{e.value}"</div>}
                            {e.expected && <div><strong>Expected:</strong> {e.expected}</div>}
                          </div>
                        </details>
                      ))}
                      {importPreviewData.validationErrors.length > 20 && <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "8px" }}>... and {importPreviewData.validationErrors.length - 20} more errors</div>}
                    </div>
                  </div>
                )}
                {importPreviewData.warnings.length > 0 && (
                  <div style={{ marginBottom: "12px", padding: "12px", background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--warning)" }}>Warnings ({importPreviewData.warnings.length}):</strong>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Click to expand</span>
                    </div>
                    <div style={{ marginTop: "8px", maxHeight: "150px", overflow: "auto" }}>
                      {importPreviewData.warnings.slice(0, 20).map((w, idx) => (
                        <details key={idx} style={{ marginBottom: "4px", fontSize: "13px" }}>
                          <summary style={{ color: "var(--warning)", cursor: "pointer" }}>{w}</summary>
                        </details>
                      ))}
                      {importPreviewData.warnings.length > 20 && <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>... and {importPreviewData.warnings.length - 20} more warnings</div>}
                    </div>
                  </div>
                )}

                <p className="mgmt-subtitle" style={{ marginBottom: "12px" }}>Valid Rows Preview (first 15):</p>
                <div className="mgmt-table-wrap" style={{ maxHeight: "280px", overflow: "auto" }}>
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Sex</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.previewData.slice(0, 15).map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.first_name}</td>
                          <td>{row.last_name}</td>
                          <td>{row.email}</td>
                          <td>{row.sex}</td>
                          <td>{row.contact_number || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <fieldset className="mgmt-fieldset" style={{ marginBottom: "16px" }}>
                  <legend>Import Options</legend>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="checkbox" checked={importOptions.skipDuplicates} onChange={(e) => setImportOptions({...importOptions, skipDuplicates: e.target.checked})} />
                      Skip duplicate emails
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="checkbox" checked={importOptions.updateExisting} onChange={(e) => setImportOptions({...importOptions, updateExisting: e.target.checked})} />
                      Update existing students
                    </label>
                  </div>
                </fieldset>

                <div className="mgmt-modal-actions">
                  <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => { setImportFile(null); setFileSelected(false); setImportPreviewData(null); }}>Change File</button>
                  <button type="button" className="mgmt-btn mgmt-btn--primary" onClick={handleConfirmImport} disabled={submitting || importPreviewData.validRows === 0}>
                    {submitting ? "Importing..." : importPreviewData.validRows === 0 ? "No Valid Rows" : `Confirm Import (${importPreviewData.validRows})`}
                  </button>
                </div>
              </div>
            ) : importResult ? (
              <div className="mgmt-form" style={{ textAlign: "center" }}>
                {importProgress > 0 && importProgress < 100 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Importing...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${importProgress}%`, background: "var(--primary)", transition: "width 0.3s ease" }} />
                    </div>
                  </div>
                )}
                <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: importResult.failed > 0 ? "var(--danger)" : "var(--success)" }}>
                  {importResult.failed === 0 ? "✓" : "⚠"} Import Complete
                </div>
                <p style={{ marginBottom: "16px" }}>
                  <strong>{importResult.success}</strong> imported, <strong>{importResult.failed}</strong> failed
                </p>
                {importResult.errors.length > 0 && (
                  <div style={{ textAlign: "left", maxHeight: "250px", overflow: "auto", marginBottom: "16px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong>Errors ({importResult.errors.length}):</strong>
                      <button type="button" className="mgmt-btn mgmt-btn--ghost" style={{ padding: "4px 12px", fontSize: "11px" }} onClick={downloadFailedRows}>
                        Download Errors CSV
                      </button>
                    </div>
                    <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                      {importResult.errors.slice(0, 15).map((e, idx) => (
                        <li key={idx} style={{ color: "var(--danger)", marginBottom: "4px", lineHeight: "1.4" }}>
                          <strong>Row {e.row}:</strong> {e.error} {e.email ? `({e.email})` : ""}
                          {e.field && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "16px" }}>Field: {e.field} | Value: "{e.value}"</div>}
                        </li>
                      ))}
                      {importResult.errors.length > 15 && <li>... and {importResult.errors.length - 15} more errors</li>}
                    </ul>
                  </div>
                )}
                {!!importResult.warnings?.length && (
                  <div style={{ textAlign: "left", maxHeight: "150px", overflow: "auto", marginBottom: "16px", fontSize: "13px" }}>
                    <strong>Warnings ({importResult.warnings.length}):</strong>
                    <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                      {importResult.warnings.slice(0, 15).map((w, idx) => (
                        <li key={idx} style={{ color: "var(--text-muted)", marginBottom: "2px" }}>{w}</li>
                      ))}
                      {importResult.warnings.length > 15 && <li>... and {importResult.warnings.length - 15} more warnings</li>}
                    </ul>
                  </div>
                )}
                <div className="mgmt-modal-actions">
                  <button type="button" className="mgmt-btn mgmt-btn--primary" onClick={() => { setShowImport(false); setImportFile(null); setFileSelected(false); setImportResult(null); setImportPreviewData(null); setImportProgress(0); }}>Done</button>
                </div>
              </div>
            ) : (
              <div className="mgmt-form" style={{ textAlign: "center", padding: "32px" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
                <p>Processing file...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
