import { enrollmentApi, type StudentEnrollment } from "../../api/enrollments";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { attendanceApi, type StudentSubjectAttendance } from "../../api/classes";

export type { StudentEnrollment, SchoolYear, StudentSubjectAttendance };

export interface StudentDashboardData {
  enrollment: StudentEnrollment | null;
  currentSY: SchoolYear | null;
  attendanceBySubject: StudentSubjectAttendance[];
}

export async function fetchStudentDashboardData(
  userId: string,
  schoolId: number,
  canViewAttendance: boolean
): Promise<StudentDashboardData> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  const sy = syRes.data.data;

  if (!sy) {
    return { enrollment: null, currentSY: null, attendanceBySubject: [] };
  }

  const enrollRes = await enrollmentApi.getByStudentAndSchoolYear(userId, sy.id);
  const enrollment = enrollRes.data.data;

  let attendanceBySubject: StudentSubjectAttendance[] = [];
  if (canViewAttendance) {
    try {
      const attendanceRes = await attendanceApi.getStudentBySubject(sy.id);
      attendanceBySubject = attendanceRes.data.data || [];
    } catch {
      attendanceBySubject = [];
    }
  }

  return { enrollment, currentSY: sy, attendanceBySubject };
}
