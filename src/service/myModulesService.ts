import { teachingModuleApi } from "../api/modules";
import { subjectApi } from "../api/subjects";
import { classApi } from "../api/classes";
import { classModuleApi } from "../api/classModules";
import type {
  EligibleClassroom,
  LessonClassroomAssignment,
  ModuleActivityTemplate,
  ModuleActivityTemplatePayload,
  ModuleAssignmentSummary,
  ModuleLessonItem,
  ModuleListItem,
  ModuleStatus,
  TeacherModuleDetail,
  TeacherModulePayload,
} from "../api/modules";
import type { SubjectListItem } from "../api/subjects";
import type { FacultyClassAssignment } from "../api/classes";
import type { GradeItemCategory } from "../api/gradebook";
import type { InstantiateActivityPayload } from "../api/classModules";

export type {
  EligibleClassroom,
  FacultyClassAssignment,
  GradeItemCategory,
  LessonClassroomAssignment,
  ModuleActivityTemplate,
  ModuleActivityTemplatePayload,
  ModuleLessonItem,
  ModuleListItem,
  ModuleStatus,
  SubjectListItem,
  TeacherModuleDetail,
  TeacherModulePayload,
};

export { getApiErrorMessage } from "../api/client";
export { teachingModuleApi } from "../api/modules";
export { classModuleApi } from "../api/classModules";

export interface ModuleFormState {
  title: string;
  subject_id: string;
  description: string;
  lesson_content: string;
  status: ModuleStatus;
}

export interface TemplateFormState {
  title: string;
  category: GradeItemCategory;
  max_score: string;
  instructions: string;
  sort_order: string;
}

export interface TextLessonFormState {
  title: string;
  content: string;
  sort_order: string;
}

export interface FileLessonFormState {
  title: string;
  notes: string;
  sort_order: string;
}

export interface ActivityFormState {
  assignmentId: string;
  subjectId: string;
  templateId: string;
  periodId: string;
  title: string;
  maxScore: string;
  dueDate: string;
}

export interface ModuleFilters {
  q?: string;
  status?: string;
  subject_id?: string;
}

export interface ModuleRefreshResult {
  detail: TeacherModuleDetail | null;
  modules: ModuleListItem[] | null;
  modulesError: unknown | null;
}

export interface ToggleArchiveResult extends ModuleRefreshResult {
  nextStatus: ModuleStatus;
}

export interface AssignClassroomResult extends ModuleRefreshResult {
  eligible: EligibleClassroom[];
}

export interface ActivityCreateDefaults {
  assignmentId: string;
  subjectId: string;
  templateId: string;
  title: string;
  maxScore: string;
}

export type ActivityCreatePlan =
  | { ok: true; defaults: ActivityCreateDefaults }
  | { ok: false; error: string };

export const CATEGORY_OPTIONS: { value: GradeItemCategory; label: string }[] = [
  { value: "activities", label: "Activity" },
  { value: "quizzes", label: "Quiz" },
  { value: "exams", label: "Exam" },
];

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const EMPTY_MODULE_FORM: ModuleFormState = {
  title: "",
  subject_id: "",
  description: "",
  lesson_content: "",
  status: "draft",
};

export const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  title: "",
  category: "activities",
  max_score: "100",
  instructions: "",
  sort_order: "0",
};

export function buildModuleFilters(
  query: string,
  statusFilter: string,
  subjectFilter: string
): ModuleFilters {
  const filters: ModuleFilters = {};
  if (query.trim()) filters.q = query.trim();
  if (statusFilter) filters.status = statusFilter;
  if (subjectFilter) filters.subject_id = subjectFilter;
  return filters;
}

export async function loadModules(filters: ModuleFilters = {}): Promise<ModuleListItem[]> {
  const res = await teachingModuleApi.listMine(filters);
  return res.data.data || [];
}

export async function loadAssignedSubjects(): Promise<SubjectListItem[]> {
  const res = await subjectApi.getAssigned();
  return res.data.data || [];
}

export async function loadFacultyClasses(facultyId: string): Promise<FacultyClassAssignment[]> {
  const res = await classApi.getAssignedClasses(facultyId);
  return res.data.data || [];
}

export async function loadModuleDetail(moduleId: string): Promise<TeacherModuleDetail | null> {
  const res = await teachingModuleApi.getMine(moduleId);
  return res.data.data || null;
}

async function refreshDetail(moduleId: string): Promise<TeacherModuleDetail | null> {
  try {
    return await loadModuleDetail(moduleId);
  } catch {
    return null;
  }
}

async function refreshModules(
  filters: ModuleFilters
): Promise<{ modules: ModuleListItem[] | null; error: unknown | null }> {
  try {
    return { modules: await loadModules(filters), error: null };
  } catch (error) {
    return { modules: null, error };
  }
}

export function validateModuleForm(form: ModuleFormState): string | null {
  if (!form.title.trim()) return "Title is required";
  if (!form.subject_id) return "Subject is required";
  return null;
}

export function buildModulePayload(form: ModuleFormState): TeacherModulePayload {
  return {
    title: form.title.trim(),
    subject_id: form.subject_id,
    description: form.description.trim() || null,
    lesson_content: form.lesson_content.trim() || null,
    status: form.status,
  };
}

export function moduleFormFromModule(module: ModuleListItem): ModuleFormState {
  return {
    title: module.title,
    subject_id: module.subject_id || "",
    description: module.description || "",
    lesson_content: module.lesson_content || "",
    status: module.status || "draft",
  };
}

export function validateTemplateForm(form: TemplateFormState): string | null {
  if (!form.title.trim()) return "Template title is required";
  const maxScore = Number(form.max_score);
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return "Max score must be greater than zero";
  }
  const sortOrder = Number(form.sort_order);
  if (!Number.isInteger(sortOrder)) return "Sort order must be an integer";
  return null;
}

export function buildTemplatePayload(form: TemplateFormState): ModuleActivityTemplatePayload {
  return {
    title: form.title.trim(),
    category: form.category,
    max_score: Number(form.max_score),
    instructions: form.instructions.trim() || null,
    sort_order: Number(form.sort_order),
  };
}

export function templateFormFromTemplate(template: ModuleActivityTemplate): TemplateFormState {
  return {
    title: template.title,
    category: template.category,
    max_score: String(template.max_score),
    instructions: template.instructions || "",
    sort_order: String(template.sort_order ?? 0),
  };
}

export function validateTextLessonForm(form: TextLessonFormState): string | null {
  if (!form.title.trim()) return "Lesson title is required";
  if (!form.content.trim()) return "Lesson content is required";
  return null;
}

export function buildTextLessonFormData(form: TextLessonFormState): FormData {
  const formData = new FormData();
  formData.append("title", form.title.trim());
  formData.append("lesson_type", "text");
  formData.append("content", form.content.trim());
  formData.append("sort_order", form.sort_order || "0");
  return formData;
}

export function validateFileLessonForm(
  form: FileLessonFormState,
  file: File | null,
  isEditing: boolean
): string | null {
  if (!form.title.trim()) return "Lesson title is required";
  if (!isEditing && !file) return "Please select a file to upload";
  return null;
}

export function buildFileLessonFormData(
  form: FileLessonFormState,
  file: File | null
): FormData {
  const formData = new FormData();
  formData.append("title", form.title.trim());
  formData.append("lesson_type", "file");
  if (form.notes.trim()) formData.append("content", form.notes.trim());
  formData.append("sort_order", form.sort_order || "0");
  if (file) formData.append("file", file);
  return formData;
}

export function deriveLessonTitleFromFile(file: File): string {
  return file.name.replace(/\.[^/.]+$/, "");
}

export function getNextLessonSortOrder(detail: TeacherModuleDetail | null): string {
  return String(detail?.lessons?.length ?? 0);
}

export function validateActivityForm(form: ActivityFormState): string | null {
  if (!form.assignmentId) return "Please select an assigned class";
  if (!form.subjectId) return "Please select a subject for the activity";
  if (!form.templateId) return "Please select an activity template";
  if (!form.periodId) return "Academic period is required";
  if (!form.title.trim()) return "Activity title is required";
  const score = Number(form.maxScore);
  if (!Number.isFinite(score) || score <= 0) {
    return "Max score must be greater than zero";
  }
  return null;
}

export function buildActivityPayload(form: ActivityFormState): InstantiateActivityPayload {
  return {
    template_id: form.templateId,
    period_id: Number(form.periodId),
    due_date: form.dueDate || null,
    title: form.title.trim(),
    max_score: Number(form.maxScore),
    subject_id: form.subjectId,
  };
}

export function groupBySchoolYear<T extends { school_year_id: number; school_year_name: string }>(
  items: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.school_year_name || String(item.school_year_id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

export function getModalSubjects(
  editingModule: ModuleListItem | null,
  subjects: SubjectListItem[],
  schoolId: number
): SubjectListItem[] {
  if (
    editingModule &&
    editingModule.subject_id &&
    !subjects.some((s) => s.id === editingModule.subject_id)
  ) {
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
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function findSelectedAssignment(
  detail: TeacherModuleDetail | null,
  assignmentId: string
): ModuleAssignmentSummary | null {
  return detail?.assignments.find((a) => a.id === assignmentId) || detail?.assignments[0] || null;
}

export function findSelectedTemplate(
  detail: TeacherModuleDetail | null,
  templateId: string
): ModuleActivityTemplate | null {
  return detail?.templates.find((t) => t.id === templateId) || detail?.templates[0] || null;
}

export function getAvailableActivitySubjects(
  assignment: ModuleAssignmentSummary | null,
  detail: TeacherModuleDetail | null,
  facultyClasses: FacultyClassAssignment[],
  subjects: SubjectListItem[]
): { id: string; name: string }[] {
  if (!assignment) return [];
  const matchedClass = facultyClasses.find((c) => c.id === assignment.classroom_id);
  if (matchedClass?.subjects && matchedClass.subjects.length > 0) {
    return matchedClass.subjects;
  }
  if (detail?.module.subject_id) {
    return [{ id: detail.module.subject_id, name: detail.module.subject || "Module Subject" }];
  }
  return subjects.map((s) => ({ id: s.id, name: s.name }));
}

export function resolveActivitySubjectForAssignment(
  assignmentId: string,
  detail: TeacherModuleDetail | null,
  facultyClasses: FacultyClassAssignment[]
): string | null {
  const targetAssignment = detail?.assignments.find((a) => a.id === assignmentId);
  if (!targetAssignment) return null;
  const matchedClass = facultyClasses.find((c) => c.id === targetAssignment.classroom_id);
  const classSubjects = matchedClass?.subjects || [];
  const moduleSubjectId = detail?.module.subject_id || "";
  return moduleSubjectId && classSubjects.some((s) => s.id === moduleSubjectId)
    ? moduleSubjectId
    : classSubjects[0]?.id || moduleSubjectId;
}

export function resolveActivityTemplateDefaults(
  detail: TeacherModuleDetail | null,
  templateId: string
): { title: string; maxScore: string } | null {
  const template = detail?.templates.find((item) => item.id === templateId);
  if (!template) return null;
  return { title: template.title, maxScore: String(template.max_score) };
}

export function buildActivityCreatePlan(
  detail: TeacherModuleDetail,
  facultyClasses: FacultyClassAssignment[],
  presetAssignmentId?: string,
  presetTemplateId?: string
): ActivityCreatePlan {
  if (!detail.assignments || detail.assignments.length === 0) {
    return {
      ok: false,
      error:
        "This module must be assigned to at least one class first. Use '+ Assign to Class' below.",
    };
  }
  if (!detail.templates || detail.templates.length === 0) {
    return {
      ok: false,
      error: "This module has no activity templates yet. Add an activity template first.",
    };
  }

  const assignmentId = presetAssignmentId || detail.assignments[0].id;
  const assignment =
    detail.assignments.find((a) => a.id === assignmentId) || detail.assignments[0];
  const templateId = presetTemplateId || detail.templates[0].id;
  const template = detail.templates.find((t) => t.id === templateId) || detail.templates[0];

  const matchedClass = facultyClasses.find((c) => c.id === assignment?.classroom_id);
  const classSubjects = matchedClass?.subjects || [];
  const moduleSubjectId = detail.module.subject_id || "";
  const defaultSubjectId =
    moduleSubjectId && classSubjects.some((s) => s.id === moduleSubjectId)
      ? moduleSubjectId
      : classSubjects[0]?.id || moduleSubjectId;

  return {
    ok: true,
    defaults: {
      assignmentId,
      subjectId: defaultSubjectId,
      templateId,
      title: template?.title || "",
      maxScore: template ? String(template.max_score) : "100",
    },
  };
}

export async function saveModule(
  editingModuleId: string | null,
  form: ModuleFormState,
  filters: ModuleFilters,
  onCreated?: (id: string) => void
): Promise<ModuleRefreshResult> {
  const payload = buildModulePayload(form);
  let detail: TeacherModuleDetail | null = null;

  if (editingModuleId) {
    await teachingModuleApi.updateMine(editingModuleId, payload);
    detail = await refreshDetail(editingModuleId);
  } else {
    const res = await teachingModuleApi.createMine(payload);
    const newId = res.data.data?.id;
    if (newId) onCreated?.(newId);
  }

  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function toggleModuleArchive(
  target: ModuleListItem,
  selectedModuleId: string | null,
  filters: ModuleFilters
): Promise<ToggleArchiveResult> {
  const nextStatus: ModuleStatus =
    target.status === "archived" ? "published" : "archived";
  await teachingModuleApi.updateMine(target.id, { status: nextStatus });

  const { modules, error } = await refreshModules(filters);
  let detail: TeacherModuleDetail | null = null;
  if (selectedModuleId === target.id) detail = await refreshDetail(target.id);

  return { nextStatus, detail, modules, modulesError: error };
}

export async function saveTemplate(
  moduleId: string,
  editingTemplateId: string | null,
  form: TemplateFormState,
  filters: ModuleFilters
): Promise<ModuleRefreshResult> {
  const payload = buildTemplatePayload(form);
  if (editingTemplateId) {
    await teachingModuleApi.updateTemplate(moduleId, editingTemplateId, payload);
  } else {
    await teachingModuleApi.createTemplate(moduleId, payload);
  }

  const detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function removeTemplate(
  moduleId: string,
  templateId: string,
  filters: ModuleFilters
): Promise<ModuleRefreshResult> {
  await teachingModuleApi.deleteTemplate(moduleId, templateId);
  const detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function saveTextLesson(
  moduleId: string,
  editingLessonId: string | null,
  form: TextLessonFormState,
  filters: ModuleFilters
): Promise<ModuleRefreshResult> {
  const formData = buildTextLessonFormData(form);
  if (editingLessonId) {
    await teachingModuleApi.updateLesson(moduleId, editingLessonId, formData);
  } else {
    await teachingModuleApi.createLesson(moduleId, formData);
  }

  const detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function saveFileLesson(
  moduleId: string,
  editingLessonId: string | null,
  form: FileLessonFormState,
  file: File | null,
  filters: ModuleFilters
): Promise<ModuleRefreshResult> {
  const formData = buildFileLessonFormData(form, file);
  if (editingLessonId) {
    await teachingModuleApi.updateLesson(moduleId, editingLessonId, formData);
  } else {
    await teachingModuleApi.createLesson(moduleId, formData);
  }

  const detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function removeLesson(
  moduleId: string,
  lessonId: string,
  filters: ModuleFilters
): Promise<ModuleRefreshResult> {
  await teachingModuleApi.deleteLesson(moduleId, lessonId);
  const detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);
  return { detail, modules, modulesError: error };
}

export async function loadLessonAssignments(
  moduleId: string,
  lessonId: string
): Promise<LessonClassroomAssignment[]> {
  const res = await teachingModuleApi.listLessonAssignments(moduleId, lessonId);
  return res.data.data || [];
}

export async function toggleLessonClassroomAssignment(
  moduleId: string,
  lessonId: string,
  room: LessonClassroomAssignment
): Promise<LessonClassroomAssignment[]> {
  if (room.assigned) {
    await teachingModuleApi.unassignLessonFromClass(moduleId, lessonId, room.class_module_id);
  } else {
    await teachingModuleApi.assignLessonToClass(moduleId, lessonId, room.class_module_id);
  }
  return loadLessonAssignments(moduleId, lessonId);
}

export async function loadEligibleClassrooms(moduleId: string): Promise<EligibleClassroom[]> {
  const res = await teachingModuleApi.getEligibleClassrooms(moduleId);
  return res.data.data || [];
}

export async function assignModuleToClassroom(
  moduleId: string,
  room: EligibleClassroom,
  selectedModuleId: string | null,
  filters: ModuleFilters
): Promise<AssignClassroomResult> {
  await classModuleApi.assign({
    module_id: moduleId,
    classroom_id: room.classroom_id,
    school_year_id: room.school_year_id,
  });

  const eligible = await loadEligibleClassrooms(moduleId);
  let detail: TeacherModuleDetail | null = null;
  if (selectedModuleId === moduleId) detail = await refreshDetail(moduleId);
  const { modules, error } = await refreshModules(filters);

  return { eligible, detail, modules, modulesError: error };
}

export async function createClassActivity(
  form: ActivityFormState,
  detail: TeacherModuleDetail | null
): Promise<{ targetClassName: string }> {
  await classModuleApi.instantiate(form.assignmentId, buildActivityPayload(form));
  const assignment = findSelectedAssignment(detail, form.assignmentId);
  return { targetClassName: assignment?.class_name || "the class" };
}
