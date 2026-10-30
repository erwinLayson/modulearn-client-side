import { classApi, type ScheduleItem } from "../api/classes";
import { enrollmentApi } from "../api/enrollments";
import { schoolYearApi } from "../api/school-years";

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

export interface FormattedSchedule {
  text: string;
  lines: string[];
}

export function formatSchedule(schedule: ScheduleItem[] | null): FormattedSchedule {
  if (!Array.isArray(schedule) || schedule.length === 0) return { text: "—", lines: [] };
  const lines = schedule.map((item) => `${item.day} ${item.start_time}–${item.end_time}`);
  return { text: lines.join(", "), lines };
}

export async function loadStudentClass(
  schoolId: number,
  studentId: string
): Promise<StudentClassDetail | null> {
  const schoolYearRes = await schoolYearApi.getCurrent(schoolId);
  const currentSchoolYear = schoolYearRes.data.data;
  if (!currentSchoolYear) return null;

  const enrollmentsRes = await enrollmentApi.getClassesByStudentId(studentId);
  const enrollment = (enrollmentsRes.data.data || [])[0];
  if (!enrollment) return null;

  const classRes = await classApi.getById(enrollment.class_id);
  const classDetail = classRes.data.data;

  let subjects: StudentClassDetail["subjects"] = [];
  try {
    const facultiesRes = await classApi.getFaculties(enrollment.class_id);
    subjects = (facultiesRes.data.data || []).map((faculty) => ({
      id: faculty.subject_id || faculty.id,
      name: faculty.subject_name || "Unknown Subject",
      teacher_name: `${faculty.first_name} ${faculty.last_name}`,
    }));
  } catch {
    subjects =
      enrollment.subjects?.map((subject) => ({
        id: subject.id,
        name: subject.name,
        teacher_name: null,
      })) || [];
  }

  return {
    id: classDetail.id,
    class_name: classDetail.class_name,
    grade_level: classDetail.grade_level,
    section: classDetail.section,
    capacity: classDetail.capacity,
    faculty_name: classDetail.faculty_name,
    schedule: classDetail.schedule,
    subjects,
  };
}
