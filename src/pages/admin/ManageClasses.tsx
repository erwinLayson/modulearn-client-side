import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { classApi, type ClassListItem } from "../../api/classes";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageClasses() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const fetchClasses = useCallback(async () => {
    try {
      const { data } = await classApi.getAll();
      setClasses(data.data || []);
    } catch {
      setToast({ message: "Failed to load classes", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Classes</h1>
          <p className="mgmt-subtitle">{isSuperAdmin ? "Manage all platform classes." : "View classes."}</p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="mgmt-empty">No classes registered yet.</div>
      ) : (
        <div className="mgmt-card-grid">
          {classes.map((c) => (
            <div key={c.id} className="mgmt-card">
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
                    </div>
                  </div>
                </div>

                <hr className="mgmt-card-divider" />

                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">School</span>
                      <span className="mgmt-card-detail-value">{c.school_name || `School #${c.school_id}`}</span>
                    </div>
                  </div>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}