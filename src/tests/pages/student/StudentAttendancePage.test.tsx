import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    user: { id: "student-1", name: "Ada Student", school_id: 1, role: "student" },
    getCurrent: vi.fn(),
    getStudentBySubject: vi.fn(),
    getAllStudentRecords: vi.fn(),
    getPeriods: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrent,
    },
}));

vi.mock("../../../api/classes", () => ({
    attendanceApi: {
        getStudentBySubject: mocks.getStudentBySubject,
        getAllStudentRecords: mocks.getAllStudentRecords,
    },
}));

vi.mock("../../../api/academicPeriods", () => ({
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getPeriods,
    },
}));

import StudentAttendancePage from "../../../pages/student/StudentAttendancePage";

const SCHOOL_YEAR = {
    id: 1,
    name: "2025-2026",
    start_date: "2025-06-01",
    end_date: "2026-04-30",
    school_id: 1,
    is_current: 1,
};

const SUBJECTS = [
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

const RECORDS = [
    {
        subject_id: "subject-1",
        subject_name: "English 7",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Ms. Santos",
        attendance_date: "2026-03-10",
        status: "present" as const,
    },
    {
        subject_id: "subject-2",
        subject_name: "Mathematics 7",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Mr. Cruz",
        attendance_date: "2026-03-10",
        status: "absent" as const,
    },
    {
        subject_id: "subject-1",
        subject_name: "English 7",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Ms. Santos",
        attendance_date: "2026-03-11",
        status: "present" as const,
    },
    {
        subject_id: "subject-2",
        subject_name: "Mathematics 7",
        class_name: "Grade 7 - Diamond",
        teacher_name: "Mr. Cruz",
        attendance_date: "2026-03-11",
        status: "present" as const,
    },
];

function recordsResponse(records: typeof RECORDS) {
    return { data: { data: { data: records } } };
}

describe("StudentAttendancePage", () => {
    beforeEach(() => {
        mocks.getCurrent.mockResolvedValue({ data: { data: SCHOOL_YEAR } });
        mocks.getStudentBySubject.mockResolvedValue({ data: { data: SUBJECTS } });
        mocks.getAllStudentRecords.mockResolvedValue(recordsResponse(RECORDS));
        mocks.getPeriods.mockResolvedValue({ data: { data: [] } });
    });

    it("shows the loading state while attendance is being loaded", () => {
        mocks.getCurrent.mockReturnValue(new Promise(() => {}));

        render(<StudentAttendancePage />);

        expect(screen.getByRole("heading", { name: "My Attendance" })).toBeInTheDocument();
        expect(screen.getAllByText("Loading...").length).toBeGreaterThanOrEqual(1);
    });

    it("renders per-subject rates, overall totals and the attendance matrix", async () => {
        render(<StudentAttendancePage />);

        expect(await screen.findByText("2 subjects")).toBeInTheDocument();

        expect(screen.getByText("Total Sessions")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("Present")).toBeInTheDocument();
        expect(screen.getByText("27")).toBeInTheDocument();
        expect(screen.getByText("Absent")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("Overall Rate")).toBeInTheDocument();
        expect(screen.getByText("90%")).toBeInTheDocument();

        expect(await screen.findByText("Mar 10")).toBeInTheDocument();
        expect(screen.getByText("Tue")).toBeInTheDocument();
        expect(screen.getByText("Mar 11")).toBeInTheDocument();

        expect(screen.getAllByText("English 7").length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText("Mathematics 7").length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText("Ms. Santos")).toBeInTheDocument();
        expect(screen.getByText("Mr. Cruz")).toBeInTheDocument();
        expect(screen.getAllByText("P")).toHaveLength(3);
        expect(screen.getAllByText("A")).toHaveLength(1);
    });

    it("shows the records empty state when no sessions have been recorded", async () => {
        mocks.getAllStudentRecords.mockResolvedValue(recordsResponse([]));

        render(<StudentAttendancePage />);

        expect(await screen.findByText("No attendance records found.")).toBeInTheDocument();
        expect(screen.getByText("2 subjects")).toBeInTheDocument();
        expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    });

    it("filters the records by subject and clears the filters", async () => {
        const user = userEvent.setup();
        mocks.getAllStudentRecords.mockImplementation(async (filters: { subject_id?: string }) => {
            const records = filters.subject_id
                ? RECORDS.filter((record) => record.subject_id === filters.subject_id)
                : RECORDS;
            return recordsResponse(records);
        });

        render(<StudentAttendancePage />);

        expect(await screen.findByText("Ms. Santos")).toBeInTheDocument();

        await user.selectOptions(screen.getByDisplayValue("All Subjects"), "subject-1");

        await waitFor(() =>
            expect(mocks.getAllStudentRecords).toHaveBeenLastCalledWith({
                limit: 500,
                subject_id: "subject-1",
            })
        );
        await waitFor(() => expect(screen.queryByText("Mr. Cruz")).not.toBeInTheDocument());
        expect(screen.getByText("Ms. Santos")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Clear Filters" }));

        await waitFor(() =>
            expect(mocks.getAllStudentRecords).toHaveBeenLastCalledWith({ limit: 500 })
        );
        expect(await screen.findByText("Mr. Cruz")).toBeInTheDocument();
        expect(screen.getByText("Ms. Santos")).toBeInTheDocument();
    });

    it("shows the empty state when no attendance subjects are returned", async () => {
        mocks.getStudentBySubject.mockResolvedValue({ data: { data: [] } });

        render(<StudentAttendancePage />);

        const emptyMessages = await screen.findAllByText("No attendance records yet.");
        expect(emptyMessages.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText("Your attendance will appear here once your teachers record it.")).toBeInTheDocument();
    });

    it("falls back to the empty state when the subject attendance request fails", async () => {
        mocks.getStudentBySubject.mockRejectedValue(new Error("attendance unavailable"));
        mocks.getAllStudentRecords.mockRejectedValue(new Error("records unavailable"));

        render(<StudentAttendancePage />);

        const emptyMessages = await screen.findAllByText("No attendance records yet.");
        expect(emptyMessages.length).toBeGreaterThanOrEqual(2);
        expect(screen.queryByText("attendance unavailable")).not.toBeInTheDocument();
        expect(screen.queryByText("records unavailable")).not.toBeInTheDocument();
    });
});
