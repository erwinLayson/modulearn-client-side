import { describe, expect, it, beforeEach } from "vitest";
import {
  loadReaderPreferences,
  saveReaderPreferences,
  getReadingProgress,
  recordReadingProgress,
  clearReadingProgress,
  isMeaningfulEngagement,
  DEFAULT_READER_PREFERENCES,
} from "../../service/readingProgressService";

describe("readingProgressService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("preferences", () => {
    it("returns defaults when no preferences are stored", () => {
      const prefs = loadReaderPreferences();
      expect(prefs).toEqual(DEFAULT_READER_PREFERENCES);
    });

    it("saves and loads updated preferences", () => {
      saveReaderPreferences({
        theme: "sepia",
        fontSize: "lg",
        lineSpacing: "relaxed",
      });

      const loaded = loadReaderPreferences();
      expect(loaded).toEqual({
        theme: "sepia",
        fontSize: "lg",
        lineSpacing: "relaxed",
      });
    });

    it("falls back to defaults for invalid stored values", () => {
      localStorage.setItem(
        "modulearn_student_reader_prefs",
        JSON.stringify({ theme: "neon", fontSize: "huge", lineSpacing: "infinite" })
      );

      const loaded = loadReaderPreferences();
      expect(loaded.theme).toBe("light");
      expect(loaded.fontSize).toBe("md");
      expect(loaded.lineSpacing).toBe("normal");
    });
  });

  describe("reading progress tracking", () => {
    it("returns null when no progress is stored", () => {
      const progress = getReadingProgress("student-1", "assign-1", "lesson-1");
      expect(progress).toBeNull();
    });

    it("records and retrieves reading progress accurately", () => {
      recordReadingProgress({
        studentId: "student-1",
        assignmentId: "assign-1",
        lessonId: "lesson-1",
        progressPercent: 42,
        scrollRatio: 0.42,
        lastHeadingId: "section-2",
        updatedAt: "2026-11-24T12:00:00Z",
        completed: false,
      });

      const loaded = getReadingProgress("student-1", "assign-1", "lesson-1");
      expect(loaded).not.toBeNull();
      expect(loaded?.progressPercent).toBe(42);
      expect(loaded?.scrollRatio).toBe(0.42);
      expect(loaded?.lastHeadingId).toBe("section-2");
    });

    it("clears reading progress", () => {
      recordReadingProgress({
        studentId: "student-1",
        assignmentId: "assign-1",
        lessonId: "lesson-1",
        progressPercent: 100,
        scrollRatio: 1.0,
        updatedAt: "2026-11-24T12:00:00Z",
        completed: true,
      });

      clearReadingProgress("student-1", "assign-1", "lesson-1");
      expect(getReadingProgress("student-1", "assign-1", "lesson-1")).toBeNull();
    });
  });

  describe("isMeaningfulEngagement", () => {
    it("rejects quick bounce with minimal scroll (< 3s and < 5%)", () => {
      expect(isMeaningfulEngagement(1200, 0.02)).toBe(false);
      expect(isMeaningfulEngagement(2900, 0.04)).toBe(false);
    });

    it("accepts reading session with dwell time >= 3000ms", () => {
      expect(isMeaningfulEngagement(3500, 0.01)).toBe(true);
    });

    it("accepts reading session with scroll ratio >= 0.05", () => {
      expect(isMeaningfulEngagement(1000, 0.15)).toBe(true);
    });
  });
});
