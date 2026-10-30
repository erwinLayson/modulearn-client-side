import { studentLessonApi, type StudentLessonItem } from "../api/modules";
import { getApiErrorMessage } from "../api/client";

export type { StudentLessonItem };
export { getApiErrorMessage };

export type FileCategory =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "image"
  | "archive"
  | "text"
  | "generic";

export interface FileMeta {
  category: FileCategory;
  badgeLabel: string;
  badgeClass: string;
  typeDescription: string;
  extension: string;
  cleanName: string;
  formattedSize: string;
  isPreviewable: boolean;
}

export async function loadStudentLessons(): Promise<StudentLessonItem[]> {
  const res = await studentLessonApi.listMine();
  return res.data.data || [];
}

export function getStudentLessonFileUrl(lessonId: string): string {
  return studentLessonApi.fileDownloadUrl(lessonId);
}

export function formatLessonFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
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

export function cleanFileName(fileName: string | null): string {
  if (!fileName) return "Document";
  const base = fileName.split(/[/\\]/).pop() || fileName;
  const clean = base.replace(/^\d{10,14}[-_]/, "");
  return clean.trim() || base;
}

export function getFileMeta(
  fileName: string | null,
  fileType: string | null,
  fileSize: number | null
): FileMeta {
  const clean = cleanFileName(fileName);
  const parts = clean.split(".");
  const ext = (parts.length > 1 ? parts.pop() || "" : "").toLowerCase();
  const mime = (fileType || "").toLowerCase();
  const formattedSize = formatLessonFileSize(fileSize);

  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      category: "pdf",
      badgeLabel: "PDF",
      badgeClass: "materials-type-badge--pdf",
      typeDescription: "PDF document",
      extension: "PDF",
      cleanName: clean,
      formattedSize,
      isPreviewable: true,
    };
  }

  if (
    ["doc", "docx"].includes(ext) ||
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml")
  ) {
    return {
      category: "word",
      badgeLabel: "Word",
      badgeClass: "materials-type-badge--word",
      typeDescription: "Word document",
      extension: ext.toUpperCase() || "DOCX",
      cleanName: clean,
      formattedSize,
      isPreviewable: false,
    };
  }

  if (
    ["xls", "xlsx", "csv"].includes(ext) ||
    mime.includes("excel") ||
    mime.includes("spreadsheetml") ||
    mime.includes("csv")
  ) {
    return {
      category: "excel",
      badgeLabel: ext === "csv" ? "CSV" : "Excel",
      badgeClass: "materials-type-badge--excel",
      typeDescription: ext === "csv" ? "CSV data file" : "Spreadsheet",
      extension: ext.toUpperCase() || "XLSX",
      cleanName: clean,
      formattedSize,
      isPreviewable: false,
    };
  }

  if (
    ["ppt", "pptx"].includes(ext) ||
    mime.includes("powerpoint") ||
    mime.includes("presentationml")
  ) {
    return {
      category: "powerpoint",
      badgeLabel: "Slides",
      badgeClass: "materials-type-badge--powerpoint",
      typeDescription: "Presentation",
      extension: ext.toUpperCase() || "PPTX",
      cleanName: clean,
      formattedSize,
      isPreviewable: false,
    };
  }

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return {
      category: "image",
      badgeLabel: "Image",
      badgeClass: "materials-type-badge--image",
      typeDescription: "Image file",
      extension: ext.toUpperCase() || "IMG",
      cleanName: clean,
      formattedSize,
      isPreviewable: true,
    };
  }

  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed")
  ) {
    return {
      category: "archive",
      badgeLabel: "Archive",
      badgeClass: "materials-type-badge--archive",
      typeDescription: "Compressed archive",
      extension: ext.toUpperCase() || "ZIP",
      cleanName: clean,
      formattedSize,
      isPreviewable: false,
    };
  }

  if (["txt", "md", "rtf", "json"].includes(ext) || mime.startsWith("text/")) {
    return {
      category: "text",
      badgeLabel: "Text",
      badgeClass: "materials-type-badge--text",
      typeDescription: "Text document",
      extension: ext.toUpperCase() || "TXT",
      cleanName: clean,
      formattedSize,
      isPreviewable: true,
    };
  }

  return {
    category: "generic",
    badgeLabel: ext ? ext.toUpperCase() : "File",
    badgeClass: "materials-type-badge--generic",
    typeDescription: ext ? `${ext.toUpperCase()} document` : "Document file",
    extension: ext ? ext.toUpperCase() : "FILE",
    cleanName: clean,
    formattedSize,
    isPreviewable: false,
  };
}
