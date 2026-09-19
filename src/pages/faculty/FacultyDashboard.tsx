import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceApi, type FacultyDashboardSummary } from "../../api/classes";
import apiClient from "../../api/client";

interface ModuleData {
  id: string;
  title: string;
  subject: string;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
}

interface ClassData {
  id: string;
  class_name: string;
  module_id: string;
  faculty_id: string;
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceSummary, setAttendanceSummary] = useState<FacultyDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    if (!user?.school_id) return;

    const fetchData = async () => {
      try {
        const [classesRes, modulesRes, studentsRes, summaryRes] = await Promise.all([
          apiClient.get<{ data: ClassData[] }>(`/classes/faculty/${user.id}`),
          apiClient.get<{ data: ModuleData[] }>(`/modules/school/${user.school_id}`),
          apiClient.get<{ data: StudentData[] }>(`/students/school/${user.school_id}`),
          attendanceApi.getFacultySummary(),
        ]);
        setClasses(classesRes.data.data || []);
        setModules(modulesRes.data.data || []);
        setStudents(studentsRes.data.data || []);
        setAttendanceSummary(summaryRes.data.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setSummaryLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.school_id]);

  if (!user) return null;

  return (
    <div className="dash-page">
      <div className="dash-welcome">
        <h1 className="dash-title">Faculty Dashboard</h1>
        <p className="dash-subtitle">
          Welcome back, <strong>{user.name}</strong>. Here is your teaching overview.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-stat-card dash-stat-card--accent">
          <div className="dash-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.243 1.007-2.25 2.25-2.25h13.5" />
            </svg>
          </div>
          <span className="dash-stat-label">My Classes</span>
          <span className="dash-stat-value">{loading ? "..." : classes.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--green">
          <div className="dash-stat-icon dash-stat-icon--green">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="dash-stat-label">Modules</span>
          <span className="dash-stat-value">{loading ? "..." : modules.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--purple">
          <div className="dash-stat-icon dash-stat-icon--purple">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <span className="dash-stat-label">Students</span>
          <span className="dash-stat-value">{loading ? "..." : students.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--orange">
          <div className="dash-stat-icon dash-stat-icon--orange">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <span className="dash-stat-label">Reports</span>
          <span className="dash-stat-value">{loading ? "..." : "--"}</span>
        </div>
      </div>

      {/* Attendance Summary Section */}
      <div className="dash-section" style={{ marginTop: "1.5rem" }}>
        <h2 className="dash-section-title">Today's Attendance</h2>
        {summaryLoading ? (
          <div className="dash-loading">Loading attendance summary...</div>
        ) : attendanceSummary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="dash-stat-card dash-stat-card--accent" style={{ padding: "1rem" }}>
              <div className="dash-stat-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="dash-stat-label">Recorded</span>
              <span className="dash-stat-value">{attendanceSummary.today.classes_with_attendance}</span>
            </div>
            <div className="dash-stat-card dash-stat-card--warning" style={{ padding: "1rem" }}>
              <div className="dash-stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a11.1 11.1 0 11-5.5 1.5 3.75 3.75 0 017.029 2.917M12 9l-3 3m0 0l-3-3m3 3V21" />
                </svg>
              </div>
              <span className="dash-stat-label">Pending</span>
              <span className="dash-stat-value">{attendanceSummary.today.classes_pending}</span>
            </div>
            <div className="dash-stat-card dash-stat-card--green" style={{ padding: "1rem" }}>
              <div className="dash-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5L12 12m0 0l7.5-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="dash-stat-label">Total Classes</span>
              <span className="dash-stat-value">{attendanceSummary.today.total_classes_today}</span>
            </div>
          </div>
        ) : (
          <div className="dash-empty"><p>Unable to load attendance summary.</p></div>
        )}
      </div>

      {/* This Week Summary */}
      <div className="dash-section" style={{ marginTop: "1.5rem" }}>
        <h2 className="dash-section-title">This Week</h2>
        {summaryLoading ? (
          <div className="dash-loading">Loading...</div>
        ) : attendanceSummary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div className="dash-stat-card" style={{ padding: "1rem", borderLeft: "4px solid #2563eb" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Sessions</span>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--ml-text)" }}>{attendanceSummary.this_week.total_sessions}</p>
            </div>
            <div className="dash-stat-card" style={{ padding: "1rem", borderLeft: "4px solid #10b981" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Present</span>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{attendanceSummary.this_week.total_present}</p>
            </div>
            <div className="dash-stat-card" style={{ padding: "1rem", borderLeft: "4px solid #ef4444" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Absent</span>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{attendanceSummary.this_week.total_absent}</p>
            </div>
            <div className="dash-stat-card" style={{ padding: "1rem", borderLeft: "4px solid #2563eb" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Attendance Rate</span>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#2563eb" }}>{attendanceSummary.this_week.attendance_rate}%</p>
            </div>
          </div>
        ) : (
          <div className="dash-empty"><p>Unable to load weekly summary.</p></div>
        )}
      </div>

      <div className="dash-columns">
        <div className="dash-section">
          <h2 className="dash-section-title">My Classes</h2>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : classes.length === 0 ? (
            <div className="dash-empty"><p>No classes assigned yet.</p></div>
          ) : (
            <div className="dash-list">
              {classes.map((cls) => (
                <div key={cls.id} className="dash-list-item">
                  <div className="dash-list-avatar">{cls.class_name.charAt(0)}</div>
                  <div className="dash-list-info">
                    <span className="dash-list-name">{cls.class_name}</span>
                    <span className="dash-list-meta">Class ID: {cls.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-section">
          <h2 className="dash-section-title">Available Modules</h2>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : modules.length === 0 ? (
            <div className="dash-empty"><p>No modules available.</p></div>
          ) : (
            <div className="dash-list">
              {modules.slice(0, 5).map((m) => (
                <div key={m.id} className="dash-list-item">
                  <div className="dash-list-avatar dash-list-avatar--purple">{m.title.charAt(0)}</div>
                  <div className="dash-list-info">
                    <span className="dash-list-name">{m.title}</span>
                    <span className="dash-list-meta">{m.subject}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}