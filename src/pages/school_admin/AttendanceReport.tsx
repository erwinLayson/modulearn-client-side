import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import { attendanceApi, classApi, type ClassListItem } from "../../api/classes";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import apiClient from "../../api/client";
import Toast from "../../components/Toast";
import { COLORS } from "../../constant/colors";

type ToastState = { message: string; type: "success" | "error" } | null;

/* ---------- constants ---------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Sticky column offsets (px) — must match the widths in the .attn-sheet CSS
const COL_CLASS_W = 150;
const COL_GRADE_W = 90;

const pad2 = (n: number) => String(n).padStart(2, "0");

/* ---------- types ---------- */

interface DayInfo {
  date: string; // YYYY-MM-DD
  dayNum: number;
  dow: string;
  isWeekend: boolean;
}

interface MatrixCell {
  classId: string;
  className: string;
  section: string | null;
  gradeLevel: string | null;
  subjectId: string;
  subjectName: string;
  teacherName: string | null;
  totalEnrolled: number;
  date: string;
  present: number;
  rate: number;
}

interface SubjectRow {
  subjectId: string;
  subjectName: string;
  cells: Map<string, MatrixCell>;
}

interface ClassGroup {
  classId: string;
  className: string;
  section: string | null;
  gradeLevel: string | null;
  subjects: SubjectRow[];
}

interface Filters {
  grade_level: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  month: number;
  year: number;
  search: string;
}

/* ---------- helpers ---------- */

const getDaysInMonth = (year: number, month: number): DayInfo[] => {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days: DayInfo[] = [];
  for (let d = 1; d <= last; d++) {
    const dt = new Date(Date.UTC(year, month - 1, d));
    const dow = dt.getUTCDay();
    days.push({
      date: `${year}-${pad2(month)}-${pad2(d)}`,
      dayNum: d,
      dow: DOW[dow],
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return days;
};

const formatLongDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
};

const formatNumber = (n: number) => n.toLocaleString("en-US");

const rateClassFor = (rate: number) =>
  rate >= 95 ? "attn-sheet__cell--high" : rate < 75 ? "attn-sheet__cell--low" : "";

/* ---------- skeleton ---------- */

const SKEL_DAYS = Array.from({ length: 15 }, (_, i) => i);

function SheetSkeleton() {
  return (
    <div className="attn-sheet-wrap" aria-hidden="true">
      <table className="attn-sheet">
        <thead>
          <tr className="attn-sheet__month-row">
            <th colSpan={3 + SKEL_DAYS.length}>
              <span className="attn-skel attn-skel--text" style={{ width: 180, height: 14 }} />
            </th>
          </tr>
          <tr>
            <th className="attn-sheet__th attn-sheet__col--class">
              <span className="attn-skel attn-skel--text" style={{ width: 90 }} />
            </th>
            <th className="attn-sheet__th attn-sheet__col--grade">
              <span className="attn-skel attn-skel--text" style={{ width: 40 }} />
            </th>
            <th className="attn-sheet__th attn-sheet__col--subject">
              <span className="attn-skel attn-skel--text" style={{ width: 60 }} />
            </th>
            {SKEL_DAYS.map(i => (
              <th key={i} className="attn-sheet__th attn-sheet__th--day">
                <span className="attn-skel attn-skel--chip" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1].map(g => (
            <Fragment key={g}>
              <tr className="attn-sheet__group-row">
                <td className="attn-sheet__td attn-sheet__col--class">
                  <span className="attn-skel attn-skel--text" style={{ width: 100 }} />
                </td>
                <td className="attn-sheet__td attn-sheet__col--grade" />
                <td className="attn-sheet__td attn-sheet__col--subject" />
                <td colSpan={SKEL_DAYS.length} className="attn-sheet__group-spacer" />
              </tr>
              {[0, 1, 2].map(r => (
                <tr key={r} className="attn-sheet__row">
                  <td className="attn-sheet__td attn-sheet__col--class" />
                  <td className="attn-sheet__td attn-sheet__col--grade" />
                  <td className="attn-sheet__td attn-sheet__col--subject">
                    <span className="attn-skel attn-skel--text" style={{ width: 84 }} />
                  </td>
                  {SKEL_DAYS.map(i => (
                    <td key={i} className="attn-sheet__td">
                      <span className="attn-skel attn-skel--chip" />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- page ---------- */

export default function AttendanceReport() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const now = new Date();
  const [filters, setFilters] = useState<Filters>({
    grade_level: "",
    class_id: "",
    subject_id: "",
    teacher_id: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    search: "",
  });

  const [matrix, setMatrix] = useState<{
    school_year_name: string | null;
    data: {
      class_id: string; class_name: string; section: string | null; grade_level: string | null;
      subject_id: string; subject_name: string; teacher_name: string | null;
      total_enrolled: number; attendance_date: string;
      present_count: number; absent_count: number;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);

  /* ----- reference data ----- */
  useEffect(() => {
    if (!schoolId) return;
    const fetchRefData = async () => {
      try {
        const [classesRes, subjectsRes, facultiesRes] = await Promise.all([
          classApi.getBySchoolId(schoolId),
          subjectApi.getBySchoolId(schoolId),
          apiClient.get<{ data: { id: string; first_name: string; last_name: string }[] }>(`/faculties/school/${schoolId}`),
        ]);
        setClasses(classesRes.data.data || []);
        setSubjects(subjectsRes.data.data || []);
        setTeachers(
          (facultiesRes.data.data || []).map(f => ({ id: f.id, name: `${f.first_name} ${f.last_name}` }))
        );
      } catch {
        setToast({ message: "Failed to load reference data", type: "error" });
      }
    };
    fetchRefData();
  }, [schoolId]);

  /* ----- matrix data ----- */
  const fetchMatrix = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getSchoolMatrix(schoolId, {
        year: filters.year,
        month: filters.month,
        class_id: filters.class_id || undefined,
        subject_id: filters.subject_id || undefined,
        teacher_id: filters.teacher_id || undefined,
        grade_level: filters.grade_level || undefined,
      });
      setMatrix(res.data.data);
    } catch {
      setToast({ message: "Failed to load attendance history", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId, filters.year, filters.month, filters.class_id, filters.subject_id, filters.teacher_id, filters.grade_level]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix, refreshKey]);

  /* ----- calendar + grouping ----- */
  const days = useMemo(() => getDaysInMonth(filters.year, filters.month), [filters.year, filters.month]);

  const groups = useMemo<ClassGroup[]>(() => {
    if (!matrix) return [];
    const byClass = new Map<string, ClassGroup>();
    for (const item of matrix.data) {
      let g = byClass.get(item.class_id);
      if (!g) {
        g = {
          classId: item.class_id,
          className: item.class_name,
          section: item.section,
          gradeLevel: item.grade_level,
          subjects: [],
        };
        byClass.set(item.class_id, g);
      }
      let s = g.subjects.find(x => x.subjectId === item.subject_id);
      if (!s) {
        s = { subjectId: item.subject_id, subjectName: item.subject_name, cells: new Map() };
        g.subjects.push(s);
      }
      const enrolled = item.total_enrolled;
      const present = item.present_count;
      s.cells.set(item.attendance_date, {
        classId: item.class_id,
        className: item.class_name,
        section: item.section,
        gradeLevel: item.grade_level,
        subjectId: item.subject_id,
        subjectName: item.subject_name,
        teacherName: item.teacher_name,
        totalEnrolled: enrolled,
        date: item.attendance_date,
        present,
        rate: enrolled > 0 ? (present / enrolled) * 100 : 0,
      });
    }
    const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const list = [...byClass.values()];
    for (const g of list) g.subjects.sort((a, b) => coll.compare(a.subjectName, b.subjectName));
    list.sort(
      (a, b) =>
        coll.compare(a.gradeLevel ?? "", b.gradeLevel ?? "") ||
        coll.compare(a.section ?? a.className, b.section ?? b.className) ||
        coll.compare(a.className, b.className)
    );
    return list;
  }, [matrix]);

  const filteredGroups = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map(g => {
        const subjects = g.subjects.filter(
          s => s.subjectName.toLowerCase().includes(q) || (g.section ?? g.className).toLowerCase().includes(q)
        );
        return subjects.length > 0 ? { ...g, subjects } : null;
      })
      .filter((g): g is ClassGroup => g !== null);
  }, [groups, filters.search]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let subjectCount = 0;
    for (const g of filteredGroups) {
      subjectCount += g.subjects.length;
      for (const s of g.subjects) {
        for (const c of s.cells.values()) {
          present += c.present;
          absent += Math.max(c.totalEnrolled - c.present, 0);
        }
      }
    }
    const rate = present + absent > 0 ? (present / (present + absent)) * 100 : 0;
    return { classrooms: filteredGroups.length, subjects: subjectCount, present, absent, rate };
  }, [filteredGroups]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(c => { if (c.grade_level) set.add(c.grade_level); });
    return [...set].sort(new Intl.Collator(undefined, { numeric: true }).compare);
  }, [classes]);

  /* ----- handlers ----- */
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      grade_level: "",
      class_id: "",
      subject_id: "",
      teacher_id: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      search: "",
    });
  };

  const buildTooltip = (c: MatrixCell) => {
    const absent = Math.max(c.totalEnrolled - c.present, 0);
    return [
      formatLongDate(c.date),
      `${c.section || c.className}${c.gradeLevel ? ` · ${c.gradeLevel}` : ""} · ${c.subjectName}`,
      `Present: ${c.present} · Absent: ${absent}`,
      `Total Students: ${c.totalEnrolled} · Rate: ${c.rate.toFixed(1)}%`,
    ].join("\n");
  };

  /* ----- export ----- */
  const exportXLSX = () => {
    if (!matrix || filteredGroups.length === 0) return;
    const label = `${MONTHS[filters.month - 1].toUpperCase()} ${filters.year}`;
    const rows: (string | number)[][] = [];
    rows.push([`CLASSROOM ATTENDANCE HISTORY — ${label}`]);
    rows.push([user?.school_name ?? ""]);
    rows.push([`School Year: ${matrix.school_year_name ?? "—"}`]);
    rows.push([]);
    rows.push(["Classroom / Section", "Grade Level", "Subject", ...days.map(d => `${d.dow} ${d.dayNum}`)]);
    for (const g of filteredGroups) {
      rows.push([g.section || g.className, g.gradeLevel || "", "", ...days.map(() => "")]);
      for (const s of g.subjects) {
        rows.push([
          g.section || g.className,
          g.gradeLevel || "",
          s.subjectName,
          ...days.map(d => {
            const c = s.cells.get(d.date);
            if (!c) return "";
            return c.totalEnrolled > 0 ? `${c.present}/${c.totalEnrolled}` : String(c.present);
          }),
        ]);
      }
      rows.push([]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 18 }, ...days.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-history-${filters.year}-${pad2(filters.month)}.xlsx`);
  };

  if (!user) return null;

  const monthLabel = `${MONTHS[filters.month - 1].toUpperCase()} ${filters.year}`;
  const hasData = filteredGroups.length > 0;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {/* 1. Page header — school shown once, here */}
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Classroom Attendance History</h1>
          <p className="mgmt-subtitle attn-school-name">{user.school_name}</p>
          <p className="attn-context">
            <span>School Year: <strong>{matrix?.school_year_name ?? "—"}</strong></span>
            <span className="attn-context-sep">·</span>
            <span>Month: <strong>{MONTHS[filters.month - 1]} {filters.year}</strong></span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="mgmt-btn mgmt-btn--ghost" onClick={resetFilters} disabled={loading}>
            Reset Filters
          </button>
          <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
            Refresh
          </button>
          <button className="mgmt-btn mgmt-btn--primary" onClick={exportXLSX} disabled={loading || !hasData}>
            Export
          </button>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="mgmt-detail-panel attn-filters">
        <div className="attn-filters-grid">
          <div>
            <label className="attn-label">School</label>
            <select className="mgmt-input" value={schoolId} disabled>
              <option value={schoolId}>{user.school_name}</option>
            </select>
          </div>
          <div>
            <label className="attn-label">Grade Level</label>
            <select className="mgmt-input" value={filters.grade_level} onChange={e => handleFilterChange("grade_level", e.target.value)} disabled={loading}>
              <option value="">All Grades</option>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="attn-label">Classroom / Section</label>
            <select className="mgmt-input" value={filters.class_id} onChange={e => handleFilterChange("class_id", e.target.value)} disabled={loading}>
              <option value="">All Sections</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.class_name}{c.section ? ` — ${c.section}` : ""}{c.grade_level ? ` (${c.grade_level})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="attn-label">Subject</label>
            <select className="mgmt-input" value={filters.subject_id} onChange={e => handleFilterChange("subject_id", e.target.value)} disabled={loading}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="attn-label">Teacher</label>
            <select className="mgmt-input" value={filters.teacher_id} onChange={e => handleFilterChange("teacher_id", e.target.value)} disabled={loading}>
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="attn-label">Month</label>
            <select className="mgmt-input" value={filters.month} onChange={e => handleFilterChange("month", e.target.value)} disabled={loading}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="attn-label">Year</label>
            <select className="mgmt-input" value={filters.year} onChange={e => handleFilterChange("year", e.target.value)} disabled={loading}>
              {Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="attn-label">Search</label>
            <input
              type="text"
              className="mgmt-input"
              placeholder="Search section or subject…"
              value={filters.search}
              onChange={e => handleFilterChange("search", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. Summary — computed from the currently displayed data */}
      <div className="attn-summary">
        <div className="attn-summary__card">
          <span className="attn-summary__label">Classrooms</span>
          <span className="attn-summary__value">{formatNumber(summary.classrooms)}</span>
        </div>
        <div className="attn-summary__card">
          <span className="attn-summary__label">Subjects</span>
          <span className="attn-summary__value">{formatNumber(summary.subjects)}</span>
        </div>
        <div className="attn-summary__card">
          <span className="attn-summary__label">Present</span>
          <span className="attn-summary__value attn-summary__value--present">{formatNumber(summary.present)}</span>
        </div>
        <div className="attn-summary__card">
          <span className="attn-summary__label">Absent</span>
          <span className="attn-summary__value attn-summary__value--absent">{formatNumber(summary.absent)}</span>
        </div>
        <div className="attn-summary__card attn-summary__card--rate">
          <span className="attn-summary__label">Overall Attendance Rate</span>
          <span className="attn-summary__value">{summary.rate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 4. Spreadsheet */}
      <div className="mgmt-detail-panel attn-sheet-panel">
        <div className="attn-sheet-head">
          <h2 className="attn-sheet-title">{monthLabel}</h2>
          <div className="attn-legend">
            <span className="attn-legend__item"><i className="attn-legend__swatch attn-legend__swatch--weekend" /> Weekend</span>
            <span className="attn-legend__item"><i className="attn-legend__swatch attn-legend__swatch--high" /> ≥ 95%</span>
            <span className="attn-legend__item"><i className="attn-legend__swatch attn-legend__swatch--low" /> &lt; 75%</span>
            <span className="attn-legend__note">Cell = present / enrolled</span>
          </div>
        </div>

        {loading ? (
          <SheetSkeleton />
        ) : !hasData ? (
          <div className="mgmt-empty">No attendance records found for the selected filters.</div>
        ) : (
          <div className="attn-sheet-wrap">
            <table className="attn-sheet">
              <thead>
                <tr className="attn-sheet__month-row">
                  <th colSpan={3 + days.length}>{monthLabel}</th>
                </tr>
                <tr>
                  <th className="attn-sheet__th attn-sheet__col--class" style={{ left: 0 }}>
                    Classroom / Section
                  </th>
                  <th className="attn-sheet__th attn-sheet__col--grade" style={{ left: COL_CLASS_W }}>
                    Grade
                  </th>
                  <th className="attn-sheet__th attn-sheet__col--subject" style={{ left: COL_CLASS_W + COL_GRADE_W }}>
                    Subject
                  </th>
                  {days.map(d => (
                    <th
                      key={d.date}
                      className={`attn-sheet__th attn-sheet__th--day ${d.isWeekend ? "attn-sheet__th--weekend" : ""}`}
                    >
                      <span className="attn-sheet__dow">{d.dow}</span>
                      <span className="attn-sheet__daynum">{d.dayNum}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map(g => (
                  <Fragment key={g.classId}>
                    {/* classroom group band */}
                    <tr className="attn-sheet__group-row">
                      <td className="attn-sheet__td attn-sheet__td--group attn-sheet__col--class" style={{ left: 0 }}>
                        {g.section || g.className}
                      </td>
                      <td className="attn-sheet__td attn-sheet__td--group attn-sheet__col--grade" style={{ left: COL_CLASS_W }}>
                        {g.gradeLevel || "—"}
                      </td>
                      <td className="attn-sheet__td attn-sheet__td--group attn-sheet__col--subject" style={{ left: COL_CLASS_W + COL_GRADE_W }} />
                      <td colSpan={days.length} className="attn-sheet__group-spacer" />
                    </tr>
                    {/* subject rows */}
                    {g.subjects.map(s => (
                      <tr key={s.subjectId} className="attn-sheet__row">
                        <td className="attn-sheet__td attn-sheet__td--muted attn-sheet__col--class" style={{ left: 0 }}>
                          {g.section || g.className}
                        </td>
                        <td className="attn-sheet__td attn-sheet__td--muted attn-sheet__col--grade" style={{ left: COL_CLASS_W }}>
                          {g.gradeLevel || "—"}
                        </td>
                        <td className="attn-sheet__td attn-sheet__td--subject attn-sheet__col--subject" style={{ left: COL_CLASS_W + COL_GRADE_W }}>
                          {s.subjectName}
                        </td>
                        {days.map(d => {
                          const cell = s.cells.get(d.date);
                          if (!cell) return <td key={d.date} className="attn-sheet__td" />;
                          return (
                            <td
                              key={d.date}
                              className={`attn-sheet__td ${d.isWeekend ? "attn-sheet__td--weekend" : ""}`}
                            >
                              <button
                                type="button"
                                className={`attn-sheet__cell ${rateClassFor(cell.rate)}`}
                                data-tip={buildTooltip(cell)}
                                onClick={() => setSelectedCell(cell)}
                              >
                                {cell.totalEnrolled > 0 ? `${cell.present}/${cell.totalEnrolled}` : String(cell.present)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Cell detail modal */}
      {selectedCell && (
        <div className="mgmt-modal-overlay" onClick={() => setSelectedCell(null)}>
          <div className="mgmt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "24rem" }}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">Attendance Details</h3>
              <button type="button" className="mgmt-modal-close" onClick={() => setSelectedCell(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="attn-detail">
              {[
                ["Class", selectedCell.section || selectedCell.className],
                ["Grade Level", selectedCell.gradeLevel || "—"],
                ["Subject", selectedCell.subjectName],
                ["Teacher", selectedCell.teacherName || "—"],
                ["Date", formatLongDate(selectedCell.date)],
                ["Present", String(selectedCell.present)],
                ["Absent", String(Math.max(selectedCell.totalEnrolled - selectedCell.present, 0))],
                ["Total Students", String(selectedCell.totalEnrolled)],
              ].map(([label, value]) => (
                <div key={label} className="attn-detail__row">
                  <span className="attn-detail__label">{label}</span>
                  <span className="attn-detail__value">{value}</span>
                </div>
              ))}
              <div className="attn-detail__row attn-detail__row--rate">
                <span className="attn-detail__label">Attendance Rate</span>
                <span
                  className="attn-detail__value"
                  style={{
                    color: selectedCell.rate >= 95 ? COLORS.presentDark : selectedCell.rate < 75 ? COLORS.absentDark : "var(--ml-accent-active)",
                  }}
                >
                  {selectedCell.rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
