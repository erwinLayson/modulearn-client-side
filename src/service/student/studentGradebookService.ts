import { gradebookApi, type StudentSubjectGradeSummary } from "../../api/gradebook";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { resolveCurrentPeriodId } from "../../api/academicPeriods";

export type { StudentSubjectGradeSummary, SchoolYear };

export async function resolveDefaultPeriod(schoolId: number): Promise<number | null> {
  return resolveCurrentPeriodId(schoolId);
}

export async function fetchCurrentSchoolYear(schoolId: number): Promise<SchoolYear | null> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  return syRes.data.data || null;
}

export async function fetchStudentGradeSummary(
  periodId: string
): Promise<StudentSubjectGradeSummary[]> {
  const res = await gradebookApi.getStudentSummary(periodId);
  return res.data.data || [];
}

export const GRADE_CATEGORY_ORDER = ["activities", "quizzes", "exams"] as const;
export const PASS_THRESHOLD = 75;

export function parseItemDate(dateVal: unknown): string | null {
  if (!dateVal) return null;
  if (typeof dateVal === "string") {
    const match = dateVal.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().slice(0, 10);
  }
  return null;
}

export function getGradeColor(grade: number, colors: {
  gradeExcellent: string;
  gradeGood: string;
  gradeFair: string;
  gradePoor: string;
}): string {
  if (grade >= 90) return colors.gradeExcellent;
  if (grade >= 75) return colors.gradeGood;
  if (grade >= 60) return colors.gradeFair;
  return colors.gradePoor;
}
