import apiClient from "./client";

export type UserRole = "super_admin" | "school_admin" | "faculty" | "student";

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  school_id: number | null;
  created_at: string;
}

export interface UserPayload {
  email: string;
  password: string;
  role: UserRole;
  school_id: number;
  status: "active" | "inactive" | "suspended";
  name: string;
}

export interface UserUpdatePayload {
  email?: string;
  role?: UserRole;
  school_id?: number | null;
  status?: "active" | "inactive" | "suspended";
  name?: string;
}

export const userApi = {
  getAll: () =>
    apiClient.get<{ data: UserListItem[] }>("/users"),

  getById: (id: string) =>
    apiClient.get<{ data: UserListItem }>(`/users/${id}`),

  create: (payload: UserPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/users", payload),

  update: (id: string, payload: UserUpdatePayload) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/users/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/users/${id}`),
};