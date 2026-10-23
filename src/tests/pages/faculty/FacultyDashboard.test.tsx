import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    apiGet: vi.fn(),
    getFacultySummary: vi.fn(),
    getCurrentYear: vi.fn(),
    isEnabled: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({
        user: {
            id: "faculty-1",
            name: "Prof. Cruz",
            email: "cruz@test.local",
            role: "faculty",
            school_id: 1,
        },
    }),
}));

vi.mock("../../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: mocks.isEnabled }),
}));

vi.mock("../../../api/classes", () => ({
    attendanceApi: {
        getFacultySummary: mocks.getFacultySummary,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentYear,
    },
}));

vi.mock("../../../api/client", () => ({
    default: {
        get: mocks.apiGet,
    },
}));

import FacultyDashboard from "../../../pages/faculty/FacultyDashboard";

const CURRENT_CLASS = {
    id: "class-current-1",
    class_name: "Grade 7 - Diamond",
    module_id: "module-1",
    faculty_id: "faculty-1",
    school_year_id: 1,
};

const OLD_CLASS = {
    id: "class-old-1",
    class_name: "Grade 6 - Pearl",
    module_id: "module-2",
    faculty_id: "faculty-1",
    school_year_id: 99,
};

const MODULES = [
    { id: "module-1", title: "Life and Works of Rizal", subject: "Araling Panlipunan" },
    { id: "module-2", title: "Reading Comprehension", subject: "English" },
];

const STUDENTS = [
    { id: "student-1", first_name: "Ana", last_name: "Santos" },
    { id: "student-2", first_name: "Ben", last_name: "Cruz" },
    { id: "student-3", first_name: "Cielo", last_name: "Reyes" },
];

const SUMMARY = {
    today: {
        classes_with_attendance: 1,
        classes_pending: 1,
        total_classes_today: 2,
    },
    this_week: {
        total_sessions: 4,
        total_present: 90,
        total_absent: 10,
        attendance_rate: 90,
    },
};

function mockDashboardData() {
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.apiGet.mockImplementation(async (url: string) => {
        if (url.startsWith("/classes/faculty/")) {
            return { data: { data: [CURRENT_CLASS, OLD_CLASS] } };
        }
        if (url === "/modules/mine") {
            return { data: { data: MODULES } };
        }
        if (url.startsWith("/students/school/")) {
            return { data: { data: STUDENTS } };
        }
        return { data: { data: [] } };
    });
}

describe("FacultyDashboard", () => {
    it("shows the loading placeholders while the dashboard requests are pending", () => {
        mocks.isEnabled.mockReturnValue(true);
        mocks.apiGet.mockReturnValue(new Promise(() => {}));
        mocks.getCurrentYear.mockReturnValue(new Promise(() => {}));
        mocks.getFacultySummary.mockReturnValue(new Promise(() => {}));

        render(<FacultyDashboard />);

        expect(screen.getByRole("heading", { name: "Faculty Dashboard" })).toBeInTheDocument();
        expect(screen.getByText("Prof. Cruz")).toBeInTheDocument();
        expect(screen.getAllByText("...")).toHaveLength(4);
        expect(screen.getByText("Loading attendance summary...")).toBeInTheDocument();
    });

    it("renders the attendance summary, current-year classes, modules and students", async () => {
        mocks.isEnabled.mockReturnValue(true);
        mockDashboardData();
        mocks.getFacultySummary.mockResolvedValue({ data: { data: SUMMARY } });

        render(<FacultyDashboard />);

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.queryByText("Grade 6 - Pearl")).not.toBeInTheDocument();
        expect(screen.getByText("Life and Works of Rizal")).toBeInTheDocument();
        expect(screen.getByText("Reading Comprehension")).toBeInTheDocument();
        expect(screen.getByText("Araling Panlipunan")).toBeInTheDocument();

        expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
        expect(screen.getByText("Recorded").closest(".dash-stat-card")).toHaveTextContent("1");
        expect(screen.getByText("Pending").closest(".dash-stat-card")).toHaveTextContent("1");
        expect(screen.getByText("Total Classes").closest(".dash-stat-card")).toHaveTextContent("2");
        expect(screen.getByText("Attendance Rate").closest(".dash-stat-card")).toHaveTextContent("90%");
    });

    it("skips the attendance summary when the attendance feature is disabled", async () => {
        mocks.isEnabled.mockReturnValue(false);
        mockDashboardData();

        render(<FacultyDashboard />);

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.queryByText("Today's Attendance")).not.toBeInTheDocument();
        expect(screen.queryByText("This Week")).not.toBeInTheDocument();
        expect(mocks.getFacultySummary).not.toHaveBeenCalled();
    });

    it("shows the class and module empty states", async () => {
        mocks.isEnabled.mockReturnValue(false);
        mocks.getCurrentYear.mockResolvedValue({
            data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
        });
        mocks.apiGet.mockImplementation(async (url: string) => {
            if (url === "/modules/mine") return { data: { data: [] } };
            return { data: { data: [] } };
        });

        render(<FacultyDashboard />);

        expect(await screen.findByText("No classes assigned yet.")).toBeInTheDocument();
        expect(screen.getByText("No modules created yet.")).toBeInTheDocument();
    });

    it("falls back to empty lists and attendance error messages when the API fails", async () => {
        mocks.isEnabled.mockReturnValue(true);
        mocks.getCurrentYear.mockRejectedValue(new Error("offline"));
        mocks.apiGet.mockRejectedValue(new Error("offline"));
        mocks.getFacultySummary.mockRejectedValue(new Error("offline"));

        render(<FacultyDashboard />);

        expect(await screen.findByText("Unable to load attendance summary.")).toBeInTheDocument();
        expect(screen.getByText("Unable to load weekly summary.")).toBeInTheDocument();
        expect(screen.getByText("No classes assigned yet.")).toBeInTheDocument();
        expect(screen.getByText("No modules created yet.")).toBeInTheDocument();
    });
});
