import { login as apiLogin } from "../api/auth";
import apiClient from "../api/client";
import type { UserRole } from "../constant/users";

export interface SchoolOption {
  school_id: number;
  school_name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_id?: number;
  school_name?: string;
  academic_config_completed?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  school_id?: number;
}

export async function fetchSchools(): Promise<SchoolOption[]> {
  const { data } = await apiClient.get<{ data: SchoolOption[] }>("/schools/list");
  return data.data || [];
}

export async function submitLogin(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await apiLogin(payload);
  if (!data.isOk || !data.data?.user) {
    throw new Error("Login failed");
  }
  const backendUser = data.data.user;
  const firstName = backendUser.first_name ?? "";
  const lastName = backendUser.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName =
    backendUser.name || fullName || backendUser.school_admin || backendUser.email || "";

  return {
    id: backendUser.id,
    name: displayName,
    email: backendUser.email,
    role: backendUser.role as UserRole,
    school_id: backendUser.school_id,
    school_name: backendUser.school_name as string | undefined,
    academic_config_completed: backendUser.academic_config_completed as boolean | undefined,
  };
}

export function getLoginErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
      "Login failed. Please try again."
    );
  }
  return "Login failed. Please try again.";
}
