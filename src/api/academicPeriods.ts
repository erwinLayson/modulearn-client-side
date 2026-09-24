import apiClient from "./client";
import { schoolYearApi } from "./school-years";

export interface AcademicPeriod {
  id: number;
  school_id: number;
  school_year_id: number;
  name: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_current: number;
}

export const academicPeriodApi = {
  getBySchoolAndYear: (schoolId: number, yearId: number) =>
    apiClient.get<{ data: AcademicPeriod[] }>(`/academic-periods/school/${schoolId}/year/${yearId}`),

  getCurrent: (schoolId: number) =>
    apiClient.get<{ data: AcademicPeriod | null }>(`/academic-periods/school/${schoolId}/current`),

  create: (payload: { school_id: number; school_year_id: number; name: string; period_number: number; start_date: string; end_date: string }) =>
    apiClient.post<{ data: { id: number } }>("/academic-periods", payload),

  update: (id: number, data: { name?: string; start_date?: string; end_date?: string }) =>
    apiClient.put<{ data: AcademicPeriod }>(`/academic-periods/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/academic-periods/${id}`),

  setCurrent: (id: number) =>
    apiClient.put<{ message: string }>(`/academic-periods/${id}/set-current`),

  generate: (schoolYearId: number) =>
    apiClient.post<{ data: { generated: number } }>("/academic-periods/generate", { school_year_id: schoolYearId }),
};

export const resolveCurrentPeriodId = async (schoolId: number): Promise<number | null> => {
  try {
    const curRes = await academicPeriodApi.getCurrent(schoolId);
    if (curRes.data.data) return curRes.data.data.id;
  } catch {
    // no current period marked - fall back to the first period of the current school year
  }
  try {
    const syRes = await schoolYearApi.getCurrent(schoolId);
    const sy = syRes.data.data;
    if (sy) {
      const listRes = await academicPeriodApi.getBySchoolAndYear(schoolId, sy.id);
      const periods = (listRes.data.data || []).slice().sort((a, b) => a.period_number - b.period_number);
      if (periods.length > 0) return periods[0].id;
    }
  } catch {
    // no academic periods configured
  }
  return null;
};
