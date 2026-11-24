import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LessonReaderPage from "../../../pages/faculty/LessonReaderPage";

const mocks = vi.hoisted(() => ({
  getMine: vi.fn(),
}));

vi.mock("../../../api/modules", () => ({
  teachingModuleApi: {
    getMine: mocks.getMine,
  },
}));

describe("LessonReaderPage", () => {
  const mockModuleData = {
    module: {
      id: "mod-1",
      title: "Philippine History",
      subject: "Social Studies",
    },
    templates: [],
    assignments: [],
    lessons: [
      {
        id: "les-1",
        title: "The Propaganda Movement",
        sort_order: 1,
        content: `# The Propaganda Movement
The Propaganda Movement was a period of reformist awakening.

## Key Figures
Dr. Jose Rizal, Marcelo H. del Pilar, and Graciano Lopez Jaena.

### Jose Rizal
Wrote Noli Me Tangere and El Filibusterismo.

> [!NOTE]
> This was a peaceful advocacy movement.`,
        file_path: null,
        file_name: null,
      },
      {
        id: "les-2",
        title: "The Katipunan",
        sort_order: 2,
        content: "# The Katipunan\nRevolutionary society founded by Andres Bonifacio.",
        file_path: null,
        file_name: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  const renderComponent = (moduleId = "mod-1", lessonId = "les-1") => {
    return render(
      <MemoryRouter initialEntries={[`/dashboard/modules/${moduleId}/lessons/${lessonId}/read`]}>
        <Routes>
          <Route
            path="/dashboard/modules/:moduleId/lessons/:lessonId/read"
            element={<LessonReaderPage />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it("loads and displays lesson details, breadcrumbs, and content", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    renderComponent();

    // Wait for content
    await waitFor(() => {
      expect(screen.getAllByText("The Propaganda Movement").length).toBeGreaterThanOrEqual(1);
    });

    // Check subject & module in breadcrumbs
    expect(screen.getAllByText("Social Studies").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Philippine History").length).toBeGreaterThanOrEqual(1);

    // Check headings in rendered content
    expect(screen.getAllByText("Key Figures").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Dr. Jose Rizal, Marcelo H. del Pilar, and Graciano Lopez Jaena.").length).toBeGreaterThanOrEqual(1);
  });

  it("extracts and displays table of contents headings", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Table of Contents")).toBeInTheDocument();
    });

    // TOC buttons
    expect(screen.getByRole("button", { name: "The Propaganda Movement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Key Figures" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jose Rizal" })).toBeInTheDocument();
  });

  it("supports font-size adjustments and reader settings", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("The Propaganda Movement").length).toBeGreaterThanOrEqual(1);
    });

    // Font size controls
    const increaseFontBtn = screen.getByRole("button", { name: "Large font size" });
    fireEvent.click(increaseFontBtn);

    const contentArea = container.querySelector(".reader-content-body--lg");
    expect(contentArea).toBeInTheDocument();

    // Content width toggle
    const widthBtn = screen.getByRole("button", { name: "Wide reading width" });
    fireEvent.click(widthBtn);

    const wideContentArea = container.querySelector(".reader-layout-container--wide");
    expect(wideContentArea).toBeInTheDocument();
  });

  it("toggles distraction-free reading mode", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("The Propaganda Movement").length).toBeGreaterThanOrEqual(1);
    });

    const distractionFreeBtn = screen.getByRole("button", { name: "Toggle distraction-free mode" });
    fireEvent.click(distractionFreeBtn);

    expect(container.querySelector(".reader-page--distraction-free")).toBeInTheDocument();
  });

  it("navigates to next lesson in sequence", async () => {
    mocks.getMine.mockResolvedValueOnce({
      data: { data: mockModuleData },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("The Propaganda Movement").length).toBeGreaterThanOrEqual(1);
    });

    const nextBtn = screen.getByRole("button", { name: /The Katipunan/i });
    expect(nextBtn).toBeInTheDocument();
  });

  it("handles error state when module fails to load", async () => {
    mocks.getMine.mockRejectedValueOnce(new Error("Network error"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Lesson Not Found")).toBeInTheDocument();
    });
  });
});
