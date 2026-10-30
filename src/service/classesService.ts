import { classApi, type ClassListItem, type ScheduleItem, type FacultyClassAssignment } from "../api/classes";
import { enrollmentApi, type EnrollmentListItem } from "../api/enrollments";
import { schoolYearApi } from "../api/school-years";

export type { ClassListItem, ScheduleItem, FacultyClassAssignment, EnrollmentListItem };

export type UserRole = "school_admin" | "faculty" | "student";

export interface EnrollmentClass {
  class_id: string;
  class_name: string;
  subjects: { id: string; name: string }[];
}

export interface StudentClassDetail {
  id: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  capacity: number | null;
  faculty_name: string | null;
  schedule: ScheduleItem[] | null;
  subjects: { id: string; name: string; teacher_name: string | null }[];
}

export interface FacultyCardItem {
  key: string;
  cls: ClassListItem;
  advisory: boolean;
  subjects: string[];
}

export async function fetchStudentClassesData(userId: string): Promise<{
  enrollmentClasses: EnrollmentClass[];
  studentClassDetails: Record<string, StudentClassDetail>;
}> {
  const { data } = await enrollmentApi.getClassesByStudentId(userId);
  const classesData: EnrollmentClass[] = data.data || [];
  const details: Record<string, StudentClassDetail> = {};

  for (const ec of classesData) {
    try {
      const classRes = await classApi.getById(ec.class_id);
      const cls = classRes.data.data;
      let subjectsWithTeachers: { id: string; name: string; teacher_name: string | null }[] = [];
      try {
        const facultiesRes = await classApi.getFaculties(ec.class_id);
        subjectsWithTeachers = (facultiesRes.data.data || []).map((f) => ({
          id: f.subject_id || f.id,
          name: f.subject_name || "Unknown Subject",
          teacher_name: `${f.first_name} ${f.last_name}`,
        }));
      } catch {
        subjectsWithTeachers =
          ec.subjects?.map((s) => ({ id: s.id, name: s.name, teacher_name: null })) || [];
      }
      details[ec.class_id] = {
        id: cls.id,
        class_name: cls.class_name,
        grade_level: cls.grade_level,
        section: cls.section,
        capacity: cls.capacity,
        faculty_name: cls.faculty_name,
        schedule: cls.schedule,
        subjects: subjectsWithTeachers,
      };
    } catch {
      details[ec.class_id] = {
        id: ec.class_id,
        class_name: ec.class_name,
        grade_level: null,
        section: null,
        capacity: null,
        faculty_name: null,
        schedule: null,
        subjects:
          ec.subjects?.map((s) => ({ id: s.id, name: s.name, teacher_name: null })) || [],
      };
    }
  }

  return { enrollmentClasses: classesData, studentClassDetails: details };
}

export async function fetchFacultyClassesData(
  userId: string,
  schoolId?: number
): Promise<FacultyClassAssignment[]> {
  const [assignedRes, syRes] = await Promise.all([
    classApi.getAssignedClasses(userId),
    schoolId ? schoolYearApi.getCurrent(schoolId) : Promise.resolve({ data: { data: null } }),
  ]);
  const currentSy = syRes.data?.data ?? null;
  const assignments = (assignedRes.data?.data || []).filter(
    (a: FacultyClassAssignment) =>
      (currentSy ? a.school_year_id === currentSy.id : true) && a.adviser_role
  );
  return assignments;
}

export async function fetchAdminClassesData(schoolId: number): Promise<ClassListItem[]> {
  const { data } = await classApi.getBySchoolId(schoolId);
  return data.data || [];
}

export async function fetchClassEnrollments(
  classId: string,
  schoolId: number
): Promise<EnrollmentListItem[]> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  const current = syRes.data.data;
  if (!current) return [];
  const res = await enrollmentApi.getByClassAndSchoolYear(classId, current.id);
  return res.data.data || [];
}

export function formatSchedule(schedule: ClassListItem["schedule"]): string {
  if (!Array.isArray(schedule) || schedule.length === 0) return "\u2014";
  return schedule
    .map(
      (s: { day: string; start_time: string; end_time: string; room?: string }) =>
        `${s.day} ${s.start_time}-${s.end_time}${s.room ? ` ${s.room}` : ""}`
    )
    .join("; ");
}

export function formatStudentName(e: EnrollmentListItem): string {
  const last = (e.student_last_name || "").trim();
  const first = (e.student_first_name || "").trim();
  const middle = (e.student_middle_name || "").trim();
  const formatted = [last, [first, middle].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return formatted || e.student_name;
}

export function filterEnrollments(
  enrollments: EnrollmentListItem[],
  searchQuery: string
): EnrollmentListItem[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return enrollments;
  return enrollments.filter(
    (e) =>
      formatStudentName(e).toLowerCase().includes(q) ||
      e.student_email.toLowerCase().includes(q) ||
      (e.lrn || "").toLowerCase().includes(q)
  );
}

export function buildFacultyCardList(
  classes: ClassListItem[],
  assignedClasses: FacultyClassAssignment[]
): FacultyCardItem[] {
  const map = new Map<string, FacultyCardItem>();
  for (const c of classes) {
    map.set(c.id, { key: c.id, cls: c, advisory: true, subjects: [] });
  }
  for (const a of assignedClasses) {
    const existing = map.get(a.id);
    const subjects = (a.subjects || []).map((s) => s.name);
    if (existing) {
      existing.subjects = subjects;
    } else {
      map.set(a.id, {
        key: `taught-${a.id}`,
        cls: {
          id: a.id,
          class_name: a.class_name,
          module_id: "",
          module_title: "",
          faculty_id: a.faculty_id,
          faculty_name: a.faculty_name,
          school_id: a.school_id,
          school_year_id: a.school_year_id,
          capacity: a.capacity,
          section: a.section,
          grade_level: a.grade_level,
          schedule: a.schedule,
          created_at: a.created_at,
        },
        advisory: Boolean(a.adviser_role),
        subjects,
      });
    }
  }
  return Array.from(map.values());
}
