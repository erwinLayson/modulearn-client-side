import { moduleApi, type ModuleListItem, type ModulePayload } from "../../api/modules";
import { subjectApi, type SubjectListItem } from "../../api/subjects";

export type { ModuleListItem, ModulePayload, SubjectListItem };

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback
    );
  }
  return fallback;
}

export async function fetchModulesForSuperAdmin(): Promise<ModuleListItem[]> {
  const { data } = await moduleApi.getAll();
  return data.data || [];
}

export async function fetchModulesAndSubjectsForSchool(
  schoolId: number
): Promise<{ modules: ModuleListItem[]; subjects: SubjectListItem[] }> {
  const [modulesRes, subjectsRes] = await Promise.all([
    moduleApi.getBySchoolId(schoolId),
    subjectApi.getBySchoolId(schoolId),
  ]);
  return {
    modules: modulesRes.data.data || [],
    subjects: subjectsRes.data.data || [],
  };
}

export async function createModule(payload: ModulePayload): Promise<void> {
  await moduleApi.create(payload);
}

export async function updateModule(
  id: string,
  payload: Partial<ModulePayload>
): Promise<void> {
  await moduleApi.update(id, payload);
}

export async function deleteModule(id: string): Promise<void> {
  await moduleApi.delete(id);
}
