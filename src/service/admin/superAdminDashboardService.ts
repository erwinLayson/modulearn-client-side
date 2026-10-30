import apiClient from "../../api/client";

export interface SchoolData {
  id: string;
  school_name: string;
  school_id: number;
  school_email: string;
  school_level: number;
  address: string;
  city: string;
  registered_at: string;
  school_logo: string;
}

export async function fetchAllSchoolsForDashboard(): Promise<SchoolData[]> {
  const { data } = await apiClient.get<{ data: SchoolData[] }>("/schools");
  return data.data || [];
}

export const SCHOOL_LEVEL_LABELS = ["", "Elementary", "Junior High", "Senior High", "College"];
