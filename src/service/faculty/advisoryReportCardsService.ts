import { classApi, type ClassListItem } from "../../api/classes";
import { enrollmentApi } from "../../api/enrollments";
import { schoolYearApi } from "../../api/school-years";
import { studentApi, type AcademicRecordResponse } from "../../api/students";

export type { ClassListItem, AcademicRecordResponse };

export interface BatchEntry {
  student_id: string;
  student_name: string;
  record: AcademicRecordResponse | null;
  error: string | null;
}

export type Scope = "current" | "all";

export const FETCH_BATCH_SIZE = 4;

export async function fetchClassAndSchoolYear(
  classId: string,
  schoolId: number
): Promise<{ cls: ClassListItem; schoolYearName: string | null; schoolYearId: number | null }> {
  const [classRes, syRes] = await Promise.all([
    classApi.getById(classId),
    schoolYearApi.getCurrent(schoolId),
  ]);
  const cls = classRes.data.data;
  const currentYear = syRes.data.data;

  return {
    cls,
    schoolYearName: currentYear?.name || null,
    schoolYearId: currentYear?.id || null,
  };
}

export async function fetchEnrolledStudents(
  classId: string,
  schoolYearId: number
): Promise<{ student_id: string; student_name: string }[]> {
  const enrollRes = await enrollmentApi.getByClassAndSchoolYear(classId, schoolYearId);
  return (enrollRes.data.data || []).map((e) => ({
    student_id: e.student_id,
    student_name: e.student_name,
  }));
}

export async function fetchStudentAcademicRecord(
  studentId: string,
  scope: Scope
): Promise<AcademicRecordResponse> {
  const res = await studentApi.getAcademicRecord(studentId, scope);
  return res.data.data;
}

export async function loadBatchStudentRecords(
  students: { student_id: string; student_name: string }[],
  scope: Scope
): Promise<BatchEntry[]> {
  return Promise.all(
    students.map(async (student): Promise<BatchEntry> => {
      try {
        const res = await studentApi.getAcademicRecord(student.student_id, scope);
        return { ...student, record: res.data.data, error: null };
      } catch {
        return { ...student, record: null, error: "Could not load this report card" };
      }
    })
  );
}
