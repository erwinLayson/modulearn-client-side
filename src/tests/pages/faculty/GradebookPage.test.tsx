import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    user: {
        id: "faculty-1",
        name: "Prof. Cruz",
        email: "cruz@test.local",
        role: "faculty",
        school_id: 1,
    },
    getAssignedClasses: vi.fn(),
    getCurrentYear: vi.fn(),
    getPeriods: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getAssignedClasses: mocks.getAssignedClasses,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentYear,
    },
}));

vi.mock("../../../api/academicPeriods", () => ({
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getPeriods,
    },
}));

import GradebookPage from "../../../pages/faculty/GradebookPage";

const ASSIGNMENTS = [
    {
        id: "class-1",
        class_name: "Grade 7 - Diamond",
        school_id: 1,
        school_year_id: 1,
        faculty_id: "faculty-1",
        capacity: 30,
        section: "Diamond",
        grade_level: "Grade 7",
        schedule: null,
        created_at: "2026-01-01T00:00:00.000Z",
        faculty_name: "Prof. Cruz",
        adviser_role: true,
        subjects: [
            { id: "subject-1", name: "English 7" },
            { id: "subject-2", name: "Mathematics 7" },
        ],
    },
    {
        id: "class-old",
        class_name: "Grade 6 - Pearl",
        school_id: 1,
        school_year_id: 99,
        faculty_id: "faculty-1",
        capacity: 28,
        section: "Pearl",
        grade_level: "Grade 6",
        schedule: null,
        created_at: "2025-01-01T00:00:00.000Z",
        faculty_name: "Prof. Cruz",
        adviser_role: false,
        subjects: [{ id: "subject-old", name: "Old Subject" }],
    },
];

const PERIODS = [
    {
        id: 10,
        name: "First Quarter",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
    },
];

function SubjectProbe() {
    const { classId, subjectId } = useParams();
    const [searchParams] = useSearchParams();
    return (
        <div>
            Subject route {classId} {subjectId} period {searchParams.get("period_id") || "none"}
        </div>
    );
}

function renderPage(initialEntry = "/dashboard/gradebook") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/dashboard/gradebook" element={<GradebookPage />} />
                <Route path="/dashboard/gradebook/:classId/:subjectId" element={<SubjectProbe />} />
                <Route path="/dashboard" element={<div>Dashboard route</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getPeriods.mockResolvedValue({ data: { data: PERIODS } });
});

describe("GradebookPage", () => {
    it("shows the loading state while the assigned classes are fetched", () => {
        mocks.getAssignedClasses.mockReturnValue(new Promise(() => {}));
        mocks.getCurrentYear.mockReturnValue(new Promise(() => {}));

        renderPage();

        expect(screen.getByRole("heading", { name: "Gradebook" })).toBeInTheDocument();
        expect(screen.getAllByText("Loading...").length).toBeGreaterThanOrEqual(1);
    });

    it("lists only the assigned classes for the current school year", async () => {
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: ASSIGNMENTS } });

        renderPage();

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.getByText("2 subjects across 1 class")).toBeInTheDocument();
        expect(screen.getByText("English 7")).toBeInTheDocument();
        expect(screen.getByText("Mathematics 7")).toBeInTheDocument();
        expect(screen.getByText("Adviser")).toBeInTheDocument();
        expect(screen.getByText("Grade 7")).toBeInTheDocument();
        expect(screen.getByText("Section Diamond")).toBeInTheDocument();
        expect(screen.queryByText("Grade 6 - Pearl")).not.toBeInTheDocument();
        expect(await screen.findByRole("option", { name: /First Quarter/ })).toBeInTheDocument();
    });

    it("navigates to the selected subject and keeps the chosen period in the URL", async () => {
        const user = userEvent.setup();
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: ASSIGNMENTS } });

        renderPage();

        await screen.findByText("English 7");
        await screen.findByRole("option", { name: /First Quarter/ });
        await user.selectOptions(screen.getByRole("combobox"), "10");
        await user.click(screen.getByText("English 7"));

        expect(await screen.findByText("Subject route class-1 subject-1 period 10")).toBeInTheDocument();
    });

    it("shows the empty state when no classes are assigned", async () => {
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: [] } });

        renderPage();

        expect(await screen.findByText("No classes assigned to you.")).toBeInTheDocument();
    });

    it("falls back to the empty state when loading the assigned classes fails", async () => {
        mocks.getAssignedClasses.mockRejectedValue(new Error("offline"));

        renderPage();

        expect(await screen.findByText("No classes assigned to you.")).toBeInTheDocument();
    });
});
