import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../api/client";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import {
  teachingModuleApi,
  type EligibleClassroom,
  type ModuleActivityTemplate,
  type ModuleActivityTemplatePayload,
  type ModuleListItem,
  type ModuleStatus,
  type TeacherModuleDetail,
  type TeacherModulePayload,
} from "../../api/modules";
import type { GradeItemCategory } from "../../api/gradebook";
import { classModuleApi } from "../../api/classModules";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

const CATEGORY_OPTIONS: { value: GradeItemCategory; label: string }[] = [
  { value: "activities", label: "Activity" },
  { value: "quizzes", label: "Quiz" },
  { value: "exams", label: "Exam" },
];

const STATUS_LABEL: Record<ModuleStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const EMPTY_MODULE_FORM = {
  title: "",
  subject_id: "",
  description: "",
  lesson_content: "",
  status: "draft" as ModuleStatus,
};

const EMPTY_TEMPLATE_FORM = {
  title: "",
  category: "activities" as GradeItemCategory,
  max_score: "100",
  instructions: "",
  sort_order: "0",
};

export default function MyModulesPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeacherModuleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleListItem | null>(null);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [savingModule, setSavingModule] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ModuleActivityTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showReuseModal, setShowReuseModal] = useState(false);
  const [reuseModuleId, setReuseModuleId] = useState<string | null>(null);
  const [eligible, setEligible] = useState<EligibleClassroom[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<ModuleListItem | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchModules = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const filters: { q?: string; status?: string; subject_id?: string } = {};
      if (query.trim()) filters.q = query.trim();
      if (statusFilter) filters.status = statusFilter;
      if (subjectFilter) filters.subject_id = subjectFilter;
      const res = await teachingModuleApi.listMine(filters);
      setModules(res.data.data || []);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to load modules"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId, query, statusFilter, subjectFilter]);

  useEffect(() => {
    if (!schoolId) return;
    subjectApi.getAssigned()
      .then((res) => setSubjects(res.data.data || []))
      .catch(() => setSubjects([]));
  }, [schoolId]);

  useEffect(() => {
    const timer = setTimeout(fetchModules, 250);
    return () => clearTimeout(timer);
  }, [fetchModules]);

  const fetchDetail = useCallback(async (moduleId: string, quiet = false) => {
    if (!quiet) setDetailLoading(true);
    try {
      const res = await teachingModuleApi.getMine(moduleId);
      setDetail(res.data.data || null);
    } catch (err) {
      setDetail(null);
      if (!quiet) setToast({ message: getApiErrorMessage(err, "Failed to load module"), type: "error" });
    } finally {
      if (!quiet) setDetailLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
    else setDetail(null);
  }, [selectedId, fetchDetail]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const groupedAssignments = useMemo(() => {
    const groups = new Map<string, TeacherModuleDetail["assignments"]>();
    for (const assignment of detail?.assignments || []) {
      const key = assignment.school_year_name || String(assignment.school_year_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(assignment);
    }
    return Array.from(groups.entries());
  }, [detail]);

  const eligibleGroups = useMemo(() => {
    const groups = new Map<string, EligibleClassroom[]>();
    for (const room of eligible) {
      const key = room.school_year_name || String(room.school_year_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(room);
    }
    return Array.from(groups.entries());
  }, [eligible]);

  const modalSubjects = useMemo(() => {
    if (editingModule && editingModule.subject_id && !subjects.some((s) => s.id === editingModule.subject_id)) {
      return [
        {
          id: editingModule.subject_id,
          name: `${editingModule.subject || "Current Subject"} (Current)`,
          subject_code: null,
          description: null,
          school_id: schoolId,
          admin_id: "",
          created_at: "",
          updated_at: null,
        },
        ...subjects,
      ];
    }
    return subjects;
  }, [editingModule, subjects, schoolId]);

  const openCreate = () => {
    setEditingModule(null);
    setModuleForm(EMPTY_MODULE_FORM);
    setShowModuleModal(true);
  };

  const openEdit = (module: ModuleListItem) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      subject_id: module.subject_id || "",
      description: module.description || "",
      lesson_content: module.lesson_content || "",
      status: module.status || "draft",
    });
    setShowModuleModal(true);
  };

  const submitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    if (!moduleForm.subject_id) {
      setToast({ message: "Subject is required", type: "error" });
      return;
    }
    setSavingModule(true);
    try {
      const payload: TeacherModulePayload = {
        title: moduleForm.title.trim(),
        subject_id: moduleForm.subject_id,
        description: moduleForm.description.trim() || null,
        lesson_content: moduleForm.lesson_content.trim() || null,
        status: moduleForm.status,
      };
      if (editingModule) {
        await teachingModuleApi.updateMine(editingModule.id, payload);
        setToast({ message: "Module updated", type: "success" });
        await fetchDetail(editingModule.id, true);
      } else {
        const res = await teachingModuleApi.createMine(payload);
        const newId = res.data.data?.id;
        setToast({ message: "Module created", type: "success" });
        if (newId) setSelectedId(newId);
      }
      setShowModuleModal(false);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to save module"), type: "error" });
    } finally {
      setSavingModule(false);
    }
  };

  const toggleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const nextStatus: ModuleStatus = archiveTarget.status === "archived" ? "published" : "archived";
      await teachingModuleApi.updateMine(archiveTarget.id, { status: nextStatus });
      setToast({ message: nextStatus === "archived" ? "Module archived" : "Module restored", type: "success" });
      setArchiveTarget(null);
      await fetchModules();
      if (selectedId === archiveTarget.id) await fetchDetail(archiveTarget.id, true);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to update module status"), type: "error" });
    } finally {
      setArchiving(false);
    }
  };

  const openTemplateCreate = () => {
    setEditingTemplate(null);
    setTemplateForm(EMPTY_TEMPLATE_FORM);
    setShowTemplateModal(true);
  };

  const openTemplateEdit = (template: ModuleActivityTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      category: template.category,
      max_score: String(template.max_score),
      instructions: template.instructions || "",
      sort_order: String(template.sort_order ?? 0),
    });
    setShowTemplateModal(true);
  };

  const submitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!templateForm.title.trim()) {
      setToast({ message: "Template title is required", type: "error" });
      return;
    }
    const maxScore = Number(templateForm.max_score);
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setToast({ message: "Max score must be greater than zero", type: "error" });
      return;
    }
    const sortOrder = Number(templateForm.sort_order);
    if (!Number.isInteger(sortOrder)) {
      setToast({ message: "Sort order must be an integer", type: "error" });
      return;
    }
    setSavingTemplate(true);
    try {
      const payload: ModuleActivityTemplatePayload = {
        title: templateForm.title.trim(),
        category: templateForm.category,
        max_score: maxScore,
        instructions: templateForm.instructions.trim() || null,
        sort_order: sortOrder,
      };
      if (editingTemplate) {
        await teachingModuleApi.updateTemplate(selectedId, editingTemplate.id, payload);
        setToast({ message: "Template updated", type: "success" });
      } else {
        await teachingModuleApi.createTemplate(selectedId, payload);
        setToast({ message: "Template added", type: "success" });
      }
      setShowTemplateModal(false);
      await fetchDetail(selectedId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to save template"), type: "error" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (template: ModuleActivityTemplate) => {
    if (!selectedId || !confirm(`Delete template "${template.title}"? Existing activities are preserved.`)) return;
    try {
      await teachingModuleApi.deleteTemplate(selectedId, template.id);
      setToast({ message: "Template deleted", type: "success" });
      await fetchDetail(selectedId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to delete template"), type: "error" });
    }
  };

  const openReuse = async (moduleId?: string) => {
    const targetId = moduleId || selectedId;
    if (!targetId) return;
    setReuseModuleId(targetId);
    setShowReuseModal(true);
    setEligible([]);
    setEligibleLoading(true);
    try {
      const res = await teachingModuleApi.getEligibleClassrooms(targetId);
      setEligible(res.data.data || []);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to load classrooms"), type: "error" });
    } finally {
      setEligibleLoading(false);
    }
  };

  const assignToClassroom = async (room: EligibleClassroom) => {
    if (!reuseModuleId || room.already_assigned) return;
    setAssigningId(room.classroom_id);
    try {
      await classModuleApi.assign({
        module_id: reuseModuleId,
        classroom_id: room.classroom_id,
        school_year_id: room.school_year_id,
      });
      setToast({ message: `Module assigned to ${room.class_name}`, type: "success" });
      const res = await teachingModuleApi.getEligibleClassrooms(reuseModuleId);
      setEligible(res.data.data || []);
      if (selectedId === reuseModuleId) await fetchDetail(reuseModuleId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to assign module"), type: "error" });
    } finally {
      setAssigningId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">My Modules</h1>
          <p className="mgmt-subtitle">Create reusable lesson modules, then assign them to your classrooms.</p>
        </div>
        <button className="mgmt-btn mgmt-btn--primary" onClick={openCreate}>+ New Module</button>
      </div>

      <div className="module-filter-bar">
        <input
          className="mgmt-input"
          placeholder="Search modules..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="mgmt-input mgmt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select className="mgmt-input mgmt-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="module-layout">
        <div className="module-list-panel">
          {loading ? (
            <div className="mgmt-loading">Loading modules...</div>
          ) : modules.length === 0 ? (
            <div className="mgmt-empty">No modules yet. Create your first reusable module.</div>
          ) : (
            <div className="module-card-grid">
              {modules.map((module) => (
                <article
                  key={module.id}
                  className={`module-card${selectedId === module.id ? " module-card--selected" : ""}`}
                  onClick={() => setSelectedId(module.id)}
                >
                  <div className="module-card__head">
                    <h3 className="module-card__title">{module.title}</h3>
                    <span className={`module-status module-status--${module.status}`}>{STATUS_LABEL[module.status]}</span>
                  </div>
                  <span className="module-card__subject">{module.subject}</span>
                  <p className="module-card__description">{module.description || "No description"}</p>
                  <div className="module-card__meta">
                    <span>{module.template_count ?? 0} templates</span>
                    <span>{module.assignment_count ?? 0} classes</span>
                    <span>{module.updated_at ? new Date(module.updated_at).toLocaleDateString() : new Date(module.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="module-card__actions">
                    <button className="mgmt-action mgmt-action--edit" onClick={(e) => { e.stopPropagation(); openEdit(module); }}>Edit</button>
                    <button
                      className="mgmt-action"
                      disabled={module.status === "archived"}
                      title={module.status === "archived" ? "Restore the module before assigning it" : "Assign to a classroom"}
                      onClick={(e) => { e.stopPropagation(); void openReuse(module.id); }}
                    >
                      Reuse
                    </button>
                    <button
                      className={`mgmt-action ${module.status === "archived" ? "mgmt-action--edit" : "mgmt-action--delete"}`}
                      onClick={(e) => { e.stopPropagation(); setArchiveTarget(module); }}
                    >
                      {module.status === "archived" ? "Restore" : "Archive"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="module-detail-panel">
          {!selectedId ? (
            <div className="mgmt-empty">Select a module to view its lesson content, templates, and assignments.</div>
          ) : detailLoading ? (
            <div className="mgmt-loading">Loading module...</div>
          ) : !detail ? (
            <div className="mgmt-empty">Module not found.</div>
          ) : (
            <>
              <div className="module-detail-header">
                <div>
                  <div className="module-detail-title-row">
                    <h2 className="mgmt-detail-title">{detail.module.title}</h2>
                    <span className={`module-status module-status--${detail.module.status}`}>{STATUS_LABEL[detail.module.status]}</span>
                  </div>
                  <p className="mgmt-subtitle">{detail.module.subject}{detail.module.description ? ` · ${detail.module.description}` : ""}</p>
                </div>
                <div className="module-detail-actions">
                  <button className="mgmt-btn mgmt-btn--primary" onClick={() => openReuse(detail.module.id)} disabled={detail.module.status === "archived"}>Reuse</button>
                  <button className="mgmt-btn mgmt-btn--ghost" onClick={() => openEdit(detail.module)}>Edit</button>
                </div>
              </div>

              <section className="module-section">
                <h3 className="module-section__title">Lesson Content</h3>
                {detail.module.lesson_content ? (
                  <div className="module-lesson-content">{detail.module.lesson_content}</div>
                ) : (
                  <p className="module-muted">No lesson content added yet.</p>
                )}
              </section>

              <section className="module-section">
                <div className="module-section__head">
                  <h3 className="module-section__title">Activity Templates</h3>
                  <button className="mgmt-btn mgmt-btn--ghost" onClick={openTemplateCreate}>+ Add Template</button>
                </div>
                {detail.templates.length === 0 ? (
                  <p className="module-muted">No activity templates yet.</p>
                ) : (
                  <div className="module-template-list">
                    {detail.templates.map((template) => (
                      <div key={template.id} className="module-template">
                        <div>
                          <div className="module-template__title-row">
                            <strong>{template.title}</strong>
                            <span className={`module-status module-status--${template.category}`}>{CATEGORY_OPTIONS.find(c => c.value === template.category)?.label || template.category}</span>
                            <span className="module-muted">Max {template.max_score}</span>
                          </div>
                          {template.instructions && <p className="module-template__instructions">{template.instructions}</p>}
                        </div>
                        <div className="module-template__actions">
                          <button className="mgmt-action mgmt-action--edit" onClick={() => openTemplateEdit(template)}>Edit</button>
                          <button className="mgmt-action mgmt-action--delete" onClick={() => deleteTemplate(template)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="module-section">
                <h3 className="module-section__title">Assigned Classes</h3>
                {groupedAssignments.length === 0 ? (
                  <p className="module-muted">This module has not been assigned to a class yet.</p>
                ) : (
                  groupedAssignments.map(([year, assignments]) => (
                    <div key={year} className="module-assignment-group">
                      <h4 className="module-assignment-group__title">{year}</h4>
                      <div className="module-assignment-list">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="module-assignment">
                            <span>{assignment.class_name}</span>
                            <span className="module-muted">Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {showModuleModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowModuleModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">{editingModule ? "Edit Module" : "New Module"}</h2>
              <button className="mgmt-modal-close" onClick={() => setShowModuleModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitModule} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Title *</label>
                  <input className="mgmt-input" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Subject *</label>
                  <select
                    className="mgmt-input mgmt-select"
                    value={moduleForm.subject_id}
                    onChange={(e) => setModuleForm({ ...moduleForm, subject_id: e.target.value })}
                    required
                    disabled={modalSubjects.length === 0}
                  >
                    <option value="">
                      {modalSubjects.length === 0 ? "No assigned subjects available" : "Select subject"}
                    </option>
                    {modalSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {modalSubjects.length === 0 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--ml-text-muted)", marginTop: "4px", display: "block" }}>
                      You have no subjects assigned to you. Please ask your school administrator to assign you to a subject or class.
                    </span>
                  )}
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Status</label>
                  <select className="mgmt-input mgmt-select" value={moduleForm.status} onChange={(e) => setModuleForm({ ...moduleForm, status: e.target.value as ModuleStatus })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Description</label>
                  <textarea className="mgmt-input mgmt-textarea" rows={3} value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} />
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Lesson Content</label>
                  <textarea className="mgmt-input mgmt-textarea" rows={7} value={moduleForm.lesson_content} onChange={(e) => setModuleForm({ ...moduleForm, lesson_content: e.target.value })} />
                </div>
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowModuleModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={savingModule || (!editingModule && modalSubjects.length === 0)}
                >
                  {savingModule ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">{editingTemplate ? "Edit Template" : "Add Template"}</h2>
              <button className="mgmt-modal-close" onClick={() => setShowTemplateModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitTemplate} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Title *</label>
                  <input className="mgmt-input" value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} required />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Category</label>
                  <select className="mgmt-input mgmt-select" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as GradeItemCategory })}>
                    {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Max Score *</label>
                  <input className="mgmt-input" type="number" min="0.01" step="0.01" value={templateForm.max_score} onChange={(e) => setTemplateForm({ ...templateForm, max_score: e.target.value })} required />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Sort Order</label>
                  <input className="mgmt-input" type="number" step="1" value={templateForm.sort_order} onChange={(e) => setTemplateForm({ ...templateForm, sort_order: e.target.value })} />
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Instructions</label>
                  <textarea className="mgmt-input mgmt-textarea" rows={4} value={templateForm.instructions} onChange={(e) => setTemplateForm({ ...templateForm, instructions: e.target.value })} />
                </div>
              </div>
              <div className="mgmt-modal-actions">
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button type="submit" className="mgmt-btn mgmt-btn--primary" disabled={savingTemplate}>{savingTemplate ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReuseModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowReuseModal(false)}>
          <div className="mgmt-modal mgmt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Assign Module to a Class</h2>
              <button className="mgmt-modal-close" onClick={() => setShowReuseModal(false)} aria-label="Close">×</button>
            </div>
            {eligibleLoading ? (
              <div className="mgmt-loading">Loading classrooms...</div>
            ) : eligible.length === 0 ? (
              <div className="mgmt-empty">No eligible classrooms. You must teach this module's subject in a class for the school year.</div>
            ) : (
              <div className="module-eligible-list">
                {eligibleGroups.map(([year, rooms]) => (
                  <div key={year} className="module-assignment-group">
                    <h4 className="module-assignment-group__title">{year}</h4>
                    {rooms.map((room) => (
                      <div key={room.classroom_id} className="module-eligible">
                        <div>
                          <strong>{room.class_name}</strong>
                          <span className="module-muted">{[room.grade_level, room.section ? `Section ${room.section}` : null].filter(Boolean).join(" · ")}</span>
                        </div>
                        {room.already_assigned ? (
                          <span className="module-status module-status--published">Assigned</span>
                        ) : (
                          <button
                            className="mgmt-btn mgmt-btn--primary"
                            disabled={assigningId === room.classroom_id}
                            onClick={() => assignToClassroom(room)}
                          >
                            {assigningId === room.classroom_id ? "Assigning..." : "Assign"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {archiveTarget && (
        <div className="mgmt-modal-overlay" onClick={() => setArchiveTarget(null)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">{archiveTarget.status === "archived" ? "Restore Module" : "Archive Module"}</h2>
              <button className="mgmt-modal-close" onClick={() => setArchiveTarget(null)} aria-label="Close">×</button>
            </div>
            <div className="mgmt-form">
              <p style={{ margin: 0, color: "var(--ml-text-muted)", lineHeight: 1.6 }}>
                {archiveTarget.status === "archived"
                  ? `Restore "${archiveTarget.title}" so it can be assigned again?`
                  : `Archive "${archiveTarget.title}"? Assignments, activities, and grades are preserved.`}
              </p>
              <div className="mgmt-modal-actions">
                <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setArchiveTarget(null)}>Cancel</button>
                <button className={`mgmt-btn ${archiveTarget.status === "archived" ? "mgmt-btn--primary" : "mgmt-btn--danger"}`} disabled={archiving} onClick={toggleArchive}>
                  {archiving ? "Saving..." : archiveTarget.status === "archived" ? "Restore" : "Archive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
