import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { classApi, type ClassListItem } from "../../api/classes";
import { schoolYearApi } from "../../api/school-years";
import { academicPeriodApi, type AcademicPeriod } from "../../api/academicPeriods";
import { gradebookApi, type FinalizationRecord } from "../../api/gradebook";
import { getApiErrorMessage } from "../../api/client";
import Toast from "../../components/Toast";
import ActionIcon from "../../components/ActionIcon";
import Tooltip from "../../components/Tooltip";
import { COLORS } from "../../constant/colors";

type ToastState = { message: string; type: "success" | "error" } | null;

interface ClassSubject {
  id: string;
  name: string;
}

const PASS_THRESHOLD = 75;

export default function FinalizationsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [finalizations, setFinalizations] = useState<FinalizationRecord[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeScope, setFinalizeScope] = useState<"period" | "year-end">("period");
  const [finalizePeriodId, setFinalizePeriodId] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  const [correcting, setCorrecting] = useState<FinalizationRecord | null>(null);
  const [correctionGrade, setCorrectionGrade] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctingSaving, setCorrectingSaving] = useState(false);

  // Load classes for the current school year
  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    (async () => {
      try {
        const syRes = await schoolYearApi.getCurrent(schoolId);
        const currentYear = syRes.data.data;
        const [classesRes, periodsRes] = await Promise.all([
          classApi.getBySchoolId(schoolId, currentYear?.id),
          currentYear
            ? academicPeriodApi.getBySchoolAndYear(schoolId, currentYear.id)
            : Promise.resolve({ data: { data: [] as AcademicPeriod[] } }),
        ]);
        if (cancelled) return;
        setClasses(classesRes.data.data || []);
        setPeriods(periodsRes.data.data || []);
      } catch {
        if (!cancelled) setToast({ message: "Failed to load classes", type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  // Load subjects whenever the class changes
  useEffect(() => {
    if (!selectedClass) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await classApi.getFaculties(selectedClass);
        if (cancelled) return;
        const subs: ClassSubject[] = [];
        const seen = new Set<string>();
        for (const f of res.data.data || []) {
          if (f.subject_id && f.subject_name && !seen.has(f.subject_id)) {
            seen.add(f.subject_id);
            subs.push({ id: f.subject_id, name: f.subject_name });
          }
        }
        setSubjects(subs);
        setSelectedSubject(subs.length > 0 ? subs[0].id : "");
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSelectedSubject("");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClass]);

  const loadFinalizations = useCallback(async () => {
    if (!selectedClass || !selectedSubject) {
      setFinalizations([]);
      return;
    }
    setListLoading(true);
    try {
      const res = await gradebookApi.getFinalizations(selectedClass, selectedSubject);
      setFinalizations(res.data.data || []);
    } catch (err) {
      setFinalizations([]);
      setToast({ message: getApiErrorMessage(err, "Failed to load finalizations"), type: "error" });
    } finally {
      setListLoading(false);
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => { void loadFinalizations(); }, [loadFinalizations]);

  const periodName = useCallback(
    (periodId: number | null) => {
      if (periodId === null) return "Year-end";
      return periods.find(p => p.id === periodId)?.name || `Period ${periodId}`;
    },
    [periods]
  );

  const visibleFinalizations = useMemo(() => {
    if (selectedPeriod === "") return finalizations;
    if (selectedPeriod === "year-end") return finalizations.filter(f => f.period_id === null);
    return finalizations.filter(f => String(f.period_id) === selectedPeriod);
  }, [finalizations, selectedPeriod]);

  const hasSelection = Boolean(selectedClass && selectedSubject);

  const openFinalizeModal = () => {
    setFinalizeScope("period");
    setFinalizePeriodId(periods.length > 0 ? String(periods[0].id) : "");
    setShowFinalizeModal(true);
  };

  const handleFinalize = async () => {
    if (!selectedClass || !selectedSubject) return;
    if (finalizeScope === "period" && !finalizePeriodId) {
      setToast({ message: "Select an academic period to finalize", type: "error" });
      return;
    }
    setFinalizing(true);
    try {
      const res = await gradebookApi.finalizeGrades({
        class_id: selectedClass,
        subject_id: selectedSubject,
        period_id: finalizeScope === "year-end" ? null : Number(finalizePeriodId),
      });
      const count = res.data.data?.finalized_count ?? 0;
      setToast({ message: `Finalized ${count} grade${count !== 1 ? "s" : ""} successfully`, type: "success" });
      setShowFinalizeModal(false);
      await loadFinalizations();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to finalize grades"), type: "error" });
    } finally {
      setFinalizing(false);
    }
  };

  const openCorrection = (row: FinalizationRecord) => {
    setCorrecting(row);
    setCorrectionGrade(row.final_grade === null ? "" : String(row.final_grade));
    setCorrectionReason("");
  };

  const handleCorrection = async () => {
    if (!correcting) return;
    if (!correctionReason.trim()) {
      setToast({ message: "Correction reason is required", type: "error" });
      return;
    }
    if (correctionGrade !== "") {
      const num = Number(correctionGrade);
      if (isNaN(num) || num < 0 || num > 100) {
        setToast({ message: "Final grade must be between 0 and 100", type: "error" });
        return;
      }
    }
    setCorrectingSaving(true);
    try {
      await gradebookApi.correctFinalization(correcting.id, {
        final_grade: correctionGrade === "" ? null : Number(correctionGrade),
        reason: correctionReason.trim(),
      });
      setToast({ message: "Finalized grade corrected successfully", type: "success" });
      setCorrecting(null);
      await loadFinalizations();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to correct finalization"), type: "error" });
    } finally {
      setCorrectingSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mgmt-page">
        <div className="mgmt-loading">Loading finalizations...</div>
      </div>
    );
  }

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Finalizations</h1>
          <p className="mgmt-subtitle">Finalize period or year-end grades and correct finalized records.</p>
        </div>
        <div className="ar-toolbar-actions" style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="mgmt-btn mgmt-btn--primary"
            onClick={openFinalizeModal}
            disabled={!hasSelection}
            type="button"
          >
            Finalize Grades
          </button>
        </div>
      </div>

      <div className="mgmt-filters">
        <div className="mgmt-filters-field">
          <label className="mgmt-label">Class</label>
          <select
            className="mgmt-input"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSubjects([]);
              setSelectedSubject("");
            }}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
                {c.section ? ` · ${c.section}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="mgmt-filters-field">
          <label className="mgmt-label">Subject</label>
          <select
            className="mgmt-input"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass || subjects.length === 0}
          >
            <option value="">{selectedClass ? (subjects.length > 0 ? "Select a subject" : "No subjects") : "Select a class first"}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="mgmt-filters-field">
          <label className="mgmt-label">Period</label>
          <select
            className="mgmt-input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="">All Periods</option>
            {periods.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
            <option value="year-end">Year-end</option>
          </select>
        </div>
        <div className="mgmt-filters-foot">
          <span className="mgmt-filters-count">
            {hasSelection ? `${visibleFinalizations.length} finalized record${visibleFinalizations.length !== 1 ? "s" : ""}` : "Select a class and subject to view finalizations"}
          </span>
        </div>
      </div>

      {!hasSelection ? (
        <div className="mgmt-empty">Select a class and subject to view finalized grades.</div>
      ) : listLoading ? (
        <div className="mgmt-loading">Loading finalizations...</div>
      ) : visibleFinalizations.length === 0 ? (
        <div className="mgmt-empty">No finalized grades found for this selection. Use <strong>Finalize Grades</strong> to freeze a period.</div>
      ) : (
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>LRN</th>
                <th>Period</th>
                <th>Final Grade</th>
                <th>Remarks</th>
                <th>Finalized</th>
                <th>Last Corrected</th>
                <th>Correction Reason</th>
                <th className="mgmt-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleFinalizations.map((row) => {
                const passed = row.final_grade !== null && row.final_grade >= PASS_THRESHOLD;
                return (
                  <tr key={row.id}>
                    <td className="mgmt-table-bold">{row.student_name}</td>
                    <td>{row.student_lrn || "—"}</td>
                    <td>{periodName(row.period_id)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: row.final_grade === null ? "var(--ml-text-muted)" : passed ? COLORS.success : COLORS.error }}>
                        {row.final_grade === null ? "—" : row.final_grade.toFixed(2)}
                      </span>
                    </td>
                    <td>{row.final_grade === null ? "—" : passed ? "Passed" : "Failed"}</td>
                    <td>{row.finalized_at ? new Date(row.finalized_at).toLocaleDateString() : "—"}</td>
                    <td>{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "—"}</td>
                    <td>{row.correction_reason || "—"}</td>
                    <td className="mgmt-table-actions">
                      <Tooltip label="Correct finalized grade">
                        <button
                          className="mgmt-action mgmt-action--edit mgmt-action--icon"
                          aria-label="Correct finalized grade"
                          onClick={() => openCorrection(row)}
                        >
                          <ActionIcon name="edit" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowFinalizeModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "28rem" }}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">Finalize Grades</h3>
              <button className="mgmt-modal-close" onClick={() => setShowFinalizeModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>
                Finalizing freezes the computed final grades for all enrolled students. Grade items, scores, and grading weights can no longer be changed afterwards.
              </p>
              <div className="mgmt-form">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Scope</label>
                  <select
                    className="mgmt-input"
                    value={finalizeScope}
                    onChange={(e) => setFinalizeScope(e.target.value as "period" | "year-end")}
                  >
                    <option value="period">Academic Period</option>
                    <option value="year-end">Year-end</option>
                  </select>
                </div>
                {finalizeScope === "period" && (
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Academic Period</label>
                    <select
                      className="mgmt-input"
                      value={finalizePeriodId}
                      onChange={(e) => setFinalizePeriodId(e.target.value)}
                    >
                      <option value="" disabled>Select academic period</option>
                      {periods.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="mgmt-modal-actions" style={{ padding: "1rem 1.5rem" }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowFinalizeModal(false)}>Cancel</button>
              <button className="mgmt-btn mgmt-btn--primary" onClick={handleFinalize} disabled={finalizing}>
                {finalizing ? "Finalizing..." : "Finalize Grades"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correcting && (
        <div className="mgmt-modal-overlay" onClick={() => setCorrecting(null)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "28rem" }}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">Correct Finalized Grade</h3>
              <button className="mgmt-modal-close" onClick={() => setCorrecting(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>
                Correcting <strong>{correcting.student_name}</strong> · {periodName(correcting.period_id)}
              </p>
              <div className="mgmt-form">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Final Grade (0–100)</label>
                  <input
                    type="number"
                    className="mgmt-input"
                    value={correctionGrade}
                    onChange={(e) => setCorrectionGrade(e.target.value)}
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Leave blank to clear"
                  />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Reason for Correction</label>
                  <textarea
                    className="mgmt-input"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this finalized grade is being changed"
                  />
                </div>
              </div>
            </div>
            <div className="mgmt-modal-actions" style={{ padding: "1rem 1.5rem" }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setCorrecting(null)}>Cancel</button>
              <button className="mgmt-btn mgmt-btn--primary" onClick={handleCorrection} disabled={correctingSaving}>
                {correctingSaving ? "Saving..." : "Save Correction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
