import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { schoolApi, type SchoolListItem } from "../../api/schools";
import { classApi, type ClassListItem } from "../../api/classes";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import Toast from "../../components/Toast";

const SCHOOL_LEVELS = ["", "Elementary", "Junior High", "Senior High", "College"];
type DetailTab = "classes" | "subjects";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function ManageSchools() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolListItem | null>(null);
  const [detailClasses, setDetailClasses] = useState<ClassListItem[]>([]);
  const [detailSubjects, setDetailSubjects] = useState<SubjectListItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("classes");
  const dismissToast = useCallback(() => setToast(null), []);

  const fetchSchools = useCallback(async () => {
    try {
      const { data } = await schoolApi.getAll();
      setSchools(data.data || []);
    } catch {
      setToast({ message: "Failed to load schools", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const closeDetail = useCallback(() => {
    setSelectedSchool(null);
    setDetailClasses([]);
    setDetailSubjects([]);
    setDetailTab("classes");
  }, []);

  const handleSchoolClick = useCallback(async (school: SchoolListItem) => {
    setSelectedSchool(school);
    setDetailTab("classes");
    setDetailClasses([]);
    setDetailSubjects([]);
  }, []);

  useEffect(() => {
    if (!selectedSchool) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          classApi.getBySchoolId(selectedSchool.school_id),
          subjectApi.getBySchoolId(selectedSchool.school_id),
        ]);
        if (cancelled) return;
        setDetailClasses(classesRes.data.data || []);
        setDetailSubjects(subjectsRes.data.data || []);
      } catch {
        if (!cancelled) setToast({ message: "Failed to load school details", type: "error" });
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSchool]);

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Schools</h1>
          <p className="mgmt-subtitle">{isSuperAdmin ? "Manage all registered schools." : "View schools."}</p>
        </div>
      </div>

      {!selectedSchool && (loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : schools.length === 0 ? (
        <div className="mgmt-empty">No schools registered yet.{isSuperAdmin ? " Add one to get started." : ""}</div>
      ) : (
        <div className="mgmt-card-grid">
          {schools.map((s) => (
            <div
              key={s.id}
              className="mgmt-card mgmt-card--clickable"
              onClick={() => handleSchoolClick(s)}
            >
              <div className="mgmt-card-top mgmt-card-top--blue" />
              <div className="mgmt-card-body">
                <div className="mgmt-card-header">
                  <div 
                    className="mgmt-card-icon" 
                    style={{ 
                      background: s.school_logo 
                        ? `url("${s.school_logo}") center/cover` 
                        : 'rgba(22, 132, 91, 0.1)',
                      color: s.school_logo ? 'transparent' : 'var(--ml-accent)'
                    }}
                  >
                    {!s.school_logo && (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "1.5rem", height: "1.5rem" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="mgmt-card-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.school_name}
                    </h3>
                    <div className="mgmt-card-badges">
                      <span className="dash-badge dash-badge--active">
                        {["", "Elementary", "Junior High", "Senior High", "College"][s.school_level] || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <hr className="mgmt-card-divider" />
                
                <div className="mgmt-card-details">
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9l9-7 9 7v10.5a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 013.75 19.5V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 9a28.298 28.298 0 0119.5 0M12 12a2.25 2.25 0 000 4.5" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">School ID</span>
                      <span className="mgmt-card-detail-value">{s.school_id}</span>
                    </div>
                  </div>
                  
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.5a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 00-1.07 1.917V19.5a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 19.5V9a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 003 6.75v.243" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Email</span>
                      <span className="mgmt-card-detail-value mgmt-card-detail-value--small">{s.school_email}</span>
                    </div>
                  </div>
                  
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Contact</span>
                      <span className="mgmt-card-detail-value">{s.contact_number || "-"}</span>
                    </div>
                  </div>
                  
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A2.25 2.25 0 0118 21h-2a2.25 2.25 0 01-1.59-.586l-4.243-4.243a12.06 12.06 0 01-1.514-3.725m1.514 3.725L12 15.75l-4.243 4.243a2.25 2.25 0 01-3.182 0 2.25 2.25 0 010-3.182l4.243-4.243M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Address</span>
                      <span className="mgmt-card-detail-value mgmt-card-detail-value--small">{s.address}, {s.city}, {s.province}, {s.region}</span>
                    </div>
                  </div>
                  
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Admin</span>
                      <span className="mgmt-card-detail-value">{s.school_admin || "-"}</span>
                    </div>
                  </div>
                  
                  <div className="mgmt-card-detail">
                    <div className="mgmt-card-detail-icon">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div className="mgmt-card-detail-content">
                      <span className="mgmt-card-detail-label">Registered</span>
                      <span className="mgmt-card-detail-value">{new Date(s.registered_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {isSuperAdmin && (
                  <div className="mgmt-card-footer" style={{ justifyContent: "flex-end" }}>
                    <button className="mgmt-btn mgmt-btn--ghost mgmt-action mgmt-action--edit" disabled>Edit</button>
                    <button className="mgmt-btn mgmt-btn--ghost mgmt-action mgmt-action--delete" disabled>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

        {selectedSchool && (
          <div className="mgmt-detail-panel">
            <div className="mgmt-detail-header">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                <button
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={closeDetail}
                  aria-label="Back to schools"
                  style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div
                  className="mgmt-card-icon"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    flexShrink: 0,
                    background: selectedSchool.school_logo
                      ? `url("${selectedSchool.school_logo}") center/cover`
                      : "rgba(22, 132, 91, 0.1)",
                    color: selectedSchool.school_logo ? "transparent" : "var(--ml-accent)",
                  }}
                >
                  {!selectedSchool.school_logo && (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "1.75rem", height: "1.75rem" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 className="mgmt-detail-title" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedSchool.school_name}
                  </h2>
                  <p className="mgmt-subtitle" style={{ margin: 0 }}>
                    <span className="dash-badge dash-badge--active" style={{ marginRight: "0.5rem" }}>
                      {SCHOOL_LEVELS[selectedSchool.school_level] || "N/A"}
                    </span>
                    School ID: {selectedSchool.school_id}
                  </p>
                </div>
              </div>
              <button className="mgmt-modal-close" onClick={closeDetail} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* School Info Section */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedSchool.school_email}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Contact</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedSchool.contact_number || "—"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Admin</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{selectedSchool.school_admin || "—"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Address</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)", fontSize: "0.875rem" }}>
                    {selectedSchool.address}, {selectedSchool.city}, {selectedSchool.province}, {selectedSchool.region}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Registered</span>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--ml-text)" }}>{new Date(selectedSchool.registered_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Tabs for Classes and Subjects */}
            <div style={{ borderBottom: "1px solid var(--ml-border)", padding: "0 1.5rem" }}>
              <nav style={{ display: "flex", gap: "0.5rem" }} role="tablist">
                <button
                  role="tab"
                  aria-selected={detailTab === "classes"}
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setDetailTab("classes")}
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.875rem",
                    borderBottom: detailTab === "classes" ? "2px solid var(--ml-accent)" : "2px solid transparent",
                    borderRadius: 0,
                    background: detailTab === "classes" ? "rgba(22, 132, 91, 0.05)" : "transparent",
                    color: detailTab === "classes" ? "var(--ml-accent)" : "var(--ml-text-secondary)",
                  }}
                >
                  Classes ({detailClasses.length})
                </button>
                <button
                  role="tab"
                  aria-selected={detailTab === "subjects"}
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setDetailTab("subjects")}
                  style={{
                    padding: "0.75rem 1rem",
                    fontSize: "0.875rem",
                    borderBottom: detailTab === "subjects" ? "2px solid var(--ml-accent)" : "2px solid transparent",
                    borderRadius: 0,
                    background: detailTab === "subjects" ? "rgba(22, 132, 91, 0.05)" : "transparent",
                    color: detailTab === "subjects" ? "var(--ml-accent)" : "var(--ml-text-secondary)",
                  }}
                >
                  Subjects ({detailSubjects.length})
                </button>
              </nav>
            </div>

            {/* Classes Tab */}
            {detailTab === "classes" && (
              <div role="tabpanel" style={{ padding: "1.5rem" }}>
                {detailLoading ? (
                  <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading classes...</div>
                ) : detailClasses.length === 0 ? (
                  <div className="mgmt-empty" style={{ padding: "2rem" }}>No classes found for this school.</div>
                ) : (
                  <div className="mgmt-table-wrap">
                    <table className="mgmt-table mgmt-table--compact">
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Section</th>
                          <th>Grade Level</th>
                          <th>Capacity</th>
                          <th>Adviser</th>
                          <th>Module</th>
                          <th>Schedule</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailClasses.map((c) => (
                          <tr key={c.id}>
                            <td className="mgmt-table-bold">{c.class_name}</td>
                            <td>{c.section || "—"}</td>
                            <td>{c.grade_level || "—"}</td>
                            <td>{c.capacity ?? "—"}</td>
                            <td>{c.faculty_name || "—"}</td>
                            <td>{c.module_title || "—"}</td>
                            <td className="mgmt-table-address mgmt-table-address--wrap">
                              {c.schedule && Array.isArray(c.schedule) && c.schedule.length > 0
                                ? c.schedule.map((sched, idx) => (
                                    <span key={idx} style={{ display: "block", fontSize: "0.75rem" }}>
                                      {sched.day}: {sched.start_time} - {sched.end_time} {sched.room ? `(${sched.room})` : ""}
                                    </span>
                                  ))
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Subjects Tab */}
            {detailTab === "subjects" && (
              <div role="tabpanel" style={{ padding: "1.5rem" }}>
                {detailLoading ? (
                  <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading subjects...</div>
                ) : detailSubjects.length === 0 ? (
                  <div className="mgmt-empty" style={{ padding: "2rem" }}>No subjects found for this school.</div>
                ) : (
                  <div className="mgmt-table-wrap">
                    <table className="mgmt-table mgmt-table--compact">
                      <thead>
                        <tr>
                          <th>Subject Name</th>
                          <th>Subject Code</th>
                          <th>Description</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailSubjects.map((sub) => (
                          <tr key={sub.id}>
                            <td className="mgmt-table-bold">{sub.name}</td>
                            <td>{sub.subject_code || "—"}</td>
                            <td className="mgmt-table-address mgmt-table-address--wrap">{sub.description || "—"}</td>
                            <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

    </div>
  );
}