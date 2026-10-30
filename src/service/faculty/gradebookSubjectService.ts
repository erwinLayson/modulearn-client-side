import {
  gradebookApi,
  type GradeItem,
  type GradesForSubjectResponse,
  type GradingCategory,
  type GradeItemCategory,
  type FinalizationRecord,
} from "../../api/gradebook";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { resolveCurrentPeriodId } from "../../api/academicPeriods";
import { getApiErrorMessage } from "../../api/client";

export type {
  GradeItem,
  GradesForSubjectResponse,
  GradingCategory,
  GradeItemCategory,
  FinalizationRecord,
  SchoolYear,
};

export const CATEGORY_LABELS: Record<string, string> = {
  activities: "Activities",
  quizzes: "Quizzes",
  exams: "Exams",
  attendance: "Attendance",
};

export const CATEGORY_ORDER: GradingCategory[] = [
  "activities",
  "quizzes",
  "exams",
  "attendance",
];

export const PASS_THRESHOLD = 75;

export type GradeSheetItem = GradesForSubjectResponse["items"][number];

export interface EnrichedStudent {
  student_id: string;
  student_name: string;
  lrn: string | null;
  attendance_rate: number;
  final_grade: number | null;
  categories: {
    [key: string]: { earned: number; possible: number };
  };
}

export interface ItemFormData {
  title: string;
  category: GradeItemCategory;
  max_score: number;
  due_date: string;
  period_id: string;
}

export async function fetchCurrentSchoolYear(schoolId: number): Promise<SchoolYear | null> {
  const res = await schoolYearApi.getCurrent(schoolId);
  return res.data.data || null;
}

export async function fetchDefaultPeriodId(schoolId: number): Promise<number | null> {
  return resolveCurrentPeriodId(schoolId);
}

export async function fetchGradingWeights(
  classId: string,
  subjectId: string
): Promise<Record<string, number>> {
  const res = await gradebookApi.getWeights(classId, subjectId);
  const w = res.data.data || [];
  const wMap: Record<string, number> = {};
  for (const cat of CATEGORY_ORDER) {
    const found = w.find((x) => x.category === cat);
    wMap[cat] = found ? found.weight : 0;
  }
  return wMap;
}

export async function saveGradingWeights(
  classId: string,
  subjectId: string,
  editWeights: Record<string, number>
): Promise<void> {
  const weightArray = Object.entries(editWeights).map(([category, weight]) => ({
    category,
    weight,
  }));
  await gradebookApi.updateWeights(classId, subjectId, weightArray);
}

export interface SheetDataResult {
  items: GradeItem[];
  gradeData: GradesForSubjectResponse;
  initialScores: Record<string, string>;
}

export async function fetchSheetData(
  classId: string,
  subjectId: string,
  selectedPeriod: string
): Promise<SheetDataResult> {
  const [itemsRes, gradesRes] = await Promise.all([
    gradebookApi.getItems(classId, subjectId, undefined, selectedPeriod),
    gradebookApi.getGrades(classId, subjectId, selectedPeriod),
  ]);

  const items = itemsRes.data.data || [];
  const gradeData: GradesForSubjectResponse = gradesRes.data.data || {
    class: { id: classId, name: "", section: null, grade_level: null },
    subject: { id: subjectId, name: null },
    weights: [],
    items,
    students: [],
  };

  const initialScores: Record<string, string> = {};
  for (const s of gradeData.students || []) {
    for (const gi of s.items || []) {
      const key = `${s.student_id}:${gi.id}`;
      initialScores[key] =
        gi.score !== null && gi.score !== undefined ? String(gi.score) : "";
    }
  }

  return { items, gradeData, initialScores };
}

export async function fetchFinalizations(
  classId: string,
  subjectId: string
): Promise<FinalizationRecord[]> {
  const res = await gradebookApi.getFinalizations(classId, subjectId);
  return res.data.data || [];
}

export async function createGradeItem(
  classId: string,
  subjectId: string,
  form: ItemFormData
): Promise<void> {
  await gradebookApi.createItem(classId, subjectId, {
    category: form.category,
    title: form.title.trim(),
    max_score: form.max_score,
    due_date: form.due_date || null,
    period_id: Number(form.period_id),
  });
}

export async function updateGradeItem(
  itemId: string,
  form: ItemFormData
): Promise<void> {
  await gradebookApi.updateItem(itemId, {
    title: form.title.trim(),
    category: form.category,
    max_score: form.max_score,
    due_date: form.due_date || null,
    period_id: Number(form.period_id),
  });
}

export async function deleteGradeItem(itemId: string): Promise<void> {
  await gradebookApi.deleteItem(itemId);
}

export async function saveModifiedScores(
  scores: Record<string, string>,
  modifiedScores: Set<string>
): Promise<void> {
  const byItem: Record<string, { student_id: string; score: number }[]> = {};
  for (const key of modifiedScores) {
    const [studentId, itemId] = key.split(":");
    const val = scores[key];
    if (val !== undefined && val !== "") {
      const num = Number(val);
      if (!isNaN(num)) {
        if (!byItem[itemId]) byItem[itemId] = [];
        byItem[itemId].push({ student_id: studentId, score: num });
      }
    }
  }

  const calls = Object.entries(byItem).map(([itemId, grades]) =>
    gradebookApi.upsertGrades(itemId, grades)
  );
  await Promise.all(calls);
}

export async function upsertGradeScores(
  itemId: string,
  grades: { student_id: string; score: number }[]
): Promise<void> {
  await gradebookApi.upsertGrades(itemId, grades);
}

export async function finalizePeriodGrades(
  classId: string,
  subjectId: string,
  periodId: number
): Promise<number> {
  const res = await gradebookApi.finalizeGrades({
    class_id: classId,
    subject_id: subjectId,
    period_id: periodId,
  });
  return res.data.data?.finalized_count ?? 0;
}

export function enrichStudents(
  gradeData: GradesForSubjectResponse | null
): EnrichedStudent[] {
  if (!gradeData) return [];
  return gradeData.students.map((s) => {
    const categories: Record<string, { earned: number; possible: number }> = {};
    for (const cat of CATEGORY_ORDER) {
      categories[cat] = { earned: 0, possible: 0 };
    }
    for (const gi of s.items) {
      categories[gi.category].possible += Number(gi.max_score);
      if (gi.score !== null && gi.score !== undefined) {
        categories[gi.category].earned += Number(gi.score);
      }
    }
    return {
      student_id: s.student_id,
      student_name: s.student_name,
      lrn: s.lrn ?? null,
      attendance_rate: s.attendance_rate,
      final_grade: s.final_grade,
      categories,
    };
  });
}

export function groupGradeItems(
  gradeData: GradesForSubjectResponse | null
): Record<string, GradeSheetItem[]> {
  if (!gradeData) return {};
  const groups: Record<string, GradeSheetItem[]> = {
    activities: [],
    quizzes: [],
    exams: [],
  };
  for (const item of gradeData.items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return groups;
}

export { getApiErrorMessage };
