import { studentLessonApi, type StudentLessonItem } from "../api/modules";
import { getApiErrorMessage } from "../api/client";

export type { StudentLessonItem };
export { getApiErrorMessage };

export async function loadStudentLessons(): Promise<StudentLessonItem[]> {
  const res = await studentLessonApi.listMine();
  return res.data.data || [];
}

export function getStudentLessonFileUrl(lessonId: string): string {
  return studentLessonApi.fileDownloadUrl(lessonId);
}

export function formatLessonFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncateLessonText(text: string | null, length = 160): string {
  if (!text) return "—";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "—";
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
}
