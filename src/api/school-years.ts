import apiClient from "./client";

export interface SchoolYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  school_id: number;
  is_current: number;
}

export const schoolYearApi = {
  getBySchoolId: (schoolId: number) =>
    apiClient.get<{ data: SchoolYear[] }>(`/school-years/school/${schoolId}`),

  getCurrent: (schoolId: number) =>
    apiClient.get<{ data: SchoolYear | null }>(`/school-years/current/${schoolId}`),

  autoGenerate: (schoolId: number) =>
    apiClient.post<{ data: SchoolYear | null }>(`/school-years/auto-generate/${schoolId}`),

  create: (payload: { name: string; start_date: string; end_date: string; school_id: number }) =>
    apiClient.post<{ message: string }>("/school-years", payload),

  setCurrent: (id: number, schoolId: number) =>
    apiClient.put<{ message: string }>(`/school-years/${id}/set-current`, { school_id: schoolId }),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/school-years/${id}`),
};
