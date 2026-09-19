import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { attendanceApi, type SchoolAttendanceReportItem, type PaginatedResponse, type SchoolAttendanceReportFilters } from "../../api/classes";
import { classApi, type ClassListItem } from "../../api/classes";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import apiClient from "../../api/client";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function AttendanceReport() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;

const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Report data
  const [reportData, setReportData] = useState<PaginatedResponse<SchoolAttendanceReportItem> | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SchoolAttendanceReportFilters>({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    student_id: "",
    date_from: "",
    date_to: "",
    page: 1,
    limit: 50,
  });

  // Fetch reference data
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
        setTeachers((facultiesRes.data.data || []).map((f: { id: string; first_name: string; last_name: string }) => ({ id: f.id, name: `${f.first_name} ${f.last_name}` })));
      } catch {
        setToast({ message: "Failed to load reference data", type: "error" });
      }
    };
    fetchRefData();
  }, [schoolId]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!schoolId) return;
    setReportLoading(true);
    try {
      const res = await attendanceApi.getSchoolReport(schoolId, filters);
      setReportData(res.data.data);
    } catch {
      setToast({ message: "Failed to load attendance report", type: "error" });
    } finally {
      setReportLoading(false);
    }
  }, [schoolId, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (key: keyof SchoolAttendanceReportFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      class_id: "",
      subject_id: "",
      teacher_id: "",
      student_id: "",
      date_from: "",
      date_to: "",
      page: 1,
      limit: 50,
    });
  };

  // Export to CSV
  const exportCSV = () => {
    if (!reportData || reportData.data.length === 0) return;
    const headers = [
      "Class", "Section", "Grade", "Subject", "Teacher", "Student",
      "Date", "Status", "Recorded At", "Marked By"
    ];
    const rows = reportData.data.map(item => [
      item.class_name,
      item.section || "",
      item.grade_level || "",
      item.subject_name,
      item.teacher_name,
      item.student_name,
      new Date(item.attendance_date).toLocaleDateString(),
      item.status,
      new Date(item.recorded_at).toLocaleString(),
      item.marked_by_name,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Attendance Report</h1>
          <p className="mgmt-subtitle">
            View and filter attendance records across all classes and subjects in {user.school_name}.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="mgmt-btn mgmt-btn--ghost" onClick={clearFilters} disabled={reportLoading}>
            Clear Filters
          </button>
          <button className="mgmt-btn mgmt-btn--primary" onClick={exportCSV} disabled={reportLoading || !reportData?.data.length}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mgmt-detail-panel" style={{ marginBottom: "1.5rem" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)" }}>
          <h2 className="mgmt-detail-title" style={{ margin: "0 0 1rem" }}>Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Class</label>
              <select className="mgmt-input" value={filters.class_id} onChange={e => handleFilterChange("class_id", e.target.value)} disabled={reportLoading}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Subject</label>
              <select className="mgmt-input" value={filters.subject_id} onChange={e => handleFilterChange("subject_id", e.target.value)} disabled={reportLoading}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Teacher</label>
              <select className="mgmt-input" value={filters.teacher_id} onChange={e => handleFilterChange("teacher_id", e.target.value)} disabled={reportLoading}>
                <option value="">All Teachers</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Student ID</label>
              <input type="text" className="mgmt-input" placeholder="Student UUID" value={filters.student_id} onChange={e => handleFilterChange("student_id", e.target.value)} disabled={reportLoading} style={{ fontSize: "8px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Date From</label>
              <input type="date" className="mgmt-input" value={filters.date_from} onChange={e => handleFilterChange("date_from", e.target.value)} disabled={reportLoading} style={{ fontSize: "8px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)", marginBottom: "0.25rem" }}>Date To</label>
              <input type="date" className="mgmt-input" value={filters.date_to} onChange={e => handleFilterChange("date_to", e.target.value)} disabled={reportLoading} style={{ fontSize: "8px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="mgmt-detail-panel">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--ml-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="mgmt-detail-title" style={{ margin: 0 }}>Attendance Records</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "var(--ml-text-muted)" }}>
            <span>Total: {reportData?.total ?? 0} records</span>
            <select className="mgmt-input" value={filters.limit} onChange={e => handleLimitChange(Number(e.target.value))} disabled={reportLoading} style={{ width: "auto", fontSize: "8px" }}>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        <div style={{ padding: "1.25rem 1.5rem" }}>
          {reportLoading ? (
            <div className="mgmt-loading" style={{ padding: "2rem" }}>Loading report...</div>
          ) : reportData && reportData.data.length === 0 ? (
            <div className="mgmt-empty" style={{ padding: "2rem" }}>No attendance records found matching the filters.</div>
          ) : reportData ? (
            <>
              <div className="mgmt-table-wrap">
                <table className="mgmt-table mgmt-table--compact">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Grade</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Recorded At</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((item) => (
                      <tr key={`${item.class_id}-${item.student_id}-${item.attendance_date}-${item.status}`}>
                        <td className="mgmt-table-bold">{item.class_name}</td>
                        <td>{item.section || "—"}</td>
                        <td>{item.grade_level || "—"}</td>
                        <td>{item.subject_name}</td>
                        <td>{item.teacher_name || "—"}</td>
                        <td className="mgmt-table-bold">{item.student_name}</td>
                        <td>{new Date(item.attendance_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`dash-badge dash-badge--${item.status === "present" ? "success" : "error"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>{new Date(item.recorded_at).toLocaleString()}</td>
                        <td style={{ fontSize: "0.75rem" }}>{item.marked_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {reportData.total_pages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap", padding: "0 1.5rem 1.5rem" }}>
                  <button
                    className="mgmt-btn mgmt-btn--ghost"
                    onClick={() => handlePageChange(Math.max(1, (filters.page ?? 1) - 1))}
                    disabled={(filters.page ?? 1) === 1 || reportLoading}
                    style={{ fontSize: "8px", padding: "0.25rem 0.5rem" }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "8px", color: "var(--ml-text-muted)" }}>
                    Page {filters.page ?? 1} of {reportData.total_pages} ({reportData.total} records)
                  </span>
                  <button
                    className="mgmt-btn mgmt-btn--ghost"
                    onClick={() => handlePageChange(Math.min(reportData.total_pages, (filters.page ?? 1) + 1))}
                    disabled={(filters.page ?? 1) === reportData.total_pages || reportLoading}
                    style={{ fontSize: "8px", padding: "0.25rem 0.5rem" }}
                  >
                    Next
                  </button>
                </div>
              )}
</>
              ) : null}
          </div>
      </div>
    </div>
  );
}