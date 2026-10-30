import { classApi, type ClassListItem } from "../../api/classes";
import {
  enrollmentApi,
  type EnrollmentListItem,
  type EnrollPayload,
} from "../../api/enrollments";
import {
  studentApi,
  type StudentListItem,
  type AcademicRecordYear,
  type AcademicRecordSubject,
} from "../../api/students";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { getApiErrorMessage } from "../../api/client";

export type {
  ClassListItem,
  EnrollmentListItem,
  EnrollPayload,
  StudentListItem,
  AcademicRecordYear,
  AcademicRecordSubject,
  SchoolYear,
};
export { getApiErrorMessage };

export interface ClassSubject {
  id: string;
  name: string;
  teacher_name: string | null;
}

export const STATUS_LABELS: Record<EnrollmentListItem["status"], string> = {
  active: "Active",
  dropped: "Dropped",
  completed: "Completed",
};

export function formatGrade(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}

export function averageGrade(subjects: AcademicRecordSubject[]): number | null {
  const graded = subjects
    .map((subj) => subj.final_grade)
    .filter((g): g is number => typeof g === "number");
  return graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

const AVATAR_VARIANTS = [
  "enroll-avatar--1",
  "enroll-avatar--2",
  "enroll-avatar--3",
  "enroll-avatar--4",
  "enroll-avatar--5",
  "enroll-avatar--6",
];

export function avatarClass(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_VARIANTS[sum % AVATAR_VARIANTS.length];
}

export async function fetchSchoolYearsWithAutoGenerate(
  schoolId: number
): Promise<{ schoolYears: SchoolYear[]; currentYearId: number }> {
  await schoolYearApi.autoGenerate(schoolId);
  const res = await schoolYearApi.getBySchoolId(schoolId);
  const syList = res.data.data || [];
  const current = syList.find((s: SchoolYear) => s.is_current === 1);
  return {
    schoolYears: syList,
    currentYearId: current ? current.id : 0,
  };
}

export async function fetchEnrollmentBaseData(
  schoolId: number
): Promise<{ allStudents: StudentListItem[]; allClasses: ClassListItem[] }> {
  const [studentsRes, classesRes] = await Promise.all([
    studentApi.getAll(schoolId),
    classApi.getBySchoolId(schoolId),
  ]);
  return {
    allStudents: studentsRes.data.data || [],
    allClasses: classesRes.data.data || [],
  };
}

export async function fetchClassEnrollments(
  classId: string,
  schoolYearId: number
): Promise<EnrollmentListItem[]> {
  const res = await enrollmentApi.getByClassAndSchoolYear(classId, schoolYearId);
  return res.data.data || [];
}

export async function fetchPreviousGrades(
  studentId: string,
  excludeSchoolYearId: number
): Promise<AcademicRecordYear[]> {
  const res = await studentApi.getAcademicRecord(studentId, "all");
  const records = res.data.data?.records ?? [];
  return records
    .filter((r) => r.school_year.id !== excludeSchoolYearId)
    .sort(
      (a, b) =>
        (b.school_year.start_date ?? "").localeCompare(a.school_year.start_date ?? "") ||
        b.school_year.id - a.school_year.id
    );
}

export async function fetchClassSubjects(classId: string): Promise<ClassSubject[]> {
  const res = await classApi.getFaculties(classId);
  return (res.data.data || [])
    .filter((f) => f.subject_id && f.subject_name)
    .map((f) => ({
      id: f.subject_id as string,
      name: f.subject_name as string,
      teacher_name: `${f.first_name} ${f.last_name}`,
    }));
}

export async function enrollStudent(payload: EnrollPayload): Promise<void> {
  await enrollmentApi.create(payload);
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentListItem["status"]
): Promise<void> {
  await enrollmentApi.updateStatus(enrollmentId, { status });
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  await enrollmentApi.delete(enrollmentId);
}

export function filterSearchResults(
  allStudents: StudentListItem[],
  query: string
): StudentListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allStudents
    .filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
    .slice(0, 8);
}

export function filterEligibleClasses(
  allClasses: ClassListItem[],
  gradeLevel: number | null
): ClassListItem[] {
  if (gradeLevel === null) return [];
  return allClasses.filter(
    (c) => c.grade_level === null || c.grade_level === String(gradeLevel)
  );
}
