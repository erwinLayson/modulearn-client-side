import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DocumentViewerPage from "../../../pages/faculty/DocumentViewerPage";

const mocks = vi.hoisted(() => ({
  getMine: vi.fn(),
}));

vi.mock("../../../api/modules", () => ({
  teachingModuleApi: {
    getMine: mocks.getMine,
  },
}));

vi.mock("../../../components/faculty/materials/PDFViewer", () => ({
  default: ({ url, fileName }: { url: string; fileName: string }) => (
    <div data-testid="pdf-viewer-mock">
      <span>Rendering: {fileName}</span>
      <span>Source: {url}</span>
    </div>
  ),
}));

describe("DocumentViewerPage", () => {
  const mockModuleData = {
    module: {
      id: "mod-1",
      title: "Philippine Literature",
      subject: "English Literature",
    },
    templates: [],
    assignments: [],
    lessons: [
      {
        id: "doc-1",
        title: "Noli Me Tangere Guide",
        sort_order: 1,
        content: "Guide document for students.",
        file_path: "/uploads/modules/noli-guide.pdf",
        file_name: "noli-guide.pdf",
        file_size: 2048576,
      },
      {
        id: "doc-2",
        title: "Chapter Presentation",
        sort_order: 2,
        content: "Slides on the Spanish Era.",
        file_path: "/uploads/modules/presentation.pptx",
        file_name: "presentation.pptx",
        file_size: 5242880,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (moduleId = "mod-1", lessonId = "doc-1") => {
    return render(
      <MemoryRouter initialEntries={[`/dashboard/modules/${moduleId}/lessons/${lessonId}/preview`]}>
        <Routes>
          <Route
            path="/dashboard/modules/:moduleId/lessons/:lessonId/preview"
            element={<DocumentViewerPage />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders PDF viewer when viewing a PDF document", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    renderComponent("mod-1", "doc-1");

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer-mock")).toBeInTheDocument();
    });

    expect(screen.getByText("Noli Me Tangere Guide")).toBeInTheDocument();
    expect(screen.getByText(/Philippine Literature/i)).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText(/Rendering: noli-guide\.pdf/i)).toBeInTheDocument();
    expect(
      screen.getByText("Source: /api/modules/mine/mod-1/lessons/doc-1/file?inline=true")
    ).toBeInTheDocument();
  });

  it("renders educational fallback with download CTA for PowerPoint documents", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    renderComponent("mod-1", "doc-2");

    await waitFor(() => {
      expect(screen.getByText("PowerPoint")).toBeInTheDocument();
    });

    expect(screen.getByText("presentation.pptx")).toBeInTheDocument();
    expect(screen.getByText("In-Browser Viewing Notice:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download presentation\.pptx/i })).toBeInTheDocument();
  });

  it("handles error state when module fails to load", async () => {
    mocks.getMine.mockRejectedValueOnce(new Error("Network error"));

    renderComponent("mod-1", "doc-1");

    await waitFor(() => {
      expect(screen.getByText("Document Not Found")).toBeInTheDocument();
    });
  });

  it("displays broken file attachment error if added lesson record has no valid file metadata or path", async () => {
    const brokenModuleData = {
      ...mockModuleData,
      lessons: [
        {
          id: "doc-broken",
          title: "Corrupted Upload Lesson",
          lesson_type: "file",
          sort_order: 1,
          content: null,
          file_name: null,
          file_path: null,
          file_size: null,
        },
      ],
    };

    mocks.getMine.mockResolvedValueOnce({
      data: { data: brokenModuleData },
    });

    renderComponent("mod-1", "doc-broken");

    await waitFor(() => {
      expect(screen.getByText("Broken File Attachment")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "This lesson was added as a file document, but the uploaded file appears to be missing or corrupted."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to Learning Materials" })).toBeInTheDocument();
  });
});
