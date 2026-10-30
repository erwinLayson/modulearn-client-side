import { userApi, type UserRole, type UserUpdatePayload } from "../../api/users";
import type { UserListItem } from "../../api/users";
import { schoolApi, type SchoolListItem } from "../../api/schools";
import { getApiErrorMessage } from "../../api/client";

export type { UserListItem, UserRole, UserUpdatePayload, SchoolListItem };

export const MIN_PASSWORD_LENGTH = 6;

export interface CreateUserForm {
  email: string;
  password: string;
  role: UserRole;
  school_id: number;
  status: "active" | "inactive" | "suspended";
  name: string;
}

export const ROLE_FILTER_OPTIONS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "school_admin", label: "School Admin" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

export async function fetchAllUsers(): Promise<UserListItem[]> {
  const { data } = await userApi.getAll();
  return data.data || [];
}

export async function fetchAllSchools(): Promise<SchoolListItem[]> {
  const { data } = await schoolApi.getAll();
  return data.data || [];
}

export async function createUser(form: CreateUserForm): Promise<void> {
  await userApi.create(form);
}

export async function updateUser(id: string, payload: UserUpdatePayload): Promise<void> {
  await userApi.update(id, payload);
}

export async function deleteUser(id: string): Promise<void> {
  await userApi.delete(id);
}

export async function updateUserPassword(
  id: string,
  newPassword: string
): Promise<void> {
  await userApi.updatePassword(id, { new_password: newPassword });
}

export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string
): string | null {
  if (!newPassword) return "New password is required";
  if (newPassword !== confirmPassword) return "New passwords do not match";
  if (newPassword.length < MIN_PASSWORD_LENGTH)
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  return null;
}

export function filterUsers(
  users: UserListItem[],
  search: string,
  roleFilter: UserRole | "all",
  schoolFilter: string
): UserListItem[] {
  const query = search.trim().toLowerCase();
  return users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (schoolFilter === "none") {
      if (u.school_id != null) return false;
    } else if (schoolFilter !== "all" && String(u.school_id ?? "") !== schoolFilter) {
      return false;
    }
    if (!query) return true;
    return (
      (u.name ?? "").toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      String(u.school_id ?? "").includes(query)
    );
  });
}

export function buildSchoolOptions(
  users: UserListItem[],
  schoolNameById: Map<number, string>
): { value: string; label: string }[] {
  const ids = Array.from(
    new Set(users.map((u) => u.school_id).filter((id): id is number => id != null))
  ).sort((a, b) => a - b);
  return ids.map((id) => ({ value: String(id), label: schoolNameById.get(id) ?? `School #${id}` }));
}

export { getApiErrorMessage };
