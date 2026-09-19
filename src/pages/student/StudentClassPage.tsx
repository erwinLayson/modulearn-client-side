import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { enrollmentApi, type EnrollmentClass } from "../../api/enrollments";
import { classApi, type ScheduleItem } from "../../api/classes";
import { schoolYearApi } from "../../api/school-years";

interface ClassDetail {
  id: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  capacity: number | null;
  faculty_name: string | null;
  schedule: ScheduleItem[] | null;
  subjects: { id: string; name: string; teacher_name: string | null }[];
}

function formatSchedule(schedule: ScheduleItem[] | null): { text: string; lines: string[] } {
  if (!Array.isArray(schedule) || schedule.length === 0) return { text: "—", lines: [] };
  const lines = schedule.map(s => {
    const day = s.day;
    const time = `${s.start_time}–${s.end_time}`;
    return `${day} ${time}`;
  });
  return { text: lines.join(", "), lines };
}

export default function StudentClassPage() {
  const { user } = useAuth();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const syRes = await schoolYearApi.getCurrent(user.school_id!);
        const sy = syRes.data.data;
        if (cancelled || !sy) {
          setLoading(false);
          return;
        }
        const enrollRes = await enrollmentApi.getClassesByStudentId(user.id);
        const classesData = enrollRes.data.data || [];
        if (classesData.length === 0) {
          setLoading(false);
          return;
        }
        const ec = classesData[0];
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

        if (!cancelled) {
          setClassDetail({
            id: cls.id,
            class_name: cls.class_name,
            grade_level: cls.grade_level,
            section: cls.section,
            capacity: cls.capacity,
            faculty_name: cls.faculty_name,
            schedule: cls.schedule,
            subjects: subjectsWithTeachers,
          });
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const schedule = classDetail ? formatSchedule(classDetail.schedule) : { text: "—", lines: [] };

  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">My Class</h1>
          <p className="mgmt-subtitle">View your current class information.</p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : !classDetail ? (
        <div className="mgmt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ml-text-muted)" strokeWidth="1" style={{ marginBottom: "0.75rem", opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
          <p style={{ margin: 0 }}>You are not enrolled in any class yet.</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>Contact your school administrator to enroll you in a class.</p>
        </div>
      ) : (
        <>
          {/* Class Header */}
          <div className="mgmt-detail-panel" style={{ marginBottom: "1rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className="mgmt-card-icon" style={{ background: "rgba(22, 132, 91, 0.1)", color: "var(--ml-accent, #16a34a)", flexShrink: 0 }}>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--ml-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {classDetail.class_name}
                </h2>
                <p style={{ margin: "0.125rem 0 0", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>
                  Your current class
                </p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {classDetail.grade_level && (
                  <span className="dash-badge dash-badge--active" style={{ fontSize: "0.75rem" }}>
                    {classDetail.grade_level}
                  </span>
                )}
                {classDetail.section && (
                  <span className="dash-badge dash-badge--warning" style={{ fontSize: "0.75rem" }}>
                    {classDetail.section}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Class Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <div className="mgmt-detail-panel" style={{ padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Grade Level</span>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--ml-text)" }}>{classDetail.grade_level || "—"}</p>
            </div>
            <div className="mgmt-detail-panel" style={{ padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Section</span>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--ml-text)" }}>{classDetail.section || "—"}</p>
            </div>
            <div className="mgmt-detail-panel" style={{ padding: "1rem 1.25rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Capacity</span>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--ml-text)" }}>{classDetail.capacity ?? "—"}</p>
            </div>
          </div>

          {/* Adviser & Schedule */}
          <div className="mgmt-detail-panel" style={{ marginBottom: "1rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Adviser</span>
                <p style={{ margin: "0.375rem 0 0", fontSize: "0.9375rem", fontWeight: 600, color: "var(--ml-text)" }}>
                  {classDetail.faculty_name || "—"}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Schedule</span>
                {schedule.lines.length > 0 ? (
                  <div style={{ marginTop: "0.375rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                    {schedule.lines.map((line, i) => (
                      <span key={i} style={{ fontSize: "0.875rem", color: "var(--ml-text)" }}>{line}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: "0.375rem 0 0", fontSize: "0.9375rem", color: "var(--ml-text)" }}>—</p>
                )}
              </div>
            </div>
          </div>

          {/* Subjects */}
          {classDetail.subjects.length > 0 && (
            <div className="mgmt-detail-panel">
              <div className="mgmt-detail-header">
                <h2 className="mgmt-detail-title" style={{ fontSize: "1rem" }}>
                  Subjects ({classDetail.subjects.length})
                </h2>
              </div>
              <div className="mgmt-table-wrap">
                <table className="mgmt-table mgmt-table--compact">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classDetail.subjects.map(s => (
                      <tr key={s.id}>
                        <td className="mgmt-table-bold">{s.name}</td>
                        <td>{s.teacher_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
