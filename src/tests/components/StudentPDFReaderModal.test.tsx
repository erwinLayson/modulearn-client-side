import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StudentPDFReaderModal from "../../components/StudentPDFReaderModal";
import type { StudentLessonItem } from "../../api/modules";

const mocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: mocks.getDocument,
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  version: "6.5.438",
}));

const MOCK_PDF_LESSON: StudentLessonItem = {
  assignment_id: "assign-101",
  lesson_id: "lesson-pdf-1",
  module_id: "mod-1",
  module_title: "Philippine History and Revolution",
  subject_name: "Social Studies",
  teacher_name: "Prof. Apolinario Mabini",
  class_id: "class-1",
  class_name: "Grade 10 - Rizal",
  school_year_id: 1,
  school_year_name: "2025-2026",
  title: "The Katipunan Document Archive",
  lesson_type: "file",
  content: "Read chapters 1 through 3 before the seminar on Monday.",
  file_name: "katipunan_archive_records.pdf",
  file_type: "application/pdf",
  file_size: 1542000,
  has_file: true,
  sort_order: 1,
  assigned_at: "2026-11-20T08:00:00Z",
};

describe("StudentPDFReaderModal – Full-Screen Document Reader", () => {
  const mockPage = {
    getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
    render: vi.fn().mockReturnValue({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    }),
  };

  const mockDoc = {
    numPages: 3,
    getPage: vi.fn().mockResolvedValue(mockPage),
    destroy: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock HTMLCanvasElement 2D context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      scale: vi.fn(),
    }) as any;

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mocks.getDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
      destroy: vi.fn(),
    });
  });

  it("renders full-screen reader layout with toolbar, document metadata, and continuous pages", async () => {
    const handleClose = vi.fn();
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={handleClose} />);

    // Check loading indicator first
    expect(screen.getByText("Loading document pages...")).toBeInTheDocument();

    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByText("The Katipunan Document Archive")).toBeInTheDocument();
    });

    // Check header controls exist
    expect(screen.getByLabelText("Back to learning materials")).toBeInTheDocument();
    expect(screen.getByLabelText("Toggle page thumbnails")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByLabelText("Current page number")).toHaveValue(1);
    expect(screen.getByText("of 3")).toBeInTheDocument();

    // Check zoom controls exist
    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    expect(screen.getByText("115%")).toBeInTheDocument();
    expect(screen.getByLabelText("Fit to width")).toBeInTheDocument();
    expect(screen.getByLabelText("Fit to page")).toBeInTheDocument();
    expect(screen.getByLabelText("Rotate 90 degrees")).toBeInTheDocument();

    // Check action controls exist
    expect(screen.getByLabelText("Toggle document details")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Download katipunan_archive_records.pdf")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Enter fullscreen")).toBeInTheDocument();

    // Check continuous pages rendered
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    });
  });

  it("navigates pages using Next and Previous buttons", async () => {
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Current page number")).toHaveValue(1);
    });

    const nextBtn = screen.getByLabelText("Next page");
    const prevBtn = screen.getByLabelText("Previous page");

    // On page 1, prev is disabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next
    await userEvent.click(nextBtn);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByLabelText("Current page number")).toHaveValue(2);

    // Prev is now enabled
    expect(prevBtn).not.toBeDisabled();

    // Click Prev
    await userEvent.click(prevBtn);
    expect(screen.getByLabelText("Current page number")).toHaveValue(1);
  });

  it("handles zoom controls and percentage indicator accurately", async () => {
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("115%")).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByLabelText("Zoom in");
    const zoomOutBtn = screen.getByLabelText("Zoom out");

    // Zoom in
    await userEvent.click(zoomInBtn);
    expect(screen.getByText("140%")).toBeInTheDocument();

    // Zoom out
    await userEvent.click(zoomOutBtn);
    expect(screen.getByText("115%")).toBeInTheDocument();
  });

  it("toggles the thumbnails sidebar and navigates by clicking a thumbnail", async () => {
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Thumbnails (3)")).toBeInTheDocument();
    });

    // Thumbnails for pages 1, 2, 3 should exist
    const jumpToPage2 = screen.getByLabelText("Jump to page 2");
    expect(jumpToPage2).toBeInTheDocument();

    // Click thumbnail 2
    await userEvent.click(jumpToPage2);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByLabelText("Current page number")).toHaveValue(2);

    // Toggle thumbnails button hides sidebar
    const toggleBtn = screen.getByLabelText("Toggle page thumbnails");
    await userEvent.click(toggleBtn);
    expect(screen.queryByText("Thumbnails (3)")).not.toBeInTheDocument();

    // Click again to show sidebar
    await userEvent.click(toggleBtn);
    expect(screen.getByText("Thumbnails (3)")).toBeInTheDocument();
  });

  it("toggles the document information drawer with full metadata preserved", async () => {
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("The Katipunan Document Archive")).toBeInTheDocument();
    });

    // Info drawer starts closed
    expect(screen.queryByText("Document Details")).not.toBeInTheDocument();

    // Toggle info drawer
    const infoBtn = screen.getByLabelText("Toggle document details");
    await userEvent.click(infoBtn);

    // Verify all metadata is preserved and visible
    expect(screen.getByText("Document Details")).toBeInTheDocument();
    expect(screen.getByText("katipunan_archive_records.pdf")).toBeInTheDocument();
    expect(screen.getByText("Grade 10 - Rizal (2025-2026)")).toBeInTheDocument();
    expect(screen.getByText("Philippine History and Revolution")).toBeInTheDocument();
    expect(screen.getByText("Social Studies · Prof. Apolinario Mabini")).toBeInTheDocument();
    expect(
      screen.getByText("Read chapters 1 through 3 before the seminar on Monday.")
    ).toBeInTheDocument();

    // Verify download button inside drawer
    const downloadOriginalLink = screen.getByRole("link", { name: "Download Original File" });
    expect(downloadOriginalLink).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-pdf-1/file"
    );

    // Verify open in browser tab link
    const openInTabLink = screen.getByRole("link", { name: "Open in New Tab" });
    expect(openInTabLink).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-pdf-1/file?inline=true"
    );
    expect(openInTabLink).toHaveAttribute("target", "_blank");

    // Close info drawer
    const closeInfoBtn = screen.getByLabelText("Close document details");
    await userEvent.click(closeInfoBtn);
    expect(screen.queryByText("Document Details")).not.toBeInTheDocument();
  });

  it("handles corrupted or invalid PDF error state gracefully with download CTA", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.getDocument.mockReturnValueOnce({
      promise: Promise.reject({
        name: "InvalidPDFException",
        message: "Invalid PDF structure",
      }),
      destroy: vi.fn(),
    });

    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Unable to Open PDF")).toBeInTheDocument();
      expect(
        screen.getByText(
          "The document appears to be corrupted or is not a valid PDF file. You can download the original copy below."
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Download Original Document" })
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("closes the reader when clicking Back button or pressing Escape", async () => {
    const handleClose = vi.fn();
    render(<StudentPDFReaderModal lesson={MOCK_PDF_LESSON} onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Back to learning materials")).toBeInTheDocument();
    });

    // Click Back
    await userEvent.click(screen.getByLabelText("Back to learning materials"));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
