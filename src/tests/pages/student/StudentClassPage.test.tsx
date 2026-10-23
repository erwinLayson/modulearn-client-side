import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    user: { id: "student-1", name: "Ada Student", school_id: 1, role: "student" },
    getCurrent: vi.fn(),
    getClassesByStudentId: vi.fn(),
    getById: vi.fn(),
    getFaculties: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrent,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getClassesByStudentId: mocks.getClassesByStudentId,
    },
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getById: mocks.getById,
        getFaculties: mocks.getFaculties,
    },
}));

import StudentClassPage from "../../../pages/student/StudentClassPage";

const SCHOOL_YEAR = {
    id: 1,
    name: "2025-2026",
    start_date: "2025-06-01",
    end_date: "2026-04-30",
    school_id: 1,
    is_current: 1,
};

const ENROLLED_CLASS = {
    class_id: "class-1",
    class_name: "Grade 7 - Diamond",
    subjects: [
        { id: "subject-1", name: "English 7" },
        { id: "subject-2", name: "Mathematics 7" },
    ],
};

const CLASS_DETAIL = {
    id: "class-1",
    class_name: "Grade 7 - Diamond",
    grade_level: "Grade 7",
    section: "Diamond",
    capacity: 40,
    faculty_name: "Ms. Reyes",
    schedule: [
        { day: "Mon", start_time: "08:00", end_time: "09:00" },
        { day: "Tue", start_time: "10:00", end_time: "11:00" },
    ],
    subjects: [],
};

const FACULTIES = [
    {
        id: "faculty-1",
        first_name: "Maria",
        last_name: "Santos",
        email: "maria@test.local",
        subject_id: "subject-1",
        subject_name: "English 7",
    },
    {
        id: "faculty-2",
        first_name: "Jose",
        last_name: "Cruz",
        email: "jose@test.local",
        subject_id: "subject-2",
        subject_name: "Mathematics 7",
    },
];

describe("StudentClassPage", () => {
    it("shows the loading state while the class is being resolved", () => {
        mocks.getCurrent.mockReturnValue(new Promise(() => {}));

        render(<StudentClassPage />);

        expect(screen.getByRole("heading", { name: "My Class" })).toBeInTheDocument();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders the class summary, schedule and enrolled subjects with teachers", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getClassesByStudentId.mockResolvedValue({ data: { data: [ENROLLED_CLASS] } });
        mocks.getById.mockResolvedValue({ data: { data: CLASS_DETAIL } });
        mocks.getFaculties.mockResolvedValue({ data: { data: FACULTIES } });

        render(<StudentClassPage />);

        expect(await screen.findByRole("heading", { name: "Grade 7 - Diamond" })).toBeInTheDocument();
        expect(screen.getByText("Your current class")).toBeInTheDocument();
        expect(screen.getAllByText("Grade 7")).toHaveLength(2);
        expect(screen.getAllByText("Diamond")).toHaveLength(2);
        expect(screen.getByText("40")).toBeInTheDocument();
        expect(screen.getByText("Ms. Reyes")).toBeInTheDocument();
        expect(screen.getByText("Mon 08:00–09:00")).toBeInTheDocument();
        expect(screen.getByText("Tue 10:00–11:00")).toBeInTheDocument();

        expect(screen.getByRole("heading", { name: "Subjects (2)" })).toBeInTheDocument();

        const englishRow = screen.getByRole("row", { name: /English 7/ });
        expect(within(englishRow).getByText("Maria Santos")).toBeInTheDocument();
        const mathRow = screen.getByRole("row", { name: /Mathematics 7/ });
        expect(within(mathRow).getByText("Jose Cruz")).toBeInTheDocument();

        expect(mocks.getById).toHaveBeenCalledWith("class-1");
        expect(mocks.getFaculties).toHaveBeenCalledWith("class-1");
    });

    it("falls back to the enrollment subjects when the faculty lookup fails", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getClassesByStudentId.mockResolvedValue({ data: { data: [ENROLLED_CLASS] } });
        mocks.getById.mockResolvedValue({ data: { data: CLASS_DETAIL } });
        mocks.getFaculties.mockRejectedValue(new Error("faculty unavailable"));

        render(<StudentClassPage />);

        expect(await screen.findByText("English 7")).toBeInTheDocument();
        expect(screen.getByText("Mathematics 7")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Subjects (2)" })).toBeInTheDocument();

        const englishRow = screen.getByRole("row", { name: /English 7/ });
        expect(within(englishRow).getByText("—")).toBeInTheDocument();
    });

    it("shows the empty state when the student has no enrolled classes", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getClassesByStudentId.mockResolvedValue({ data: { data: [] } });

        render(<StudentClassPage />);

        expect(await screen.findByText("You are not enrolled in any class yet.")).toBeInTheDocument();
        expect(screen.getByText("Contact your school administrator to enroll you in a class.")).toBeInTheDocument();
        expect(mocks.getById).not.toHaveBeenCalled();
    });

    it("shows the empty state when there is no current school year", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: null } });

        render(<StudentClassPage />);

        expect(await screen.findByText("You are not enrolled in any class yet.")).toBeInTheDocument();
        expect(mocks.getClassesByStudentId).not.toHaveBeenCalled();
    });

    it("shows the empty state when the class lookup fails", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getClassesByStudentId.mockResolvedValue({ data: { data: [ENROLLED_CLASS] } });
        mocks.getById.mockRejectedValue(new Error("class unavailable"));
        mocks.getFaculties.mockResolvedValue({ data: { data: [] } });

        render(<StudentClassPage />);

        expect(await screen.findByText("You are not enrolled in any class yet.")).toBeInTheDocument();
        expect(screen.queryByText("class unavailable")).not.toBeInTheDocument();
    });
});
