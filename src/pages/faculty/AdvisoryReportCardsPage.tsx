import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { classApi, type ClassListItem } from "../../api/classes";
import { enrollmentApi } from "../../api/enrollments";
import { schoolYearApi } from "../../api/school-years";
import { studentApi, type AcademicRecordResponse } from "../../api/students";
import AcademicRecordSheet from "../../components/AcademicRecordSheet";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;
type Scope = "current" | "all";

/** A loaded report card, or a student whose record could not be read. */
interface BatchEntry {
  student_id: string;
  student_name: string;
  record: AcademicRecordResponse | null;
  error: string | null;
}

const FETCH_BATCH_SIZE = 4;

export default function AdvisoryReportCardsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scope, setScope] = useState<Scope>("current");
  const [cls, setCls] = useState<ClassListItem | null>(null);
  const [schoolYearName, setSchoolYearName] = useState<string | null>(null);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const backPath = "/dashboard/classes";

  const loadAll = useCallback(async () => {
    if (!classId || !user?.school_id) return;
    setLoading(true);
    setEntries([]);
    setLoadedCount(0);

    try {
      const [classRes, syRes] = await Promise.all([
        classApi.getById(classId),
        schoolYearApi.getCurrent(user.school_id),
      ]);
      const detail = classRes.data.data;
      setCls(detail);

      const currentYear = syRes.data.data;
      if (!currentYear) {
        setSchoolYearName(null);
        setTotalCount(0);
        setToast({ message: "No current school year set for this school", type: "error" });
        return;
      }
      setSchoolYearName(currentYear.name);

      const enrollRes = await enrollmentApi.getByClassAndSchoolYear(classId, currentYear.id);
      const students = (enrollRes.data.data || []).map((e) => ({
        student_id: e.student_id,
        student_name: e.student_name,
      }));
      setTotalCount(students.length);

      for (let i = 0; i < students.length; i += FETCH_BATCH_SIZE) {
        const chunk = students.slice(i, i + FETCH_BATCH_SIZE);
        const results = await Promise.all(
          chunk.map(async (student): Promise<BatchEntry> => {
            try {
              const res = await studentApi.getAcademicRecord(student.student_id, scope);
              return { ...student, record: res.data.data, error: null };
            } catch {
              return { ...student, record: null, error: "Could not load this report card" };
            }
          })
        );
        setEntries((prev) => [...prev, ...results]);
        setLoadedCount((prev) => prev + results.length);
      }
    } catch {
      setToast({ message: "Failed to load the class report cards", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [classId, user?.school_id, scope]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const changeScope = (next: Scope) => {
    if (next === scope) return;
    setScope(next);
  };

  const printable = entries.filter((e) => e.record);
  const failed = entries.filter((e) => e.error);
  const ready = !loading && printable.length > 0;
  const title = cls
    ? [cls.class_name, cls.grade_level, cls.section ? `Section ${cls.section}` : null].filter(Boolean).join(" · ")
    : "Advisory class";

  return (
    <div className="mgmt-page ar-page">
      <div className="mgmt-header ar-toolbar no-print">
        <div>
          <h1 className="mgmt-title">Class Report Cards</h1>
          <p className="mgmt-subtitle">
            {title}
            {schoolYearName ? ` · School Year ${schoolYearName}` : ""}
            {totalCount > 0 ? ` · ${printable.length} of ${totalCount} loaded` : ""}
          </p>
        </div>
        <div className="ar-toolbar-actions">
          <button className="mgmt-action mgmt-action--edit" onClick={() => navigate(backPath)} type="button">
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
          <button
            className="mgmt-action mgmt-action--edit"
            onClick={() => window.print()}
            disabled={!ready}
            type="button"
          >
            Print All
          </button>
        </div>
      </div>

      {loading && (
        <div className="mgmt-loading">
          Loading report cards… {totalCount > 0 ? `${loadedCount} of ${totalCount}` : ""}
        </div>
      )}

      {!loading && totalCount === 0 && !failed.length && (
        <div className="mgmt-empty">No students enrolled in this class for the current school year.</div>
      )}

      {failed.length > 0 && (
        <div className="mgmt-empty no-print" role="alert">
          {failed.length} report card{failed.length !== 1 ? "s" : ""} could not be loaded:{" "}
          {failed.map((f) => f.student_name).join(", ")}
        </div>
      )}

      {printable.length > 0 && (
        <div className="ar-batch">
          {printable.map((entry) => (
            <div className="ar-batch-item" key={entry.student_id}>
              <AcademicRecordSheet record={entry.record!} />
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
    </div>
  );
}
