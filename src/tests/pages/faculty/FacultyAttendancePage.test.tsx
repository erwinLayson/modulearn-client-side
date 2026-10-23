import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TODAY = new Date().toISOString().slice(0, 10);

const mocks = vi.hoisted(() => ({
    user: {
        id: "faculty-1",
        name: "Prof. Cruz",
        email: "cruz@test.local",
        role: "faculty",
        school_id: 1,
    },
    state: { history: [] as Array<Record<string, unknown>>, sessionCreated: false },
    getAssignedClasses: vi.fn(),
    getClassSessions: vi.fn(),
    getAttendance: vi.fn(),
    createAttendanceSession: vi.fn(),
    editAttendance: vi.fn(),
    getHistory: vi.fn(),
    getByClassAndSchoolYear: vi.fn(),
    getCurrentYear: vi.fn(),
    getPeriods: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getAssignedClasses: mocks.getAssignedClasses,
        getClassSessions: mocks.getClassSessions,
        getAttendance: mocks.getAttendance,
        createAttendanceSession: mocks.createAttendanceSession,
        editAttendance: mocks.editAttendance,
    },
    attendanceApi: {
        getHistory: mocks.getHistory,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getByClassAndSchoolYear: mocks.getByClassAndSchoolYear,
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

import FacultyAttendancePage from "../../../pages/faculty/FacultyAttendancePage";

const CLASS_ASSIGNMENT = {
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
    subjects: [{ id: "subject-1", name: "English 7" }],
};

const ENROLLMENT = {
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
};

const SESSION = {
    id: 1,
    class_id: "class-1",
    subject_id: "subject-1",
    attendance_date: `${TODAY}T00:00:00.000Z`,
    period_id: 10,
    period_name: "First Quarter",
    created_by: "faculty-1",
    created_at: `${TODAY}T08:00:00.000Z`,
};

const ATTENDANCE_RECORDS = [
    {
        student_id: "student-1",
        subject_id: "subject-1",
        status: "present",
        recorded_at: `${TODAY}T08:00:00.000Z`,
        marked_by: "faculty-1",
    },
];

const HISTORY_ITEM = {
    attendance_date: "2026-03-15T00:00:00.000Z",
    class_id: "class-1",
    class_name: "Grade 7 - Diamond",
    subject_id: "subject-1",
    subject_name: "English 7",
    present_count: 1,
    absent_count: 0,
    total_count: 1,
};

const HISTORY_DATE_LABEL = new Date("2026-03-15T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
});

const PERIODS = [
    {
        id: 10,
        name: "First Quarter",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
    },
];

function openClassCard(user: ReturnType<typeof userEvent.setup>) {
    return user.click(screen.getByText("Grade 7 - Diamond"));
}

beforeEach(() => {
    mocks.state.history = [];
    mocks.state.sessionCreated = false;
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getPeriods.mockResolvedValue({ data: { data: PERIODS } });
    mocks.getAssignedClasses.mockResolvedValue({ data: { data: [CLASS_ASSIGNMENT] } });
    mocks.getByClassAndSchoolYear.mockResolvedValue({ data: { data: [ENROLLMENT] } });
    mocks.getClassSessions.mockImplementation(async () => ({
        data: { data: mocks.state.sessionCreated ? [SESSION] : [] },
    }));
    mocks.getAttendance.mockResolvedValue({ data: { data: ATTENDANCE_RECORDS } });
    mocks.createAttendanceSession.mockImplementation(async () => {
        mocks.state.sessionCreated = true;
        return { data: { message: "created", isOk: true } };
    });
    mocks.editAttendance.mockResolvedValue({ data: { message: "saved", isOk: true } });
    mocks.getHistory.mockImplementation(async (filters: { date_from?: string } = {}) => {
        const items = filters.date_from
            ? mocks.state.history.filter(
                (h) => String(h.attendance_date).slice(0, 10) === filters.date_from
            )
            : mocks.state.history;
        return { data: { data: { data: items } } };
    });
});

async function openCreateModal(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Create Attendance" }));
    const heading = await screen.findByRole("heading", { name: "Create Attendance" });
    const modal = heading.parentElement!.parentElement as HTMLElement;

    const subjectSelect = within(modal).getByRole("option", { name: "Select subject" }).closest("select") as HTMLSelectElement;
    await user.selectOptions(subjectSelect, "subject-1");

    await within(modal).findByRole("option", { name: /First Quarter/ });
    const selects = within(modal).getAllByRole("combobox");
    const periodSelect = selects[selects.length - 1];
    await user.selectOptions(periodSelect, "10");

    return modal;
}

describe("FacultyAttendancePage", () => {
    it("shows the loading state while classes are fetched", () => {
        mocks.getAssignedClasses.mockReturnValue(new Promise(() => {}));

        render(<FacultyAttendancePage />);

        expect(screen.getByRole("heading", { name: "Attendance" })).toBeInTheDocument();
        expect(screen.getAllByText("Loading...").length).toBeGreaterThanOrEqual(1);
    });

    it("lists assigned classes, opens a class and switches to the attendance history", async () => {
        const user = userEvent.setup();
        mocks.state.history = [HISTORY_ITEM];

        render(<FacultyAttendancePage />);

        expect(await screen.findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.getByText("Open Class")).toBeInTheDocument();

        await openClassCard(user);

        expect(await screen.findByRole("heading", { level: 1, name: "Grade 7 - Diamond" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Attendance" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Attendance History" })).toBeInTheDocument();
        expect(screen.getByText("Attendance Spreadsheet")).toBeInTheDocument();
        expect(screen.getByText("Sessions")).toBeInTheDocument();
        expect(screen.getByText("Students")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Attendance History" }));

        expect(await screen.findByText(HISTORY_DATE_LABEL)).toBeInTheDocument();
        expect(screen.getByText("Clear Filters")).toBeInTheDocument();
        expect(screen.getByText("CLASS RATE")).toBeInTheDocument();
    });

    it("creates an attendance session, marks a student absent and saves", async () => {
        const user = userEvent.setup();

        render(<FacultyAttendancePage />);
        await screen.findByText("Grade 7 - Diamond");
        await openClassCard(user);

        expect(await screen.findByText("No attendance records yet.")).toBeInTheDocument();

        const modal = await openCreateModal(user);
        await user.click(within(modal).getByRole("button", { name: "Create Session" }));

        expect(mocks.createAttendanceSession).toHaveBeenCalledWith({
            class_id: "class-1",
            subject_id: "subject-1",
            date: TODAY,
            period_id: 10,
        });
        expect(
            await screen.findByText("Session created — mark attendance, then click Save Attendance")
        ).toBeInTheDocument();

        expect(await screen.findByText("Ana Santos")).toBeInTheDocument();
        const cell = document.querySelector(".att-cell-input") as HTMLInputElement;
        expect(cell).toHaveValue("1");

        fireEvent.change(cell, { target: { value: "0" } });
        expect(cell).toHaveValue("0");
        await user.click(screen.getByRole("button", { name: "Save Attendance" }));

        expect(mocks.editAttendance).toHaveBeenCalledWith("class-1", {
            records: [{ student_id: "student-1", status: "absent" }],
            date: TODAY,
            subject_id: "subject-1",
        });
        expect(await screen.findByText("Attendance saved successfully")).toBeInTheDocument();
    });

    it("rejects a duplicate attendance session for the same subject and date", async () => {
        const user = userEvent.setup();
        mocks.getClassSessions.mockResolvedValue({ data: { data: [SESSION] } });

        render(<FacultyAttendancePage />);
        await screen.findByText("Grade 7 - Diamond");
        await openClassCard(user);

        expect(await screen.findByText("Ana Santos")).toBeInTheDocument();

        const modal = await openCreateModal(user);
        await user.click(within(modal).getByRole("button", { name: "Create Session" }));

        expect(
            await screen.findByText(
                `Attendance for this subject on ${TODAY} already exists. Edit the existing session instead.`
            )
        ).toBeInTheDocument();
        expect(mocks.createAttendanceSession).not.toHaveBeenCalled();
    });

    it("shows the empty state when no classes are assigned", async () => {
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: [] } });

        render(<FacultyAttendancePage />);

        expect(await screen.findByText("No classes assigned to you.")).toBeInTheDocument();
    });

    it("shows the load error and retries the class request", async () => {
        const user = userEvent.setup();
        mocks.getAssignedClasses.mockRejectedValue({
            response: { data: { message: "Network down" } },
        });

        render(<FacultyAttendancePage />);

        const messages = await screen.findAllByText("Network down");
        expect(messages.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Couldn't load your assigned classes")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retry" }));
        await waitFor(() => expect(mocks.getAssignedClasses).toHaveBeenCalledTimes(2));
    });
});
