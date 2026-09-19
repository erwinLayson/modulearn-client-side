import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { gradebookApi, type StudentSubjectGradeSummary } from "../../api/gradebook";

const CATEGORY_ORDER = ["activities", "quizzes", "exams"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  activities: "ACT",
  quizzes: "QUIZ",
  exams: "EXAM",
};
const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  activities: { bg: "#eff6ff", fg: "#1d4ed8" },
  quizzes: { bg: "#f5f3ff", fg: "#6d28d9" },
  exams: { bg: "#fef2f2", fg: "#991b1b" },
};
const PASS_THRESHOLD = 75;

function getGradeColor(grade: number): string {
  if (grade >= 90) return "#16a34a";
  if (grade >= 75) return "#2563eb";
  if (grade >= 60) return "#d97706";
  return "#dc2626";
}

function parseDate(dateVal: unknown): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === "string") {
    const match = dateVal.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().slice(0, 10);
  }
  return null;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

interface ColumnDef {
  key: string;
  date: string;
  category: string;
  title: string;
}

interface SubjectRow {
  subject_id: string;
  subject_name: string;
  teacher_name: string;
  scoresByCol: Map<string, { score: number | null; max_score: number }>;
  totalEarned: number;
  totalPossible: number;
  finalGrade: number | null;
}

export default function StudentGradebookPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentSubjectGradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await gradebookApi.getStudentSummary();
      setSummary(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Collect all unique items across all subjects, each becomes a column
  const columns = useMemo(() => {
    const seen = new Map<string, ColumnDef>();
    for (const subj of summary) {
      for (const cat of CATEGORY_ORDER) {
        for (const item of subj[cat].items) {
          const d = parseDate(item.due_date);
          if (!d) continue;
          const colKey = `${d}|${cat}|${item.title}`;
          if (!seen.has(colKey)) {
            seen.set(colKey, {
              key: colKey,
              date: d,
              category: cat,
              title: item.title,
            });
          }
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const catIdx = (c: string) => CATEGORY_ORDER.indexOf(c as typeof CATEGORY_ORDER[number]);
      return catIdx(a.category) - catIdx(b.category);
    });
  }, [summary]);

  // Group columns by date for colspan header
  const dateGroups = useMemo(() => {
    const groups: { date: string; cols: ColumnDef[] }[] = [];
    let current: { date: string; cols: ColumnDef[] } | null = null;
    for (const col of columns) {
      if (!current || current.date !== col.date) {
        current = { date: col.date, cols: [] };
        groups.push(current);
      }
      current.cols.push(col);
    }
    return groups;
  }, [columns]);

  // Build matrix rows
  const rows = useMemo(() => {
    const result: SubjectRow[] = [];
    for (const subj of summary) {
      if (subjectFilter && subj.subject_id !== subjectFilter) continue;

      const scoresByCol = new Map<string, { score: number | null; max_score: number }>();
      let totalEarned = 0;
      let totalPossible = 0;

      for (const cat of CATEGORY_ORDER) {
        for (const item of subj[cat].items) {
          const d = parseDate(item.due_date);
          if (!d) continue;
          const colKey = `${d}|${cat}|${item.title}`;
          scoresByCol.set(colKey, { score: item.score, max_score: item.max_score });
          if (item.score !== null) totalEarned += item.score;
          totalPossible += item.max_score;
        }
      }

      result.push({
        subject_id: subj.subject_id,
        subject_name: subj.subject_name,
        teacher_name: subj.teacher_name,
        scoresByCol,
        totalEarned,
        totalPossible,
        finalGrade: subj.final_grade,
      });
    }
    return result;
  }, [summary, subjectFilter]);

  // Column totals (for footer row)
  const colTotals = useMemo(() => {
    return columns.map(col => {
      let earned = 0;
      let possible = 0;
      for (const row of rows) {
        const cell = row.scoresByCol.get(col.key);
        if (cell) {
          if (cell.score !== null) earned += cell.score;
          possible += cell.max_score;
        }
      }
      return { key: col.key, earned, possible };
    });
  }, [columns, rows]);

  // Grand totals
  const grandTotalEarned = rows.reduce((s, r) => s + r.totalEarned, 0);
  const grandTotalPossible = rows.reduce((s, r) => s + r.totalPossible, 0);

  // Summary stats
  const totalEarned = summary.reduce((s, subj) => {
    let sum = 0;
    for (const cat of CATEGORY_ORDER) {
      for (const item of subj[cat].items) {
        if (item.score !== null) sum += item.score;
      }
    }
    return s + sum;
  }, 0);

  const totalPossible = summary.reduce((s, subj) => {
    let sum = 0;
    for (const cat of CATEGORY_ORDER) {
      for (const item of subj[cat].items) sum += item.max_score;
    }
    return s + sum;
  }, 0);

  const subjectsPassed = summary.filter(s => s.final_grade !== null && s.final_grade >= PASS_THRESHOLD).length;
  const subjectsWithGrades = summary.filter(s => s.final_grade !== null).length;
  const gradesSum = summary.reduce((s, subj) => s + (subj.final_grade ?? 0), 0);
  const averageGrade = subjectsWithGrades > 0 ? Math.round(gradesSum / subjectsWithGrades * 100) / 100 : null;

  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">My Grades</h1>
          <p className="mgmt-subtitle">
            {loading ? "Loading..." : summary.length > 0 ? `${summary.length} subject${summary.length !== 1 ? "s" : ""}` : "No grade data available yet."}
          </p>
        </div>
      </div>

      {!loading && summary.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Total Score</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: "var(--ml-text)" }}>
              {totalEarned.toFixed(0)} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>/ {totalPossible.toFixed(0)}</span>
            </p>
          </div>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Subjects Passed</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: "#16a34a" }}>
              {subjectsPassed} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>/ {subjectsWithGrades}</span>
            </p>
          </div>
          <div style={{ padding: "1rem 1.25rem", background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem" }}>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ml-text-muted)" }}>Average Grade</p>
            <p style={{ margin: "0.375rem 0 0", fontSize: "1.5rem", fontWeight: 800, color: averageGrade !== null ? getGradeColor(averageGrade) : "var(--ml-text-muted)" }}>
              {averageGrade !== null ? `${averageGrade}%` : "—"}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : summary.length === 0 ? (
        <div className="mgmt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ml-text-muted)" strokeWidth="1" style={{ marginBottom: "0.75rem", opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p style={{ margin: 0 }}>No grade data available yet.</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>Your grades will appear here once your teachers add them.</p>
        </div>
      ) : columns.length === 0 ? (
        <div className="mgmt-empty" style={{ padding: "2rem" }}>No grade items with due dates found.</div>
      ) : (
        <div className="mgmt-detail-panel">
          <div className="mgmt-detail-header">
            <h2 className="mgmt-detail-title" style={{ fontSize: "1rem" }}>Grade Items</h2>
          </div>

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
                  {summary.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                  ))}
                </select>
              </div>
              <button
                className="mgmt-btn mgmt-btn--ghost"
                onClick={() => setSubjectFilter("")}
                style={{ fontSize: "0.8rem", padding: "0.375rem 0.75rem" }}
              >
                Clear Filter
              </button>
            </div>
          </div>

          <div className="gb-spreadsheet">
            <div style={{ overflowX: "auto" }}>
              <table className="gb-spreadsheet__table" style={{ minWidth: "100%" }}>
                <thead>
                  {/* Row 1: Date headers with colspan */}
                  <tr>
                    <th
                      className="gb-spreadsheet__th gb-spreadsheet__th--sticky"
                      rowSpan={2}
                      style={{ minWidth: 160, textTransform: "none", letterSpacing: "normal", verticalAlign: "bottom" }}
                    >
                      SUBJECT
                    </th>
                    {dateGroups.map(group => (
                      <th
                        key={group.date}
                        className="gb-spreadsheet__th"
                        colSpan={group.cols.length}
                        style={{ textAlign: "center", borderBottom: "1px solid var(--ml-border)" }}
                      >
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontWeight: 700 }}>{formatDateShort(group.date)}</div>
                          <div style={{ fontSize: "0.625rem", fontWeight: 400, color: "var(--ml-text-muted)" }}>{formatWeekday(group.date)}</div>
                        </div>
                      </th>
                    ))}
                    <th
                      className="gb-spreadsheet__th gb-spreadsheet__th--total-header"
                      rowSpan={2}
                      style={{ minWidth: 80, textAlign: "center", verticalAlign: "bottom" }}
                    >
                      GRADE
                    </th>
                    <th
                      className="gb-spreadsheet__th gb-spreadsheet__th--total-header"
                      rowSpan={2}
                      style={{ minWidth: 80, textAlign: "center", verticalAlign: "bottom" }}
                    >
                      TOTAL
                    </th>
                  </tr>
                  {/* Row 2: Category headers */}
                  <tr>
                    {dateGroups.map(group =>
                      group.cols.map(col => {
                        const colors = CATEGORY_COLORS[col.category] || { bg: "#f3f4f6", fg: "#374151" };
                        return (
                          <th
                            key={col.key}
                            className="gb-spreadsheet__th"
                            style={{ textAlign: "center", padding: "0.375rem 0.25rem" }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                background: colors.bg,
                                color: colors.fg,
                                letterSpacing: "0.03em",
                              }}
                              title={col.title}
                            >
                              {CATEGORY_LABELS[col.category] || col.category}
                            </span>
                          </th>
                        );
                      })
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.subject_id} className="gb-spreadsheet__row">
                      <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky">
                        <div className="gb-spreadsheet__student-cell">
                          <span className="gb-spreadsheet__student-name">{row.subject_name}</span>
                          <span className="gb-spreadsheet__student-lrn">{row.teacher_name}</span>
                        </div>
                      </td>
                      {columns.map(col => {
                        const cell = row.scoresByCol.get(col.key);
                        return (
                          <td key={col.key} className="gb-spreadsheet__td" style={{ textAlign: "center", padding: "0.375rem 0.25rem" }}>
                            {cell ? (
                              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                {cell.score !== null ? (
                                  <>
                                    <span style={{ color: cell.max_score > 0 && cell.score / cell.max_score >= 0.75 ? "#16a34a" : cell.max_score > 0 && cell.score / cell.max_score >= 0.5 ? "#d97706" : "#dc2626" }}>
                                      {cell.score}
                                    </span>
                                    <span style={{ color: "var(--ml-text-muted)" }}>/{cell.max_score}</span>
                                  </>
                                ) : (
                                  <span style={{ color: "var(--ml-text-muted)" }}>—/{cell.max_score}</span>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: "var(--ml-text-muted)", fontSize: "0.75rem" }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700 }}>
                        <span className="gb-spreadsheet__total-text" style={{ color: row.finalGrade !== null ? getGradeColor(row.finalGrade) : "var(--ml-text-muted)" }}>
                          {row.finalGrade !== null ? `${row.finalGrade}%` : "—"}
                        </span>
                      </td>
                      <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700 }}>
                        <span className="gb-spreadsheet__total-text">
                          {row.totalPossible > 0 ? `${row.totalEarned.toFixed(0)} / ${row.totalPossible.toFixed(0)}` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="gb-spreadsheet__row" style={{ fontWeight: 700, background: "var(--ml-surface-alt)" }}>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                      TOTAL
                    </td>
                    {colTotals.map(({ key, earned, possible }) => (
                      <td key={key} className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        <span style={{ color: possible > 0 ? (earned / possible >= 0.75 ? "#16a34a" : earned / possible >= 0.5 ? "#d97706" : "#dc2626") : "var(--ml-text-muted)" }}>
                          {possible > 0 ? `${earned}/${possible}` : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                      <span style={{ color: "var(--ml-text-muted)" }}>—</span>
                    </td>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700 }}>
                      <span className="gb-spreadsheet__total-text">
                        {grandTotalPossible > 0 ? `${grandTotalEarned.toFixed(0)} / ${grandTotalPossible.toFixed(0)}` : "—"}
                      </span>
                    </td>
                  </tr>
                  <tr className="gb-spreadsheet__row" style={{ fontWeight: 700, background: "var(--ml-surface-alt)", borderTop: "2px solid var(--ml-border)" }}>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                      AVERAGE
                    </td>
                    {colTotals.map(({ key }) => (
                      <td key={key} className="gb-spreadsheet__td" style={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                        <span style={{ color: "var(--ml-text-muted)" }}>—</span>
                      </td>
                    ))}
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                      <span style={{ color: averageGrade !== null ? getGradeColor(averageGrade) : "var(--ml-text-muted)", fontWeight: 800 }}>
                        {averageGrade !== null ? `${averageGrade}%` : "—"}
                      </span>
                    </td>
                    <td className="gb-spreadsheet__td gb-spreadsheet__td--total" style={{ textAlign: "center", fontWeight: 700 }}>
                      <span className="gb-spreadsheet__total-text">—</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
