import type { FileMeta, ReadingStats, TocHeading } from "./types";

export function cleanFileName(fileName: string | null): string {
  if (!fileName) return "Document";
  const base = fileName.split(/[/\\]/).pop() || fileName;
  const clean = base.replace(/^\d{10,14}[-_]/, "");
  return clean.trim() || base;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
  const formattedSize = formatFileSize(fileSize);

  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      category: "pdf",
      badgeLabel: "PDF",
      badgeClass: "materials-type-badge--pdf",
      extension: "PDF",
      cleanName: clean,
      formattedSize,
      isPdf: true,
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
      extension: ext.toUpperCase() || "DOCX",
      cleanName: clean,
      formattedSize,
      isPdf: false,
      isPreviewable: false,
    };
  }

  if (
    ["ppt", "pptx"].includes(ext) ||
    mime.includes("powerpoint") ||
    mime.includes("officedocument.presentationml")
  ) {
    return {
      category: "powerpoint",
      badgeLabel: "PowerPoint",
      badgeClass: "materials-type-badge--powerpoint",
      extension: ext.toUpperCase() || "PPTX",
      cleanName: clean,
      formattedSize,
      isPdf: false,
      isPreviewable: false,
    };
  }

  if (
    ["xls", "xlsx", "csv"].includes(ext) ||
    mime.includes("excel") ||
    mime.includes("spreadsheet")
  ) {
    return {
      category: "excel",
      badgeLabel: "Spreadsheet",
      badgeClass: "materials-type-badge--excel",
      extension: ext.toUpperCase() || "XLSX",
      cleanName: clean,
      formattedSize,
      isPdf: false,
      isPreviewable: false,
    };
  }

  if (
    ["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return {
      category: "image",
      badgeLabel: "Image",
      badgeClass: "materials-type-badge--image",
      extension: ext.toUpperCase() || "IMG",
      cleanName: clean,
      formattedSize,
      isPdf: false,
      isPreviewable: true,
    };
  }

  return {
    category: "generic",
    badgeLabel: ext ? ext.toUpperCase() : "Document",
    badgeClass: "materials-type-badge--generic",
    extension: ext.toUpperCase() || "FILE",
    cleanName: clean,
    formattedSize,
    isPdf: false,
    isPreviewable: false,
  };
}

export function calculateReadingStats(content: string | null): ReadingStats {
  if (!content || !content.trim()) {
    return { wordCount: 0, readTimeMinutes: 1, readTimeText: "Quick read" };
  }
  const clean = content.trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  const readTimeText = words <= 30 ? "< 1 min read" : `${minutes} min read`;
  return { wordCount: words, readTimeMinutes: minutes, readTimeText };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractTableOfContents(content: string | null): TocHeading[] {
  if (!content) return [];
  const lines = content.split("\n");
  const headings: TocHeading[] = [];
  const idCounts = new Map<string, number>();

  let inCodeBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let level: 1 | 2 | 3 | null = null;
    let headingText = "";

    if (trimmed.startsWith("### ")) {
      level = 3;
      headingText = trimmed.slice(4).trim();
    } else if (trimmed.startsWith("## ")) {
      level = 2;
      headingText = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("# ")) {
      level = 1;
      headingText = trimmed.slice(2).trim();
    }

    if (level && headingText) {
      // Remove inline markdown markers for clean TOC display
      const cleanTitle = headingText.replace(/[*_`]/g, "").trim();
      let baseId = slugify(cleanTitle) || `heading-${headings.length + 1}`;
      
      const count = idCounts.get(baseId) || 0;
      idCounts.set(baseId, count + 1);
      const uniqueId = count > 0 ? `${baseId}-${count}` : baseId;

      headings.push({
        id: uniqueId,
        text: cleanTitle,
        level,
      });
    }
  }

  return headings;
}
