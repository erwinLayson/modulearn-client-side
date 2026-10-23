import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AttendanceReport from "../../../pages/school_admin/AttendanceReport";

const mocks = vi.hoisted(() => ({
    getClasses: vi.fn(),
    getSubjects: vi.fn(),
    getFaculties: vi.fn(),
    getSchoolMatrix: vi.fn(),
    writeFile: vi.fn(),
    aoaToSheet: vi.fn(() => ({})),
    bookNew: vi.fn(() => ({})),
    bookAppendSheet: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({
        user: {
            id: "admin-1",
            name: "Admin User",
            email: "admin@test.local",
            role: "school_admin",
            school_id: 1,
            school_name: "Springfield High",
        },
    }),
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getBySchoolId: mocks.getClasses,
    },
    attendanceApi: {
        getSchoolMatrix: mocks.getSchoolMatrix,
    },
}));

vi.mock("../../../api/subjects", () => ({
    subjectApi: {
        getBySchoolId: mocks.getSubjects,
    },
}));

vi.mock("../../../api/client", () => ({
    default: {
        get: mocks.getFaculties,
    },
}));

vi.mock("xlsx", () => ({
    utils: {
        aoa_to_sheet: mocks.aoaToSheet,
        book_new: mocks.bookNew,
        book_append_sheet: mocks.bookAppendSheet,
    },
    writeFile: mocks.writeFile,
}));

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const ATTENDANCE_DATE = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}-15`;

const CLASSES = [
    {
        id: "class-1",
        class_name: "Grade 7",
        section: "Diamond",
        grade_level: "Grade 7",
    },
];

const SUBJECTS = [{ id: "subject-1", name: "English 7" }];

const FACULTIES = [{ id: "faculty-1", first_name: "Ada", last_name: "Lovelace" }];

const MATRIX = {
    school_year_name: "2025-2026",
    data: [
        {
            class_id: "class-1",
            class_name: "Grade 7",
            section: "Diamond",
            grade_level: "Grade 7",
            subject_id: "subject-1",
            subject_name: "English 7",
            teacher_name: "Ada Lovelace",
            total_enrolled: 20,
            attendance_date: ATTENDANCE_DATE,
            present_count: 18,
            absent_count: 2,
        },
    ],
};

function setupReferenceData() {
    mocks.getClasses.mockResolvedValue({ data: { data: CLASSES } });
    mocks.getSubjects.mockResolvedValue({ data: { data: SUBJECTS } });
    mocks.getFaculties.mockResolvedValue({ data: { data: FACULTIES } });
    mocks.getSchoolMatrix.mockResolvedValue({ data: { data: MATRIX } });
}

describe("AttendanceReport", () => {
    it("loads the classroom matrix and renders summary counters", async () => {
        setupReferenceData();
        render(<AttendanceReport />);

        expect(
            screen.getByRole("heading", { name: "Classroom Attendance History" })
        ).toBeInTheDocument();

        expect(await screen.findByText("18/20")).toBeInTheDocument();
        expect(screen.getAllByText("Diamond").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("English 7").length).toBeGreaterThanOrEqual(1);
        expect(
            screen.getByText("18", { selector: ".attn-summary__value--present" })
        ).toBeInTheDocument();
        expect(screen.getByText("90.0%")).toBeInTheDocument();
        expect(mocks.getSchoolMatrix).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                year: CURRENT_YEAR,
                month: CURRENT_MONTH,
            })
        );
    });

    it("applies grade, month and search filters", async () => {
        const user = userEvent.setup();
        setupReferenceData();
        render(<AttendanceReport />);

        await screen.findByText("18/20");

        const selects = screen.getAllByRole("combobox");
        await user.selectOptions(selects[1], "Grade 7");

        await waitFor(() =>
            expect(mocks.getSchoolMatrix).toHaveBeenLastCalledWith(
                1,
                expect.objectContaining({ grade_level: "Grade 7" })
            )
        );

        const nextMonth = CURRENT_MONTH === 12 ? 1 : CURRENT_MONTH + 1;
        await user.selectOptions(selects[5], String(nextMonth));

        await waitFor(() =>
            expect(mocks.getSchoolMatrix).toHaveBeenLastCalledWith(
                1,
                expect.objectContaining({ month: String(nextMonth) })
            )
        );

        await user.type(
            screen.getByPlaceholderText("Search section or subject…"),
            "Mathematics"
        );

        expect(
            await screen.findByText(
                "No attendance records found for the selected filters."
            )
        ).toBeInTheDocument();
    });

    it("shows the empty state when no matrix rows are returned", async () => {
        setupReferenceData();
        mocks.getSchoolMatrix.mockResolvedValue({
            data: { data: { school_year_name: "2025-2026", data: [] } },
        });
        render(<AttendanceReport />);

        expect(
            await screen.findByText(
                "No attendance records found for the selected filters."
            )
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
    });

    it("shows an error toast when the matrix cannot be loaded", async () => {
        setupReferenceData();
        mocks.getSchoolMatrix.mockRejectedValue(new Error("network"));
        render(<AttendanceReport />);

        expect(
            await screen.findByText("Failed to load attendance history")
        ).toBeInTheDocument();
        expect(
            screen.getByText("No attendance records found for the selected filters.")
        ).toBeInTheDocument();
    });

    it("exports the displayed matrix as an XLSX workbook", async () => {
        const user = userEvent.setup();
        setupReferenceData();
        render(<AttendanceReport />);

        await screen.findByText("18/20");
        await user.click(screen.getByRole("button", { name: "Export" }));

        expect(mocks.aoaToSheet).toHaveBeenCalled();
        expect(mocks.bookNew).toHaveBeenCalled();
        expect(mocks.bookAppendSheet).toHaveBeenCalled();
        expect(mocks.writeFile).toHaveBeenCalledWith(
            expect.anything(),
            `attendance-history-${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}.xlsx`
        );
    });
});
