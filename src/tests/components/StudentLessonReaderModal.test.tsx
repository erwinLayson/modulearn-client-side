import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StudentLessonReaderModal from "../../components/StudentLessonReaderModal";
import type { StudentLessonItem } from "../../api/modules";

const MOCK_LESSON: StudentLessonItem = {
  assignment_id: "assign-101",
  lesson_id: "lesson-101",
  module_id: "mod-101",
  module_title: "Life of Rizal",
  subject_name: "English",
  teacher_name: "Dennis Dela Cruz",
  class_id: "class-101",
  class_name: "Grade 11 - A",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Overview Lesson",
  lesson_type: "text",
  content: "Hahahaha",
  file_name: null,
  file_type: null,
  file_size: null,
  has_file: false,
  sort_order: 1,
  assigned_at: "2026-11-20T08:00:00Z",
};

describe("StudentLessonReaderModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders lesson title, badges, teacher info, and plain content", () => {
    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    // Dialog exists
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Title
    expect(within(dialog).getByText("Overview Lesson")).toBeInTheDocument();

    // Context badges
    expect(within(dialog).getByText("Written Lesson")).toBeInTheDocument();
    expect(within(dialog).getByText("English")).toBeInTheDocument();
    expect(within(dialog).getByText("Module: Life of Rizal")).toBeInTheDocument();

    // Teacher & Class Info
    expect(within(dialog).getByText("Dennis Dela Cruz")).toBeInTheDocument();
    expect(within(dialog).getByText("DC")).toBeInTheDocument(); // initials
    expect(within(dialog).getByText("Grade 11 - A")).toBeInTheDocument();

    // Content: "Hahahaha"
    expect(within(dialog).getByText("Hahahaha")).toBeInTheDocument();

    // Reading stats
    expect(within(dialog).getByText("< 1 min read")).toBeInTheDocument();
    expect(within(dialog).getByText("1 word")).toBeInTheDocument();
  });

  it("adjusts font size using the A- / A / A+ buttons", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    const article = screen.getByRole("article");
    expect(article).toHaveClass("student-reader-paper--md");

    // Click Small
    const smallBtn = screen.getByLabelText("Small font size");
    await user.click(smallBtn);
    expect(article).toHaveClass("student-reader-paper--sm");

    // Click Large
    const largeBtn = screen.getByLabelText("Large font size");
    await user.click(largeBtn);
    expect(article).toHaveClass("student-reader-paper--lg");
  });

  it("toggles fullscreen mode", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveClass("student-reader-modal--fullscreen");

    const fullscreenBtn = screen.getByLabelText("Enter full screen");
    await user.click(fullscreenBtn);

    expect(dialog).toHaveClass("student-reader-modal--fullscreen");

    // Click to exit fullscreen
    const exitFullscreenBtn = screen.getByLabelText("Exit full screen");
    await user.click(exitFullscreenBtn);
    expect(dialog).not.toHaveClass("student-reader-modal--fullscreen");
  });

  it("copies content to clipboard", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    const copyBtn = screen.getByRole("button", { name: "Copy Notes" });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("Hahahaha");
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });

  it("calls window.print on print button click", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    const printBtn = screen.getByRole("button", { name: "Print" });
    await user.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
  });

  it("closes on Close button click and on Escape key", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    // Click Close
    const closeBtn = screen.getByRole("button", { name: "Close" });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key
    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("renders structured markdown headings, lists, quotes, and code blocks", () => {
    const markdownLesson: StudentLessonItem = {
      ...MOCK_LESSON,
      content: `# Main Title
## Section Two
> An important key quote

- Item alpha
- Item beta

\`\`\`
const test = 123;
\`\`\`

Here is **bold** and *italic* text.`,
    };

    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={markdownLesson} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Main Title")).toBeInTheDocument();
    expect(within(dialog).getByText("Section Two")).toBeInTheDocument();
    expect(within(dialog).getByText("An important key quote")).toBeInTheDocument();
    expect(within(dialog).getByText("Item alpha")).toBeInTheDocument();
    expect(within(dialog).getByText("Item beta")).toBeInTheDocument();
    expect(within(dialog).getByText("const test = 123;")).toBeInTheDocument();
    expect(within(dialog).getByText("bold")).toBeInTheDocument();
    expect(within(dialog).getByText("italic")).toBeInTheDocument();
  });

  it("shows empty state when content is empty or whitespace", () => {
    const emptyLesson: StudentLessonItem = {
      ...MOCK_LESSON,
      content: "   ",
    };

    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={emptyLesson} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("No Written Content")).toBeInTheDocument();
  });

  it("toggles table of contents and navigates to heading sections", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const lessonWithHeadings: StudentLessonItem = {
      ...MOCK_LESSON,
      content: `# Introduction
Here is the intro.
## Learning Objectives
- Master factoring
### Special Cases
Details on special cases.`,
    };

    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(<StudentLessonReaderModal lesson={lessonWithHeadings} onClose={handleClose} />);

    // Toggle TOC button
    const tocBtn = screen.getByTitle("Table of Contents");
    await user.click(tocBtn);

    // Sidebar opens with headings
    const aside = screen.getByRole("complementary", { name: "Table of contents" });
    expect(aside).toBeInTheDocument();
    expect(within(aside).getByText("Introduction")).toBeInTheDocument();
    expect(within(aside).getByText("Learning Objectives")).toBeInTheDocument();
    expect(within(aside).getByText("Special Cases")).toBeInTheDocument();

    // Click heading link
    const introLink = within(aside).getByRole("button", { name: "Introduction" });
    await user.click(introLink);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("adjusts reading themes and line spacing via preferences popover", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<StudentLessonReaderModal lesson={MOCK_LESSON} onClose={handleClose} />);

    // Open preferences popover
    const prefsBtn = screen.getByLabelText("Reading preferences");
    await user.click(prefsBtn);

    // Select Sepia theme
    const sepiaBtn = screen.getByRole("button", { name: "Sepia" });
    await user.click(sepiaBtn);

    // Overlay has theme class
    const overlay = document.querySelector(".student-reader-overlay");
    expect(overlay).toHaveClass("student-reader-theme--sepia");

    // Select Relaxed line spacing
    const relaxedBtn = screen.getByRole("button", { name: "Relaxed" });
    await user.click(relaxedBtn);

    const article = screen.getByRole("article");
    expect(article).toHaveClass("student-reader-spacing--relaxed");
  });

  it("renders markdown tables and structured callout blocks", () => {
    const richLesson: StudentLessonItem = {
      ...MOCK_LESSON,
      content: `> [!NOTE] This is an essential note for students.
> [!IMPORTANT] Remember to bring calculators.
> [!OBJECTIVE] Understand polynomial factoring.
> [!EXAMPLE] Factor x^2 + 5x + 6 = (x+2)(x+3).

| Term | Definition |
|---|---|
| Monomial | Single term expression |
| Binomial | Two term polynomial |`,
    };

    const handleClose = vi.fn();
    render(<StudentLessonReaderModal lesson={richLesson} onClose={handleClose} />);

    // Callout badges & bodies inside the article
    const article = screen.getByRole("article");
    expect(within(article).getByText("NOTE")).toBeInTheDocument();
    expect(within(article).getByText("This is an essential note for students.")).toBeInTheDocument();
    expect(within(article).getByText("IMPORTANT")).toBeInTheDocument();
    expect(within(article).getByText("Remember to bring calculators.")).toBeInTheDocument();
    expect(within(article).getByText("OBJECTIVE")).toBeInTheDocument();
    expect(within(article).getByText("EXAMPLE")).toBeInTheDocument();

    // Table elements
    expect(within(article).getByText("Monomial")).toBeInTheDocument();
    expect(within(article).getByText("Single term expression")).toBeInTheDocument();
    expect(within(article).getByText("Binomial")).toBeInTheDocument();
  });

  it("displays resume banner when reopening previously read lesson", () => {
    localStorage.setItem(
      "modulearn_reading_progress_student-42_assign-101",
      JSON.stringify({
        studentId: "student-42",
        assignmentId: "assign-101",
        lessonId: "lesson-101",
        progressPercent: 55,
        scrollRatio: 0.55,
        updatedAt: "2026-11-24T12:00:00Z",
        completed: false,
      })
    );

    const handleClose = vi.fn();
    render(
      <StudentLessonReaderModal
        lesson={MOCK_LESSON}
        studentId="student-42"
        onClose={handleClose}
      />
    );

    // Resume banner is visible
    expect(screen.getByText("Resumed reading at 55%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jump to top" })).toBeInTheDocument();
  });
});
