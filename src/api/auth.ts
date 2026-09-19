import apiClient from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  email: string;
  role: string;
  school_id: number;
  user: {
    id: string;
    email: string;
    role: string;
    school_id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    school_name?: string;
    school_admin?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface LoginResponse {
  message: string;
  data?: UserData;
  isOk: boolean;
}

export const login = (payload: LoginPayload) =>
  apiClient.post<LoginResponse>("/auth/login", payload);

export const logout = () =>
  apiClient.post<{ message: string; isOk: boolean }>("/logout");
