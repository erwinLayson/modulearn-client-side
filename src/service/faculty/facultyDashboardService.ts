import apiClient from "../../api/client";
import { attendanceApi, type FacultyDashboardSummary } from "../../api/classes";
import { schoolYearApi } from "../../api/school-years";

export type { FacultyDashboardSummary };

export interface FacultyDashboardModuleData {
  id: string;
  title: string;
  subject: string;
}

export interface FacultyDashboardStudentData {
  id: string;
  first_name: string;
  last_name: string;
}

export interface FacultyDashboardClassData {
  id: string;
  class_name: string;
  module_id: string;
  faculty_id: string;
  school_year_id: number;
}

export interface FacultyDashboardData {
  classes: FacultyDashboardClassData[];
  modules: FacultyDashboardModuleData[];
  students: FacultyDashboardStudentData[];
}

export async function fetchFacultyDashboardData(
  userId: string,
  schoolId: number
): Promise<FacultyDashboardData> {
  const [classesRes, modulesRes, studentsRes, syRes] = await Promise.all([
    apiClient.get<{ data: FacultyDashboardClassData[] }>(`/classes/faculty/${userId}`),
    apiClient.get<{ data: FacultyDashboardModuleData[] }>(`/modules/mine`),
    apiClient.get<{ data: FacultyDashboardStudentData[] }>(`/students/school/${schoolId}`),
    schoolYearApi.getCurrent(schoolId),
  ]);

  const currentSy = syRes.data.data;
  const allClasses = classesRes.data.data || [];

  return {
    classes: currentSy
      ? allClasses.filter((c) => c.school_year_id === currentSy.id)
      : allClasses,
    modules: modulesRes.data.data || [],
    students: studentsRes.data.data || [],
  };
}

export async function fetchFacultyAttendanceSummary(): Promise<FacultyDashboardSummary | null> {
  const res = await attendanceApi.getFacultySummary();
  return res.data.data;
}
