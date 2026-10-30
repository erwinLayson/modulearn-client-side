import { classApi, type ClassListItem, type ScheduleItem } from "../../api/classes";

export type { ClassListItem, ScheduleItem };

export async function fetchClasses(): Promise<ClassListItem[]> {
  const { data } = await classApi.getAll();
  return data.data || [];
}
