import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { enrollmentApi, type StudentEnrollment } from "../../api/enrollments";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { attendanceApi, type StudentSubjectAttendance, type StudentAttendanceDetail } from "../../api/classes";
import { COLORS } from "../../constant/colors";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [currentSY, setCurrentSY] = useState<SchoolYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceBySubject, setAttendanceBySubject] = useState<StudentSubjectAttendance[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<Record<string, { data: StudentAttendanceDetail[]; total: number; loading: boolean }>>({});

  useEffect(() => {
    if (!user?.id || !user?.school_id) return;

    const fetchData = async () => {
      try {
        const syRes = await schoolYearApi.getCurrent(user.school_id!);
        const sy = syRes.data.data;
        setCurrentSY(sy);

        if (sy) {
          const [enrollRes, attendanceRes] = await Promise.all([
            enrollmentApi.getByStudentAndSchoolYear(user.id, sy.id),
            attendanceApi.getStudentBySubject(sy.id),
          ]);
          setEnrollment(enrollRes.data.data);
          setAttendanceBySubject(attendanceRes.data.data || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setAttendanceLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.school_id]);

  const fetchAttendanceDetail = async (subjectId: string, classId: string) => {
    if (attendanceDetails[subjectId]) return;
    setAttendanceDetails(prev => ({ ...prev, [subjectId]: { data: [], total: 0, loading: true } }));
    try {
      const res = await attendanceApi.getStudentDetail(classId, subjectId);
      const paginated = res.data.data;
      setAttendanceDetails(prev => ({ ...prev, [subjectId]: { data: paginated.data, total: paginated.total, loading: false } }));
    } catch {
      setAttendanceDetails(prev => ({ ...prev, [subjectId]: { data: [], total: 0, loading: false } }));
    }
  };

  const toggleSubject = (subjectId: string, classId: string) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      fetchAttendanceDetail(subjectId, classId);
    }
  };

  if (!user) return null;

  const subjects = enrollment?.subjects || [];
  const schedule = Array.isArray(enrollment?.schedule) ? enrollment!.schedule : [];

  return (
    <div className="dash-page">
      <div className="dash-welcome">
        <h1 className="dash-title">Student Dashboard</h1>
        <p className="dash-subtitle">
          Welcome back, <strong>{user.name}</strong>.
          {currentSY && <span> School Year: <strong>{currentSY.name}</strong></span>}
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-stat-card dash-stat-card--accent">
          <div className="dash-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="dash-stat-label">My Class</span>
          <span className="dash-stat-value">{loading ? "..." : enrollment ? enrollment.class_name : "—"}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--green">
          <div className="dash-stat-icon dash-stat-icon--green">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <span className="dash-stat-label">Subjects</span>
          <span className="dash-stat-value">{loading ? "..." : subjects.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--purple">
          <div className="dash-stat-icon dash-stat-icon--purple">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <span className="dash-stat-label">Adviser</span>
          <span className="dash-stat-value" style={{ fontSize: "0.875rem" }}>{loading ? "..." : enrollment?.adviser_name || "—"}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--orange">
          <div className="dash-stat-icon dash-stat-icon--orange">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <span className="dash-stat-label">Status</span>
          <span className="dash-stat-value" style={{ fontSize: "0.875rem" }}>
            {loading ? "..." : enrollment ? (
              <span className={`dash-badge dash-badge--${enrollment.status}`}>{enrollment.status}</span>
            ) : "—"}
          </span>
        </div>
      </div>

      {/* Attendance by Subject Section */}
      <div className="dash-section" style={{ marginTop: "1.5rem" }}>
        <h2 className="dash-section-title">Attendance by Subject</h2>
        {attendanceLoading ? (
          <div className="dash-loading">Loading attendance...</div>
        ) : attendanceBySubject.length === 0 ? (
          <div className="dash-empty"><p>No attendance records yet.</p></div>
        ) : (
          <div className="mgmt-card-grid">
            {attendanceBySubject.map((subject) => {
              const detail = attendanceDetails[subject.subject_id];
              const isExpanded = expandedSubject === subject.subject_id;
              return (
                <div key={subject.subject_id} className="mgmt-card">
                  <div className="mgmt-card-top mgmt-card-top--blue" />
                  <div className="mgmt-card-body">
                    <div className="mgmt-card-header">
                      <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mgmt-card-title">{subject.subject_name}</h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>
                          {subject.class_name} • {subject.teacher_name}
                        </span>
                      </div>
                    </div>

                    <hr className="mgmt-card-divider" />

                    <div className="mgmt-card-details" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                      <div className="mgmt-card-detail">
                        <span className="mgmt-card-detail-label">Total</span>
                        <span className="mgmt-card-detail-value">{subject.total_sessions}</span>
                      </div>
                      <div className="mgmt-card-detail">
                        <span className="mgmt-card-detail-label">Present</span>
                        <span className="mgmt-card-detail-value" style={{ color: COLORS.present }}>{subject.present_count}</span>
                      </div>
                      <div className="mgmt-card-detail">
                        <span className="mgmt-card-detail-label">Absent</span>
                        <span className="mgmt-card-detail-value" style={{ color: COLORS.error }}>{subject.absent_count}</span>
                      </div>
                      <div className="mgmt-card-detail">
                        <span className="mgmt-card-detail-label">Rate</span>
                        <span className="mgmt-card-detail-value" style={{ color: subject.attendance_rate >= 75 ? COLORS.present : subject.attendance_rate >= 50 ? COLORS.warning : COLORS.error }}>
                          {subject.attendance_rate}%
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSubject(subject.subject_id, subject.class_id)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        color: "var(--ml-primary)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        padding: "0.5rem 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {isExpanded ? "Hide Details" : "Show Details"}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--ml-border)" }}>
                        {detail?.loading ? (
                          <div className="dash-loading">Loading details...</div>
                        ) : detail && detail.data.length === 0 ? (
                          <div className="dash-empty" style={{ padding: "1rem" }}>No attendance records for this subject.</div>
                        ) : detail ? (
                          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                            <table className="mgmt-table mgmt-table--compact" style={{ fontSize: "0.75rem" }}>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th>Recorded At</th>
                                  <th>Marked By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.data.map((record) => (
                                  <tr key={`${record.attendance_date}-${record.status}`}>
                                    <td>{new Date(record.attendance_date).toLocaleDateString()}</td>
                                    <td>
                                      <span className={`dash-badge dash-badge--${record.status === "present" ? "success" : "error"}`}>
                                        {record.status}
                                      </span>
                                    </td>
                                    <td>{new Date(record.recorded_at).toLocaleString()}</td>
                                    <td>{record.teacher_name}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subjects Section */}
      <div className="dash-section">
        <h2 className="dash-section-title">My Subjects</h2>
        {loading ? (
          <div className="dash-loading">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="dash-empty"><p>No subjects assigned yet.</p></div>
        ) : (
          <div className="mgmt-card-grid">
            {subjects.map(s => (
              <div key={s.id} className="mgmt-card">
                <div className="mgmt-card-top mgmt-card-top--blue" />
                <div className="mgmt-card-body">
                  <div className="mgmt-card-header">
                    <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="mgmt-card-title">{s.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>
                        {s.teacher_name || "No teacher assigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Section */}
      {schedule.length > 0 && (
        <div className="dash-section">
          <h2 className="dash-section-title">Schedule</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {schedule.map((s, i) => (
              <span key={i} className="mgmt-schedule-chip">
                <strong>{s.day}</strong> {s.start_time}-{s.end_time}
                {s.room && ` (${s.room})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}