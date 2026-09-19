import apiClient from "./client";

export type FacultyRole = "teacher" | "cashier" | "register";

export interface FacultyPayload {
  first_name: string;
  last_name: string;
  email: string;
  school_id: number;
  contact_number: string;
  faculty_role: FacultyRole;
}

export interface FacultyListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: number;
  contact_number: string;
  admin_id: string;
  faculty_role: FacultyRole;
}

export interface FacultyUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  faculty_role?: FacultyRole;
}

export const facultyApi = {
  getAll: (schoolId: number) =>
    apiClient.get<{ data: FacultyListItem[] }>(`/faculties/school/${schoolId}`),

  getById: (id: string) =>
    apiClient.get<{ data: FacultyListItem }>(`/faculties/${id}`),

  create: (payload: FacultyPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/faculties", payload),

  update: (id: string, payload: FacultyUpdatePayload) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/faculties/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/faculties/${id}`),
};
