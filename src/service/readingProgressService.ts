/**
 * readingProgressService.ts
 * Manages student reading progress, position restoration, and reading preferences
 * for written lesson materials in ModuLearn.
 */

export type ReaderTheme = "light" | "sepia" | "dark";
export type ReaderFontSize = "sm" | "md" | "lg";
export type ReaderLineSpacing = "compact" | "normal" | "relaxed";

export interface ReaderPreferences {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  lineSpacing: ReaderLineSpacing;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  theme: "light",
  fontSize: "md",
  lineSpacing: "normal",
};

const PREFS_STORAGE_KEY = "modulearn_student_reader_prefs";
const PROGRESS_KEY_PREFIX = "modulearn_reading_progress";

export interface StudentLessonProgress {
  studentId: string;
  assignmentId: string;
  lessonId: string;
  progressPercent: number; // 0 - 100
  scrollRatio: number; // 0.0 - 1.0
  lastHeadingId?: string;
  updatedAt: string;
  completed: boolean;
}

/**
 * Loads student reader preferences from persistent storage.
 */
export function loadReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_READER_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      theme: ["light", "sepia", "dark"].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_READER_PREFERENCES.theme,
      fontSize: ["sm", "md", "lg"].includes(parsed.fontSize)
        ? parsed.fontSize
        : DEFAULT_READER_PREFERENCES.fontSize,
      lineSpacing: ["compact", "normal", "relaxed"].includes(parsed.lineSpacing)
        ? parsed.lineSpacing
        : DEFAULT_READER_PREFERENCES.lineSpacing,
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

/**
 * Persists student reader preferences.
 */
export function saveReaderPreferences(prefs: ReaderPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Constructs a unique, non-duplicative storage key scoped to student and lesson assignment.
 */
function buildProgressKey(studentId: string, assignmentId: string, lessonId: string): string {
  const cleanStudent = studentId || "guest";
  const cleanAssign = assignmentId || lessonId || "general";
  return `${PROGRESS_KEY_PREFIX}_${cleanStudent}_${cleanAssign}`;
}

/**
 * Retrieves the last recorded reading progress for a student on a specific lesson assignment.
 */
export function getReadingProgress(
  studentId: string,
  assignmentId: string,
  lessonId: string
): StudentLessonProgress | null {
  try {
    const key = buildProgressKey(studentId, assignmentId, lessonId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentLessonProgress;
    if (typeof parsed?.progressPercent !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Checks whether an interaction represents genuine reading engagement rather than an immediate bounce.
 * Prevents recording progress when student only opens and immediately closes the lesson.
 */
export function isMeaningfulEngagement(dwellTimeMs: number, scrollRatio: number): boolean {
  // At least 3 seconds of active viewing OR scrolled down past 5% of document
  return dwellTimeMs >= 3000 || scrollRatio >= 0.05;
}

/**
 * Records or updates the student's reading progress.
 * In-place update avoids duplicate records.
 */
export function recordReadingProgress(progress: StudentLessonProgress): void {
  try {
    const key = buildProgressKey(progress.studentId, progress.assignmentId, progress.lessonId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clears recorded reading progress for a lesson.
 */
export function clearReadingProgress(
  studentId: string,
  assignmentId: string,
  lessonId: string
): void {
  try {
    const key = buildProgressKey(studentId, assignmentId, lessonId);
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
