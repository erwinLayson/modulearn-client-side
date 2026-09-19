import apiClient from "./client";

export interface SubjectListItem {
  id: string;
  name: string;
  subject_code: string | null;
  description: string | null;
  school_id: number;
  admin_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface SubjectPayload {
  name: string;
  subject_code?: string | null;
  description?: string | null;
  school_id: number;
  admin_id: string;
}

export interface SubjectFaculty {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const subjectApi = {
  getAll: () =>
    apiClient.get<{ data: SubjectListItem[] }>("/subjects"),

  getBySchoolId: (schoolId: number) =>
    apiClient.get<{ data: SubjectListItem[] }>(`/subjects/school/${schoolId}`),

  getById: (id: string) =>
    apiClient.get<{ data: SubjectListItem }>(`/subjects/${id}`),

  create: (payload: SubjectPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/subjects", payload),

  update: (id: string, payload: Partial<SubjectPayload>) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/subjects/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/subjects/${id}`),

  getFaculties: (id: string) =>
    apiClient.get<{ data: SubjectFaculty[] }>(`/subjects/${id}/faculties`),

  assignFaculty: (id: string, facultyId: string) =>
    apiClient.post<{ message: string; isOk: boolean }>(`/subjects/${id}/faculties`, { faculty_id: facultyId }),

  removeFaculty: (id: string, facultyId: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/subjects/${id}/faculties/${facultyId}`),

  getAvailableFaculties: (schoolId: number) =>
    apiClient.get<{ data: SubjectFaculty[] }>(`/subjects/faculties/school/${schoolId}`),
};