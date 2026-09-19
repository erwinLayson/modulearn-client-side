import apiClient from "./client";

export interface StudentPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  extension_name?: string;
  email: string;
  school_id: number;
  lrn?: string;
  date_of_birth?: string | null;
  place_of_birth?: string;
  sex?: "male" | "female";
  nationality?: string;
  contact_number?: string;
  region?: string;
  province?: string;
  city_municipality?: string;
  barangay?: string;
  purok_street?: string;
}

export interface StudentListItem {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  extension_name: string;
  email: string;
  school_id: number;
  lrn: string;
  date_of_birth: string | null;
  place_of_birth: string;
  sex: "male" | "female";
  nationality: string;
  contact_number: string;
  region: string;
  province: string;
  city_municipality: string;
  barangay: string;
  purok_street: string;
  admin_id: string;
  age?: number;
}

export interface StudentUpdatePayload {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  extension_name?: string;
  email?: string;
  lrn?: string;
  date_of_birth?: string | null;
  place_of_birth?: string;
  sex?: "male" | "female";
  nationality?: string;
  contact_number?: string;
  region?: string;
  province?: string;
  city_municipality?: string;
  barangay?: string;
  purok_street?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; email?: string; error: string; field?: string; value?: string; expected?: string }>;
  columnMapping?: Record<string, string>;
  warnings?: string[];
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  validationErrors: Array<{ 
    row: number; 
    email?: string; 
    error: string;
    field?: string;
    value?: string;
    expected?: string;
  }>;
  warnings: string[];
  columnMapping: Record<string, string>;
  previewData: Array<{
    first_name: string;
    last_name: string;
    email: string;
    sex: string;
    contact_number: string;
  }>;
}

export const studentApi = {
  getAll: (schoolId: number) =>
    apiClient.get<{ data: StudentListItem[] }>(`/students/school/${schoolId}`),

  getById: (id: string) =>
    apiClient.get<{ data: StudentListItem }>(`/students/${id}`),

  create: (payload: StudentPayload) =>
    apiClient.post<{ message: string; isOk: boolean }>("/students", payload),

  importPreview: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ message: string; data: ImportPreview }>("/students/import/preview", formData, {
      headers: { "Content-Type": undefined },
    });
  },

  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ message: string; data: ImportResult }>("/students/import", formData, {
      headers: { "Content-Type": undefined },
    });
  },

  update: (id: string, payload: StudentUpdatePayload) =>
    apiClient.put<{ message: string; isOk: boolean }>(`/students/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string; isOk: boolean }>(`/students/${id}`),
};
