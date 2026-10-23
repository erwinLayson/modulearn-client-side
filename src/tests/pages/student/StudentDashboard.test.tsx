import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    user: { id: "student-1", name: "Ada Student", school_id: 1, role: "student" },
    isEnabled: vi.fn(() => true),
    getCurrent: vi.fn(),
    getByStudentAndSchoolYear: vi.fn(),
    getStudentBySubject: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: mocks.isEnabled }),
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrent,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getByStudentAndSchoolYear: mocks.getByStudentAndSchoolYear,
    },
}));

vi.mock("../../../api/classes", () => ({
    attendanceApi: {
        getStudentBySubject: mocks.getStudentBySubject,
    },
}));

import StudentDashboard from "../../../pages/student/StudentDashboard";

const SCHOOL_YEAR = {
    id: 1,
    name: "2025-2026",
    start_date: "2025-06-01",
    end_date: "2026-04-30",
    school_id: 1,
    is_current: 1,
};

const ENROLLMENT = {
    id: "enr-1",
    class_id: "class-1",
    class_name: "Grade 7 - Diamond",
    section: "Diamond",
    grade_level: 7,
    capacity: 40,
    adviser_name: "Ms. Reyes",
    school_year_id: 1,
    school_year_name: "2025-2026",
    status: "active" as const,
    enrolled_at: "2025-06-01",
    schedule: [
        { day: "Mon", start_time: "08:00", end_time: "09:00", room: "Room 101" },
        { day: "Tue", start_time: "10:00", end_time: "11:00" },
    ],
    subjects: [
        { id: "subject-1", name: "English 7", teacher_name: "Ms. Santos" },
        { id: "subject-2", name: "Mathematics 7", teacher_name: "Mr. Cruz" },
        { id: "subject-3", name: "Science 7", teacher_name: "Ms. Lim" },
    ],
};

const ATTENDANCE = [
    {
        subject_id: "subject-1",
        subject_name: "English 7",
        class_id: "class-1",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Ms. Santos",
        total_sessions: 20,
        present_count: 19,
        absent_count: 1,
        attendance_rate: 95,
    },
    {
        subject_id: "subject-2",
        subject_name: "Mathematics 7",
        class_id: "class-1",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Mr. Cruz",
        total_sessions: 10,
        present_count: 8,
        absent_count: 2,
        attendance_rate: 80,
    },
];

describe("StudentDashboard", () => {
    beforeEach(() => {
        mocks.isEnabled.mockReturnValue(true);
    });

    it("shows loading placeholders while the dashboard data is pending", () => {
        mocks.getCurrent.mockReturnValue(new Promise(() => {}));

        render(<StudentDashboard />);

        expect(screen.getByRole("heading", { name: "Student Dashboard" })).toBeInTheDocument();
        expect(screen.getAllByText("...")).toHaveLength(4);
        expect(screen.getByText("Loading attendance...")).toBeInTheDocument();
    });

    it("renders the greeting, class counters, schedule and attendance rates", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getByStudentAndSchoolYear.mockResolvedValue({ data: { data: ENROLLMENT } });
        mocks.getStudentBySubject.mockResolvedValue({ data: { data: ATTENDANCE } });

        render(<StudentDashboard />);

        expect(await screen.findByText("Ada Student")).toBeInTheDocument();
        expect(screen.getByText(/School Year:/)).toBeInTheDocument();
        expect(screen.getByText("2025-2026")).toBeInTheDocument();

        expect(screen.getByText("My Class")).toBeInTheDocument();
        expect(screen.getAllByText("Grade 7 - Diamond").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Subjects")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("Ms. Reyes")).toBeInTheDocument();
        expect(screen.getByText("active")).toBeInTheDocument();

        expect(screen.getByText("Schedule")).toBeInTheDocument();
        expect(screen.getByText(/08:00-09:00/)).toBeInTheDocument();
        expect(screen.getByText(/10:00-11:00/)).toBeInTheDocument();

        expect(screen.getByText("Attendance by Subject")).toBeInTheDocument();
        expect(screen.getByText("English 7")).toBeInTheDocument();
        expect(screen.getByText("Mathematics 7")).toBeInTheDocument();
        expect(screen.getByText("95%")).toBeInTheDocument();
        expect(screen.getByText("80%")).toBeInTheDocument();
        expect(mocks.getStudentBySubject).toHaveBeenCalledWith(1);
    });

    it("renders the empty dashboard when the student has no enrollment", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getByStudentAndSchoolYear.mockResolvedValue({ data: { data: null } });
        mocks.getStudentBySubject.mockResolvedValue({ data: { data: [] } });

        render(<StudentDashboard />);

        expect(await screen.findByText("No attendance records yet.")).toBeInTheDocument();
        expect(screen.getByText("Subjects")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getAllByText("—")).toHaveLength(3);
    });

    it("keeps the dashboard usable when the attendance request fails", async () => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getByStudentAndSchoolYear.mockResolvedValue({ data: { data: ENROLLMENT } });
        mocks.getStudentBySubject.mockRejectedValue(new Error("attendance offline"));

        render(<StudentDashboard />);

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.getByText("Ms. Reyes")).toBeInTheDocument();
        expect(screen.getByText("No attendance records yet.")).toBeInTheDocument();
    });

    it("silently falls back when the school year request fails", async () => {
        mocks.getCurrent.mockRejectedValue(new Error("school year unavailable"));

        render(<StudentDashboard />);

        expect(await screen.findByText("No attendance records yet.")).toBeInTheDocument();
        expect(screen.getByText("Subjects")).toBeInTheDocument();
        expect(screen.getAllByText("—")).toHaveLength(3);
        expect(mocks.getByStudentAndSchoolYear).not.toHaveBeenCalled();
        expect(mocks.getStudentBySubject).not.toHaveBeenCalled();
    });

    it("hides attendance and does not call the attendance API when the feature is disabled", async () => {
        mocks.isEnabled.mockReturnValue(false);
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getByStudentAndSchoolYear.mockResolvedValue({ data: { data: ENROLLMENT } });

        render(<StudentDashboard />);

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.queryByText("Attendance by Subject")).not.toBeInTheDocument();
        expect(screen.queryByText("No attendance records yet.")).not.toBeInTheDocument();
        expect(mocks.getStudentBySubject).not.toHaveBeenCalled();
    });
});
