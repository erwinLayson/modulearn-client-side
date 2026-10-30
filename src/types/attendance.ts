export interface DayInfo {
  date: string; // YYYY-MM-DD
  dayNum: number;
  dow: string;
  isWeekend: boolean;
}

export interface MatrixCell {
  classId: string;
  className: string;
  section: string | null;
  gradeLevel: string | null;
  subjectId: string;
  subjectName: string;
  teacherName: string | null;
  totalEnrolled: number;
  date: string;
  present: number;
  rate: number;
}

export interface AttendanceSubjectRow {
  subjectId: string;
  subjectName: string;
  cells: Map<string, MatrixCell>;
}

export interface ClassGroup {
  classId: string;
  className: string;
  section: string | null;
  gradeLevel: string | null;
  subjects: AttendanceSubjectRow[];
}

export interface Filters {
  grade_level: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  month: number;
  year: number;
  search: string;
}

export interface MatrixRow {
  subject_id: string;
  subject_name: string;
  teacher_name: string;
  statuses: Record<string, "present" | "absent">;
}
