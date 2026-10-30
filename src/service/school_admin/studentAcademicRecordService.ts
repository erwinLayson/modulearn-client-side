import { studentApi, type AcademicRecordResponse } from "../../api/students";

export type { AcademicRecordResponse };

export type Scope = "current" | "all";

export async function fetchStudentAcademicRecord(
  studentId: string,
  scope: Scope
): Promise<AcademicRecordResponse> {
  const { data } = await studentApi.getAcademicRecord(studentId, scope);
  return data.data;
}
