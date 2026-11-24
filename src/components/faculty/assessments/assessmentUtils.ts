import type { GradeItemCategory } from "../../../service/faculty/myModulesService";

export interface CategoryMeta {
  value: GradeItemCategory;
  label: string;
  singularLabel: string;
  badgeClass: string;
}

export function getCategoryMeta(category: GradeItemCategory | string): CategoryMeta {
  switch (category) {
    case "quizzes":
      return {
        value: "quizzes",
        label: "Quiz",
        singularLabel: "Quiz",
        badgeClass: "assessment-badge--quiz",
      };
    case "exams":
      return {
        value: "exams",
        label: "Exam",
        singularLabel: "Exam",
        badgeClass: "assessment-badge--exam",
      };
    case "activities":
    default:
      return {
        value: "activities",
        label: "Assignment",
        singularLabel: "Assignment",
        badgeClass: "assessment-badge--activity",
      };
  }
}

/**
 * Calculates the number of tasks, questions, or countable items in an activity
 * based on structured instructions or numbered lists.
 */
export function calculateActivityItems(instructions: string | null | undefined): {
  count: number | null;
  label: string;
} {
  if (!instructions || !instructions.trim()) {
    return { count: 1, label: "1 task" };
  }

  const trimmed = instructions.trim();

  // Pattern 1: Numbered lines like "1.", "1)", "Item 1", "Question 1:", "Task 1."
  const numberedMatches = trimmed.match(
    /(?:^|\n)\s*(?:\d+[\.\)]|[Qq]uestion\s*\d+|[Tt]ask\s*\d+|[Ii]tem\s*\d+|[Pp]art\s*[A-Za-z0-9]+)/g
  );
  if (numberedMatches && numberedMatches.length > 1) {
    return {
      count: numberedMatches.length,
      label: `${numberedMatches.length} items`,
    };
  }

  // Pattern 2: Bullet points like "- ", "* ", "• "
  const bulletMatches = trimmed.match(/(?:^|\n)\s*[-*•]\s+/g);
  if (bulletMatches && bulletMatches.length > 1) {
    return {
      count: bulletMatches.length,
      label: `${bulletMatches.length} tasks`,
    };
  }

  // Fallback: If single paragraph or unitemized instructions
  return { count: 1, label: "1 task" };
}

/**
 * Consistently formats max score / points, e.g. "10 pts", "100 pts", "12.5 pts"
 */
export function formatActivityPoints(points: number): string {
  if (!Number.isFinite(points) || points <= 0) {
    return "0 pts";
  }
  if (Number.isInteger(points)) {
    return `${points} pts`;
  }
  return `${Number(points.toFixed(2))} pts`;
}

/**
 * Safely formats creation date without throwing on null or invalid dates
 */
export function formatActivityDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
