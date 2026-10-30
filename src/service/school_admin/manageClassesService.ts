import {
  classApi,
  type ClassListItem,
  type ClassPayload,
  type ClassUpdatePayload,
  type ClassFaculty,
} from "../../api/classes";
import { subjectApi, type SubjectListItem, type SubjectFaculty } from "../../api/subjects";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import { enrollmentApi, type EnrollmentListItem } from "../../api/enrollments";
import { getApiErrorMessage } from "../../api/client";

export type {
  ClassListItem,
  ClassPayload,
  ClassUpdatePayload,
  ClassFaculty,
  SubjectListItem,
  SubjectFaculty,
  SchoolYear,
  EnrollmentListItem,
};
export { getApiErrorMessage };

export interface AdviserOption {
  id: string;
  first_name: string;
  last_name: string;
}

export async function fetchSchoolYears(schoolId: number): Promise<SchoolYear[]> {
  const res = await schoolYearApi.getBySchoolId(schoolId);
  return res.data.data || [];
}

export async function fetchClassesAndAdvisers(
  schoolId: number,
  selectedYearId: number | ""
): Promise<{ classes: ClassListItem[]; advisers: AdviserOption[] }> {
  const yearParam = selectedYearId || undefined;
  const [classesRes, advisersRes] = await Promise.all([
    classApi.getBySchoolId(schoolId, yearParam),
    selectedYearId
      ? classApi.getAvailableAdvisers(schoolId, selectedYearId)
      : Promise.resolve({ data: { data: [] as AdviserOption[] } }),
  ]);
  return {
    classes: classesRes.data.data || [],
    advisers: advisersRes.data.data || [],
  };
}

export async function fetchClassFaculties(classId: string): Promise<ClassFaculty[]> {
  const assignedRes = await classApi.getFaculties(classId);
  return assignedRes.data.data || [];
}

export async function fetchClassActiveStudents(
  classId: string,
  schoolYearId: number
): Promise<EnrollmentListItem[]> {
  const res = await enrollmentApi.getByClassAndSchoolYear(classId, schoolYearId);
  return (res.data.data || []).filter((e) => e.status === "active");
}

export async function assignFacultyToClass(
  classId: string,
  facultyId: string,
  subjectId: string
): Promise<void> {
  await classApi.assignFaculty(classId, facultyId, subjectId);
}

export async function removeFacultyFromClass(
  classId: string,
  facultyId: string
): Promise<void> {
  await classApi.removeFaculty(classId, facultyId);
}

export async function fetchReplacementCandidates(
  subjectId: string,
  currentTeacherId: string,
  assignedFaculties: ClassFaculty[]
): Promise<SubjectFaculty[]> {
  const res = await subjectApi.getFaculties(subjectId);
  return (res.data.data || []).filter(
    (f) =>
      f.id !== currentTeacherId &&
      !assignedFaculties.some((af) => af.id === f.id && af.subject_id === subjectId)
  );
}

export async function replaceFacultyInClass(
  classId: string,
  currentTeacherId: string,
  replacementId: string,
  subjectId: string
): Promise<void> {
  await classApi.replaceFaculty(classId, currentTeacherId, replacementId, subjectId);
}

export async function createClass(payload: ClassPayload): Promise<void> {
  await classApi.create(payload);
}

export async function updateClass(id: string, payload: ClassUpdatePayload): Promise<void> {
  await classApi.update(id, payload);
}

export async function deleteClass(id: string): Promise<void> {
  await classApi.delete(id);
}

export async function getClassById(id: string): Promise<ClassListItem | null> {
  const res = await classApi.getById(id);
  return res.data.data || null;
}

export async function fetchClassSubjects(schoolId: number): Promise<SubjectListItem[]> {
  const res = await subjectApi.getBySchoolId(schoolId);
  return res.data.data || [];
}

export async function fetchSubjectFaculties(subjectId: string): Promise<SubjectFaculty[]> {
  const res = await subjectApi.getFaculties(subjectId);
  return res.data.data || [];
}
