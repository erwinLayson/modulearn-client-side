import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StudentUnifiedReaderModal from "../../components/StudentUnifiedReaderModal";
import type { StudentLessonItem } from "../../api/modules";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
        render: vi.fn().mockReturnValue({
          promise: Promise.resolve(),
          cancel: vi.fn(),
        }),
      }),
      destroy: vi.fn(),
    }),
  }),
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  version: "6.5.438",
}));

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

const MOCK_WRITTEN_LESSON: StudentLessonItem = {
  assignment_id: "assign-text-1",
  lesson_id: "lesson-text-1",
  module_id: "mod-1",
  module_title: "Module 1: World Literature",
  subject_name: "English",
  teacher_name: "Dr. Jose Rizal",
  class_id: "class-1",
  class_name: "Grade 11 - Mabini",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Introduction to Epic Poetry",
  lesson_type: "text",
  content: "# Section 1: Overview\n\nEpic poetry reflects ancient heroic traditions.\n\n## Section 2: Characteristics\n\nFeatures grandiose language and supernatural forces.",
  file_name: null,
  file_type: null,
  file_size: null,
  has_file: false,
  sort_order: 1,
  assigned_at: "2026-11-20T08:00:00Z",
};

const MOCK_PDF_LESSON: StudentLessonItem = {
  assignment_id: "assign-pdf-1",
  lesson_id: "lesson-pdf-1",
  module_id: "mod-2",
  module_title: "Philippine Revolution",
  subject_name: "History",
  teacher_name: "Prof. Apolinario Mabini",
  class_id: "class-1",
  class_name: "Grade 11 - Mabini",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Revolutionary Documents",
  lesson_type: "file",
  content: "Analyze primary sources carefully.",
  file_name: "historical_documents.pdf",
  file_type: "application/pdf",
  file_size: 2048000,
  has_file: true,
  sort_order: 2,
  assigned_at: "2026-11-21T08:00:00Z",
};

const MOCK_DOCX_LESSON: StudentLessonItem = {
  assignment_id: "assign-docx-1",
  lesson_id: "lesson-docx-1",
  module_id: "mod-3",
  module_title: "Algebraic Reasoning",
  subject_name: "Mathematics",
  teacher_name: "Prof. Maria Santos",
  class_id: "class-1",
  class_name: "Grade 11 - Mabini",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Polynomial Formulas",
  lesson_type: "file",
  content: "Review formulas before the exam.",
  file_name: "polynomial_notes.docx",
  file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  file_size: 512000,
  has_file: true,
  sort_order: 3,
  assigned_at: "2026-11-22T08:00:00Z",
};

const MOCK_GENERIC_FILE_LESSON: StudentLessonItem = {
  assignment_id: "assign-file-1",
  lesson_id: "lesson-file-1",
  module_id: "mod-4",
  module_title: "Web Development",
  subject_name: "Computer Science",
  teacher_name: "Linus Torvalds",
  class_id: "class-1",
  class_name: "Grade 11 - Mabini",
  school_year_id: 1,
  school_year_name: "2026-2027",
  title: "Starter Project Archive",
  lesson_type: "file",
  content: "Extract and run pnpm install.",
  file_name: "starter_code.zip",
  file_type: "application/zip",
  file_size: 1048576,
  has_file: true,
  sort_order: 4,
  assigned_at: "2026-11-23T08:00:00Z",
};

describe("StudentUnifiedReaderModal – Single Source of Truth UI Design", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    }) as any;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(50)),
    } as any);
  });

  it("renders a written lesson in the unified reader shell with textbook controls", async () => {
    const handleClose = vi.fn();
    render(<StudentUnifiedReaderModal lesson={MOCK_WRITTEN_LESSON} onClose={handleClose} />);

    // Dialog exists
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("student-unified-reader-modal")).toBeInTheDocument();

    // Single source of truth toolbar elements
    expect(screen.getAllByText("Introduction to Epic Poetry")[0]).toBeInTheDocument();
    expect(within(dialog).getByText("Written Lesson")).toBeInTheDocument();
    expect(within(dialog).getByText("Contents")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Small font size")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Default font size")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Large font size")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Reading preferences")).toBeInTheDocument();

    // Textbook body rendered
    expect(screen.getAllByText("Section 1: Overview")[0]).toBeInTheDocument();
    expect(within(dialog).getByText("Epic poetry reflects ancient heroic traditions.")).toBeInTheDocument();
  });

  it("renders a PDF document in the unified reader shell with page jump and zoom", async () => {
    const handleClose = vi.fn();
    render(<StudentUnifiedReaderModal lesson={MOCK_PDF_LESSON} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // PDF badge and title
    expect(screen.getAllByText("Revolutionary Documents")[0]).toBeInTheDocument();
    expect(within(dialog).getByText("PDF Document")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation sidebar" })).toBeInTheDocument();

    // Paginated controls
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByLabelText("Current page number")).toHaveValue(1);
    expect(await screen.findByText("of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    expect(screen.getByLabelText("Fit to width")).toBeInTheDocument();

    // Download original document link
    const downloadLink = screen.getByRole("link", { name: "Download original historical_documents.pdf" });
    expect(downloadLink).toHaveAttribute("href", "/api/modules/student/lessons/lesson-pdf-1/file");
  });

  it("renders a Word DOCX document in the unified reader shell", async () => {
    const handleClose = vi.fn();
    render(<StudentUnifiedReaderModal lesson={MOCK_DOCX_LESSON} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // DOCX badge and title
    expect(screen.getAllByText("Polynomial Formulas")[0]).toBeInTheDocument();
    expect(within(dialog).getByText("Word DOCX")).toBeInTheDocument();

    // Wait for pages to render from docx-preview mock
    expect(await screen.findByText("of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
  });

  it("renders a generic file preview in the unified reader shell", () => {
    const handleClose = vi.fn();
    render(<StudentUnifiedReaderModal lesson={MOCK_GENERIC_FILE_LESSON} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Clean file title and teacher note
    expect(screen.getAllByText(/starter_code\.zip/)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Extract and run pnpm install.")[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download original starter_code.zip" })).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-file-1/file"
    );
  });

  it("opens the universal metadata info drawer displaying academic context and instructor", async () => {
    const user = userEvent.setup();
    render(<StudentUnifiedReaderModal lesson={MOCK_WRITTEN_LESSON} onClose={vi.fn()} />);

    // Initially not opened, so label is "Open document information"
    const openInfoBtn = screen.getByLabelText("Open document information");
    await user.click(openInfoBtn);

    const drawer = screen.getByRole("complementary", { name: "Document and Lesson Details" });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText("Dr. Jose Rizal")).toBeInTheDocument();
    expect(within(drawer).getByText("Grade 11 - Mabini")).toBeInTheDocument();
    expect(within(drawer).getByText("Module 1: World Literature")).toBeInTheDocument();
    expect(within(drawer).getByText("English")).toBeInTheDocument();
  });

  it("closes when clicking the Back button or pressing Escape", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<StudentUnifiedReaderModal lesson={MOCK_WRITTEN_LESSON} onClose={handleClose} />);

    const backBtn = screen.getByLabelText("Back to learning materials");
    await user.click(backBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
