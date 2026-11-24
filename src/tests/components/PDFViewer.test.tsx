import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PDFViewer from "../../components/faculty/materials/PDFViewer";

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

describe("PDFViewer", () => {
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
  });

  it("handles InvalidPDFException when PDF structure is corrupt or invalid", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handleDownload = vi.fn();

    // Exact error object reported from PDF.js
    const invalidPdfError = {
      name: "InvalidPDFException",
      message: "Invalid PDF structure.",
      stack: undefined,
    };

    mocks.getDocument.mockReturnValueOnce({
      promise: Promise.reject(invalidPdfError),
      destroy: vi.fn(),
    });

    render(
      <PDFViewer
        url="/uploads/corrupted-file.pdf"
        fileName="corrupted-file.pdf"
        onDownload={handleDownload}
      />
    );

    // Verify error is logged to console matching line 54
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("PDF loading error:", invalidPdfError);
    });

    // Verify clear, actionable error message is shown to the user
    expect(
      screen.getByText(/Invalid PDF structure: The document appears to be corrupted or not a valid PDF/i)
    ).toBeInTheDocument();

    // Verify loading indicator is removed
    expect(screen.queryByText("Loading PDF document...")).not.toBeInTheDocument();

    // Verify fallback "Download Original File" button is present and clickable
    const fallbackDownloadBtn = screen.getByRole("button", { name: "Download Original File" });
    expect(fallbackDownloadBtn).toBeInTheDocument();

    fireEvent.click(fallbackDownloadBtn);
    expect(handleDownload).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it("loads and renders valid PDF with navigation and zoom controls", async () => {
    const mockRenderTask = {
      promise: Promise.resolve(),
      cancel: vi.fn(),
    };
    const mockPage = {
      getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
      render: vi.fn().mockReturnValue(mockRenderTask),
    };
    const mockDoc = {
      numPages: 5,
      getPage: vi.fn().mockResolvedValue(mockPage),
      destroy: vi.fn(),
    };

    mocks.getDocument.mockReturnValueOnce({
      promise: Promise.resolve(mockDoc),
      destroy: vi.fn(),
    });

    render(
      <PDFViewer
        url="/uploads/syllabus.pdf"
        fileName="syllabus.pdf"
        onDownload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    });

    // Check zoom controls
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByText("120%")).toBeInTheDocument();

    // Check navigation buttons
    const prevBtn = screen.getByRole("button", { name: "Previous page" });
    const nextBtn = screen.getByRole("button", { name: "Next page" });

    expect(prevBtn).toBeDisabled(); // On page 1
    expect(nextBtn).toBeEnabled();

    // Navigate to page 2
    fireEvent.click(nextBtn);
    expect(mockDoc.getPage).toHaveBeenCalledWith(2);
  });

  it("handles generic network error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.getDocument.mockReturnValueOnce({
      promise: Promise.reject(new Error("Network connection lost")),
      destroy: vi.fn(),
    });

    render(
      <PDFViewer
        url="/uploads/lecture.pdf"
        fileName="lecture.pdf"
        onDownload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load PDF document. You can download the original file below.")
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles MissingPDFException when the added PDF file was removed or missing on disk", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const missingPdfError = {
      name: "MissingPDFException",
      message: 'Missing PDF "/uploads/deleted-file.pdf".',
    };

    mocks.getDocument.mockReturnValueOnce({
      promise: Promise.reject(missingPdfError),
      destroy: vi.fn(),
    });

    render(
      <PDFViewer
        url="/uploads/deleted-file.pdf"
        fileName="deleted-file.pdf"
        onDownload={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/The PDF file could not be found or has been removed/i)
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
