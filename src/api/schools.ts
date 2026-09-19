import apiClient from "./client";

export interface SchoolListItem {
  id: string;
  school_id: number;
  school_name: string;
  school_email: string;
  school_level: number;
  address: string;
  region: string;
  province: string;
  city: string;
  contact_number: string;
  school_logo: string;
  school_admin: string;
  admin_id: string;
  registered_at: string;
}

export interface RegisterSchoolPayload {
  school_name: string;
  school_id: number;
  school_level: number;
  school_email: string;
  address: string;
  region: string;
  province: string;
  city: string;
  contact_number: string;
  school_logo: string;
  school_admin: string;
}

export interface RegisterSchoolResponse {
  message: string;
  isOk: boolean;
}

export const schoolApi = {
  getAll: () =>
    apiClient.get<{ data: SchoolListItem[] }>("/schools"),

  getById: (id: string) =>
    apiClient.get<{ data: SchoolListItem }>(`/schools/${id}`),

  register: (payload: RegisterSchoolPayload) =>
    apiClient.post<RegisterSchoolResponse>("/schools", payload),
};

export const registerSchool = schoolApi.register;
