import apiClient from "./client";

export interface ScheduleItem {
  day: string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface FacultyClassAssignment {
  id: string;
  class_name: string;
  school_id: number;
  faculty_id: string;
  capacity: number | null;
  section: string | null;
  grade_level: string | null;
  schedule: ScheduleItem[] | null;
  created_at: string;
  faculty_name: string;
  adviser_role: boolean;
  subjects: { id: string; name: string }[];
}

export interface ClassListItem {
  id: string;
  class_name: string;
  module_id: string;
  module_title: string;
  faculty_id: string;
  faculty_name: string;
  school_id: number;
  school_name?: string;
  capacity: number | null;
  section: string | null;
  grade_level: string | null;
  schedule: ScheduleItem[] | null;
  created_at: string;
}

export interface ClassPayload {
  class_name: string;
  module_id?: string;
  faculty_id: string;
  school_id: number;
  capacity?: number;
  section?: string;
  grade_level?: string;
  schedule?: ScheduleItem[];
}

export interface ClassUpdatePayload {
  class_name?: string;
  module_id?: string;
  faculty_id?: string;
  capacity?: number;
  section?: string;
  grade_level?: string;
  schedule?: ScheduleItem[];
}

export interface ClassFaculty {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject_id: string | null;
  subject_name: string | null;
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
  student_id: string;
  subject_id: string;
  status: AttendanceStatus;
  recorded_at: string;
  marked_by: string;
}

export interface AttendanceMarkPayload {
  records: { student_id: string; status: AttendanceStatus }[];
  date?: string;
  subject_id: string;
}

export interface AttendanceHistoryItem {
  attendance_date: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  present_count: number;
  absent_count: number;
  total_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface FacultyDashboardSummary {
  today: {
    classes_with_attendance: number;
    classes_pending: number;
    total_classes_today: number;
  };
  this_week: {
    total_sessions: number;
    total_present: number;
    total_absent: number;
    attendance_rate: number;
  };
}

export interface StudentSubjectAttendance {
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  teacher_name: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
}

export interface StudentAttendanceDetail {
  attendance_date: string;
  status: AttendanceStatus;
  recorded_at: string;
  marked_by: string;
  teacher_name: string;
}

export interface StudentAttendanceRecord {
  subject_id: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  attendance_date: string;
  status: AttendanceStatus;
}

export interface SchoolAttendanceReportItem {
  class_id: string;
  class_name: string;
  section: string | null;
  grade_level: string | null;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  recorded_at: string;
  marked_by: string;
  marked_by_name: string;
}

export interface AttendanceHistoryFilters {
  class_id?: string;
  subject_id?: string;
  student_id?: string;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface SchoolAttendanceReportFilters {
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const classApi = {
  getAll: () =>
    apiClient.get<{ data: ClassListItem[] }>("/classes"),

  getBySchoolId: (schoolId: number) =>
    apiClient.get<{ data: ClassListItem[] }>(`/classes/school/${schoolId}`),

  getAssignedClasses: (facultyId: string) =>
    apiClient.get<{ data: FacultyClassAssignment[] }>(`/classes/faculty/${facultyId}/assigned`),

  getAttendance: (classId: string, date: string, subjectId?: string) =>
    apiClient.get<{ data: AttendanceRecord[] }>(`/attendance/class/${classId}`, { params: { date, subject_id: subjectId } }),

  markAttendance: (classId: string, payload: AttendanceMarkPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>(`/attendance/class/${classId}`, payload),

  editAttendance: (classId: string, payload: AttendanceMarkPayload & { date: string }) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/attendance/class/${classId}`, payload),

  createAttendanceSession: (payload: { class_id: string; subject_id: string; date: string }) =>
    apiClient.post<{ message: string; isOk: boolean }>("/attendance/sessions", payload),

  getClassSessions: (classId: string) =>
    apiClient.get<{ data: { attendance_date: string; subject_id: string; subject_name: string }[] }>(`/attendance/sessions/${classId}`),

  getById: (id: string) =>
    apiClient.get<{ data: ClassListItem }>(`/classes/${id}`),

  create: (payload: ClassPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/classes", payload),

  update: (id: string, payload: ClassUpdatePayload) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/classes/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/classes/${id}`),

  getFaculties: (id: string) =>
    apiClient.get<{ data: ClassFaculty[] }>(`/classes/${id}/faculties`),

  assignFaculty: (id: string, facultyId: string, subjectId?: string) =>
    apiClient.post<{ message: string; isOk: boolean }>(`/classes/${id}/faculties`, { faculty_id: facultyId, subject_id: subjectId }),

  replaceFaculty: (id: string, oldFacultyId: string, newFacultyId: string, subjectId?: string) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/classes/${id}/faculties/${oldFacultyId}`, { new_faculty_id: newFacultyId, subject_id: subjectId }),

  removeFaculty: (id: string, facultyId: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/classes/${id}/faculties/${facultyId}`),

  getAvailableFaculties: (schoolId: number) =>
    apiClient.get<{ data: ClassFaculty[] }>(`/classes/faculties/school/${schoolId}`),

  getAvailableAdvisers: (schoolId: number) =>
    apiClient.get<{ data: ClassFaculty[] }>(`/classes/available-advisers/${schoolId}`),
};

export const attendanceApi = {
  getHistory: (filters: AttendanceHistoryFilters = {}) =>
    apiClient.get<{ data: PaginatedResponse<AttendanceHistoryItem> }>("/attendance/history", { params: filters }),

  getFacultySummary: () =>
    apiClient.get<{ data: FacultyDashboardSummary }>("/attendance/faculty/summary"),

  getStudentBySubject: (schoolYearId?: number) =>
    apiClient.get<{ data: StudentSubjectAttendance[] }>("/attendance/student/me", { params: { school_year_id: schoolYearId } }),

  getStudentDetail: (classId: string, subjectId: string, filters: { date_from?: string; date_to?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<{ data: PaginatedResponse<StudentAttendanceDetail> }>(`/attendance/student/me/${classId}/${subjectId}`, { params: filters }),

  getAllStudentRecords: (filters: { subject_id?: string; date_from?: string; date_to?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<{ data: PaginatedResponse<StudentAttendanceRecord> }>("/attendance/student/me/records", { params: filters }),

  getSchoolReport: (schoolId: number, filters: SchoolAttendanceReportFilters = {}) =>
    apiClient.get<{ data: PaginatedResponse<SchoolAttendanceReportItem> }>(`/attendance/school/${schoolId}/report`, { params: filters }),

  getSchoolAttendance: (schoolId: number, date: string, subjectId?: string) =>
    apiClient.get<{ data: AttendanceRecord[] }>(`/attendance/school/${schoolId}`, { params: { date, subject_id: subjectId } }),
};