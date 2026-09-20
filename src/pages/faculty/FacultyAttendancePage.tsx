import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  classApi,
  attendanceApi,
  type FacultyClassAssignment,
  type AttendanceStatus,
  type AttendanceHistoryItem,
} from "../../api/classes";
import { enrollmentApi, type EnrollmentListItem } from "../../api/enrollments";
import { schoolYearApi } from "../../api/school-years";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

interface ClassCardData {
  assignment: FacultyClassAssignment;
  sessionCount: number;
  todayRecorded: number;
  todayPending: number;
}

function getRate(p: number, t: number) { return t > 0 ? Math.round((p / t) * 100) : 0; }
function rateColor(r: number) { return r >= 75 ? "#16a34a" : r >= 50 ? "#d97706" : "#dc2626"; }

export default function FacultyAttendancePage() {
  const { user } = useAuth();
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [classCards, setClassCards] = useState<ClassCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<FacultyClassAssignment | null>(null);

  const [activeTab, setActiveTab] = useState<"attendance" | "history">("attendance");
  const [classEnrollments, setClassEnrollments] = useState<EnrollmentListItem[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubjectId, setCreateSubjectId] = useState("");
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [histSubjectFilter, setHistSubjectFilter] = useState("");
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");

  const [spreadSessions, setSpreadSessions] = useState<{ date: string; subject_id: string; subject_name: string; statuses: Record<string, AttendanceStatus> }[]>([]);
  const [spreadStudents, setSpreadStudents] = useState<{ student_id: string; student_name: string; lrn: string | null }[]>([]);
  const [spreadLoading, setSpreadLoading] = useState(false);

  const [attSessions, setAttSessions] = useState<{ date: string; subject_id: string; subject_name: string; statuses: Record<string, AttendanceStatus> }[]>([]);
  const [attStudents, setAttStudents] = useState<{ student_id: string; student_name: string; lrn: string | null }[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  const [pendingEdits, setPendingEdits] = useState<Map<string, AttendanceStatus>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const editKey = (studentId: string, date: string, subjectId: string) => `${studentId}::${date}::${subjectId}`;

  const loadClassCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await classApi.getAssignedClasses(user.id);
      const assignments = res.data.data || [];
      const todayRes = await attendanceApi.getHistory({ date_from: today, date_to: today, limit: 200 });
      const todayHistory: AttendanceHistoryItem[] = todayRes.data.data?.data || [];
      const todayMap = new Map<string, AttendanceHistoryItem>();
      for (const h of todayHistory) todayMap.set(`${h.class_id}::${h.subject_id}`, h);

      const allHistoryRes = await attendanceApi.getHistory({ limit: 500 });
      const allHistory: AttendanceHistoryItem[] = allHistoryRes.data.data?.data || [];
      const sessionCountMap = new Map<string, Set<string>>();
      for (const h of allHistory) {
        const key = h.class_id;
        if (!sessionCountMap.has(key)) sessionCountMap.set(key, new Set());
        sessionCountMap.get(key)!.add(`${h.subject_id}::${h.attendance_date}`);
      }

      const cards: ClassCardData[] = assignments.map(a => {
        const recorded = (a.subjects || []).filter(s => todayMap.has(`${a.id}::${s.id}`)).length;
        const pending = (a.subjects || []).length - recorded;
        return {
          assignment: a,
          sessionCount: sessionCountMap.get(a.id)?.size || 0,
          todayRecorded: recorded,
          todayPending: pending,
        };
      });
      setClassCards(cards);
    } catch {
      setClassCards([]);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { loadClassCards(); }, [loadClassCards]);

  const openClass = useCallback(async (assignment: FacultyClassAssignment) => {
    setSelectedClass(assignment);
    setActiveTab("attendance");
    setClassEnrollments([]);
    setPendingEdits(new Map());
    setHasUnsavedChanges(false);
    setHistSubjectFilter("");
    setHistDateFrom("");
    setHistDateTo("");

    try {
      const syRes = await schoolYearApi.getCurrent(user!.school_id!);
      const sy = syRes.data.data;
      if (sy) {
        const enrRes = await enrollmentApi.getByClassAndSchoolYear(assignment.id, sy.id);
        setClassEnrollments((enrRes.data.data || []).filter(e => e.status === "active"));
      }
    } catch { /* ignore */ }
  }, [user]);

  const loadAttendanceSpreadsheet = useCallback(async () => {
    if (!selectedClass) return;
    setAttLoading(true);
    try {
      const res = await attendanceApi.getHistory({ class_id: selectedClass.id, limit: 200 });
      const sessions: AttendanceHistoryItem[] = res.data.data?.data || [];

      const sessionMap = new Map<string, { date: string; subject_id: string; subject_name: string }>();
      for (const s of sessions) {
        const dateOnly = s.attendance_date.slice(0, 10);
        const key = `${dateOnly}::${s.subject_id}`;
        if (!sessionMap.has(key)) sessionMap.set(key, { date: dateOnly, subject_id: s.subject_id, subject_name: s.subject_name });
      }
      const sortedSessions = [...sessionMap.values()].sort((a, b) => {
        const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        return dateCmp !== 0 ? dateCmp : a.subject_name.localeCompare(b.subject_name);
      });

      const sessionStatuses: { date: string; subject_id: string; subject_name: string; statuses: Record<string, AttendanceStatus> }[] = [];
      for (const sess of sortedSessions) {
        try {
          const attRes = await classApi.getAttendance(selectedClass.id, sess.date, sess.subject_id);
          const statuses: Record<string, AttendanceStatus> = {};
          for (const r of attRes.data.data || []) statuses[r.student_id] = r.status;
          sessionStatuses.push({ date: sess.date, subject_id: sess.subject_id, subject_name: sess.subject_name, statuses });
        } catch { sessionStatuses.push({ date: sess.date, subject_id: sess.subject_id, subject_name: sess.subject_name, statuses: {} }); }
      }

      const students = classEnrollments.map(e => ({ student_id: e.student_id, student_name: e.student_name, lrn: e.lrn ?? null }));
      setAttSessions(sessionStatuses);
      setAttStudents(students);
    } catch { setAttSessions([]); setAttStudents([]); }
    finally { setAttLoading(false); }
  }, [selectedClass, classEnrollments]);

  useEffect(() => {
    if (activeTab === "attendance" && selectedClass) {
      loadAttendanceSpreadsheet();
    }
  }, [activeTab, selectedClass, loadAttendanceSpreadsheet]);

  const openCreateSession = useCallback(() => {
    setShowCreateModal(true);
    setCreateSubjectId("");
    setCreateDate(today);
  }, [today]);

  const handleCreateSession = useCallback(() => {
    if (!selectedClass || !createSubjectId) { setToast({ message: "Select a subject", type: "error" }); return; }
    if (classEnrollments.length === 0) { setToast({ message: "No students enrolled", type: "error" }); return; }
    if (!createDate) { setToast({ message: "Select a date", type: "error" }); return; }

    const duplicate = attSessions.some(s => s.date === createDate && s.subject_id === createSubjectId);
    if (duplicate) {
      setToast({ message: `Attendance for this subject on ${createDate} already exists. Edit the existing session instead.`, type: "error" });
      return;
    }

    const subjectName = (selectedClass.subjects || []).find(s => s.id === createSubjectId)?.name || "Subject";
    setAttSessions(prev => {
      const next = [...prev, { date: createDate, subject_id: createSubjectId, subject_name: subjectName, statuses: {} as Record<string, AttendanceStatus> }];
      next.sort((a, b) => {
        const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        return dateCmp !== 0 ? dateCmp : a.subject_name.localeCompare(b.subject_name);
      });
      return next;
    });
    setToast({ message: "Session added — mark attendance, then click Save Attendance", type: "success" });
    setShowCreateModal(false);
  }, [selectedClass, createSubjectId, createDate, classEnrollments, attSessions]);

  const handleEditCell = useCallback((studentId: string, date: string, subjectId: string, value: string) => {
    if (value !== "0" && value !== "1" && value !== "") return;
    setPendingEdits(prev => {
      const next = new Map(prev);
      const key = editKey(studentId, date, subjectId);
      if (value === "") {
        next.delete(key);
      } else {
        next.set(key, value === "1" ? "present" : "absent");
      }
      setHasUnsavedChanges(next.size > 0);
      return next;
    });
  }, []);

  const getEffectiveStatus = useCallback((studentId: string, date: string, subjectId: string, originalStatus: AttendanceStatus | undefined): AttendanceStatus | undefined => {
    const key = editKey(studentId, date, subjectId);
    if (pendingEdits.has(key)) return pendingEdits.get(key);
    return originalStatus;
  }, [pendingEdits]);

  const getCellDisplayValue = useCallback((studentId: string, date: string, subjectId: string, originalStatus: AttendanceStatus | undefined): string => {
    const key = editKey(studentId, date, subjectId);
    if (pendingEdits.has(key)) {
      const v = pendingEdits.get(key);
      return v === "present" ? "1" : v === "absent" ? "0" : "";
    }
    if (originalStatus === "present") return "1";
    if (originalStatus === "absent") return "0";
    return "";
  }, [pendingEdits]);

  const handleSaveAttendance = useCallback(async () => {
    if (!selectedClass) return;

    const recordsToSave: { student_id: string; status: AttendanceStatus }[] = [];
    const affectedSessions = new Map<string, string>();

    for (const [key, status] of pendingEdits) {
      const [studentId, date, subjectId] = key.split("::");
      recordsToSave.push({ student_id: studentId, status });
      affectedSessions.set(`${date}::${subjectId}`, date);
    }

    if (recordsToSave.length === 0) return;

    setSaving(true);
    try {
      for (const [sessionKey, date] of affectedSessions) {
        const [, subjectId] = sessionKey.split("::");
        const sessionRecords = recordsToSave.filter(r => {
          const k = editKey(r.student_id, date, subjectId);
          return pendingEdits.has(k);
        });
        if (sessionRecords.length > 0) {
          await classApi.editAttendance(selectedClass.id, {
            records: sessionRecords,
            date,
            subject_id: subjectId,
          });
        }
      }

      setPendingEdits(new Map());
      setHasUnsavedChanges(false);
      setToast({ message: "Attendance saved successfully", type: "success" });
      await loadAttendanceSpreadsheet();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || "Failed to save attendance", type: "error" });
    } finally { setSaving(false); }
  }, [selectedClass, pendingEdits, loadAttendanceSpreadsheet]);

  const openHistorySpreadsheet = useCallback(async () => {
    if (!selectedClass) return;
    setSpreadLoading(true);
    try {
      const subjectFilter = histSubjectFilter || undefined;
      const res = await attendanceApi.getHistory({ class_id: selectedClass.id, subject_id: subjectFilter, date_from: histDateFrom || undefined, date_to: histDateTo || undefined, limit: 200 });
      const sessions: AttendanceHistoryItem[] = res.data.data?.data || [];

      const sessionMap = new Map<string, { date: string; subject_id: string; subject_name: string }>();
      for (const s of sessions) {
        const dateOnly = s.attendance_date.slice(0, 10);
        const key = `${dateOnly}::${s.subject_id}`;
        if (!sessionMap.has(key)) sessionMap.set(key, { date: dateOnly, subject_id: s.subject_id, subject_name: s.subject_name });
      }
      const sortedSessions = [...sessionMap.values()].sort((a, b) => {
        const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        return dateCmp !== 0 ? dateCmp : a.subject_name.localeCompare(b.subject_name);
      });

      const sessionStatuses: { date: string; subject_id: string; subject_name: string; statuses: Record<string, AttendanceStatus> }[] = [];
      for (const sess of sortedSessions) {
        const dateOnly = sess.date.slice(0, 10);
        try {
          const attRes = await classApi.getAttendance(selectedClass.id, dateOnly, sess.subject_id);
          const statuses: Record<string, AttendanceStatus> = {};
          for (const r of attRes.data.data || []) statuses[r.student_id] = r.status;
          sessionStatuses.push({ date: dateOnly, subject_id: sess.subject_id, subject_name: sess.subject_name, statuses });
        } catch { sessionStatuses.push({ date: dateOnly, subject_id: sess.subject_id, subject_name: sess.subject_name, statuses: {} }); }
      }

      const students = classEnrollments.map(e => ({ student_id: e.student_id, student_name: e.student_name, lrn: e.lrn ?? null }));
      setSpreadSessions(sessionStatuses);
      setSpreadStudents(students);
    } catch { setSpreadSessions([]); setSpreadStudents([]); }
    finally { setSpreadLoading(false); }
  }, [selectedClass, histSubjectFilter, histDateFrom, histDateTo, classEnrollments]);

  useEffect(() => {
    if (activeTab === "history" && selectedClass) openHistorySpreadsheet();
  }, [activeTab, selectedClass, openHistorySpreadsheet]);

  const classSubjects = selectedClass?.subjects || [];

  if (!user) return null;

  if (!selectedClass) {
    return (
      <div className="mgmt-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
        <div className="mgmt-header">
          <div>
            <h1 className="mgmt-title">Attendance</h1>
            <p className="mgmt-subtitle">
              {loading ? "Loading..." : `Track and manage attendance across your assigned classes.`}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="mgmt-loading">Loading...</div>
        ) : classCards.length === 0 ? (
          <div className="mgmt-empty">No classes assigned to you.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {classCards.map(card => (
              <div
                key={card.assignment.id}
                className="mgmt-card mgmt-card--clickable"
                onClick={() => openClass(card.assignment)}
                style={{ cursor: "pointer" }}
              >
                <div className="mgmt-card-top mgmt-card-top--blue" />
                <div className="mgmt-card-body">
                  <div className="mgmt-card-header">
                    <div className="mgmt-card-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="mgmt-card-title">{card.assignment.class_name}</h3>
                      <div className="mgmt-card-badges">
                        {card.assignment.grade_level && <span className="dash-badge dash-badge--active">{card.assignment.grade_level}</span>}
                        {card.assignment.section && <span className="dash-badge dash-badge--warning">Section {card.assignment.section}</span>}
                      </div>
                    </div>
                  </div>
                  <hr className="mgmt-card-divider" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--ml-text-muted)" }}>Subjects</span>
                      <span style={{ fontWeight: 600 }}>{card.assignment.subjects.length}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--ml-text-muted)" }}>Sessions</span>
                      <span style={{ fontWeight: 600 }}>{card.sessionCount}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--ml-text-muted)" }}>Today</span>
                      {card.todayPending === 0 && card.todayRecorded > 0 ? (
                        <span className="dash-badge dash-badge--success" style={{ fontSize: "0.7rem" }}>Recorded</span>
                      ) : card.todayPending > 0 ? (
                        <span className="dash-badge dash-badge--warning" style={{ fontSize: "0.7rem" }}>{card.todayPending} Pending</span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>No sessions</span>
                      )}
                    </div>
                  </div>
                  <div className="mgmt-card-footer" style={{ justifyContent: "flex-end", marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--ml-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      Open Class
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {/* Class Detail Header */}
      <div className="mgmt-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            className="mgmt-btn mgmt-btn--ghost"
            onClick={() => { setSelectedClass(null); setClassCards([]); loadClassCards(); }}
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div>
            <h1 className="mgmt-title" style={{ fontSize: "1.25rem" }}>{selectedClass.class_name}</h1>
            <p className="mgmt-subtitle">
              {[selectedClass.grade_level || null, selectedClass.section ? `Section ${selectedClass.section}` : null].filter(Boolean).join(" \u00b7 ") || "Class details"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--ml-border)", marginBottom: "1.5rem" }}>
        {(["attendance", "history"] as const).map(tab => {
          const labels = { attendance: "Attendance", history: "Attendance History" };
          const isActive = activeTab === tab;
          return (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none", outline: "none",
              borderBottom: isActive ? "2px solid var(--ml-primary)" : "2px solid transparent",
              padding: "0.75rem 0", color: isActive ? "var(--ml-primary)" : "var(--ml-text-muted)",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ padding: "0.75rem 1rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", color: "var(--ml-text-muted)" }}>Sessions</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 800 }}>{attSessions.length}</p>
            </div>
            <div style={{ padding: "0.75rem 1rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", color: "var(--ml-text-muted)" }}>Students</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 800 }}>{attStudents.length}</p>
            </div>
            <div style={{ padding: "0.75rem 1rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", color: "var(--ml-text-muted)" }}>Present</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#16a34a" }}>{attSessions.reduce((sum, s) => sum + Object.values(s.statuses).filter(v => v === "present").length, 0)}</p>
            </div>
            <div style={{ padding: "0.75rem 1rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", color: "var(--ml-text-muted)" }}>Absent</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>{attSessions.reduce((sum, s) => sum + Object.values(s.statuses).filter(v => v === "absent").length, 0)}</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>Attendance Spreadsheet</h3>
              {hasUnsavedChanges && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "#d97706", background: "rgba(217, 119, 6, 0.1)", padding: "0.25rem 0.625rem", borderRadius: "1rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
                  Unsaved changes
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {hasUnsavedChanges && (
                <button
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => { setPendingEdits(new Map()); setHasUnsavedChanges(false); }}
                  style={{ fontSize: "0.8125rem" }}
                >
                  Discard
                </button>
              )}
              <button
                className="mgmt-btn mgmt-btn--primary"
                onClick={handleSaveAttendance}
                disabled={!hasUnsavedChanges || saving}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}
              >
                {saving ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                    Save Attendance
                  </>
                )}
              </button>
              <button className="mgmt-btn mgmt-btn--primary" onClick={openCreateSession} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Create Attendance
              </button>
            </div>
          </div>

          {attLoading ? <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading spreadsheet...</div>
          : attSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ml-text-muted)" strokeWidth="1.5" style={{ margin: "0 auto 1rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem", color: "var(--ml-text)" }}>No attendance records yet.</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>Create an attendance session to begin tracking student attendance.</p>
            </div>
          ) : attStudents.length === 0 ? (
            <div className="mgmt-empty" style={{ padding: "2rem" }}>No students enrolled in this class.</div>
          ) : (
            <div className="gb-spreadsheet" style={{ borderRadius: "0.75rem", border: "1px solid var(--ml-border)" }}>
              <table className="gb-spreadsheet__table">
                <thead>
                  <tr>
                    <th className="gb-spreadsheet__th gb-spreadsheet__th--sticky" rowSpan={2} style={{ minWidth: 200, maxWidth: 260, textTransform: "none", letterSpacing: "normal", verticalAlign: "bottom" }}>
                      <div className="gb-spreadsheet__student-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        STUDENT
                      </div>
                    </th>
                    {attSessions.map((s, i) => (
                      <th key={`${s.date}-${s.subject_id}-${i}`} className="gb-spreadsheet__th" style={{ minWidth: 110, textAlign: "center", padding: "0.5rem 0.625rem", borderBottom: "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.125rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ml-text)" }}>
                            {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ml-accent)", lineHeight: 1.2 }}>
                            {s.subject_name}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="gb-spreadsheet__th" style={{ minWidth: 72, textAlign: "center", background: "rgba(16, 163, 74, 0.06)", color: "#16a34a", verticalAlign: "bottom" }} rowSpan={2}>PRESENT</th>
                    <th className="gb-spreadsheet__th" style={{ minWidth: 72, textAlign: "center", background: "rgba(220, 38, 38, 0.06)", color: "#dc2626", verticalAlign: "bottom" }} rowSpan={2}>ABSENT</th>
                    <th className="gb-spreadsheet__th" style={{ minWidth: 80, textAlign: "center", verticalAlign: "bottom" }} rowSpan={2}>CLASS RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {attStudents.map(st => {
                    let present = 0;
                    let absent = 0;
                    for (const s of attSessions) {
                      const effective = getEffectiveStatus(st.student_id, s.date, s.subject_id, s.statuses[st.student_id]);
                      if (effective === "present") present++;
                      else if (effective === "absent") absent++;
                    }
                    const total = present + absent;
                    const rate = getRate(present, total);
                    return (
                      <tr key={st.student_id} className="gb-spreadsheet__row">
                        <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky">
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.0625rem" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.3 }}>{st.student_name}</span>
                            {st.lrn && <span style={{ fontSize: "0.6875rem", color: "var(--ml-text-muted)", lineHeight: 1.2 }}>LRN: {st.lrn}</span>}
                          </div>
                        </td>
                        {attSessions.map((s, i) => {
                          const cellVal = getCellDisplayValue(st.student_id, s.date, s.subject_id, s.statuses[st.student_id]);
                          const key = editKey(st.student_id, s.date, s.subject_id);
                          const isDirty = pendingEdits.has(key);
                          return (
                            <td key={`${s.date}-${s.subject_id}-${i}`} className="gb-spreadsheet__td" style={{ textAlign: "center", padding: "0.375rem" }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={cellVal}
                                onChange={(e) => handleEditCell(st.student_id, s.date, s.subject_id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={`att-cell-input${isDirty ? " att-cell-input--dirty" : ""}${cellVal === "1" ? " att-cell-input--present" : cellVal === "0" ? " att-cell-input--absent" : ""}`}
                              />
                            </td>
                          );
                        })}
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#16a34a", background: "rgba(16, 163, 74, 0.03)" }}>{present}</td>
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#dc2626", background: "rgba(220, 38, 38, 0.03)" }}>{absent}</td>
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: total > 0 ? rateColor(rate) : "var(--ml-text-muted)" }}>{total > 0 ? `${rate}%` : "\u2014"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="gb-spreadsheet__row" style={{ fontWeight: 700, background: "var(--ml-surface-alt)" }}>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 14h18M3 18h18M3 6h18" /></svg>
                        TOTAL
                      </div>
                    </td>
                    {attSessions.map((s, i) => {
                      let p = 0;
                      let a = 0;
                      for (const st of attStudents) {
                        const effective = getEffectiveStatus(st.student_id, s.date, s.subject_id, s.statuses[st.student_id]);
                        if (effective === "present") p++;
                        else if (effective === "absent") a++;
                      }
                      const recorded = p + a;
                      return (
                        <td key={`${s.date}-${s.subject_id}-${i}`} className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, padding: "0.5rem" }}>
                          {recorded > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.0625rem", lineHeight: 1.2 }}>
                              <span style={{ color: "#16a34a", fontSize: "0.75rem" }}>{p} Present</span>
                              <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>{a} Absent</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--ml-text-muted)", fontSize: "0.75rem" }}>&#8212;</span>
                          )}
                        </td>
                      );
                    })}
                    {(() => {
                      let tp = 0;
                      let ta = 0;
                      for (const st of attStudents) {
                        for (const sess of attSessions) {
                          const effective = getEffectiveStatus(st.student_id, sess.date, sess.subject_id, sess.statuses[st.student_id]);
                          if (effective === "present") tp++;
                          else if (effective === "absent") ta++;
                        }
                      }
                      const tt = tp + ta;
                      return (
                        <>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#16a34a", background: "rgba(16, 163, 74, 0.03)" }}>{tp}</td>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#dc2626", background: "rgba(220, 38, 38, 0.03)" }}>{ta}</td>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: tt > 0 ? rateColor(getRate(tp, tt)) : "var(--ml-text-muted)" }}>{tt > 0 ? `${getRate(tp, tt)}%` : "\u2014"}</td>
                        </>
                      );
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* Attendance History Tab */}
      {activeTab === "history" && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Subject</label>
              <select className="mgmt-input" value={histSubjectFilter} onChange={(e) => { setHistSubjectFilter(e.target.value); }} style={{ fontSize: "0.8rem" }}>
                <option value="">All Subjects</option>
                {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "130px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>From</label>
              <input type="date" className="mgmt-input" value={histDateFrom} onChange={(e) => { setHistDateFrom(e.target.value); }} style={{ fontSize: "0.8rem" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "130px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>To</label>
              <input type="date" className="mgmt-input" value={histDateTo} onChange={(e) => { setHistDateTo(e.target.value); }} style={{ fontSize: "0.8rem" }} />
            </div>
            <button className="mgmt-btn mgmt-btn--ghost" onClick={() => { setHistSubjectFilter(""); setHistDateFrom(""); setHistDateTo(""); }} style={{ fontSize: "0.8rem", padding: "0.375rem 0.75rem" }}>Clear Filters</button>
          </div>

          {spreadLoading ? <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading spreadsheet...</div>
          : spreadSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ml-text-muted)" strokeWidth="1.5" style={{ margin: "0 auto 1rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem", color: "var(--ml-text)" }}>No attendance records yet.</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>Create an attendance session to begin tracking student attendance.</p>
            </div>
          ) : spreadStudents.length === 0 ? (
            <div className="mgmt-empty" style={{ padding: "2rem" }}>No students enrolled in this class.</div>
          ) : (
            <div className="gb-spreadsheet" style={{ borderRadius: "0.75rem", border: "1px solid var(--ml-border)" }}>
              <table className="gb-spreadsheet__table">
                <thead>
                  <tr>
                    <th
                      className="gb-spreadsheet__th gb-spreadsheet__th--sticky"
                      rowSpan={2}
                      style={{ minWidth: 200, maxWidth: 260, textTransform: "none", letterSpacing: "normal", verticalAlign: "bottom" }}
                    >
                      <div className="gb-spreadsheet__student-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        STUDENT
                      </div>
                    </th>
                    {spreadSessions.map((s, i) => (
                      <th
                        key={`${s.date}-${s.subject_id}-${i}`}
                        className="gb-spreadsheet__th"
                        style={{
                          minWidth: 110,
                          textAlign: "center",
                          padding: "0.5rem 0.625rem",
                          borderBottom: "none",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.125rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ml-text)" }}>
                            {new Date(s.date.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--ml-accent)", lineHeight: 1.2 }}>
                            {s.subject_name}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th
                      className="gb-spreadsheet__th"
                      style={{ minWidth: 72, textAlign: "center", background: "rgba(16, 163, 74, 0.06)", color: "#16a34a", verticalAlign: "bottom" }}
                      rowSpan={2}
                    >
                      PRESENT
                    </th>
                    <th
                      className="gb-spreadsheet__th"
                      style={{ minWidth: 72, textAlign: "center", background: "rgba(220, 38, 38, 0.06)", color: "#dc2626", verticalAlign: "bottom" }}
                      rowSpan={2}
                    >
                      ABSENT
                    </th>
                    <th
                      className="gb-spreadsheet__th"
                      style={{ minWidth: 80, textAlign: "center", verticalAlign: "bottom" }}
                      rowSpan={2}
                    >
                      CLASS RATE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spreadStudents.map(st => {
                    let present = 0;
                    let absent = 0;
                    for (const s of spreadSessions) {
                      const status = s.statuses[st.student_id];
                      if (status === "present") present++;
                      else if (status === "absent") absent++;
                    }
                    const total = present + absent;
                    const rate = getRate(present, total);
                    return (
                      <tr key={st.student_id} className="gb-spreadsheet__row">
                        <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky">
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.0625rem" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.3 }}>{st.student_name}</span>
                            {st.lrn && <span style={{ fontSize: "0.6875rem", color: "var(--ml-text-muted)", lineHeight: 1.2 }}>LRN: {st.lrn}</span>}
                          </div>
                        </td>
                        {spreadSessions.map((s, i) => {
                          const status = s.statuses[st.student_id];
                          return (
                            <td key={`${s.date}-${s.subject_id}-${i}`} className="gb-spreadsheet__td" style={{ textAlign: "center" }}>
                              {status === "present" ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#166534", fontWeight: 600, fontSize: "0.8125rem" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: "#dcfce7", fontSize: "0.7rem", fontWeight: 700 }}>&#10003;</span>
                                  Present
                                </span>
                              ) : status === "absent" ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#991b1b", fontWeight: 600, fontSize: "0.8125rem" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: "#fef2f2", fontSize: "0.7rem", fontWeight: 700 }}>&#10007;</span>
                                  Absent
                                </span>
                              ) : (
                                <span style={{ color: "var(--ml-text-muted)", fontSize: "0.8125rem" }}>&#8212; Not Recorded</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#16a34a", background: "rgba(16, 163, 74, 0.03)" }}>
                          {present}
                        </td>
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#dc2626", background: "rgba(220, 38, 38, 0.03)" }}>
                          {absent}
                        </td>
                        <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: total > 0 ? rateColor(rate) : "var(--ml-text-muted)" }}>
                          {total > 0 ? `${rate}%` : "\u2014"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="gb-spreadsheet__row" style={{ fontWeight: 700, background: "var(--ml-surface-alt)" }}>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 14h18M3 18h18M3 6h18" /></svg>
                        TOTAL
                      </div>
                    </td>
                    {spreadSessions.map((s, i) => {
                      const p = Object.values(s.statuses).filter(v => v === "present").length;
                      const a = Object.values(s.statuses).filter(v => v === "absent").length;
                      const recorded = p + a;
                      return (
                        <td key={`${s.date}-${s.subject_id}-${i}`} className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, padding: "0.5rem" }}>
                          {recorded > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.0625rem", lineHeight: 1.2 }}>
                              <span style={{ color: "#16a34a", fontSize: "0.75rem" }}>{p} Present</span>
                              <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>{a} Absent</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--ml-text-muted)", fontSize: "0.75rem" }}>&#8212;</span>
                          )}
                        </td>
                      );
                    })}
                    {(() => {
                      let tp = 0;
                      let ta = 0;
                      for (const st of spreadStudents) {
                        for (const sess of spreadSessions) {
                          const status = sess.statuses[st.student_id];
                          if (status === "present") tp++;
                          else if (status === "absent") ta++;
                        }
                      }
                      const tt = tp + ta;
                      return (
                        <>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#16a34a", background: "rgba(16, 163, 74, 0.03)" }}>{tp}</td>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: "#dc2626", background: "rgba(220, 38, 38, 0.03)" }}>{ta}</td>
                          <td className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, color: tt > 0 ? rateColor(getRate(tp, tt)) : "var(--ml-text-muted)" }}>
                            {tt > 0 ? `${getRate(tp, tt)}%` : "\u2014"}
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Session Modal */}
      {showCreateModal && selectedClass && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "var(--ml-surface)", borderRadius: "1rem", border: "1px solid var(--ml-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: "100%", maxWidth: "480px", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Create Attendance</h2>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowCreateModal(false)} style={{ padding: "0.25rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "var(--ml-surface-alt)", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "var(--ml-text-muted)" }}>Class</span>
                <p style={{ margin: "0.25rem 0 0", fontWeight: 600, fontSize: "0.9375rem" }}>
                  {selectedClass.class_name}{selectedClass.section ? ` ${selectedClass.section}` : ""}{selectedClass.grade_level ? ` \u00b7 ${selectedClass.grade_level}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Subject</label>
                  <select className="mgmt-input" value={createSubjectId} onChange={(e) => setCreateSubjectId(e.target.value)} style={{ fontSize: "0.8rem" }}>
                    <option value="">Select subject</option>
                    {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Date</label>
                  <input type="date" className="mgmt-input" value={createDate} max={today} onChange={(e) => setCreateDate(e.target.value)} style={{ fontSize: "0.8rem" }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--ml-border)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowCreateModal(false)} style={{ fontSize: "0.8125rem" }}>Cancel</button>
              <button className="mgmt-btn mgmt-btn--primary" onClick={handleCreateSession} disabled={!createSubjectId} style={{ fontSize: "0.8125rem" }}>
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
