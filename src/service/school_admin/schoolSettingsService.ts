import { academicPeriodApi, type AcademicPeriod } from "../../api/academicPeriods";
import apiClient from "../../api/client";

export type { AcademicPeriod };

export interface SchoolConfig {
  academic_system: string;
  period_count: number;
  academic_config_completed: boolean;
}

export interface SchoolYear {
  id: number;
  is_current: number;
}

export async function fetchSchoolSettingsData(
  schoolId: number
): Promise<{ config: SchoolConfig; currentSchoolYearId: number | null; periods: AcademicPeriod[] }> {
  const [configRes, syRes] = await Promise.all([
    apiClient.get<{
      data: { academic_system: string; period_count: number; academic_config_completed: number };
    }>(`/schools/${schoolId}/config`),
    apiClient.get<{ data: { id: number; is_current: number }[] }>(
      `/school-years/school/${schoolId}`
    ),
  ]);

  const configData = configRes.data.data;
  const config: SchoolConfig = {
    academic_system: configData.academic_system,
    period_count: configData.period_count,
    academic_config_completed: configData.academic_config_completed === 1,
  };

  const currentSy = (syRes.data.data || []).find((sy) => sy.is_current === 1);
  let periods: AcademicPeriod[] = [];

  if (currentSy) {
    const periodsRes = await academicPeriodApi.getBySchoolAndYear(schoolId, currentSy.id);
    periods = periodsRes.data.data || [];
  }

  return {
    config,
    currentSchoolYearId: currentSy ? currentSy.id : null,
    periods,
  };
}

export async function saveAcademicConfig(
  schoolId: number,
  academicSystem: string,
  periodCount: number
): Promise<void> {
  await apiClient.put(`/schools/${schoolId}/config`, {
    academic_system: academicSystem,
    period_count: periodCount,
  });
}

export async function generatePeriods(
  schoolYearId: number
): Promise<{ generated: number }> {
  const { data } = await academicPeriodApi.generate(schoolYearId);
  return data.data;
}

export async function fetchPeriods(
  schoolId: number,
  schoolYearId: number
): Promise<AcademicPeriod[]> {
  const res = await academicPeriodApi.getBySchoolAndYear(schoolId, schoolYearId);
  return res.data.data || [];
}

export async function setCurrentPeriod(periodId: number): Promise<void> {
  await academicPeriodApi.setCurrent(periodId);
}

export async function updatePeriod(
  periodId: number,
  payload: { name: string; start_date: string; end_date: string }
): Promise<AcademicPeriod> {
  const { data } = await academicPeriodApi.update(periodId, payload);
  return data.data;
}

export async function deletePeriod(periodId: number): Promise<void> {
  await academicPeriodApi.delete(periodId);
}

export function getPeriodUpdateErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
      "Failed to update period"
    );
  }
  return "Failed to update period";
}
