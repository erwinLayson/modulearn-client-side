import { attendanceApi, type StudentSubjectAttendance, type StudentAttendanceRecord } from "../../api/classes";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";

export type { StudentSubjectAttendance, StudentAttendanceRecord, SchoolYear };

export async function fetchStudentAttendanceSummary(
  schoolId: number
): Promise<{ subjects: StudentSubjectAttendance[]; currentSchoolYear: SchoolYear | null }> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  const sy = syRes.data.data;

  if (!sy) {
    return { subjects: [], currentSchoolYear: null };
  }

  const res = await attendanceApi.getStudentBySubject(sy.id);
  return {
    subjects: res.data.data || [],
    currentSchoolYear: sy,
  };
}

export interface AttendanceRecordFilters {
  subject_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export async function fetchStudentAttendanceRecords(
  filters: AttendanceRecordFilters
): Promise<StudentAttendanceRecord[]> {
  const res = await attendanceApi.getAllStudentRecords({ ...filters, limit: filters.limit ?? 500 });
  return res.data.data?.data || [];
}
