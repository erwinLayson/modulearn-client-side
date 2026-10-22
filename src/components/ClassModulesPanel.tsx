import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/client";
import { academicPeriodApi } from "../api/academicPeriods";
import { classModuleApi, type ClassModuleItem } from "../api/classModules";
import Toast from "./Toast";
import PeriodSelector from "./PeriodSelector";

interface ClassModulesPanelProps {
  classId: string;
  schoolYearId: number;
  schoolId: number;
}

type ToastState = { message: string; type: "success" | "error" } | null;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export default function ClassModulesPanel({ classId, schoolYearId, schoolId }: ClassModulesPanelProps) {
  const [modules, setModules] = useState<ClassModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [periodId, setPeriodId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [periodHint, setPeriodHint] = useState("");

  const loadModules = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await classModuleApi.getForClass(classId);
      setModules(res.data.data || []);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to load class modules"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadModules(); }, [loadModules]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );
  const selectedTemplate = useMemo(
    () => selectedModule?.templates.find((t) => t.id === selectedTemplateId) || null,
    [selectedModule, selectedTemplateId]
  );

  const applyTemplate = (module: ClassModuleItem, templateId: string) => {
    const template = module.templates.find((t) => t.id === templateId);
    setSelectedTemplateId(templateId);
    setActivityTitle(template?.title || "");
    setMaxScore(template ? String(template.max_score) : "");
  };

  const openCreate = (module: ClassModuleItem, templateId?: string) => {
    setSelectedModuleId(module.id);
    const tid = templateId || module.templates[0]?.id || "";
    setSelectedTemplateId(tid);
    const template = module.templates.find((t) => t.id === tid);
    setActivityTitle(template?.title || "");
    setMaxScore(template ? String(template.max_score) : "");
    setDueDate("");
    setPeriodId("");
    setPeriodHint("");
    setShowCreate(true);
  };

  useEffect(() => {
    if (!showCreate || !schoolYearId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await academicPeriodApi.getBySchoolAndYear(schoolId, schoolYearId);
        if (cancelled) return;
        const periods = res.data.data || [];
        const current = periods.find((p) => p.is_current === 1);
        const first = periods.slice().sort((a, b) => a.period_number - b.period_number)[0];
        const preferred = current || first;
        if (preferred) {
          setPeriodId(String(preferred.id));
          setPeriodHint("");
        } else {
          setPeriodHint("No academic periods are configured for this school year.");
        }
      } catch {
        if (!cancelled) setPeriodHint("No academic periods are configured for this school year.");
      }
    })();
    return () => { cancelled = true; };
  }, [showCreate, schoolId, schoolYearId]);

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !selectedTemplateId) {
      setToast({ message: "Select an activity template", type: "error" });
      return;
    }
    if (!periodId) {
      setToast({ message: "Academic period is required", type: "error" });
      return;
    }
    if (!activityTitle.trim()) {
      setToast({ message: "Activity title is required", type: "error" });
      return;
    }
    const score = Number(maxScore);
    if (!Number.isFinite(score) || score <= 0) {
      setToast({ message: "Max score must be greater than zero", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await classModuleApi.instantiate(selectedModuleId, {
        template_id: selectedTemplateId,
        period_id: Number(periodId),
        due_date: dueDate || null,
        title: activityTitle.trim(),
        max_score: score,
      });
      setToast({ message: "Activity created. It is now available in the gradebook.", type: "success" });
      setShowCreate(false);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to create activity"), type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="class-modules-panel">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="module-section__head">
        <div>
          <h3 className="module-section__title">Class Modules</h3>
          <p className="module-muted" style={{ margin: "0.25rem 0 0" }}>
            Reusable modules assigned to this class. Create independent activities from their templates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading" style={{ padding: "1.5rem" }}>Loading modules...</div>
      ) : modules.length === 0 ? (
        <div className="mgmt-empty" style={{ padding: "1.5rem" }}>
          No modules assigned to this class. Assign one from My Modules.
        </div>
      ) : (
        <div className="class-module-grid">
          {modules.map((module) => (
            <article key={module.id} className="class-module-card">
              <div className="module-card__head">
                <h4 className="module-card__title">{module.title}</h4>
                <span className={`module-status module-status--${module.status}`}>
                  {STATUS_LABEL[module.status] || module.status}
                </span>
              </div>
              <div className="module-card__meta">
                <span>{module.subject_name}</span>
                <span>{module.school_year_name}</span>
                <span>{module.templates.length} templates</span>
              </div>

              {module.templates.length === 0 ? (
                <p className="module-muted">No activity templates.</p>
              ) : (
                <div className="class-module-templates">
                  {module.templates.map((template) => (
                    <div key={template.id} className="class-module-template">
                      <div>
                        <strong>{template.title}</strong>
                        <span className="module-muted"> · {template.category} · max {template.max_score}</span>
                      </div>
                      <button className="mgmt-action mgmt-action--edit" onClick={() => openCreate(module, template.id)}>
                        Create Activity
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {showCreate && selectedModule && (
        <div className="mgmt-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="mgmt-modal mgmt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Create Activity from Template</h2>
              <button className="mgmt-modal-close" onClick={() => setShowCreate(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitActivity} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Template *</label>
                  <select
                    className="mgmt-input mgmt-select"
                    value={selectedTemplateId || ""}
                    onChange={(e) => applyTemplate(selectedModule, e.target.value)}
                    required
                  >
                    <option value="">Select template</option>
                    {selectedModule.templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mgmt-form-row">
                  <PeriodSelector
                    schoolId={schoolId}
                    schoolYearId={schoolYearId}
                    value={periodId}
                    onChange={setPeriodId}
                    showAllOption={false}
                    disabled={!selectedModuleId}
                  />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Due Date</label>
                  <input className="mgmt-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Activity Title *</label>
                  <input className="mgmt-input" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} required />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Max Score *</label>
                  <input className="mgmt-input" type="number" min="0.01" step="0.01" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} required />
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Instructions (copied from template)</label>
                  <div className="module-instructions-preview">
                    {selectedTemplate?.instructions || "No instructions provided."}
                  </div>
                </div>
                {periodHint && <div className="mgmt-form-row mgmt-form-row--full"><p className="module-muted">{periodHint}</p></div>}
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="mgmt-btn mgmt-btn--primary" disabled={submitting}>{submitting ? "Creating..." : "Create Activity"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
