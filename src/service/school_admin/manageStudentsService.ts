import {
  studentApi,
  type StudentListItem,
  type StudentPayload,
  type StudentUpdatePayload,
  type ImportResult,
  type ImportPreview,
} from "../../api/students";
import { getApiErrorMessage } from "../../api/client";

export type {
  StudentListItem,
  StudentPayload,
  StudentUpdatePayload,
  ImportResult,
  ImportPreview,
};
export { getApiErrorMessage };

export type SexFilter = "all" | "male" | "female";

export const emptyStudentForm: StudentPayload = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension_name: "",
  email: "",
  school_id: 0,
  lrn: "",
  date_of_birth: null,
  place_of_birth: "",
  sex: "male",
  nationality: "Filipino",
  contact_number: "",
  region: "",
  province: "",
  city_municipality: "",
  barangay: "",
  purok_street: "",
};

export async function fetchStudents(schoolId: number): Promise<StudentListItem[]> {
  const { data } = await studentApi.getAll(schoolId);
  return data.data || [];
}

export async function createStudent(payload: StudentPayload): Promise<void> {
  await studentApi.create(payload);
}

export async function updateStudent(id: string, payload: StudentUpdatePayload): Promise<void> {
  await studentApi.update(id, payload);
}

export async function deleteStudent(id: string): Promise<void> {
  await studentApi.delete(id);
}

export async function previewStudentImport(file: File): Promise<ImportPreview> {
  const { data } = await studentApi.importPreview(file);
  return data.data;
}

export async function executeStudentImport(file: File): Promise<ImportResult> {
  const { data } = await studentApi.import(file);
  return data.data;
}

export function validateStudentImportFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Use CSV or Excel." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File too large. Max size is 5MB." };
  }
  return { valid: true };
}

export function filterStudents(
  students: StudentListItem[],
  search: string,
  sexFilter: SexFilter
): StudentListItem[] {
  const query = search.trim().toLowerCase();
  return students.filter((s) => {
    if (sexFilter !== "all" && s.sex !== sexFilter) return false;
    if (!query) return true;
    const name = [s.first_name, s.middle_name, s.last_name, s.extension_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      name.includes(query) ||
      (s.email ?? "").toLowerCase().includes(query) ||
      (s.lrn ?? "").toLowerCase().includes(query) ||
      (s.contact_number ?? "").toLowerCase().includes(query)
    );
  });
}

export function generateFailedRowsCsv(errors: ImportResult["errors"]): string {
  const headers = ["Row", "Email", "Error", "Field", "Value", "Expected"];
  const rows = errors.map((e) => [
    e.row,
    e.email || "",
    e.error,
    e.field || "",
    e.value || "",
    e.expected || "",
  ]);
  return [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function getStudentImportTemplateCsv(): string {
  return "first_name,middle_name,last_name,extension_name,email,lrn,date_of_birth,place_of_birth,sex,nationality,contact_number,region,province,city_municipality,barangay,purok_street\nJohn,Michael,Doe,Jr.,john@example.com,123456789012,2010-05-15,Manila,male,Filipino,555-0101,NCR,Manila,Manila,Barangay 1,Purok 1\nJane,Anne,Smith,,jane@example.com,123456789013,2009-08-22,Quezon City,female,Filipino,555-0102,NCR,Quezon City,Quezon City,Barangay 2,Purok 2";
}
