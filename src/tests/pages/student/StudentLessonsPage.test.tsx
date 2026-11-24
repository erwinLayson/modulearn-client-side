import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { id: "student-1", name: "Ada Lovelace", role: "student", school_id: 1 },
  listMine: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/modules", () => ({
  studentLessonApi: {
    listMine: mocks.listMine,
    fileDownloadUrl: (id: string) => `/api/modules/student/lessons/${id}/file`,
  },
}));

vi.mock("../../../components/StudentPDFReaderModal", () => ({
  default: ({
    lesson,
    onClose,
  }: {
    lesson: any;
    onClose: () => void;
  }) => (
    <div
      role="dialog"
      data-testid="student-pdf-reader-modal"
      className="student-pdf-reader-overlay"
      aria-label={`PDF Document Reader: ${lesson.title}`}
    >
      <button type="button" onClick={onClose} aria-label="Back to learning materials">
        Back
      </button>
      <div data-testid="student-pdf-viewer-preview">
        <span>Rendering PDF: {lesson.file_name}</span>
        <span>Source: /api/modules/student/lessons/{lesson.lesson_id}/file?inline=true</span>
      </div>
      <h2>{lesson.title}</h2>
      <a
        href={`/api/modules/student/lessons/${lesson.lesson_id}/file?inline=true`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open in New Tab
      </a>
      <div>
        <span>Teacher's Instructions & Notes</span>
        <p>{lesson.content}</p>
      </div>
      <a
        href={`/api/modules/student/lessons/${lesson.lesson_id}/file`}
        download={lesson.file_name}
      >
        Download Original File
      </a>
    </div>
  ),
}));

vi.mock("../../../components/StudentDocxReaderModal", () => ({
  default: ({
    lesson,
    onClose,
  }: {
    lesson: any;
    onClose: () => void;
  }) => (
    <div
      role="dialog"
      data-testid="student-docx-reader-modal"
      className="student-docx-reader-overlay"
      aria-label={`DOCX Document Reader: ${lesson.title}`}
    >
      <button type="button" onClick={onClose} aria-label="Back to learning materials">
        Back
      </button>
      <div data-testid="student-docx-viewer-preview">
        <span>Rendering DOCX: {lesson.file_name}</span>
        <span>Source: /api/modules/student/lessons/{lesson.lesson_id}/file</span>
      </div>
      <h2>{lesson.title}</h2>
      <div>
        <span>Teacher's Instructions & Notes</span>
        <p>{lesson.content}</p>
      </div>
      <a
        href={`/api/modules/student/lessons/${lesson.lesson_id}/file`}
        download={lesson.file_name}
      >
        Download Original DOCX
      </a>
    </div>
  ),
}));

import StudentLessonsPage from "../../../pages/student/StudentLessonsPage";

const MOCK_LESSONS = [
  {
    assignment_id: "assign-1",
    lesson_id: "lesson-1",
    module_id: "mod-1",
    module_title: "Life of Rizal",
    subject_name: "English",
    teacher_name: "Dennis Dela Cruz",
    class_id: "class-1",
    class_name: "Grade 10 - Diamond",
    school_year_id: 1,
    school_year_name: "2025-2026",
    title: "Chapter 1: Early Childhood",
    lesson_type: "file" as const,
    content: "Please read before our quiz on Friday.",
    file_name: "1730000000000-Full_Stack_Resume.pdf",
    file_type: "application/pdf",
    file_size: 29593, // ~28.9 KB
    has_file: true,
  },
  {
    assignment_id: "assign-2",
    lesson_id: "lesson-2",
    module_id: "mod-2",
    module_title: "Algebraic Expressions",
    subject_name: "Mathematics",
    teacher_name: "Maria Santos",
    class_id: "class-1",
    class_name: "Grade 10 - Diamond",
    school_year_id: 1,
    school_year_name: "2025-2026",
    title: "Lesson 2: Polynomial Factoring",
    lesson_type: "text" as const,
    content: "Polynomials are algebraic expressions that consist of variables and coefficients.",
    file_name: null,
    file_type: null,
    file_size: null,
    has_file: false,
  },
  {
    assignment_id: "assign-3",
    lesson_id: "lesson-3",
    module_id: "mod-3",
    module_title: "Essay Writing",
    subject_name: "History",
    teacher_name: "Ramon Magsaysay",
    class_id: "class-1",
    class_name: "Grade 10 - Diamond",
    school_year_id: 1,
    school_year_name: "2025-2026",
    title: "Essay Guidelines",
    lesson_type: "file" as const,
    content: "Follow MLA formatting.",
    file_name: "essay_rubric.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 14200,
    has_file: true,
  },
  {
    assignment_id: "assign-4",
    lesson_id: "lesson-4",
    module_id: "mod-4",
    module_title: "Web Development",
    subject_name: "Computer Science",
    teacher_name: "Linus Torvalds",
    class_id: "class-1",
    class_name: "Grade 10 - Diamond",
    school_year_id: 1,
    school_year_name: "2025-2026",
    title: "Starter Project",
    lesson_type: "file" as const,
    content: "Extract and run npm install.",
    file_name: "starter_code.zip",
    file_type: "application/zip",
    file_size: 1048576,
    has_file: true,
  },
];

describe("StudentLessonsPage – Learning Materials Table UI", () => {
  it("renders table with proper headers, column content, and semantic badges", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    expect(screen.getByText("Loading learning materials...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Shared Materials")).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText("Class / School Year")).toBeInTheDocument();
    expect(screen.getByText("Module")).toBeInTheDocument();
    expect(screen.getByText("Lesson / Material")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Check Module Info (Primary & Secondary)
    expect(screen.getByText("Life of Rizal")).toBeInTheDocument();
    expect(screen.getByText("English · Dennis Dela Cruz")).toBeInTheDocument();

    // Check File presentation: cleaned filename, type and size
    expect(screen.getByText("Full_Stack_Resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF document · 28.9 KB")).toBeInTheDocument();

    // Check Type Badges
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Written")).toBeInTheDocument();

    // Check Action buttons exist
    const previewBtn = screen.getByLabelText("Preview details for Chapter 1: Early Childhood");
    expect(previewBtn).toBeInTheDocument();

    const downloadLink = screen.getByLabelText("Download 1730000000000-Full_Stack_Resume.pdf");
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-1/file"
    );
    expect(downloadLink).toHaveAttribute(
      "download",
      "1730000000000-Full_Stack_Resume.pdf"
    );

    const readBtn = screen.getByLabelText("Read Lesson 2: Polynomial Factoring");
    expect(readBtn).toBeInTheDocument();
  });

  it("opens the reader modal when clicking Read on a written lesson", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    await waitFor(() => {
      expect(screen.getByText("Algebraic Expressions")).toBeInTheDocument();
    });

    const readBtn = screen.getByLabelText("Read Lesson 2: Polynomial Factoring");
    await userEvent.click(readBtn);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(
        "Polynomials are algebraic expressions that consist of variables and coefficients."
      )
    ).toBeInTheDocument();

    // Close reader modal using close button
    const closeBtn = within(dialog).getByRole("button", { name: "Close" });
    await userEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the full-screen PDF document reader when clicking the PDF preview button", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    await waitFor(() => {
      expect(screen.getByText("Full_Stack_Resume.pdf")).toBeInTheDocument();
    });

    const previewBtn = screen.getByLabelText("Preview details for Chapter 1: Early Childhood");
    expect(previewBtn).toHaveClass("materials-btn--preview");
    expect(within(previewBtn).getByText("Preview")).toBeInTheDocument();

    await userEvent.click(previewBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("student-pdf-reader-modal")).toBeInTheDocument();

    // Check PDF viewer preview component is rendered with correct props
    const pdfViewer = within(dialog).getByTestId("student-pdf-viewer-preview");
    expect(pdfViewer).toBeInTheDocument();
    expect(within(pdfViewer).getByText("Rendering PDF: 1730000000000-Full_Stack_Resume.pdf")).toBeInTheDocument();
    expect(
      within(pdfViewer).getByText(
        "Source: /api/modules/student/lessons/lesson-1/file?inline=true"
      )
    ).toBeInTheDocument();

    // Check Open in New Tab action link
    const openInNewTabLink = within(dialog).getByRole("link", { name: "Open in New Tab" });
    expect(openInNewTabLink).toHaveAttribute(
      "href",
      "/api/modules/student/lessons/lesson-1/file?inline=true"
    );
    expect(openInNewTabLink).toHaveAttribute("target", "_blank");
    expect(openInNewTabLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(
      within(dialog).getByText("Teacher's Instructions & Notes")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Please read before our quiz on Friday.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Download Original File" })
    ).toHaveAttribute("href", "/api/modules/student/lessons/lesson-1/file");

    // Close reader via Back button
    await userEvent.click(within(dialog).getByRole("button", { name: "Back to learning materials" }));
    expect(screen.queryByTestId("student-pdf-reader-modal")).not.toBeInTheDocument();
  });

  it("opens the full-screen DOCX document reader when clicking the Word preview button", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    await waitFor(() => {
      expect(screen.getByText("essay_rubric.docx")).toBeInTheDocument();
    });

    const previewBtn = screen.getByLabelText("Preview details for Essay Guidelines");
    expect(previewBtn).toHaveClass("materials-btn--preview");
    expect(within(previewBtn).getByText("Preview")).toBeInTheDocument();

    await userEvent.click(previewBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("student-docx-reader-modal")).toBeInTheDocument();

    // Check DOCX viewer preview component is rendered with correct props
    const docxViewer = within(dialog).getByTestId("student-docx-viewer-preview");
    expect(docxViewer).toBeInTheDocument();
    expect(within(docxViewer).getByText("Rendering DOCX: essay_rubric.docx")).toBeInTheDocument();
    expect(
      within(docxViewer).getByText(
        "Source: /api/modules/student/lessons/lesson-3/file"
      )
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText("Teacher's Instructions & Notes")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Follow MLA formatting.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Download Original DOCX" })
    ).toHaveAttribute("href", "/api/modules/student/lessons/lesson-3/file");

    // Close reader via Back button
    await userEvent.click(within(dialog).getByRole("button", { name: "Back to learning materials" }));
    expect(screen.queryByTestId("student-docx-reader-modal")).not.toBeInTheDocument();
  });

  it("does not render PDF or DOCX reader for non-previewable files and opens file details modal", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    await waitFor(() => {
      expect(screen.getByText("starter_code.zip")).toBeInTheDocument();
    });

    const previewBtn = screen.getByLabelText("Preview details for Starter Project");
    expect(previewBtn).toHaveClass("materials-btn--icon-only");
    expect(within(previewBtn).queryByText("Preview")).not.toBeInTheDocument();

    await userEvent.click(previewBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveClass("student-pdf-reader-overlay");
    expect(dialog).not.toHaveClass("student-docx-reader-overlay");

    // PDF and DOCX readers should NOT be rendered for zip archives
    expect(screen.queryByTestId("student-pdf-reader-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("student-docx-reader-modal")).not.toBeInTheDocument();

    expect(
      within(dialog).getAllByText("Extract and run npm install.")[0]
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Download Original File" })
    ).toHaveAttribute("href", "/api/modules/student/lessons/lesson-4/file");
  });
});
