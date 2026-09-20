import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import Toast from "../../components/Toast";
import { COLORS } from "../../constant/colors";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageSubjectsAdmin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await subjectApi.getAll();
      setSubjects(data.data || []);
    } catch {
      setToast({ message: "Failed to load subjects", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Subjects</h1>
          <p className="mgmt-subtitle">{isSuperAdmin ? "View all subjects across all schools." : "View subjects."}</p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="mgmt-empty">No subjects registered yet.</div>
      ) : (
        <div className="mgmt-card-grid">
          {subjects.map((s) => (
            <div key={s.id} className="mgmt-card">
              <div className="mgmt-card-top mgmt-card-top--green" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-header">
                  <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mgmt-card-title">{s.name}</h3>
                    <div className="mgmt-card-badges">
                      {s.subject_code && <span className="dash-badge dash-badge--active">{s.subject_code}</span>}
                      <span className="dash-badge dash-badge--warning">School #{s.school_id}</span>
                    </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}