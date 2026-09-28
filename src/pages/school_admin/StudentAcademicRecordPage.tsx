import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi, type AcademicRecordResponse } from "../../api/students";
import { useAuth } from "../../context/AuthContext";
import AcademicRecordSheet from "../../components/AcademicRecordSheet";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;
type Scope = "current" | "all";

export default function StudentAcademicRecordPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Advisers reach the record from their advisory class list, not the students page.
  const backPath = user?.role === "faculty" ? "/dashboard/classes" : "/dashboard/students";
  const [scope, setScope] = useState<Scope>("current");
  const [record, setRecord] = useState<AcademicRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studentId) return;
      try {
        const { data } = await studentApi.getAcademicRecord(studentId, scope);
        if (!cancelled) setRecord(data.data);
      } catch {
        if (!cancelled) setToast({ message: "Failed to load academic record", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, scope]);

  const changeScope = (next: Scope) => {
    if (next === scope) return;
    setLoading(true);
    setRecord(null);
    setScope(next);
  };

  return (
    <div className="mgmt-page ar-page">
      <div className="mgmt-header ar-toolbar no-print">
        <div>
          <h1 className="mgmt-title">Student Academic Record</h1>
          <p className="mgmt-subtitle">Print-ready historical grades and enrollment</p>
        </div>
        <div className="ar-toolbar-actions">
          <button className="mgmt-action mgmt-action--edit" onClick={() => navigate(backPath)}>
            Back
          </button>
          <div className="ar-scope-toggle" role="group" aria-label="Scope">
            <button
              className={`ar-scope-btn ${scope === "current" ? "ar-scope-btn--active" : ""}`}
              onClick={() => changeScope("current")}
              type="button"
            >
              Current Year
            </button>
            <button
              className={`ar-scope-btn ${scope === "all" ? "ar-scope-btn--active" : ""}`}
              onClick={() => changeScope("all")}
              type="button"
            >
              All Years
            </button>
          </div>
          <button className="mgmt-action mgmt-action--edit" onClick={() => window.print()} type="button">
            Print
          </button>
        </div>
      </div>

      {loading && <div className="mgmt-loading">Loading academic record…</div>}

      {!loading && !record && (
        <div className="mgmt-empty">No academic record found for this student.</div>
      )}

      {!loading && record && <AcademicRecordSheet record={record} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
    </div>
  );
}
