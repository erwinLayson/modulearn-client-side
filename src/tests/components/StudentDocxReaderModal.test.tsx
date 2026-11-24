import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StudentDocxReaderModal from "../../components/StudentDocxReaderModal";
import type { StudentLessonItem } from "../../api/modules";

// Mock docx-preview
vi.mock("docx-preview", () => ({
  renderAsync: vi.fn().mockImplementation((_buffer, container) => {
    const page1 = document.createElement("section");
    page1.className = "docx student-docx-page";
    page1.innerHTML = "<h1>Sample Heading</h1><p>First page of Word doc.</p>";

    const page2 = document.createElement("section");
    page2.className = "docx student-docx-page";
    page2.innerHTML = "<p>Second page with table and images.</p>";

    container.appendChild(page1);
    container.appendChild(page2);
    return Promise.resolve();
  }),
}));

const MOCK_DOCX_LESSON: StudentLessonItem = {
  assignment_id: "assign-docx-1",
  lesson_id: "lesson-docx-1",
  module_id: "mod-1",
  module_title: "Module 1: Algebra Fundamentals",
  subject_name: "Mathematics",
  teacher_name: "Professor Maria Santos",
  class_id: "class-1",
  class_name: "Grade 10 - Newton",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Algebra Lecture Handout",
  lesson_type: "file",
  content: "Please read sections 1 to 3 before tomorrow's quiz.",
  file_name: "Algebra_Lecture_Handout.docx",
  file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  file_size: 1024 * 350, // 350 KB
  has_file: true,
  sort_order: 1,
  assigned_at: "2026-11-24T08:00:00Z",
};

describe("StudentDocxReaderModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    } as any);
  });

  it("renders document title, Word DOCX badge, filename, and toolbar actions", async () => {
    const handleClose = vi.fn();
    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    // Dialog exists
    expect(
      screen.getByRole("dialog", { name: "DOCX Document Reader: Algebra Lecture Handout" })
    ).toBeInTheDocument();

    // Document title and badge
    expect(screen.getByText("Algebra Lecture Handout")).toBeInTheDocument();
    expect(screen.getByText("Word DOCX")).toBeInTheDocument();
    expect(screen.getByText(/Algebra_Lecture_Handout\.docx/)).toBeInTheDocument();

    // Download original DOCX button exists with correct href
    const downloadLink = screen.getByRole("link", { name: "Download original document" });
    expect(downloadLink).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-docx-1/file"
    );
    expect(downloadLink).toHaveAttribute("download", "Algebra_Lecture_Handout.docx");
  });

  it("handles page navigation and updates page indicator", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    // Wait for pages to render (mock creates 2 pages)
    expect(await screen.findByText("of 2")).toBeInTheDocument();

    const nextPageBtn = screen.getByLabelText("Next page");
    expect(nextPageBtn).not.toBeDisabled();

    await user.click(nextPageBtn);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("supports zoom controls and fit to width", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    expect(await screen.findByText("100%")).toBeInTheDocument();

    // Zoom in
    const zoomInBtn = screen.getByLabelText("Zoom in");
    await user.click(zoomInBtn);
    expect(screen.getByText("115%")).toBeInTheDocument();

    // Zoom out
    const zoomOutBtn = screen.getByLabelText("Zoom out");
    await user.click(zoomOutBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Fit to width resets to 100%
    const fitWidthBtn = screen.getByLabelText("Fit to width");
    await user.click(fitWidthBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("toggles the collapsible metadata drawer", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    const infoBtn = screen.getByLabelText("Toggle document details");
    expect(infoBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(infoBtn);
    expect(infoBtn).toHaveAttribute("aria-pressed", "true");

    // Drawer displays preserved metadata
    const drawer = screen.getByRole("complementary", { name: "Document details" });
    expect(within(drawer).getByText("Document Details")).toBeInTheDocument();
    expect(within(drawer).getByText("Professor Maria Santos")).toBeInTheDocument();
    expect(within(drawer).getByText("Grade 10 - Newton (2026-2027)")).toBeInTheDocument();
    expect(
      within(drawer).getByText("Please read sections 1 to 3 before tomorrow's quiz.")
    ).toBeInTheDocument();

    // Close drawer
    const closeDrawerBtn = screen.getByLabelText("Close document details");
    await user.click(closeDrawerBtn);
    expect(screen.queryByRole("complementary", { name: "Document details" })).not.toBeInTheDocument();
  });

  it("handles fetch error and displays error state with download fallback", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    const handleClose = vi.fn();
    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    expect(await screen.findByText("Unable to Preview Document")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download Original File" })).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-docx-1/file"
    );
  });

  it("closes on Back button and Escape key", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<StudentDocxReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    const backBtn = screen.getByLabelText("Back to learning materials");
    await user.click(backBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
