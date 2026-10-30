import { classApi, type ClassListItem } from "../../api/classes";
import { schoolYearApi } from "../../api/school-years";
import { academicPeriodApi, type AcademicPeriod } from "../../api/academicPeriods";
import { gradebookApi, type FinalizationRecord } from "../../api/gradebook";
import { getApiErrorMessage } from "../../api/client";

export type { ClassListItem, AcademicPeriod, FinalizationRecord };
export { getApiErrorMessage };

export const PASS_THRESHOLD = 75;

export interface ClassSubject {
  id: string;
  name: string;
}

export interface FinalizeGradesPayload {
  class_id: string;
  subject_id: string;
  period_id: number | null;
}

export interface CorrectFinalizationPayload {
  final_grade: number | null;
  reason: string;
}

export async function fetchClassesAndPeriods(
  schoolId: number
): Promise<{ classes: ClassListItem[]; periods: AcademicPeriod[] }> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  const currentYear = syRes.data.data;

  const [classesRes, periodsRes] = await Promise.all([
    classApi.getBySchoolId(schoolId, currentYear?.id),
    currentYear
      ? academicPeriodApi.getBySchoolAndYear(schoolId, currentYear.id)
      : Promise.resolve({ data: { data: [] as AcademicPeriod[] } }),
  ]);

  return {
    classes: classesRes.data.data || [],
    periods: periodsRes.data.data || [],
  };
}

export async function fetchSubjectsForClass(classId: string): Promise<ClassSubject[]> {
  const res = await classApi.getFaculties(classId);
  const subs: ClassSubject[] = [];
  const seen = new Set<string>();
  for (const f of res.data.data || []) {
    if (f.subject_id && f.subject_name && !seen.has(f.subject_id)) {
      seen.add(f.subject_id);
      subs.push({ id: f.subject_id, name: f.subject_name });
    }
  }
  return subs;
}

export async function fetchFinalizations(
  classId: string,
  subjectId: string
): Promise<FinalizationRecord[]> {
  const res = await gradebookApi.getFinalizations(classId, subjectId);
  return res.data.data || [];
}

export async function finalizeGrades(payload: FinalizeGradesPayload): Promise<number> {
  const res = await gradebookApi.finalizeGrades(payload);
  return res.data.data?.finalized_count ?? 0;
}

export async function correctFinalization(
  id: number,
  payload: CorrectFinalizationPayload
): Promise<void> {
  await gradebookApi.correctFinalization(id, payload);
}

export function validateCorrectionGrade(grade: string): string | null {
  if (grade !== "") {
    const num = Number(grade);
    if (isNaN(num) || num < 0 || num > 100) {
      return "Final grade must be between 0 and 100";
    }
  }
  return null;
}
