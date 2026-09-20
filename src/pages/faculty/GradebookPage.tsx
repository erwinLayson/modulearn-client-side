import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { classApi, type FacultyClassAssignment } from "../../api/classes";
import { COLORS } from "../../constant/colors";

export default function GradebookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<FacultyClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await classApi.getAssignedClasses(user.id);
      setAssignments(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) return null;

  const totalSubjects = assignments.reduce((sum, a) => sum + a.subjects.length, 0);

  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Gradebook</h1>
          <p className="mgmt-subtitle">
            {loading ? "Loading..." : `${totalSubjects} subject${totalSubjects !== 1 ? "s" : ""} across ${assignments.length} class${assignments.length !== 1 ? "es" : ""}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="mgmt-empty">No classes assigned to you.</div>
      ) : (
        <div className="mgmt-card-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="mgmt-card mgmt-card--clickable"
              onClick={() => assignment.subjects.length > 0 && navigate(`/dashboard/gradebook/${assignment.id}/${assignment.subjects[0].id}`)}
            >
              <div className="mgmt-card-top mgmt-card-top--blue" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-header">
                  <div className="mgmt-card-icon" style={{ background: "rgba(13, 110, 253, 0.1)", color: COLORS.accent }}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mgmt-card-title">{assignment.class_name}</h3>
                    <div className="mgmt-card-badges">
                      {assignment.adviser_role && <span className="dash-badge dash-badge--info">Adviser</span>}
                      {assignment.grade_level && <span className="dash-badge dash-badge--active">{assignment.grade_level}</span>}
                      {assignment.section && <span className="dash-badge dash-badge--warning">Section {assignment.section}</span>}
                    </div>
                  </div>
                </div>
                <hr className="mgmt-card-divider" />
                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon"><svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></div>
                    <div className="mgmt-card-detail-content"><span className="mgmt-card-detail-label">Capacity</span><span className="mgmt-card-detail-value">{assignment.capacity ?? "\u2014"}</span></div>
                  </div>
                </div>
                {assignment.subjects.length > 0 && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--ml-border)" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)", margin: "0 0 0.5rem" }}>Subjects ({assignment.subjects.length})</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {assignment.subjects.map(subject => (
                        <span
                          key={subject.id}
                          className="dash-badge dash-badge--completed"
                          style={{ fontSize: "0.7rem", cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/gradebook/${assignment.id}/${subject.id}`); }}
                        >
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
