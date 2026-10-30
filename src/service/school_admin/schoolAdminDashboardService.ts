import apiClient from "../../api/client";

export interface SchoolAdminFacultyData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SchoolAdminStudentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SchoolAdminModuleData {
  id: string;
  title: string;
  subject: string;
}

export interface SchoolAdminSubjectData {
  id: string;
  name: string;
}

export interface SchoolAdminClassData {
  id: string;
  class_name: string;
  module_title: string;
  faculty_name: string;
  capacity: number | null;
}

export interface SchoolAdminDashboardData {
  faculties: SchoolAdminFacultyData[];
  students: SchoolAdminStudentData[];
  modules: SchoolAdminModuleData[];
  subjects: SchoolAdminSubjectData[];
  classes: SchoolAdminClassData[];
}

export async function fetchSchoolAdminDashboardData(
  schoolId: number
): Promise<SchoolAdminDashboardData> {
  const [facultiesRes, studentsRes, modulesRes, subjectsRes, classesRes] = await Promise.all([
    apiClient.get<{ data: SchoolAdminFacultyData[] }>(`/faculties/school/${schoolId}`),
    apiClient.get<{ data: SchoolAdminStudentData[] }>(`/students/school/${schoolId}`),
    apiClient.get<{ data: SchoolAdminModuleData[] }>(`/modules/school/${schoolId}`),
    apiClient.get<{ data: SchoolAdminSubjectData[] }>(`/subjects/school/${schoolId}`),
    apiClient.get<{ data: SchoolAdminClassData[] }>(`/classes/school/${schoolId}`),
  ]);

  return {
    faculties: facultiesRes.data.data || [],
    students: studentsRes.data.data || [],
    modules: modulesRes.data.data || [],
    subjects: subjectsRes.data.data || [],
    classes: classesRes.data.data || [],
  };
}
