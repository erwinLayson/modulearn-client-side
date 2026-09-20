import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceApi, type StudentSubjectAttendance, type StudentAttendanceRecord } from "../../api/classes";
import { schoolYearApi } from "../../api/school-years";
import { COLORS } from "../../constant/colors";

function getStatusColor(rate: number): string {
  if (rate >= 75) return COLORS.present;
  if (rate >= 50) return COLORS.warning;
  return COLORS.error;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

interface MatrixRow {
  subject_id: string;
  subject_name: string;
  teacher_name: string;
  statuses: Record<string, "present" | "absent">;
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<StudentSubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!user?.school_id) return;
    let cancelled = false;
    (async () => {
      try {
        const syRes = await schoolYearApi.getCurrent(user.school_id!);
        const sy = syRes.data.data;
        if (cancelled || !sy) return;
        const res = await attendanceApi.getStudentBySubject(sy.id);
        if (!cancelled) setSubjects(res.data.data || []);
      } catch {
        if (!cancelled) setSubjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.school_id]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setRecordsLoading(true);
    try {
      const filters: { subject_id?: string; date_from?: string; date_to?: string; limit?: number } = { limit: 500 };
      if (subjectFilter) filters.subject_id = subjectFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      const res = await attendanceApi.getAllStudentRecords(filters);
      setRecords(res.data.data?.data || []);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [user, subjectFilter, dateFrom, dateTo]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totalSessions = subjects.reduce((s, subj) => s + subj.total_sessions, 0);
  const totalPresent = subjects.reduce((s, subj) => s + subj.present_count, 0);
  const totalAbsent = subjects.reduce((s, subj) => s + subj.absent_count, 0);
  const overallRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) set.add(r.attendance_date);
    return Array.from(set).sort();
  }, [records]);

  const matrix = useMemo(() => {
    const subjectMap = new Map<string, MatrixRow>();
    for (const r of records) {
      let row = subjectMap.get(r.subject_id);
      if (!row) {
        row = { subject_id: r.subject_id, subject_name: r.subject_name, teacher_name: r.teacher_name, statuses: {} };
        subjectMap.set(r.subject_id, row);
      }
      row.statuses[r.attendance_date] = r.status;
    }
    return Array.from(subjectMap.values());
  }, [records]);

  const dateTotals = useMemo(() => {
    return dates.map(date => {
      let present = 0;
      let total = 0;
      for (const row of matrix) {
        if (row.statuses[date]) {
          total++;
          if (row.statuses[date] === "present") present++;
        }
      }
      return { date, present, total };
    });
  }, [dates, matrix]);

  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">My Attendance</h1>
          <p className="mgmt-subtitle">
            {loading ? "Loading..." : subjects.length > 0 ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""}` : "No attendance records yet."}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && subjects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Total Sessions</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: "var(--ml-text)" }}>{totalSessions}</p>
          </div>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Present</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: COLORS.present }}>{totalPresent}</p>
          </div>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Absent</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: COLORS.error }}>{totalAbsent}</p>
          </div>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Overall Rate</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: getStatusColor(overallRate) }}>{overallRate}%</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="mgmt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ml-text-muted)" strokeWidth="1" style={{ marginBottom: "0.75rem", opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p style={{ margin: 0 }}>No attendance records yet.</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>Your attendance will appear here once your teachers record it.</p>
        </div>
      ) : (
        <div className="mgmt-detail-panel">
          <div className="mgmt-detail-header">
            <h2 className="mgmt-detail-title" style={{ fontSize: "1rem" }}>Attendance Records</h2>
          </div>

          {/* Filters */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Subject</label>
                <select
                  className="mgmt-input"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  style={{ fontSize: "0.8rem" }}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>From</label>
                <input type="date" className="mgmt-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ fontSize: "0.8rem" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>To</label>
                <input type="date" className="mgmt-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ fontSize: "0.8rem" }} />
              </div>
              <button
                className="mgmt-btn mgmt-btn--ghost"
                onClick={() => { setSubjectFilter(""); setDateFrom(""); setDateTo(""); }}
                style={{ fontSize: "0.8rem", padding: "0.375rem 0.75rem" }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Matrix Spreadsheet */}
          <div className="gb-spreadsheet">
            {recordsLoading ? (
              <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading records...</div>
            ) : records.length === 0 ? (
              <div className="mgmt-empty" style={{ padding: "2rem" }}>No attendance records found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="gb-spreadsheet__table" style={{ minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th className="gb-spreadsheet__th gb-spreadsheet__th--sticky" style={{ minWidth: 160, textTransform: "none", letterSpacing: "normal" }}>
                        SUBJECT
                      </th>
                      {dates.map(date => (
                        <th key={date} className="gb-spreadsheet__th" style={{ minWidth: 80, textAlign: "center" }}>
                          <div style={{ lineHeight: 1.3 }}>
                            <div>{formatDateShort(date)}</div>
                            <div style={{ fontSize: "0.625rem", fontWeight: 400, color: "var(--ml-text-muted)" }}>{formatWeekday(date)}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map(row => (
                      <tr key={row.subject_id} className="gb-spreadsheet__row">
                        <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky">
                          <div className="gb-spreadsheet__student-cell">
                            <span className="gb-spreadsheet__student-name">{row.subject_name}</span>
                            <span className="gb-spreadsheet__student-lrn">{row.teacher_name}</span>
                          </div>
                        </td>
                        {dates.map(date => {
                          const status = row.statuses[date];
                          return (
                            <td key={date} className="gb-spreadsheet__td" style={{ textAlign: "center", padding: "0.375rem 0.25rem" }}>
                              {status ? (
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.125rem 0.5rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    background: status === "present" ? COLORS.presentBg : COLORS.absentBg,
                                    color: status === "present" ? COLORS.presentDark : COLORS.absentDark,
                                    border: `1px solid ${status === "present" ? COLORS.presentBorder : COLORS.absentBorder}`,
                                  }}
                                >
                                  {status === "present" ? "P" : "A"}
                                </span>
                              ) : (
                                <span style={{ color: "var(--ml-text-muted)", fontSize: "0.75rem" }}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="gb-spreadsheet__row" style={{ fontWeight: 700, background: "var(--ml-surface-alt)" }}>
                      <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                        TOTAL
                      </td>
                      {dateTotals.map(({ date, present, total }) => (
                        <td key={date} className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                          <span style={{ color: COLORS.present }}>{present}</span>
                          <span style={{ color: "var(--ml-text-muted)" }}>/{total}</span>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
