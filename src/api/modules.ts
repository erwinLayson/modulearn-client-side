import apiClient from "./client";

export interface ModuleListItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  subject_id: string | null;
  school_id: number;
  admin_id: string;
  created_at: string;
}

export interface ModulePayload {
  title: string;
  description: string;
  subject: string;
  subject_id?: string | null;
  school_id: number;
  admin_id: string;
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