import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    user: {
        id: "faculty-1",
        name: "Prof. Cruz",
        email: "cruz@test.local",
        role: "faculty",
        school_id: 1,
    },
    getById: vi.fn(),
    getCurrentYear: vi.fn(),
    getByClassAndSchoolYear: vi.fn(),
    getAcademicRecord: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getById: mocks.getById,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentYear,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getByClassAndSchoolYear: mocks.getByClassAndSchoolYear,
    },
}));

vi.mock("../../../api/students", () => ({
    studentApi: {
        getAcademicRecord: mocks.getAcademicRecord,
    },
}));

import AdvisoryReportCardsPage from "../../../pages/faculty/AdvisoryReportCardsPage";

const CLASS_DETAIL = {
    id: "class-1",
    class_name: "Grade 7 - Diamond",
    module_id: "",
    module_title: "",
    faculty_id: "faculty-1",
    faculty_name: "Prof. Cruz",
    school_id: 1,
    school_year_id: 1,
    capacity: 30,
    section: "Diamond",
    grade_level: "Grade 7",
    schedule: null,
    created_at: "2026-01-01T00:00:00.000Z",
};

const ENROLLMENTS = [
    {
        id: "enrollment-1",
        student_id: "student-1",
        student_name: "Ana Santos",
        student_email: "ana@test.local",
        lrn: "123456",
        class_id: "class-1",
        class_name: "Grade 7 - Diamond",
        section: "Diamond",
        grade_level: 7,
        school_year_id: 1,
        school_year_name: "2025-2026",
        status: "active",
        enrolled_at: "2026-01-01T00:00:00.000Z",
        subjects: [],
    },
    {
        id: "enrollment-2",
        student_id: "student-2",
        student_name: "Ben Cruz",
        student_email: "ben@test.local",
        lrn: "654321",
        class_id: "class-1",
        class_name: "Grade 7 - Diamond",
        section: "Diamond",
        grade_level: 7,
        school_year_id: 1,
        school_year_name: "2025-2026",
        status: "active",
        enrolled_at: "2026-01-01T00:00:00.000Z",
        subjects: [],
    },
];

function makeRecord(studentId: string, firstName: string, middle: string, lastName: string, finalGrade: number) {
    return {
        student: {
            id: studentId,
            first_name: firstName,
            middle_name: middle,
            last_name: lastName,
            extension_name: "",
            lrn: studentId === "student-1" ? "123456" : "654321",
            email: `${firstName.toLowerCase()}@test.local`,
            sex: "female",
            date_of_birth: "2012-01-15",
        },
        school: {
            school_id: 1,
            school_name: "Bagong Silang National High School",
            address: "Purok 1",
            region: "Region IV-A",
            province: "Laguna",
            city: "Calamba",
            contact_number: "049-123-4567",
            school_logo: "",
        },
        records: [
            {
                school_year: {
                    id: 1,
                    name: "2025-2026",
                    start_date: "2025-06-01",
                    end_date: "2026-03-31",
                    is_current: 1,
                },
                enrollment: {
                    grade_level: "7",
                    section: "Diamond",
                    class_name: "Grade 7 - Diamond",
                    adviser_name: "Prof. Cruz",
                    status: "active",
                },
                periods: [
                    {
                        id: 10,
                        name: "First Quarter",
                        period_number: 1,
                        start_date: "2025-06-01",
                        end_date: "2025-08-31",
                    },
                    {
                        id: 11,
                        name: "Second Quarter",
                        period_number: 2,
                        start_date: "2025-09-01",
                        end_date: "2025-11-30",
                    },
                ],
                subjects: [
                    {
                        subject_id: "subject-1",
                        subject_name: "English 7",
                        grades: [
                            { period_id: 10, final_grade: finalGrade },
                            { period_id: 11, final_grade: finalGrade + 1 },
                        ],
                        final_grade: finalGrade + 0.75,
                    },
                ],
            },
        ],
    };
}

const RECORDS: Record<string, ReturnType<typeof makeRecord>> = {
    "student-1": makeRecord("student-1", "Ana", "B.", "Santos", 89.25),
    "student-2": makeRecord("student-2", "Ben", "C.", "Cruz", 91),
};

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/dashboard/classes/class-1/report-cards"]}>
            <Routes>
                <Route
                    path="/dashboard/classes/:classId/report-cards"
                    element={<AdvisoryReportCardsPage />}
                />
                <Route path="/dashboard/classes" element={<div>Classes route</div>} />
                <Route path="/dashboard" element={<div>Dashboard route</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    mocks.getById.mockResolvedValue({ data: { data: CLASS_DETAIL } });
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getByClassAndSchoolYear.mockResolvedValue({ data: { data: ENROLLMENTS } });
    mocks.getAcademicRecord.mockImplementation(async (studentId: string) => ({
        data: { data: RECORDS[studentId] },
    }));
});

describe("AdvisoryReportCardsPage", () => {
    it("shows the loading state while the class and records load", () => {
        mocks.getById.mockReturnValue(new Promise(() => {}));
        mocks.getCurrentYear.mockReturnValue(new Promise(() => {}));

        renderPage();

        expect(screen.getByRole("heading", { name: "Class Report Cards" })).toBeInTheDocument();
        expect(screen.getByText(/Loading report cards/)).toBeInTheDocument();
    });

    it("renders a report card per advisee and prints them all", async () => {
        const user = userEvent.setup();
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

        renderPage();

        expect(await screen.findByText(/2 of 2 loaded/)).toBeInTheDocument();
        const header = screen
            .getByRole("heading", { name: "Class Report Cards" })
            .closest(".mgmt-header") as HTMLElement;
        expect(header).toHaveTextContent("Grade 7 - Diamond · Grade 7 · Section Diamond");
        expect(header).toHaveTextContent("School Year 2025-2026");
        expect(screen.getAllByText("STUDENT ACADEMIC RECORD")).toHaveLength(2);
        expect(screen.getAllByText("Bagong Silang National High School")).toHaveLength(2);
        expect(screen.getAllByText("English 7")).toHaveLength(2);
        expect(screen.getByText("Ana B. Santos")).toBeInTheDocument();
        expect(screen.getByText("Ben C. Cruz")).toBeInTheDocument();
        expect(screen.getAllByText("89.25")).toHaveLength(1);
        expect(screen.getAllByText("91.75")).toHaveLength(1);

        const printButton = screen.getByRole("button", { name: "Print All" });
        expect(printButton).toBeEnabled();
        await user.click(printButton);
        expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it("refetches every student record when switching to the all-years scope", async () => {
        const user = userEvent.setup();

        renderPage();
        await screen.findByText(/2 of 2 loaded/);

        await user.click(screen.getByRole("button", { name: "All Years" }));

        await waitFor(() =>
            expect(mocks.getAcademicRecord).toHaveBeenCalledWith("student-1", "all")
        );
        expect(await screen.findByText(/2 of 2 loaded/)).toBeInTheDocument();
    });

    it("shows the empty state when no students are enrolled", async () => {
        mocks.getByClassAndSchoolYear.mockResolvedValue({ data: { data: [] } });

        renderPage();

        expect(
            await screen.findByText("No students enrolled in this class for the current school year.")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Print All" })).toBeDisabled();
    });

    it("shows a toast when the class report cards cannot be loaded", async () => {
        mocks.getById.mockRejectedValue(new Error("offline"));

        renderPage();

        expect(await screen.findByText("Failed to load the class report cards")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Print All" })).toBeDisabled();
    });

    it("reports the students whose report cards failed while printing the rest", async () => {
        mocks.getAcademicRecord.mockImplementation(async (studentId: string) => {
            if (studentId === "student-1") throw new Error("missing record");
            return { data: { data: RECORDS[studentId] } };
        });

        renderPage();

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("1 report card could not be loaded: Ana Santos");
        expect(screen.getByText("Ben C. Cruz")).toBeInTheDocument();
        expect(screen.queryByText("Ana B. Santos")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Print All" })).toBeEnabled();
    });
});
