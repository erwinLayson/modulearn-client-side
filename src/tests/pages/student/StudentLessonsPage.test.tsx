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

  it("opens the file details preview modal when clicking the file preview button", async () => {
    mocks.listMine.mockResolvedValueOnce({
      data: { data: MOCK_LESSONS },
    });

    render(<StudentLessonsPage />);

    await waitFor(() => {
      expect(screen.getByText("Full_Stack_Resume.pdf")).toBeInTheDocument();
    });

    const previewBtn = screen.getByLabelText("Preview details for Chapter 1: Early Childhood");
    await userEvent.click(previewBtn);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Teacher's Instructions & Notes")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Please read before our quiz on Friday.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Download Original File" })
    ).toHaveAttribute("href", "/api/modules/student/lessons/lesson-1/file");
  });
});
