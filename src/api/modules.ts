import apiClient from "./client";
import type { GradeItemCategory } from "./gradebook";

export type ModuleStatus = "draft" | "published" | "archived";

export interface ModuleListItem {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  subject_id: string | null;
  school_id: number;
  admin_id: string | null;
  owner_faculty_id: string | null;
  status: ModuleStatus;
  lesson_content: string | null;
  template_count?: number;
  assignment_count?: number;
  lesson_count?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ModulePayload {
  title: string;
  description: string;
  subject: string;
  subject_id?: string | null;
  school_id: number;
  admin_id: string;
}

export interface TeacherModulePayload {
  title: string;
  description?: string | null;
  subject_id: string;
  lesson_content?: string | null;
  status?: ModuleStatus;
}

export interface ModuleActivityTemplate {
  id: string;
  module_id: string;
  title: string;
  instructions: string | null;
  category: GradeItemCategory;
  max_score: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface ModuleActivityTemplatePayload {
  title: string;
  instructions?: string | null;
  category?: GradeItemCategory;
  max_score: number;
  sort_order?: number;
}

export interface ModuleAssignmentSummary {
  id: string;
  module_id: string;
  classroom_id: string;
  class_name: string;
  school_year_id: number;
  school_year_name: string;
  assigned_at: string;
}

export interface ModuleLessonItem {
  id: string;
  module_id: string;
  title: string;
  lesson_type: "text" | "file";
  content: string | null;
  file_name: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  sort_order: number;
  created_at: string;
  updated_at?: string | null;
}

export interface TeacherModuleDetail {
  module: ModuleListItem;
  templates: ModuleActivityTemplate[];
  assignments: ModuleAssignmentSummary[];
  lessons: ModuleLessonItem[];
}

export interface EligibleClassroom {
  classroom_id: string;
  class_name: string;
  section: string | null;
  grade_level: string | null;
  school_year_id: number;
  school_year_name: string;
  already_assigned: boolean;
  class_module_id: string | null;
}

export const moduleApi = {
  getAll: () =>
    apiClient.get<{ data: ModuleListItem[] }>("/modules"),

  getBySchoolId: (schoolId: number) =>
    apiClient.get<{ data: ModuleListItem[] }>(`/modules/school/${schoolId}`),

  getById: (id: string) =>
    apiClient.get<{ data: ModuleListItem }>(`/modules/${id}`),

  create: (payload: ModulePayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/modules", payload),

  update: (id: string, payload: Partial<ModulePayload>) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/modules/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/modules/${id}`),
};

export const teachingModuleApi = {
  listMine: (filters: { q?: string; status?: string; subject_id?: string } = {}) =>
    apiClient.get<{ data: ModuleListItem[] }>("/modules/mine", { params: filters }),

  getMine: (id: string) =>
    apiClient.get<{ data: TeacherModuleDetail }>(`/modules/mine/${id}`),

  createMine: (payload: TeacherModulePayload) =>
    apiClient.post<{ data: { id: string } }>("/modules/mine", payload),

  updateMine: (id: string, payload: Partial<TeacherModulePayload>) =>
    apiClient.put<{ data: TeacherModuleDetail }>(`/modules/mine/${id}`, payload),

  getEligibleClassrooms: (id: string) =>
    apiClient.get<{ data: EligibleClassroom[] }>(`/modules/mine/${id}/eligible-classrooms`),

  createTemplate: (moduleId: string, payload: ModuleActivityTemplatePayload) =>
    apiClient.post<{ data: { id: string } }>(`/modules/mine/${moduleId}/templates`, payload),

  updateTemplate: (moduleId: string, templateId: string, payload: Partial<ModuleActivityTemplatePayload>) =>
    apiClient.put<{ message: string }>(`/modules/mine/${moduleId}/templates/${templateId}`, payload),

  deleteTemplate: (moduleId: string, templateId: string) =>
    apiClient.delete<{ message: string }>(`/modules/mine/${moduleId}/templates/${templateId}`),

  listLessons: (moduleId: string) =>
    apiClient.get<{ data: ModuleLessonItem[] }>(`/modules/mine/${moduleId}/lessons`),

  createLesson: (moduleId: string, payload: FormData) =>
    apiClient.post<{ data: ModuleLessonItem }>(`/modules/mine/${moduleId}/lessons`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateLesson: (moduleId: string, lessonId: string, payload: FormData) =>
    apiClient.put<{ data: ModuleLessonItem }>(`/modules/mine/${moduleId}/lessons/${lessonId}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteLesson: (moduleId: string, lessonId: string) =>
    apiClient.delete<{ message: string }>(`/modules/mine/${moduleId}/lessons/${lessonId}`),
};
