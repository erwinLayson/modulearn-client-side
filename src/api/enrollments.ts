import apiClient from "./client";

export interface EnrollmentSubject {
  id: string;
  name: string;
  teacher_name: string | null;
}

export interface EnrollmentListItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  lrn: string | null;
  class_id: string;
  class_name: string;
  section: string | null;
  grade_level: number | null;
  school_year_id: number | null;
  school_year_name: string | null;
  status: "active" | "dropped" | "completed";
  enrolled_at: string;
  subjects: EnrollmentSubject[];
}

export interface StudentEnrollment {
  id: string;
  class_id: string;
  class_name: string;
  section: string | null;
  grade_level: number | null;
  capacity: number | null;
  adviser_name: string | null;
  school_year_id: number | null;
  school_year_name: string | null;
  status: "active" | "dropped" | "completed";
  enrolled_at: string;
  schedule: { day: string; start_time: string; end_time: string; room?: string }[] | null;
  subjects: EnrollmentSubject[];
}

export interface EnrollPayload {
  student_id: string;
  class_id: string;
  school_year_id: number;
  grade_level: number;
  subject_ids: string[];
}

export interface UpdateEnrollmentPayload {
  status: "active" | "dropped" | "completed";
}

export interface EnrollmentClass {
  class_id: string;
  class_name: string;
  subjects: { id: string; name: string }[];
}

export const enrollmentApi = {
  getByClassAndSchoolYear: (classId: string, schoolYearId: number) =>
    apiClient.get<{ data: EnrollmentListItem[] }>(`/enrollments/class/${classId}/school-year/${schoolYearId}`),

  getByStudentId: (studentId: string) =>
    apiClient.get<{ data: StudentEnrollment[] }>(`/enrollments/student/${studentId}`),

  getByStudentAndSchoolYear: (studentId: string, schoolYearId: number) =>
    apiClient.get<{ data: StudentEnrollment | null }>(`/enrollments/student/${studentId}/school-year/${schoolYearId}`),

  getClassesByStudentId: (studentId: string) =>
    apiClient.get<{ data: EnrollmentClass[] }>(`/enrollments/student/${studentId}/classes`),

  create: (payload: EnrollPayload) =>
    apiClient.post<{ message: string }>("/enrollments", payload),

  updateStatus: (id: string, payload: UpdateEnrollmentPayload) =>
    apiClient.put<{ message: string }>(`/enrollments/${id}/status`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/enrollments/${id}`),
};
