import apiClient from "./client";

export type GradingCategory = "activities" | "quizzes" | "exams" | "attendance";
export type GradeItemCategory = "activities" | "quizzes" | "exams";

export interface GradingWeight {
  id: number;
  category: GradingCategory;
  weight: number;
}

export interface GradeItem {
  id: string;
  class_id: string;
  subject_id: string;
  faculty_id: string;
  category: GradeItemCategory;
  title: string;
  max_score: number;
  due_date: string | null;
  created_at: string;
}

export interface GradeItemWithScore extends GradeItem {
  score: number | null;
}

export interface FacultyAssignedClassSubject {
  class_id: string;
  class_name: string;
  section: string | null;
  grade_level: string | null;
  subject_id: string;
  subject_name: string;
}

export interface StudentGrade {
  student_id: string;
  student_name: string;
  student_email: string;
  lrn: string | null;
  items: { id: string; category: GradeItemCategory; title: string; max_score: number; score: number | null }[];
  attendance_rate: number;
  final_grade: number | null;
}

export interface GradesForSubjectResponse {
  class: { id: string; name: string; section: string | null; grade_level: string | null };
  subject: { id: string };
  weights: { category: GradingCategory; weight: number }[];
  items: { id: string; category: GradeItemCategory; title: string; max_score: number; due_date: string | null }[];
  students: StudentGrade[];
}

export interface StudentSubjectGradeSummary {
  subject_id: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  section: string | null;
  grade_level: number | null;
  teacher_name: string;
  activities: { items: { id: string; title: string; score: number | null; max_score: number; due_date: string | null }[]; average: number | null };
  quizzes: { items: { id: string; title: string; score: number | null; max_score: number; due_date: string | null }[]; average: number | null };
  exams: { items: { id: string; title: string; score: number | null; max_score: number; due_date: string | null }[]; average: number | null };
  attendance_rate: number;
  grading_weights: { category: GradingCategory; weight: number }[];
  final_grade: number | null;
}

export const gradebookApi = {
  // Grading Weights
  getWeights: (classId: string, subjectId: string) =>
    apiClient.get<{ data: GradingWeight[] }>(`/gradebook/weights/${classId}/${subjectId}`),

  updateWeights: (classId: string, subjectId: string, weights: { category: string; weight: number }[]) =>
    apiClient.put<{ message: string }>(`/gradebook/weights/${classId}/${subjectId}`, { weights }),

  // Grade Items
  getItems: (classId: string, subjectId: string, category?: string) =>
    apiClient.get<{ data: GradeItem[] }>(`/gradebook/items/${classId}/${subjectId}`, { params: category ? { category } : {} }),

  createItem: (classId: string, subjectId: string, data: { category: string; title: string; max_score: number; due_date?: string | null }) =>
    apiClient.post<{ data: { id: string; message: string } }>(`/gradebook/items/${classId}/${subjectId}`, data),

  updateItem: (id: string, data: { title: string; category: string; max_score: number; due_date?: string | null }) =>
    apiClient.put<{ message: string }>(`/gradebook/items/${id}`, data),

  deleteItem: (id: string) =>
    apiClient.delete<{ message: string }>(`/gradebook/items/${id}`),

  // Grades (Faculty)
  getGrades: (classId: string, subjectId: string) =>
    apiClient.get<{ data: GradesForSubjectResponse }>(`/gradebook/grades/${classId}/${subjectId}`),

  upsertGrades: (gradeItemId: string, grades: { student_id: string; score: number }[]) =>
    apiClient.post<{ message: string }>(`/gradebook/grades/${gradeItemId}`, { grades }),

  // Student APIs
  getStudentGrades: (classId: string, subjectId: string) =>
    apiClient.get<{ data: StudentSubjectGradeSummary }>(`/gradebook/student/${classId}/${subjectId}`),

  getStudentSummary: () =>
    apiClient.get<{ data: StudentSubjectGradeSummary[] }>("/gradebook/student-summary"),
};
