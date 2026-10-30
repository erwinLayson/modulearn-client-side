export interface ColumnDef {
  key: string;
  date: string;
  category: string;
  title: string;
  isModuleActivity?: boolean;
  instructions?: string | null;
}

export interface SubjectRow {
  subject_id: string;
  subject_name: string;
  teacher_name: string;
  scoresByCol: Map<string, { score: number | null; max_score: number }>;
  totalEarned: number;
  totalPossible: number;
  finalGrade: number | null;
}
