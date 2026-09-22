import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/client";

interface FacultyData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ModuleData {
  id: string;
  title: string;
  subject: string;
}

interface SubjectData {
  id: string;
  name: string;
}

interface ClassData {
  id: string;
  class_name: string;
  module_title: string;
  faculty_name: string;
  capacity: number | null;
}

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<FacultyData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const goToAttendanceReport = () => {
    navigate("/dashboard/attendance-report");
  };

  useEffect(() => {
    if (!user?.school_id) return;

    const fetchData = async () => {
      try {
        const [facultiesRes, studentsRes, modulesRes, subjectsRes, classesRes] = await Promise.all([
          apiClient.get<{ data: FacultyData[] }>(`/faculties/school/${user.school_id}`),
          apiClient.get<{ data: StudentData[] }>(`/students/school/${user.school_id}`),
          apiClient.get<{ data: ModuleData[] }>(`/modules/school/${user.school_id}`),
          apiClient.get<{ data: SubjectData[] }>(`/subjects/school/${user.school_id}`),
          apiClient.get<{ data: ClassData[] }>(`/classes/school/${user.school_id}`),
        ]);
        setFaculties(facultiesRes.data.data || []);
        setStudents(studentsRes.data.data || []);
        setModules(modulesRes.data.data || []);
        setSubjects(subjectsRes.data.data || []);
        setClasses(classesRes.data.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.school_id]);

  if (!user) return null;

  const showSetupPrompt = user.role === "school_admin" && user.academic_config_completed === false;

  return (
    <div className="dash-page">
      <div className="dash-welcome">
        <h1 className="dash-title">School Admin Dashboard</h1>
        <p className="dash-subtitle">
          Welcome back, <strong>{user.name}</strong>. Manage <strong>{user.school_name}</strong>.
        </p>
      </div>

      {showSetupPrompt && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          background: "rgba(13, 110, 253, 0.08)",
          border: "1px solid rgba(13, 110, 253, 0.2)",
          borderRadius: "0.75rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ml-accent)" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>Complete your academic configuration</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>
                Set up your academic system (quarter/semester) to enable grading periods and attendance tracking.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/settings"
            style={{
              padding: "0.5rem 1rem",
              background: "var(--ml-accent)",
              color: "white",
              borderRadius: "0.5rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Configure Now
          </a>
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-stat-card dash-stat-card--accent">
          <div className="dash-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <span className="dash-stat-label">Faculties</span>
          <span className="dash-stat-value">{loading ? "..." : faculties.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--green">
          <div className="dash-stat-icon dash-stat-icon--green">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <span className="dash-stat-label">Students</span>
          <span className="dash-stat-value">{loading ? "..." : students.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--purple">
          <div className="dash-stat-icon dash-stat-icon--purple">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="dash-stat-label">Modules</span>
          <span className="dash-stat-value">{loading ? "..." : modules.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--teal">
          <div className="dash-stat-icon dash-stat-icon--teal">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="dash-stat-label">Subjects</span>
          <span className="dash-stat-value">{loading ? "..." : subjects.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--orange">
          <div className="dash-stat-icon dash-stat-icon--orange">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="dash-stat-label">Classes</span>
          <span className="dash-stat-value">{loading ? "..." : classes.length}</span>
        </div>

        <div className="dash-stat-card dash-stat-card--teal" onClick={goToAttendanceReport} style={{ cursor: "pointer" }}>
          <div className="dash-stat-icon dash-stat-icon--teal">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="dash-stat-label">Attendance Report</span>
          <span className="dash-stat-value">View</span>
        </div>
      </div>

      <div className="dash-columns">
        <div className="dash-section">
          <h2 className="dash-section-title">Recent Faculties</h2>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : faculties.length === 0 ? (
            <div className="dash-empty"><p>No faculties yet.</p></div>
          ) : (
            <div className="dash-list">
              {faculties.slice(0, 5).map((f) => (
                <div key={f.id} className="dash-list-item">
                  <div className="dash-list-avatar">{f.first_name.charAt(0)}</div>
                  <div className="dash-list-info">
                    <span className="dash-list-name">{f.first_name} {f.last_name}</span>
                    <span className="dash-list-meta">{f.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-section">
          <h2 className="dash-section-title">Recent Students</h2>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : students.length === 0 ? (
            <div className="dash-empty"><p>No students yet.</p></div>
          ) : (
            <div className="dash-list">
              {students.slice(0, 5).map((s) => (
                <div key={s.id} className="dash-list-item">
                  <div className="dash-list-avatar dash-list-avatar--green">{s.first_name.charAt(0)}</div>
                  <div className="dash-list-info">
                    <span className="dash-list-name">{s.first_name} {s.last_name}</span>
                    <span className="dash-list-meta">{s.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-columns" style={{ marginTop: "1.5rem" }}>
        <div className="dash-section">
          <h2 className="dash-section-title">Recent Classes</h2>
          {loading ? (
            <div className="dash-loading">Loading...</div>
          ) : classes.length === 0 ? (
            <div className="dash-empty"><p>No classes yet.</p></div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Module</th>
                    <th>Adviser</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td className="dash-table-bold">{c.class_name}</td>
                      <td>{c.module_title}</td>
                      <td>{c.faculty_name}</td>
                      <td>{c.capacity ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
