import apiClient from "./client";
import type { GradeItemCategory } from "./gradebook";
import type { ModuleActivityTemplate, ModuleStatus } from "./modules";

export interface ClassModuleItem {
  id: string;
  module_id: string;
  classroom_id: string;
  class_name: string;
  school_year_id: number;
  school_year_name: string;
  assigned_at: string;
  title: string;
  description: string | null;
  lesson_content: string | null;
  subject_id: string;
  subject_name: string;
  status: ModuleStatus;
  owner_faculty_id: string | null;
  templates: ModuleActivityTemplate[];
}

export interface AssignModulePayload {
  module_id: string;
  classroom_id: string;
  school_year_id: number;
}

export interface InstantiateActivityPayload {
  template_id: string;
  period_id: number;
  due_date?: string | null;
  title?: string;
  max_score?: number;
}

export interface InstantiatedActivity {
  id: string;
}

export const classModuleApi = {
  assign: (payload: AssignModulePayload) =>
    apiClient.post<{ data: { id: string } }>("/class-modules", payload),

  getForClass: (classId: string) =>
    apiClient.get<{ data: ClassModuleItem[] }>(`/class-modules/class/${classId}`),

  instantiate: (assignmentId: string, payload: InstantiateActivityPayload) =>
    apiClient.post<{ data: InstantiatedActivity }>(`/class-modules/${assignmentId}/activities`, payload),
};

export type { GradeItemCategory };
