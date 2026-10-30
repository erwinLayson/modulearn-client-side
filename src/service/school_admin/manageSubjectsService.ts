import {
  subjectApi,
  type SubjectListItem,
  type SubjectPayload,
  type SubjectFaculty,
} from "../../api/subjects";
import { getApiErrorMessage } from "../../api/client";

export type { SubjectListItem, SubjectPayload, SubjectFaculty };
export { getApiErrorMessage };

export async function fetchSubjects(schoolId: number): Promise<SubjectListItem[]> {
  const subjectsRes = await subjectApi.getBySchoolId(schoolId);
  return subjectsRes.data.data || [];
}

export async function fetchSubjectDetails(
  subjectId: string,
  schoolId: number
): Promise<{ assignedFaculties: SubjectFaculty[]; availableFaculties: SubjectFaculty[] }> {
  const [assignedRes, availableRes] = await Promise.all([
    subjectApi.getFaculties(subjectId),
    subjectApi.getAvailableFaculties(schoolId),
  ]);
  return {
    assignedFaculties: assignedRes.data.data || [],
    availableFaculties: availableRes.data.data || [],
  };
}

export async function assignFacultyToSubject(
  subjectId: string,
  facultyId: string
): Promise<void> {
  await subjectApi.assignFaculty(subjectId, facultyId);
}

export async function removeFacultyFromSubject(
  subjectId: string,
  facultyId: string
): Promise<void> {
  await subjectApi.removeFaculty(subjectId, facultyId);
}

export async function createSubject(payload: SubjectPayload): Promise<void> {
  await subjectApi.create(payload);
}

export async function updateSubject(
  id: string,
  payload: Partial<SubjectPayload>
): Promise<void> {
  await subjectApi.update(id, payload);
}

export async function deleteSubject(id: string): Promise<void> {
  await subjectApi.delete(id);
}

export function filterUnassignedFaculties(
  availableFaculties: SubjectFaculty[],
  assignedFaculties: SubjectFaculty[]
): SubjectFaculty[] {
  return availableFaculties.filter(
    (af) => !assignedFaculties.some((af2) => af2.id === af.id)
  );
}
