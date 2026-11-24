import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LearningMaterialsLibrary from "../../components/faculty/materials/LearningMaterialsLibrary";
import AssessmentLibraryTable from "../../components/faculty/assessments/AssessmentLibraryTable";
import {
  loadModules,
  loadAssignedSubjects,
  loadFacultyClasses,
  loadModuleDetail,
  buildModuleFilters,
  getApiErrorMessage,
  CATEGORY_OPTIONS,
  STATUS_LABEL,
  EMPTY_MODULE_FORM,
  EMPTY_TEMPLATE_FORM,
  type EligibleClassroom,
  type LessonClassroomAssignment,
  type ModuleActivityTemplate,
  type ModuleActivityTemplatePayload,
  type ModuleLessonItem,
  type ModuleListItem,
  type ModuleStatus,
  type TeacherModuleDetail,
  type TeacherModulePayload,
  type SubjectListItem,
  type FacultyClassAssignment,
  type GradeItemCategory,
  teachingModuleApi,
  classModuleApi,
} from "../../service/faculty/myModulesService";
import Toast from "../../components/Toast";
import PeriodSelector from "../../components/PeriodSelector";
import type { ToastState } from "../../types";

function useSafeNavigate(): (to: string, options?: any) => void {
  try {
    const nav = useNavigate();
    return (to: string, options?: any) => nav(to, options);
  } catch {
    return (to: string) => {
      if (typeof window !== "undefined") {
        window.location.href = to;
      }
    };
  }
}

function useSafeSearchParams(): [URLSearchParams, (next: any, opts?: any) => void] {
  try {
    return useSearchParams();
  } catch {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return [params, () => {}];
  }
}

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

  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "" || subjectFilter !== "";
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setSubjectFilter("");
    setLoading(true);
  };

  const navigate = useSafeNavigate();
  const [searchParams, setSearchParams] = useSafeSearchParams();
  const initialModuleId = searchParams.get("moduleId");
  const [selectedId, setSelectedId] = useState<string | null>(initialModuleId);

  useEffect(() => {
    const qModuleId = searchParams.get("moduleId");
    if (qModuleId && qModuleId !== selectedId) {
      setSelectedId(qModuleId);
    }
  }, [searchParams]);

  const handleSelectModule = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      setSearchParams({ moduleId: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
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

  const [facultyClasses, setFacultyClasses] = useState<FacultyClassAssignment[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityAssignmentId, setActivityAssignmentId] = useState("");
  const [activitySubjectId, setActivitySubjectId] = useState("");
  const [activityTemplateId, setActivityTemplateId] = useState("");
  const [activityPeriodId, setActivityPeriodId] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityMaxScore, setActivityMaxScore] = useState("");
  const [activityDueDate, setActivityDueDate] = useState("");
  const [creatingActivity, setCreatingActivity] = useState(false);

  const [showLessonTextModal, setShowLessonTextModal] = useState(false);
  const [editingTextLesson, setEditingTextLesson] = useState<ModuleLessonItem | null>(null);
  const [lessonTextTitle, setLessonTextTitle] = useState("");
  const [lessonTextContent, setLessonTextContent] = useState("");
  const [lessonTextSortOrder, setLessonTextSortOrder] = useState("0");
  const [savingTextLesson, setSavingTextLesson] = useState(false);

  const [showLessonFileModal, setShowLessonFileModal] = useState(false);
  const [editingFileLesson, setEditingFileLesson] = useState<ModuleLessonItem | null>(null);
  const [lessonFileTitle, setLessonFileTitle] = useState("");
  const [lessonFileNotes, setLessonFileNotes] = useState("");
  const [lessonFileSortOrder, setLessonFileSortOrder] = useState("0");
  const [selectedLessonFile, setSelectedLessonFile] = useState<File | null>(null);
  const [savingFileLesson, setSavingFileLesson] = useState(false);

  const [lessonAssignmentTarget, setLessonAssignmentTarget] = useState<ModuleLessonItem | null>(null);
  const [lessonClassrooms, setLessonClassrooms] = useState<LessonClassroomAssignment[]>([]);
  const [lessonClassroomsLoading, setLessonClassroomsLoading] = useState(false);
  const [lessonAssigningId, setLessonAssigningId] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const filters = buildModuleFilters(query, statusFilter, subjectFilter);
      const data = await loadModules(filters);
      setModules(data);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to load modules"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId, query, statusFilter, subjectFilter]);

  useEffect(() => {
    if (!schoolId) return;
    loadAssignedSubjects()
      .then((data) => setSubjects(data))
      .catch(() => setSubjects([]));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !user?.id) return;
    loadFacultyClasses(user.id)
      .then((data) => setFacultyClasses(data))
      .catch(() => setFacultyClasses([]));
  }, [schoolId, user?.id]);

  useEffect(() => {
    const timer = setTimeout(fetchModules, 250);
    return () => clearTimeout(timer);
  }, [fetchModules]);

  useEffect(() => {
    if (!openCardMenuId) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".module-card-menu")) {
        setOpenCardMenuId(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCardMenuId(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openCardMenuId]);

  const fetchDetail = useCallback(async (moduleId: string, quiet = false) => {
    if (!quiet) setDetailLoading(true);
    try {
      const data = await loadModuleDetail(moduleId);
      setDetail(data);
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

  const lessonAssignmentGroups = useMemo(() => {
    const groups = new Map<string, LessonClassroomAssignment[]>();
    for (const room of lessonClassrooms) {
      const key = room.school_year_name || String(room.school_year_id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(room);
    }
    return Array.from(groups.entries());
  }, [lessonClassrooms]);

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
        if (newId) handleSelectModule(newId);
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

  const openCreateTextLesson = () => {
    setEditingTextLesson(null);
    setLessonTextTitle("");
    setLessonTextContent("");
    setLessonTextSortOrder(String(detail?.lessons?.length ?? 0));
    setShowLessonTextModal(true);
  };

  const openEditTextLesson = (lesson: ModuleLessonItem) => {
    setEditingTextLesson(lesson);
    setLessonTextTitle(lesson.title);
    setLessonTextContent(lesson.content || "");
    setLessonTextSortOrder(String(lesson.sort_order ?? 0));
    setShowLessonTextModal(true);
  };

  const submitTextLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!lessonTextTitle.trim()) {
      setToast({ message: "Lesson title is required", type: "error" });
      return;
    }
    if (!lessonTextContent.trim()) {
      setToast({ message: "Lesson content is required", type: "error" });
      return;
    }

    setSavingTextLesson(true);
    try {
      const formData = new FormData();
      formData.append("title", lessonTextTitle.trim());
      formData.append("lesson_type", "text");
      formData.append("content", lessonTextContent.trim());
      formData.append("sort_order", lessonTextSortOrder || "0");

      if (editingTextLesson) {
        await teachingModuleApi.updateLesson(selectedId, editingTextLesson.id, formData);
        setToast({ message: "Lesson updated successfully", type: "success" });
      } else {
        await teachingModuleApi.createLesson(selectedId, formData);
        setToast({ message: "Lesson created successfully", type: "success" });
      }
      setShowLessonTextModal(false);
      await fetchDetail(selectedId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to save lesson"), type: "error" });
    } finally {
      setSavingTextLesson(false);
    }
  };

  const openUploadFileLesson = () => {
    setEditingFileLesson(null);
    setLessonFileTitle("");
    setLessonFileNotes("");
    setLessonFileSortOrder(String(detail?.lessons?.length ?? 0));
    setSelectedLessonFile(null);
    setShowLessonFileModal(true);
  };

  const openEditFileLesson = (lesson: ModuleLessonItem) => {
    setEditingFileLesson(lesson);
    setLessonFileTitle(lesson.title);
    setLessonFileNotes(lesson.content || "");
    setLessonFileSortOrder(String(lesson.sort_order ?? 0));
    setSelectedLessonFile(null);
    setShowLessonFileModal(true);
  };

  const submitFileLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!lessonFileTitle.trim()) {
      setToast({ message: "Lesson title is required", type: "error" });
      return;
    }
    if (!editingFileLesson && !selectedLessonFile) {
      setToast({ message: "Please select a file to upload", type: "error" });
      return;
    }

    setSavingFileLesson(true);
    try {
      const formData = new FormData();
      formData.append("title", lessonFileTitle.trim());
      formData.append("lesson_type", "file");
      if (lessonFileNotes.trim()) {
        formData.append("content", lessonFileNotes.trim());
      }
      formData.append("sort_order", lessonFileSortOrder || "0");
      if (selectedLessonFile) {
        formData.append("file", selectedLessonFile);
      }

      if (editingFileLesson) {
        await teachingModuleApi.updateLesson(selectedId, editingFileLesson.id, formData);
        setToast({ message: "Lesson file updated successfully", type: "success" });
      } else {
        await teachingModuleApi.createLesson(selectedId, formData);
        setToast({ message: "Lesson file uploaded successfully", type: "success" });
      }
      setShowLessonFileModal(false);
      await fetchDetail(selectedId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to upload lesson"), type: "error" });
    } finally {
      setSavingFileLesson(false);
    }
  };

  useEffect(() => {
    const editLessonId = searchParams.get("editLesson");
    if (editLessonId && detail?.lessons) {
      const target = detail.lessons.find((l) => l.id === editLessonId);
      if (target) {
        if (target.lesson_type === "file") {
          openEditFileLesson(target);
        } else {
          openEditTextLesson(target);
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("editLesson");
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [searchParams, detail]);

  const deleteLesson = async (lesson: ModuleLessonItem) => {
    if (!selectedId || !confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await teachingModuleApi.deleteLesson(selectedId, lesson.id);
      setToast({ message: "Lesson deleted", type: "success" });
      await fetchDetail(selectedId, true);
      await fetchModules();
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to delete lesson"), type: "error" });
    }
  };

  const openLessonAssignments = async (lesson: ModuleLessonItem) => {
    if (!selectedId) return;
    setLessonAssignmentTarget(lesson);
    setLessonClassrooms([]);
    setLessonClassroomsLoading(true);
    try {
      const res = await teachingModuleApi.listLessonAssignments(selectedId, lesson.id);
      setLessonClassrooms(res.data.data || []);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to load class assignments"), type: "error" });
    } finally {
      setLessonClassroomsLoading(false);
    }
  };

  const toggleLessonClassroom = async (room: LessonClassroomAssignment) => {
    if (!selectedId || !lessonAssignmentTarget) return;
    setLessonAssigningId(room.class_module_id);
    try {
      if (room.assigned) {
        await teachingModuleApi.unassignLessonFromClass(
          selectedId,
          lessonAssignmentTarget.id,
          room.class_module_id
        );
      } else {
        await teachingModuleApi.assignLessonToClass(
          selectedId,
          lessonAssignmentTarget.id,
          room.class_module_id
        );
      }
      const res = await teachingModuleApi.listLessonAssignments(
        selectedId,
        lessonAssignmentTarget.id
      );
      setLessonClassrooms(res.data.data || []);
      setToast({
        message: room.assigned
          ? `Lesson hidden from ${room.class_name}`
          : `Lesson shared with ${room.class_name}`,
        type: "success",
      });
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to update lesson assignment"), type: "error" });
    } finally {
      setLessonAssigningId(null);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

  const selectedAssignmentForActivity = useMemo(() => {
    return detail?.assignments.find((a) => a.id === activityAssignmentId) || detail?.assignments[0] || null;
  }, [detail, activityAssignmentId]);

  const selectedTemplateForActivity = useMemo(() => {
    return detail?.templates.find((t) => t.id === activityTemplateId) || detail?.templates[0] || null;
  }, [detail, activityTemplateId]);

  const availableSubjectsForActivity = useMemo(() => {
    if (!selectedAssignmentForActivity) return [];
    const matchedClass = facultyClasses.find(
      (c) => c.id === selectedAssignmentForActivity.classroom_id
    );
    if (matchedClass?.subjects && matchedClass.subjects.length > 0) {
      return matchedClass.subjects;
    }
    if (detail?.module.subject_id) {
      return [{ id: detail.module.subject_id, name: detail.module.subject || "Module Subject" }];
    }
    return subjects.map((s) => ({ id: s.id, name: s.name }));
  }, [selectedAssignmentForActivity, facultyClasses, detail, subjects]);

  const openCreateActivity = (presetAssignmentId?: string, presetTemplateId?: string) => {
    if (!detail) return;
    if (!detail.assignments || detail.assignments.length === 0) {
      setToast({
        message: "This module must be assigned to at least one class first. Use '+ Assign to Class' below.",
        type: "error",
      });
      return;
    }
    if (!detail.templates || detail.templates.length === 0) {
      setToast({
        message: "This module has no activity templates yet. Add an activity template first.",
        type: "error",
      });
      return;
    }

    const assignmentId = presetAssignmentId || detail.assignments[0].id;
    const assignment = detail.assignments.find((a) => a.id === assignmentId) || detail.assignments[0];
    const templateId = presetTemplateId || detail.templates[0].id;
    const template = detail.templates.find((t) => t.id === templateId) || detail.templates[0];

    const matchedClass = facultyClasses.find((c) => c.id === assignment?.classroom_id);
    const classSubjects = matchedClass?.subjects || [];
    const moduleSubjectId = detail.module.subject_id || "";
    const defaultSubjectId = (moduleSubjectId && classSubjects.some((s) => s.id === moduleSubjectId))
      ? moduleSubjectId
      : (classSubjects[0]?.id || moduleSubjectId);

    setActivityAssignmentId(assignmentId);
    setActivitySubjectId(defaultSubjectId);
    setActivityTemplateId(templateId);
    setActivityTitle(template?.title || "");
    setActivityMaxScore(template ? String(template.max_score) : "100");
    setActivityDueDate("");
    setActivityPeriodId("");
    setShowActivityModal(true);
  };

  const handleClassroomChangeForActivity = (newAssignmentId: string) => {
    setActivityAssignmentId(newAssignmentId);
    const targetAssignment = detail?.assignments.find((a) => a.id === newAssignmentId);
    if (targetAssignment) {
      const matchedClass = facultyClasses.find((c) => c.id === targetAssignment.classroom_id);
      const classSubjects = matchedClass?.subjects || [];
      const moduleSubjectId = detail?.module.subject_id || "";
      const defaultSubjectId = (moduleSubjectId && classSubjects.some((s) => s.id === moduleSubjectId))
        ? moduleSubjectId
        : (classSubjects[0]?.id || moduleSubjectId);
      setActivitySubjectId(defaultSubjectId);
    }
  };

  const handleTemplateChangeForActivity = (tId: string) => {
    setActivityTemplateId(tId);
    const t = detail?.templates.find((item) => item.id === tId);
    if (t) {
      setActivityTitle(t.title);
      setActivityMaxScore(String(t.max_score));
    }
  };

  const submitCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityAssignmentId) {
      setToast({ message: "Please select an assigned class", type: "error" });
      return;
    }
    if (!activitySubjectId) {
      setToast({ message: "Please select a subject for the activity", type: "error" });
      return;
    }
    if (!activityTemplateId) {
      setToast({ message: "Please select an activity template", type: "error" });
      return;
    }
    if (!activityPeriodId) {
      setToast({ message: "Academic period is required", type: "error" });
      return;
    }
    if (!activityTitle.trim()) {
      setToast({ message: "Activity title is required", type: "error" });
      return;
    }
    const score = Number(activityMaxScore);
    if (!Number.isFinite(score) || score <= 0) {
      setToast({ message: "Max score must be greater than zero", type: "error" });
      return;
    }

    setCreatingActivity(true);
    try {
      await classModuleApi.instantiate(activityAssignmentId, {
        template_id: activityTemplateId,
        period_id: Number(activityPeriodId),
        due_date: activityDueDate || null,
        title: activityTitle.trim(),
        max_score: score,
        subject_id: activitySubjectId,
      });
      const targetClassName = selectedAssignmentForActivity?.class_name || "the class";
      setToast({
        message: `Activity "${activityTitle.trim()}" created in ${targetClassName}! It is now available in the gradebook.`,
        type: "success",
      });
      setShowActivityModal(false);
    } catch (err) {
      setToast({ message: getApiErrorMessage(err, "Failed to create activity"), type: "error" });
    } finally {
      setCreatingActivity(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {selectedId ? (
        /* =================== FULL-PAGE MODULE DETAIL VIEW =================== */
        <div className="module-detail-view">
          <div className="module-detail-nav">
            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost module-back-btn"
              onClick={() => handleSelectModule(null)}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Modules</span>
            </button>
            <div className="module-breadcrumbs">
              <button
                type="button"
                className="module-breadcrumb-link"
                onClick={() => handleSelectModule(null)}
              >
                My Modules
              </button>
              <span className="module-breadcrumb-sep">/</span>
              <span className="module-breadcrumb-current">
                {detail?.module.title || "Module Detail"}
              </span>
            </div>
          </div>

          {detailLoading ? (
            <div className="mgmt-loading">Loading module details...</div>
          ) : !detail ? (
            <div className="mgmt-empty">
              <p style={{ margin: "0 0 1rem" }}>Module not found or could not be loaded.</p>
              <button
                type="button"
                className="mgmt-btn mgmt-btn--primary"
                onClick={() => handleSelectModule(null)}
              >
                Back to Modules
              </button>
            </div>
          ) : (
            <div className="module-detail-container">
              {/* Detail Hero Header */}
              <div className="module-detail-hero">
                <div className="module-detail-hero-left">
                  <div className="module-detail-hero-badges">
                    <span className={`module-status module-status--${detail.module.status}`}>
                      {STATUS_LABEL[detail.module.status]}
                    </span>
                    {detail.module.subject && (
                      <span className="module-subject-badge">{detail.module.subject}</span>
                    )}
                  </div>
                  <h1 className="module-detail-hero-title">{detail.module.title}</h1>
                  {detail.module.description && (
                    <p className="module-detail-hero-desc">{detail.module.description}</p>
                  )}
                </div>
                <div className="module-detail-hero-actions">
                  {detail.assignments.length > 0 && detail.templates.length > 0 && (
                    <button
                      type="button"
                      className="mgmt-btn mgmt-btn--primary"
                      onClick={() => openCreateActivity()}
                      disabled={detail.module.status === "archived"}
                      title="Create activity in an assigned class"
                    >
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Create Class Activity</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="mgmt-btn mgmt-btn--ghost"
                    onClick={() => openReuse(detail.module.id)}
                    disabled={detail.module.status === "archived"}
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    <span>Assign to Class</span>
                  </button>
                  <button
                    type="button"
                    className="mgmt-btn mgmt-btn--ghost"
                    onClick={() => openEdit(detail.module)}
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    <span>Edit Module</span>
                  </button>
                  <button
                    type="button"
                    className={`mgmt-btn ${detail.module.status === "archived" ? "mgmt-btn--ghost" : "mgmt-btn--danger-ghost"}`}
                    onClick={() => setArchiveTarget(detail.module)}
                  >
                    {detail.module.status === "archived" ? (
                      <>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                        </svg>
                        <span>Restore</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Overview Stats Ribbon */}
              <div className="module-stats-grid">
                <div className="module-stat-card">
                  <span className="module-stat-card-label">Subject</span>
                  <span className="module-stat-card-value">{detail.module.subject || "—"}</span>
                </div>
                <div className="module-stat-card">
                  <span className="module-stat-card-label">Status</span>
                  <span className="module-stat-card-value">
                    {STATUS_LABEL[detail.module.status]}
                  </span>
                </div>
                <div className="module-stat-card">
                  <span className="module-stat-card-label">Lessons & Materials</span>
                  <span className="module-stat-card-value">{detail.lessons?.length ?? 0}</span>
                </div>
                <div className="module-stat-card">
                  <span className="module-stat-card-label">Activity Templates</span>
                  <span className="module-stat-card-value">{detail.templates.length}</span>
                </div>
              </div>

              {/* Section 1: Learning Materials Library */}
              <LearningMaterialsLibrary
                moduleId={detail.module.id}
                moduleTitle={detail.module.title}
                lessons={detail.lessons || []}
                onReadLesson={(lesson) =>
                  navigate(`/dashboard/modules/${detail.module.id}/lessons/${lesson.id}/read`)
                }
                onPreviewDocument={(lesson) =>
                  navigate(`/dashboard/modules/${detail.module.id}/lessons/${lesson.id}/preview`)
                }
                onAssignLesson={openLessonAssignments}
                onEditLesson={(lesson) =>
                  lesson.lesson_type === "file"
                    ? openEditFileLesson(lesson)
                    : openEditTextLesson(lesson)
                }
                onDeleteLesson={deleteLesson}
                onOpenCreateTextLesson={openCreateTextLesson}
                onOpenUploadFileLesson={openUploadFileLesson}
                getFileDownloadUrl={(lessonId) =>
                  `/api/modules/mine/${detail.module.id}/lessons/${lessonId}/file`
                }
              />

              {/* Section 2: Assessment Library / Activity Templates */}
              <section className="module-detail-card">
                <AssessmentLibraryTable
                  templates={detail.templates || []}
                  creatorName={user?.name || "Teacher"}
                  moduleTitle={detail.module.title}
                  moduleSubject={detail.module.subject || undefined}
                  hasAssignments={Boolean(detail.assignments && detail.assignments.length > 0)}
                  isArchived={detail.module.status === "archived"}
                  loading={detailLoading}
                  onCreateTemplate={openTemplateCreate}
                  onEditTemplate={openTemplateEdit}
                  onDeleteTemplate={deleteTemplate}
                  onAssignTemplate={(template) => openCreateActivity(undefined, template.id)}
                />
              </section>

              {/* Section 3: Assigned Classrooms */}
              <section className="module-detail-card">
                <div className="module-detail-card-head">
                  <div>
                    <h3 className="module-detail-card-title">
                      Assigned Classrooms ({detail.assignments.length})
                    </h3>
                    <p className="module-detail-card-subtitle">
                      Classrooms where this module is assigned.
                    </p>
                  </div>
                </div>

                {groupedAssignments.length === 0 ? (
                  <div className="module-section-empty">
                    <p>This module has not been assigned to a classroom yet.</p>
                    <button
                      type="button"
                      className="mgmt-btn mgmt-btn--primary mgmt-btn--sm"
                      onClick={() => openReuse(detail.module.id)}
                      disabled={detail.module.status === "archived"}
                    >
                      Assign to Classroom
                    </button>
                  </div>
                ) : (
                  groupedAssignments.map(([year, assignments]) => (
                    <div key={year} className="module-assignment-group" style={{ marginBottom: "1.25rem" }}>
                      <h4 className="module-assignment-group__title">{year}</h4>
                      <div className="module-assignment-cards-grid">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="module-assigned-class-card">
                            <div className="module-assigned-class-icon">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong className="module-assigned-class-name">{assignment.class_name}</strong>
                              <span className="module-muted" style={{ display: "block", marginTop: "2px" }}>
                                Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          )}
        </div>
      ) : (
        /* =================== MODULES LIST / CARD GRID VIEW =================== */
        <>
          <div className="mgmt-header">
            <div>
              <h1 className="mgmt-title">My Modules</h1>
              <p className="mgmt-subtitle">Create reusable lesson modules, then assign them to your classrooms.</p>
            </div>
            <button type="button" className="mgmt-btn mgmt-btn--primary" onClick={openCreate}>
              + New Module
            </button>
          </div>

          <div className="module-filter-bar">
            <input
              className="mgmt-input"
              placeholder="Search modules..."
              aria-label="Search modules"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="mgmt-input mgmt-select"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              className="mgmt-input mgmt-select"
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {!loading && hasActiveFilters && modules.length > 0 && (
            <div className="module-results-bar">
              <span>
                {modules.length} {modules.length === 1 ? "module" : "modules"} found
              </span>
              <button type="button" className="mgmt-action mgmt-action--edit" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {loading ? (
            <div className="mgmt-loading">Loading modules...</div>
          ) : modules.length === 0 ? (
            hasActiveFilters ? (
              <div className="mgmt-empty">
                <p style={{ margin: "0 0 1rem" }}>No modules match your filters.</p>
                <button type="button" className="mgmt-btn mgmt-btn--ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="mgmt-empty">
                <p style={{ margin: "0 0 1rem" }}>No modules found. Create your first reusable module.</p>
                <button type="button" className="mgmt-btn mgmt-btn--primary" onClick={openCreate}>
                  + New Module
                </button>
              </div>
            )
          ) : (
            <div className="module-card-grid">
              {modules.map((module) => (
                <article
                  key={module.id}
                  className={`module-card ${openCardMenuId === module.id ? "module-card--menu-open" : ""}`}
                  onClick={() => handleSelectModule(module.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open module ${module.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectModule(module.id);
                    }
                  }}
                >
                  <div className={`module-card-top module-card-top--${module.status}`} />
                  <div className="module-card-body">
                    <div className="module-card-header">
                      <div className="module-card-icon">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <div className="module-card-title-wrap">
                        <h3 className="module-card-title" title={module.title}>{module.title}</h3>
                        <div className="module-card-badges">
                          <span className={`module-status module-status--${module.status}`}>
                            {STATUS_LABEL[module.status]}
                          </span>
                          {module.subject && (
                            <span className="module-subject-badge">{module.subject}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="module-card-desc">
                      {module.description || "No description provided."}
                    </p>

                    <div className="module-card-stats">
                      <div className="module-stat-item" title="Lessons & Materials">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <span>{module.lesson_count ?? 0} {module.lesson_count === 1 ? "lesson" : "lessons"}</span>
                      </div>
                      <div className="module-stat-item" title="Activity Templates">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{module.template_count ?? 0} {module.template_count === 1 ? "template" : "templates"}</span>
                      </div>
                      <div className="module-stat-item" title="Assigned Classrooms">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                        </svg>
                        <span>{module.assignment_count ?? 0} {module.assignment_count === 1 ? "class" : "classes"}</span>
                      </div>
                      <div className="module-stat-item" title="Last updated">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{module.updated_at ? new Date(module.updated_at).toLocaleDateString() : new Date(module.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="module-card-footer">
                      <div className="module-card-action-btns">
                        <button
                          type="button"
                          className="mgmt-action mgmt-action--edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(module);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="mgmt-action"
                          disabled={module.status === "archived"}
                          title={module.status === "archived" ? "Restore the module before assigning it" : "Assign to a classroom"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void openReuse(module.id);
                          }}
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className={`mgmt-action ${module.status === "archived" ? "mgmt-action--edit" : "mgmt-action--delete"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setArchiveTarget(module);
                          }}
                        >
                          {module.status === "archived" ? "Restore" : "Archive"}
                        </button>
                      </div>
                      <span className="module-card-open-hint">
                        View details &rarr;
                      </span>
                      <div
                        className="module-card-menu"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setOpenCardMenuId(null);
                            return;
                          }
                          // Keep Enter/Space from activating the card underneath.
                          if (e.key === "Enter" || e.key === " ") e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          className="module-card-menu-trigger"
                          aria-label={`Actions for ${module.title}`}
                          aria-haspopup="menu"
                          aria-expanded={openCardMenuId === module.id}
                          onClick={() =>
                            setOpenCardMenuId(openCardMenuId === module.id ? null : module.id)
                          }
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="5" cy="12" r="1.75" />
                            <circle cx="12" cy="12" r="1.75" />
                            <circle cx="19" cy="12" r="1.75" />
                          </svg>
                        </button>
                        {openCardMenuId === module.id && (
                          <div className="module-card-menu-panel" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className="module-card-menu-item"
                              onClick={() => {
                                setOpenCardMenuId(null);
                                openEdit(module);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="module-card-menu-item"
                              disabled={module.status === "archived"}
                              title={module.status === "archived" ? "Restore the module before assigning it" : undefined}
                              onClick={() => {
                                setOpenCardMenuId(null);
                                void openReuse(module.id);
                              }}
                            >
                              Assign to class
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={`module-card-menu-item ${module.status === "archived" ? "" : "module-card-menu-item--danger"}`}
                              onClick={() => {
                                setOpenCardMenuId(null);
                                setArchiveTarget(module);
                              }}
                            >
                              {module.status === "archived" ? "Restore" : "Archive"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

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

      {showActivityModal && detail && (
        <div className="mgmt-modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="mgmt-modal mgmt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">Create Class Activity from Module</h2>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowActivityModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitCreateActivity} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Target Classroom *</label>
                  <select
                    className="mgmt-input mgmt-select"
                    value={activityAssignmentId}
                    onChange={(e) => handleClassroomChangeForActivity(e.target.value)}
                    required
                  >
                    {detail.assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.class_name} ({a.school_year_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mgmt-form-row">
                  <label className="mgmt-label">Subject *</label>
                  <select
                    className="mgmt-input mgmt-select"
                    value={activitySubjectId}
                    onChange={(e) => setActivitySubjectId(e.target.value)}
                    required
                  >
                    {availableSubjectsForActivity.length === 0 ? (
                      <option value="">No subjects available</option>
                    ) : (
                      availableSubjectsForActivity.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="mgmt-form-row">
                  <label className="mgmt-label">Activity Template *</label>
                  <select
                    className="mgmt-input mgmt-select"
                    value={activityTemplateId}
                    onChange={(e) => handleTemplateChangeForActivity(e.target.value)}
                    required
                  >
                    {detail.templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({CATEGORY_OPTIONS.find((c) => c.value === t.category)?.label || t.category} · Max {t.max_score} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mgmt-form-row">
                  {selectedAssignmentForActivity && (
                    <PeriodSelector
                      schoolId={schoolId}
                      schoolYearId={selectedAssignmentForActivity.school_year_id}
                      value={activityPeriodId}
                      onChange={setActivityPeriodId}
                      showAllOption={false}
                    />
                  )}
                </div>

                <div className="mgmt-form-row">
                  <label className="mgmt-label">Due Date</label>
                  <input
                    type="date"
                    className="mgmt-input"
                    value={activityDueDate}
                    onChange={(e) => setActivityDueDate(e.target.value)}
                  />
                </div>

                <div className="mgmt-form-row">
                  <label className="mgmt-label">Activity Title *</label>
                  <input
                    type="text"
                    className="mgmt-input"
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mgmt-form-row">
                  <label className="mgmt-label">Max Score *</label>
                  <input
                    type="number"
                    className="mgmt-input"
                    min="0.01"
                    step="0.01"
                    value={activityMaxScore}
                    onChange={(e) => setActivityMaxScore(e.target.value)}
                    required
                  />
                </div>

                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Template Instructions</label>
                  <div className="module-instructions-preview">
                    {selectedTemplateForActivity?.instructions || "No instructions provided for this template."}
                  </div>
                </div>
              </div>

              <div className="mgmt-modal-actions">
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setShowActivityModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={creatingActivity}
                >
                  {creatingActivity ? "Creating Activity..." : "Create Activity in Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Written Lesson Modal */}
      {showLessonTextModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowLessonTextModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">
                {editingTextLesson ? "Edit Written Lesson" : "New Written Lesson"}
              </h2>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowLessonTextModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitTextLesson} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Lesson Title *</label>
                  <input
                    type="text"
                    className="mgmt-input"
                    value={lessonTextTitle}
                    onChange={(e) => setLessonTextTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Introduction to Topic"
                    required
                  />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Sort Order</label>
                  <input
                    type="number"
                    className="mgmt-input"
                    step="1"
                    value={lessonTextSortOrder}
                    onChange={(e) => setLessonTextSortOrder(e.target.value)}
                  />
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Lesson Content & Notes *</label>
                  <textarea
                    className="mgmt-input mgmt-textarea"
                    rows={10}
                    value={lessonTextContent}
                    onChange={(e) => setLessonTextContent(e.target.value)}
                    placeholder="Write detailed lesson content, study notes, key terms, or instructions for this lesson..."
                    required
                  />
                </div>
              </div>
              <div className="mgmt-modal-actions">
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setShowLessonTextModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={savingTextLesson}
                >
                  {savingTextLesson ? "Saving Lesson..." : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Lesson Modal */}
      {showLessonFileModal && (
        <div className="mgmt-modal-overlay" onClick={() => setShowLessonFileModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h2 className="mgmt-modal-title">
                {editingFileLesson ? "Replace Lesson Document" : "Upload Lesson Document"}
              </h2>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowLessonFileModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitFileLesson} className="mgmt-form">
              <div className="mgmt-form-grid">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Lesson Title *</label>
                  <input
                    type="text"
                    className="mgmt-input"
                    value={lessonFileTitle}
                    onChange={(e) => setLessonFileTitle(e.target.value)}
                    placeholder="e.g. Presentation Slides / Reference Guide"
                    required
                  />
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Sort Order</label>
                  <input
                    type="number"
                    className="mgmt-input"
                    step="1"
                    value={lessonFileSortOrder}
                    onChange={(e) => setLessonFileSortOrder(e.target.value)}
                  />
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">
                    {editingFileLesson ? "Choose New File (optional)" : "Document File *"}
                  </label>
                  <div className="module-file-dropzone">
                    <input
                      type="file"
                      className="module-file-dropzone-input"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedLessonFile(file);
                        if (file && !lessonFileTitle) {
                          setLessonFileTitle(file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }}
                    />
                    <div className="module-file-dropzone-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                    </div>
                    <p className="module-file-dropzone-text">
                      {selectedLessonFile
                        ? selectedLessonFile.name
                        : "Click to browse or drag and drop your lesson file"}
                    </p>
                    <p className="module-file-dropzone-hint">
                      Supported: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel, Text, Markdown, Images (up to 50MB)
                    </p>
                  </div>
                  {selectedLessonFile && (
                    <div className="module-file-selected-card">
                      <div>
                        <strong>{selectedLessonFile.name}</strong>
                        <span className="module-lesson-file-meta">
                          {formatFileSize(selectedLessonFile.size)} · {selectedLessonFile.type || "file"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mgmt-action mgmt-action--delete"
                        onClick={() => setSelectedLessonFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {editingFileLesson && !selectedLessonFile && editingFileLesson.file_name && (
                    <div className="module-file-selected-card">
                      <div>
                        <span>Current file: </span>
                        <strong>{editingFileLesson.file_name}</strong>
                        <span className="module-lesson-file-meta">
                          {formatFileSize(editingFileLesson.file_size)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mgmt-form-row mgmt-form-row--full">
                  <label className="mgmt-label">Optional Description or Reading Instructions</label>
                  <textarea
                    className="mgmt-input mgmt-textarea"
                    rows={3}
                    value={lessonFileNotes}
                    onChange={(e) => setLessonFileNotes(e.target.value)}
                    placeholder="e.g. Please read chapters 1 to 3 before attempting the quiz."
                  />
                </div>
              </div>
              <div className="mgmt-modal-actions">
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setShowLessonFileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-btn mgmt-btn--primary"
                  disabled={savingFileLesson}
                >
                  {savingFileLesson ? "Uploading..." : editingFileLesson ? "Save Changes" : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Classroom Assignment Modal */}
      {lessonAssignmentTarget && (
        <div className="mgmt-modal-overlay" onClick={() => setLessonAssignmentTarget(null)}>
          <div className="mgmt-modal mgmt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <div>
                <h2 className="mgmt-modal-title">Assign Lesson to Classes</h2>
                <p className="module-muted" style={{ marginTop: "0.25rem" }}>
                  {lessonAssignmentTarget.title}
                </p>
              </div>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setLessonAssignmentTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {lessonClassroomsLoading ? (
              <div className="mgmt-loading">Loading classrooms...</div>
            ) : lessonClassrooms.length === 0 ? (
              <div className="mgmt-empty">
                This module is not assigned to any class yet. Assign the module to a class first,
                then publish its lessons to that class.
              </div>
            ) : (
              <div className="module-eligible-list">
                {lessonAssignmentGroups.map(([year, rooms]) => (
                  <div key={year} className="module-assignment-group">
                    <h4 className="module-assignment-group__title">
                      {year}
                      {rooms.some((room) => room.school_year_is_current === 1) && " · Current School Year"}
                    </h4>
                    {rooms.map((room) => (
                      <div key={room.class_module_id} className="module-eligible">
                        <div>
                          <strong>{room.class_name}</strong>
                          <span className="module-muted">
                            {room.assigned
                              ? "Visible to enrolled students"
                              : "Not shared with this class"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`mgmt-btn ${room.assigned ? "mgmt-btn--ghost" : "mgmt-btn--primary"}`}
                          disabled={lessonAssigningId === room.class_module_id}
                          onClick={() => toggleLessonClassroom(room)}
                        >
                          {lessonAssigningId === room.class_module_id
                            ? "Saving..."
                            : room.assigned
                              ? "Remove"
                              : "Assign"}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
                <p className="module-muted" style={{ marginTop: "0.5rem" }}>
                  Students actively enrolled in a class for this school year can view the lesson and
                  download uploaded file materials.
                </p>
              </div>
            )}
            <div className="mgmt-modal-actions">
              <button
                type="button"
                className="mgmt-btn mgmt-btn--ghost"
                onClick={() => setLessonAssignmentTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Activity Modal */}
    </div>
  );
}
