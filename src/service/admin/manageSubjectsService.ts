import { subjectApi, type SubjectListItem } from "../../api/subjects";

export type { SubjectListItem };

export async function fetchAllSubjects(): Promise<SubjectListItem[]> {
  const { data } = await subjectApi.getAll();
  return data.data || [];
}
