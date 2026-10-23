import { render, screen } from "@testing-library/react";
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
    isEnabled: vi.fn(),
    getAssignedClasses: vi.fn(),
    getBySchoolId: vi.fn(),
    getById: vi.fn(),
    getFaculties: vi.fn(),
    getByClassAndSchoolYear: vi.fn(),
    getCurrentYear: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: mocks.isEnabled }),
}));

vi.mock("../../api/classes", () => ({
    classApi: {
        getAssignedClasses: mocks.getAssignedClasses,
        getBySchoolId: mocks.getBySchoolId,
        getById: mocks.getById,
        getFaculties: mocks.getFaculties,
    },
}));

vi.mock("../../api/enrollments", () => ({
    enrollmentApi: {
        getByClassAndSchoolYear: mocks.getByClassAndSchoolYear,
    },
}));

vi.mock("../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentYear,
    },
}));

import ClassesPage from "../../pages/ClassesPage";

const ADVISORY_ASSIGNMENT = {
    id: "class-1",
    class_name: "Grade 7 - Diamond",
    school_id: 1,
    school_year_id: 1,
    faculty_id: "faculty-1",
    capacity: 30,
    section: "Diamond",
    grade_level: "Grade 7",
    schedule: [
        { day: "Monday", start_time: "08:00", end_time: "09:00", room: "Room 101" },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    faculty_name: "Prof. Cruz",
    adviser_role: true,
    subjects: [{ id: "subject-1", name: "English 7" }],
};

const SCHOOL_CLASSES = [
    {
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
        schedule: [{ day: "Monday", start_time: "08:00", end_time: "09:00" }],
        created_at: "2026-01-01T00:00:00.000Z",
    },
    {
        id: "class-2",
        class_name: "Grade 8 - Ruby",
        module_id: "",
        module_title: "",
        faculty_id: "faculty-2",
        faculty_name: "Ms. Reyes",
        school_id: 1,
        school_year_id: 1,
        capacity: 28,
        section: "Ruby",
        grade_level: "Grade 8",
        schedule: null,
        created_at: "2026-01-01T00:00:00.000Z",
    },
];

const ENROLLMENTS = [
    {
        id: "enrollment-1",
        student_id: "student-1",
        student_first_name: "Ana",
        student_middle_name: "Bautista",
        student_last_name: "Santos",
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
        student_first_name: "Ben",
        student_middle_name: "Cruz",
        student_last_name: "Reyes",
        student_name: "Ben Reyes",
        student_email: "ben@test.local",
        lrn: "654321",
        class_id: "class-1",
        class_name: "Grade 7 - Diamond",
        section: "Diamond",
        grade_level: 7,
        school_year_id: 1,
        school_year_name: "2025-2026",
        status: "active",
        enrolled_at: "2026-01-02T00:00:00.000Z",
        subjects: [],
    },
];

function renderPage(role: "faculty" | "school_admin" | "student") {
    return render(
        <MemoryRouter initialEntries={["/dashboard/classes"]}>
            <Routes>
                <Route path="/dashboard/classes" element={<ClassesPage role={role} />} />
                <Route path="/dashboard/classes/:classId/report-cards" element={<div>Report cards route</div>} />
                <Route path="/dashboard/students/:studentId/academic-record" element={<div>Academic record route</div>} />
                <Route path="/dashboard" element={<div>Dashboard route</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    mocks.isEnabled.mockReturnValue(true);
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getAssignedClasses.mockResolvedValue({ data: { data: [ADVISORY_ASSIGNMENT] } });
    mocks.getBySchoolId.mockResolvedValue({ data: { data: SCHOOL_CLASSES } });
    mocks.getByClassAndSchoolYear.mockResolvedValue({ data: { data: ENROLLMENTS } });
    mocks.getById.mockResolvedValue({ data: { data: SCHOOL_CLASSES[0] } });
    mocks.getFaculties.mockResolvedValue({ data: { data: [] } });
});

describe("ClassesPage", () => {
    it("opens the faculty advisory class with its roster and navigates to batch report cards", async () => {
        const user = userEvent.setup();

        renderPage("faculty");

        expect(await screen.findByRole("heading", { level: 2, name: "Grade 7 - Diamond" })).toBeInTheDocument();
        expect(screen.getByText("Grade 7 · Section Diamond")).toBeInTheDocument();
        expect(await screen.findByText("Santos, Ana Bautista")).toBeInTheDocument();
        expect(screen.getByText("Enrolled Students (2)")).toBeInTheDocument();
        expect(screen.getByText("Reyes, Ben Cruz")).toBeInTheDocument();
        expect(screen.getByText("ana@test.local")).toBeInTheDocument();
        expect(screen.getAllByText("Active")).toHaveLength(2);
        expect(screen.getAllByRole("button", { name: "Print report card" })).toHaveLength(2);

        await user.click(screen.getByRole("button", { name: "Print all report cards" }));
        expect(await screen.findByText("Report cards route")).toBeInTheDocument();
    });

    it("filters the advisee roster by name and reports no matches", async () => {
        const user = userEvent.setup();

        renderPage("faculty");
        await screen.findByText("Santos, Ana Bautista");

        const search = screen.getByPlaceholderText("Search students...");
        await user.type(search, "Ana");

        expect(screen.getByText("Santos, Ana Bautista")).toBeInTheDocument();
        expect(screen.queryByText("Reyes, Ben Cruz")).not.toBeInTheDocument();

        await user.clear(search);
        await user.type(search, "zzz");

        expect(screen.getByText("No students match your search.")).toBeInTheDocument();
    });

    it("lists every school class for a school administrator", async () => {
        renderPage("school_admin");

        expect(await screen.findByRole("heading", { name: "Classes" })).toBeInTheDocument();
        expect(screen.getByText("Manage classrooms for your school.")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Class Name" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Adviser" })).toBeInTheDocument();
        expect(screen.getByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.getByText("Grade 8 - Ruby")).toBeInTheDocument();
        expect(screen.getByText("Ms. Reyes")).toBeInTheDocument();
    });

    it("shows the empty state when no advisory classes are assigned", async () => {
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: [] } });

        renderPage("faculty");

        expect(await screen.findByText("No classes assigned to you.")).toBeInTheDocument();
    });

    it("shows the class load error and falls back to the empty state", async () => {
        mocks.getAssignedClasses.mockRejectedValue(new Error("offline"));

        renderPage("faculty");

        expect(await screen.findByText("Failed to load classes")).toBeInTheDocument();
        expect(screen.getByText("No classes assigned to you.")).toBeInTheDocument();
    });
});
