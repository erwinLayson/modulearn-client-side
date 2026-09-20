import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { classApi, type ClassListItem, type ScheduleItem, type FacultyClassAssignment } from "../api/classes";
import { enrollmentApi, type EnrollmentListItem } from "../api/enrollments";
import { schoolYearApi } from "../api/school-years";
import Toast from "../components/Toast";
import { COLORS } from "../constant/colors";

type ToastState = { message: string; type: "success" | "error" } | null;
type UserRole = "school_admin" | "faculty" | "student";

interface ClassesPageProps {
  role: UserRole;
}

interface EnrollmentClass {
  class_id: string;
  class_name: string;
  subjects: { id: string; name: string }[];
}

interface StudentClassDetail {
  id: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  capacity: number | null;
  faculty_name: string | null;
  schedule: ScheduleItem[] | null;
  subjects: { id: string; name: string; teacher_name: string | null }[];
}

export default function ClassesPage({ role }: ClassesPageProps) {
  const { user } = useAuth();
  const isSchoolAdmin = role === "school_admin";
  const isFaculty = role === "faculty";
  const isStudent = role === "student";

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<FacultyClassAssignment[]>([]);
  const [enrollmentClasses, setEnrollmentClasses] = useState<EnrollmentClass[]>([]);
  const [studentClassDetails, setStudentClassDetails] = useState<Record<string, StudentClassDetail>>({});
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(null);
  const [classEnrollments, setClassEnrollments] = useState<EnrollmentListItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      if (isStudent) {
        const { data } = await enrollmentApi.getClassesByStudentId(user.id);
        const classesData = data.data || [];
        setEnrollmentClasses(classesData);
        const details: Record<string, StudentClassDetail> = {};
        for (const ec of classesData) {
          try {
            const classRes = await classApi.getById(ec.class_id);
            const cls = classRes.data.data;
            let subjectsWithTeachers: { id: string; name: string; teacher_name: string | null }[] = [];
            try {
              const facultiesRes = await classApi.getFaculties(ec.class_id);
              subjectsWithTeachers = (facultiesRes.data.data || []).map(f => ({
                id: f.subject_id || f.id,
                name: f.subject_name || "Unknown Subject",
                teacher_name: `${f.first_name} ${f.last_name}`,
              }));
            } catch {
              subjectsWithTeachers = ec.subjects?.map(s => ({ id: s.id, name: s.name, teacher_name: null })) || [];
            }
            details[ec.class_id] = {
              id: cls.id, class_name: cls.class_name, grade_level: cls.grade_level,
              section: cls.section, capacity: cls.capacity, faculty_name: cls.faculty_name,
              schedule: cls.schedule, subjects: subjectsWithTeachers,
            };
          } catch {
            details[ec.class_id] = {
              id: ec.class_id, class_name: ec.class_name, grade_level: null, section: null,
              capacity: null, faculty_name: null, schedule: null,
              subjects: ec.subjects?.map(s => ({ id: s.id, name: s.name, teacher_name: null })) || [],
            };
          }
        }
        setStudentClassDetails(details);
      } else {
        const schoolId = user.school_id ?? 0;
        const { data } = await classApi.getBySchoolId(schoolId);
        const allClasses = data.data || [];
        if (isFaculty) {
          setClasses(allClasses.filter((c: ClassListItem) => c.faculty_id === user.id));
          try {
            const assignedRes = await classApi.getAssignedClasses(user.id);
            setAssignedClasses(assignedRes.data.data || []);
          } catch { setAssignedClasses([]); }
        } else {
          setClasses(allClasses);
        }
      }
    } catch {
      setToast({ message: "Failed to load classes", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [user, isFaculty, isStudent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedClass || !user) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const schoolId = user.school_id ?? 0;
        const syRes = await schoolYearApi.getCurrent(schoolId);
        const current = syRes.data.data;
        if (cancelled) return;
        if (!current) { setClassEnrollments([]); return; }
        const res = await enrollmentApi.getByClassAndSchoolYear(selectedClass.id, current.id);
        if (!cancelled) setClassEnrollments(res.data.data || []);
      } catch {
        if (!cancelled) setToast({ message: "Failed to load class details", type: "error" });
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClass, user]);

  const handleClassClick = useCallback((cls: ClassListItem) => {
    setSelectedClass(cls);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedClass(null);
    setClassEnrollments([]);
  }, []);

  const formatSchedule = (schedule: ClassListItem["schedule"]) => {
    if (!Array.isArray(schedule) || schedule.length === 0) return "\u2014";
    return schedule.map((s: { day: string; start_time: string; end_time: string; room?: string }) =>
      `${s.day} ${s.start_time}-${s.end_time}${s.room ? ` ${s.room}` : ""}`
    ).join("; ");
  };

  const facultyCardList = (() => {
    const map = new Map<string, { key: string; cls: ClassListItem; advisory: boolean; subjects: string[] }>();
    for (const c of classes) map.set(c.id, { key: c.id, cls: c, advisory: true, subjects: [] });
    for (const a of assignedClasses) {
      const existing = map.get(a.id);
      const subjects = (a.subjects || []).map(s => s.name);
      if (existing) { existing.subjects = subjects; }
      else {
        map.set(a.id, { key: `taught-${a.id}`, cls: {
          id: a.id, class_name: a.class_name, module_id: "", module_title: "",
          faculty_id: a.faculty_id, faculty_name: a.faculty_name, school_id: a.school_id,
          capacity: a.capacity, section: a.section, grade_level: a.grade_level,
          schedule: a.schedule, created_at: a.created_at,
        }, advisory: false, subjects });
      }
    }
    return Array.from(map.values());
  })();

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">{isSchoolAdmin ? "Classes" : "My Classes"}</h1>
          <p className="mgmt-subtitle">{isSchoolAdmin ? "Manage classrooms for your school." : "View your assigned classes."}</p>
        </div>
      </div>

      {isFaculty && selectedClass ? (
        <div className="mgmt-detail-panel">
          <div className="mgmt-detail-header">
            <div className="mgmt-detail-header-main" style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={closeDetail} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back
              </button>
              <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 className="mgmt-detail-title" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedClass.class_name}
                </h2>
                <p className="mgmt-subtitle" style={{ margin: 0 }}>
                  {[selectedClass.grade_level || null, selectedClass.section ? `Section ${selectedClass.section}` : null].filter(Boolean).join(" \u00b7 ") || "Class details"}
                </p>
              </div>
            </div>
          </div>

          <div className="mgmt-detail-info" style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Grade Level</span>
                <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedClass.grade_level || "\u2014"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Section</span>
                <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedClass.section || "\u2014"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Capacity</span>
                <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedClass.capacity ?? "\u2014"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Adviser</span>
                <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedClass.faculty_name || "\u2014"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Schedule</span>
                <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)", fontSize: "0.875rem" }}>{formatSchedule(selectedClass.schedule)}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", minWidth: 0 }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--ml-text)" }}>
              Enrolled Students ({classEnrollments.length})
            </h3>

            {detailLoading ? (
              <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading students...</div>
            ) : classEnrollments.length === 0 ? (
              <div className="mgmt-empty" style={{ padding: "2rem" }}>No students enrolled in this class.</div>
            ) : (
              <div className="mgmt-table-wrap">
                <table className="mgmt-table mgmt-table--compact">
                  <thead><tr><th>Student Name</th><th>Email</th><th>Status</th><th>Enrolled</th></tr></thead>
                  <tbody>
                    {classEnrollments.map(e => (
                      <tr key={e.id}>
                        <td className="mgmt-table-bold">{e.student_name}</td>
                        <td>{e.student_email}</td>
                        <td><span className={`dash-badge dash-badge--${e.status}`}>{e.status.charAt(0).toUpperCase() + e.status.slice(1)}</span></td>
                        <td>{new Date(e.enrolled_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {loading ? <div className="mgmt-loading">Loading...</div>
          : isStudent ? (
            enrollmentClasses.length === 0 ? <div className="mgmt-empty">You are not enrolled in any classes yet.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {enrollmentClasses.map(ec => {
                  const detail = studentClassDetails[ec.class_id];
                  return (
                    <div key={ec.class_id} className="mgmt-detail-panel">
                      <div className="mgmt-detail-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                          <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h2 className="mgmt-detail-title" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ec.class_name}</h2>
                            <p className="mgmt-subtitle" style={{ margin: 0 }}>
                              {detail && [detail.grade_level || null, detail.section ? `Section ${detail.section}` : null].filter(Boolean).join(" \u00b7 ") || "Class details"}
                            </p>
                          </div>
                        </div>
                        {detail?.faculty_name && <span className="dash-badge dash-badge--info" style={{ flexShrink: 0 }}>Adviser: {detail.faculty_name}</span>}
                      </div>
                      <div style={{ padding: "1.25rem 1.5rem", borderBottom: detail && detail.subjects.length > 0 ? "1px solid var(--ml-border)" : undefined }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                          <div><span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Grade Level</span><p style={{ margin: "0.25rem 0 0" }}>{detail?.grade_level || "\u2014"}</p></div>
                          <div><span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Section</span><p style={{ margin: "0.25rem 0 0" }}>{detail?.section || "\u2014"}</p></div>
                          <div><span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Capacity</span><p style={{ margin: "0.25rem 0 0" }}>{detail?.capacity ?? "\u2014"}</p></div>
                          <div><span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Adviser</span><p style={{ margin: "0.25rem 0 0" }}>{detail?.faculty_name || "\u2014"}</p></div>
                          <div><span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Schedule</span><p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>{detail ? formatSchedule(detail.schedule) : "\u2014"}</p></div>
                        </div>
                      </div>
                      {detail && detail.subjects.length > 0 && (
                        <div style={{ padding: "1.25rem 1.5rem" }}>
                          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-primary)", margin: "0 0 1rem" }}>Subjects ({detail.subjects.length})</h3>
                          <div className="mgmt-table-wrap">
                            <table className="mgmt-table mgmt-table--compact">
                              <thead><tr><th>Subject</th><th>Teacher</th></tr></thead>
                              <tbody>{detail.subjects.map(s => <tr key={s.id}><td className="mgmt-table-bold">{s.name}</td><td>{s.teacher_name || "\u2014"}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )
          : classes.length === 0 && assignedClasses.length === 0 ? (
            <div className="mgmt-empty">{isSchoolAdmin ? "No classes yet." : "No classes assigned to you."}</div>
          )
          : isFaculty ? (
            <div className="mgmt-card-grid">
              {facultyCardList.map(item => (
                <div key={item.key} className="mgmt-card mgmt-card--clickable" onClick={() => handleClassClick(item.cls)}>
                  <div className="mgmt-card-top mgmt-card-top--blue" />
                  <div className="mgmt-card-body">
                    <div className="mgmt-card-header">
                      <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mgmt-card-title">{item.cls.class_name}</h3>
                        <div className="mgmt-card-badges">
                          {item.advisory && <span className="dash-badge dash-badge--info">Adviser</span>}
                          {item.cls.grade_level && <span className="dash-badge dash-badge--active">{item.cls.grade_level}</span>}
                          {item.cls.section && <span className="dash-badge dash-badge--warning">Section {item.cls.section}</span>}
                        </div>
                      </div>
                    </div>
                    <hr className="mgmt-card-divider" />
                    <div className="mgmt-card-details">
                      <div className="mgmt-card-detail">
                        <div className="mgmt-card-detail-icon"><svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></div>
                        <div className="mgmt-card-detail-content"><span className="mgmt-card-detail-label">Capacity</span><span className="mgmt-card-detail-value">{item.cls.capacity ?? "\u2014"}</span></div>
                      </div>
                      <div className="mgmt-card-detail">
                        <div className="mgmt-card-detail-icon"><svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <div className="mgmt-card-detail-content"><span className="mgmt-card-detail-label">Schedule</span><span className="mgmt-card-detail-value mgmt-card-detail-value--small">{formatSchedule(item.cls.schedule)}</span></div>
                      </div>
                    </div>
                    {item.subjects.length > 0 && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--ml-border)" }}>
                        <h4 style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)", margin: "0 0 0.5rem" }}>Teaching</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                          {item.subjects.map(name => <span key={name} className="dash-badge dash-badge--completed" style={{ fontSize: "0.7rem" }}>{name}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mgmt-table-wrap">
              <table className="mgmt-table mgmt-table--compact">
                <thead><tr><th>Class Name</th><th>Grade</th><th>Adviser</th><th>Section</th><th>Capacity</th><th>Schedule</th></tr></thead>
                <tbody>
                  {classes.map((c: ClassListItem) => (
                    <tr key={c.id}>
                      <td className="mgmt-table-bold">{c.class_name}</td>
                      <td>{c.grade_level || "\u2014"}</td>
                      <td>{c.faculty_name || "\u2014"}</td>
                      <td>{c.section || "\u2014"}</td>
                      <td>{c.capacity ?? "\u2014"}</td>
                      <td className="mgmt-table-address mgmt-table-address--wrap">{formatSchedule(c.schedule)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
