import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LearningMaterialsLibrary from "../../components/faculty/materials/LearningMaterialsLibrary";
import type { ModuleLessonItem } from "../../api/modules";

const MOCK_LESSONS: ModuleLessonItem[] = [
  {
    id: "lesson-1",
    module_id: "mod-1",
    title: "Chapter 1: Life in Calamba",
    lesson_type: "text",
    content: "# Early Life\nRizal grew up in Calamba, Laguna. He loved reading books.\n\n## Education\nHe was taught by his mother.",
    file_name: null,
    file_path: null,
    file_type: null,
    file_size: null,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "lesson-2",
    module_id: "mod-1",
    title: "Lecture Slides: Rizal in Europe",
    lesson_type: "file",
    content: "Review these slides before next meeting.",
    file_name: "1730000000000-Rizal_Europe.pdf",
    file_path: "/uploads/lessons/Rizal_Europe.pdf",
    file_type: "application/pdf",
    file_size: 1548576, // ~1.5 MB
    sort_order: 2,
    created_at: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "lesson-3",
    module_id: "mod-1",
    title: "Reading Assignment Notes",
    lesson_type: "file",
    content: "Discussion questions inside.",
    file_name: "1730000000000-Assignment.docx",
    file_path: "/uploads/lessons/Assignment.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 45000,
    sort_order: 3,
    created_at: "2026-01-03T00:00:00.000Z",
  },
];

describe("LearningMaterialsLibrary", () => {
  it("renders library header, cards with badges and metadata", () => {
    const handleRead = vi.fn();
    const handlePreview = vi.fn();

    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={MOCK_LESSONS}
        onReadLesson={handleRead}
        onPreviewDocument={handlePreview}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    // Section title & counts
    expect(screen.getByRole("heading", { name: "Learning Materials" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Check Written Lesson Card
    expect(screen.getByText("Chapter 1: Life in Calamba")).toBeInTheDocument();
    expect(screen.getByText("Written Lesson")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();

    // Check Document Cards
    expect(screen.getByText("Lecture Slides: Rizal in Europe")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Rizal_Europe.pdf")).toBeInTheDocument();
    expect(screen.getByText(/1.5 MB/)).toBeInTheDocument();

    expect(screen.getByText("Reading Assignment Notes")).toBeInTheDocument();
    expect(screen.getByText("Word")).toBeInTheDocument();
    expect(screen.getByText("Assignment.docx")).toBeInTheDocument();
  });

  it("filters materials by type (All, Written Lessons, Documents)", async () => {
    const user = userEvent.setup();

    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={MOCK_LESSONS}
        onReadLesson={vi.fn()}
        onPreviewDocument={vi.fn()}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    // Click "Written Lessons" tab
    await user.click(screen.getByRole("tab", { name: /Written Lessons/i }));

    expect(screen.getByText("Chapter 1: Life in Calamba")).toBeInTheDocument();
    expect(screen.queryByText("Lecture Slides: Rizal in Europe")).not.toBeInTheDocument();
    expect(screen.queryByText("Reading Assignment Notes")).not.toBeInTheDocument();

    // Click "Documents" tab
    await user.click(screen.getByRole("tab", { name: /Documents/i }));

    expect(screen.queryByText("Chapter 1: Life in Calamba")).not.toBeInTheDocument();
    expect(screen.getByText("Lecture Slides: Rizal in Europe")).toBeInTheDocument();
    expect(screen.getByText("Reading Assignment Notes")).toBeInTheDocument();
  });

  it("searches materials by keyword and shows no-match state", async () => {
    const user = userEvent.setup();

    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={MOCK_LESSONS}
        onReadLesson={vi.fn()}
        onPreviewDocument={vi.fn()}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search materials/i);
    await user.type(searchInput, "Calamba");

    expect(screen.getByText("Chapter 1: Life in Calamba")).toBeInTheDocument();
    expect(screen.queryByText("Lecture Slides: Rizal in Europe")).not.toBeInTheDocument();

    // Search something nonexistent
    await user.clear(searchInput);
    await user.type(searchInput, "xyznonexistent");

    expect(screen.getByText(/No Materials Match Your Filters/i)).toBeInTheDocument();

    // Reset filters
    await user.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByText("Chapter 1: Life in Calamba")).toBeInTheDocument();
  });

  it("calls onReadLesson when clicking Read Lesson CTA", async () => {
    const user = userEvent.setup();
    const handleRead = vi.fn();

    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={MOCK_LESSONS}
        onReadLesson={handleRead}
        onPreviewDocument={vi.fn()}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    const readBtn = screen.getByRole("button", { name: "Read Lesson" });
    await user.click(readBtn);

    expect(handleRead).toHaveBeenCalledWith(MOCK_LESSONS[0]);
  });

  it("calls onPreviewDocument when clicking Preview Document on a PDF", async () => {
    const user = userEvent.setup();
    const handlePreview = vi.fn();

    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={MOCK_LESSONS}
        onReadLesson={vi.fn()}
        onPreviewDocument={handlePreview}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    const previewBtn = screen.getByRole("button", { name: "Preview Document" });
    await user.click(previewBtn);

    expect(handlePreview).toHaveBeenCalledWith(MOCK_LESSONS[1]);
  });

  it("renders empty state when no materials exist", () => {
    render(
      <LearningMaterialsLibrary
        moduleId="mod-1"
        moduleTitle="Life of Rizal"
        lessons={[]}
        onReadLesson={vi.fn()}
        onPreviewDocument={vi.fn()}
        onAssignLesson={vi.fn()}
        onEditLesson={vi.fn()}
        onDeleteLesson={vi.fn()}
        onOpenCreateTextLesson={vi.fn()}
        onOpenUploadFileLesson={vi.fn()}
      />
    );

    expect(screen.getByText("No Learning Materials Added")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Write First Lesson" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Upload Document" }).length).toBeGreaterThanOrEqual(1);
  });
});
