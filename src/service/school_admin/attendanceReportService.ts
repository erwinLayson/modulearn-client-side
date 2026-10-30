import { attendanceApi, classApi, type ClassListItem } from "../../api/classes";
import { subjectApi, type SubjectListItem } from "../../api/subjects";
import apiClient from "../../api/client";

export type { ClassListItem, SubjectListItem };

export interface AttendanceTeacher {
  id: string;
  name: string;
}

export interface AttendanceRefData {
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  teachers: AttendanceTeacher[];
}

export interface AttendanceMatrixFilters {
  year: number;
  month: number;
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  grade_level?: string;
}

export interface AttendanceMatrixResult {
  school_year_name: string | null;
  data: {
    class_id: string;
    class_name: string;
    section: string | null;
    grade_level: string | null;
    subject_id: string;
    subject_name: string;
    teacher_name: string | null;
    total_enrolled: number;
    attendance_date: string;
    present_count: number;
    absent_count: number;
  }[];
}

export async function fetchAttendanceRefData(schoolId: number): Promise<AttendanceRefData> {
  const [classesRes, subjectsRes, facultiesRes] = await Promise.all([
    classApi.getBySchoolId(schoolId),
    subjectApi.getBySchoolId(schoolId),
    apiClient.get<{ data: { id: string; first_name: string; last_name: string }[] }>(
      `/faculties/school/${schoolId}`
    ),
  ]);

  return {
    classes: classesRes.data.data || [],
    subjects: subjectsRes.data.data || [],
    teachers: (facultiesRes.data.data || []).map((f) => ({
      id: f.id,
      name: `${f.first_name} ${f.last_name}`,
    })),
  };
}

export async function fetchAttendanceMatrix(
  schoolId: number,
  filters: AttendanceMatrixFilters
): Promise<AttendanceMatrixResult> {
  const res = await attendanceApi.getSchoolMatrix(schoolId, filters);
  return res.data.data;
}
