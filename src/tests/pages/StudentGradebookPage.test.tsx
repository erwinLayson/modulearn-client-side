import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getStudentSummary: vi.fn(),
    getCurrentSchoolYear: vi.fn(),
    resolveCurrentPeriodId: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: { id: "student-1", school_id: 1, role: "student" } }),
}));

vi.mock("../../api/gradebook", () => ({
    gradebookApi: {
        getStudentSummary: mocks.getStudentSummary,
    },
}));

vi.mock("../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentSchoolYear,
    },
}));

vi.mock("../../api/academicPeriods", () => ({
    resolveCurrentPeriodId: mocks.resolveCurrentPeriodId,
    academicPeriodApi: {
        getBySchoolAndYear: vi.fn().mockResolvedValue({ data: { data: [] } }),
        getCurrent: vi.fn().mockResolvedValue({ data: { data: null } }),
    },
}));

import StudentGradebookPage from "../../pages/student/StudentGradebookPage";

describe("StudentGradebookPage", () => {
    it("attaches and displays a module activity created for the classroom in the student grades table", async () => {
        mocks.getCurrentSchoolYear.mockResolvedValue({
            data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
        });
        mocks.resolveCurrentPeriodId.mockResolvedValue(1);

        mocks.getStudentSummary.mockResolvedValue({
            data: {
                data: [
                    {
                        class_id: "class-1",
                        class_name: "Grade 7 - Diamond",
                        subject_id: "subject-1",
                        subject_name: "English 7",
                        teacher_name: "Ms. Santos",
                        final_grade: 92,
                        attendanceRate: 98,
                        activities: {
                            items: [
                                {
                                    id: "module-activity-1",
                                    title: "Life of Rizal Warm-up Activity",
                                    category: "activities",
                                    score: 24,
                                    max_score: 25,
                                    due_date: "2026-03-15",
                                    module_template_id: "mod-1",
                                    instructions: "Read chapter 1 first",
                                },
                            ],
                            average: 96,
                        },
                        quizzes: { items: [], average: null },
                        exams: { items: [], average: null },
                    },
                ],
            },
        });

        render(
            <MemoryRouter initialEntries={["/student/grades?period_id=1"]}>
                <StudentGradebookPage />
            </MemoryRouter>
        );

        // Subject row exists in spreadsheet table
        const subjectCells = await screen.findAllByText("English 7");
        expect(subjectCells.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Ms. Santos")).toBeInTheDocument();

        // Module activity column header is present with category and title tooltip
        const activityHeader = screen.getByTitle("[Module Activity] Life of Rizal Warm-up Activity — Read chapter 1 first");
        expect(activityHeader).toBeInTheDocument();
        expect(activityHeader).toHaveTextContent("ACT");

        // Module badge 'M' is displayed next to category
        const moduleBadge = screen.getByTitle("Read chapter 1 first");
        expect(moduleBadge).toBeInTheDocument();
        expect(moduleBadge).toHaveTextContent("M");
        expect(moduleBadge).toHaveClass("gb-spreadsheet__module-badge");

        // Activity score and max score are attached and displayed in the table
        expect(screen.getAllByText("24").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("/25").length).toBeGreaterThanOrEqual(1);

        // Computed final grade from student summary is displayed
        expect(screen.getAllByText("92%").length).toBeGreaterThanOrEqual(1);

        // Verify total column and total row are removed from the grade items table
        expect(screen.queryByRole("columnheader", { name: "TOTAL" })).not.toBeInTheDocument();
        expect(screen.queryByRole("cell", { name: "TOTAL" })).not.toBeInTheDocument();
    });

    it("displays assigned module activities without due dates and unscored activities awaiting grading", async () => {
        mocks.getCurrentSchoolYear.mockResolvedValue({
            data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
        });
        mocks.resolveCurrentPeriodId.mockResolvedValue(1);

        mocks.getStudentSummary.mockResolvedValue({
            data: {
                data: [
                    {
                        class_id: "class-1",
                        class_name: "Grade 7 - Diamond",
                        subject_id: "subject-1",
                        subject_name: "English 7",
                        teacher_name: "Ms. Santos",
                        final_grade: null,
                        attendanceRate: 100,
                        activities: {
                            items: [
                                {
                                    id: "module-activity-undated",
                                    title: "Assigned Module Self-Paced Project",
                                    category: "activities",
                                    score: null,
                                    max_score: 30,
                                    due_date: null,
                                    class_module_id: "cm-101",
                                },
                            ],
                            average: null,
                        },
                        quizzes: { items: [], average: null },
                        exams: { items: [], average: null },
                    },
                ],
            },
        });

        render(
            <MemoryRouter initialEntries={["/student/grades?period_id=1"]}>
                <StudentGradebookPage />
            </MemoryRouter>
        );

        const subjectCells = await screen.findAllByText("English 7");
        expect(subjectCells.length).toBeGreaterThanOrEqual(1);

        // Date header displays "No Due Date"
        expect(screen.getByText("No Due Date")).toBeInTheDocument();

        // Column header displays module activity tooltip and M badge
        expect(screen.getByTitle("[Module Activity] Assigned Module Self-Paced Project")).toBeInTheDocument();
        const moduleBadge = screen.getByTitle("Created from a module template");
        expect(moduleBadge).toBeInTheDocument();
        expect(moduleBadge).toHaveTextContent("M");
        expect(moduleBadge).toHaveClass("gb-spreadsheet__module-badge");

        // Unscored cell displays —/30
        expect(
            screen.getAllByText((_content, element) => element?.tagName.toLowerCase() === "span" && element?.textContent?.trim() === "—/30").length
        ).toBeGreaterThanOrEqual(1);
    });
});
