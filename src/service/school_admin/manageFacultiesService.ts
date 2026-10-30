import { facultyApi, type FacultyRole } from "../../api/faculties";
import type { FacultyListItem, FacultyPayload, FacultyUpdatePayload } from "../../api/faculties";

export type { FacultyListItem, FacultyPayload, FacultyUpdatePayload, FacultyRole };

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    );
  }
  return fallback;
}

export const facultyRoleOptions: FacultyRole[] = ["teacher", "cashier", "register"];

export const emptyFacultyForm: FacultyPayload = {
  first_name: "",
  last_name: "",
  email: "",
  school_id: 0,
  contact_number: "",
  faculty_role: "teacher",
};

export async function fetchFaculties(schoolId: number): Promise<FacultyListItem[]> {
  const { data } = await facultyApi.getAll(schoolId);
  return data.data || [];
}

export async function createFaculty(payload: FacultyPayload): Promise<void> {
  await facultyApi.create(payload);
}

export async function updateFaculty(id: string, payload: FacultyUpdatePayload): Promise<void> {
  await facultyApi.update(id, payload);
}

export async function deleteFaculty(id: string): Promise<void> {
  await facultyApi.delete(id);
}
