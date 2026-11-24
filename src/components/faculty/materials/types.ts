export type FileCategory =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "image"
  | "text"
  | "archive"
  | "generic";

export interface FileMeta {
  category: FileCategory;
  badgeLabel: string;
  badgeClass: string;
  extension: string;
  cleanName: string;
  formattedSize: string;
  isPdf: boolean;
  isPreviewable: boolean;
}

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export type ReaderFontSize = "sm" | "md" | "lg" | "xl";
export type ReaderContentWidth = "normal" | "wide" | "full";

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  contentWidth: ReaderContentWidth;
  isDistractionFree: boolean;
}

export interface ReadingStats {
  wordCount: number;
  readTimeMinutes: number;
  readTimeText: string;
}

export type MaterialFilterType = "all" | "written" | "file" | "pdf" | "office";
export type MaterialSortOption = "order" | "newest" | "title";
