import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import StudentAcademicRecordPage from "../../../pages/school_admin/StudentAcademicRecordPage";
import type { AcademicRecordResponse } from "../../../api/students";

const mocks = vi.hoisted(() => ({
    getAcademicRecord: vi.fn(),
}));

vi.mock("../../../api/students", () => ({
    studentApi: {
        getAcademicRecord: mocks.getAcademicRecord,
    },
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

const RECORD: AcademicRecordResponse = {
    student: {
        id: "student-1",
        first_name: "Maria",
        middle_name: "Cruz",
        last_name: "Santos",
        extension_name: "Jr.",
        lrn: "123456789012",
        email: "maria@test.local",
        sex: "female",
        date_of_birth: "2012-05-14",
    },
    school: {
        school_id: 1,
        school_name: "Springfield National High School",
        address: "12 Main St",
        region: "Region IV-A",
        province: "Laguna",
        city: "Calamba",
        contact_number: "09170000000",
        school_logo: "/logo.png",
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
                grade_level: 7,
                section: "Diamond",
                class_name: "Grade 7 - Diamond",
                adviser_name: "Ms. Reyes",
                status: "active",
            },
            periods: [
                {
                    id: 1,
                    name: "Q1",
                    period_number: 1,
                    start_date: "2025-06-01",
                    end_date: "2025-08-31",
                },
            ],
            subjects: [
                {
                    subject_id: "sub-1",
                    subject_name: "English 7",
                    grades: [{ period_id: 1, final_grade: 88 }],
                    final_grade: 91.5,
                },
            ],
        },
    ],
};

const ALL_RECORD: AcademicRecordResponse = {
    ...RECORD,
    records: [
        {
            ...RECORD.records[0],
            school_year: {
                id: 2,
                name: "2024-2025",
                start_date: "2024-06-01",
                end_date: "2025-03-31",
                is_current: 0,
            },
        },
    ],
};

function renderPage(route = "/dashboard/students/student-1/academic-record") {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route
                    path="/dashboard/students/:studentId/academic-record"
                    element={<StudentAcademicRecordPage />}
                />
                <Route
                    path="/dashboard/students"
                    element={<div>Students page</div>}
                />
                <Route
                    path="/dashboard/classes"
                    element={<div>Classes page</div>}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("StudentAcademicRecordPage", () => {
    it("loads and renders the real academic record sheet", async () => {
        mocks.getAcademicRecord.mockResolvedValue({
            data: { data: RECORD },
        });
        renderPage();

        expect(
            screen.getByRole("heading", { name: "Student Academic Record" })
        ).toBeInTheDocument();
        expect(
            await screen.findByText("Springfield National High School")
        ).toBeInTheDocument();
        expect(screen.getByText(/Maria Cruz Santos Jr\./)).toBeInTheDocument();
        expect(screen.getByText("123456789012")).toBeInTheDocument();
        expect(screen.getByText("School Year 2025-2026")).toBeInTheDocument();
        expect(screen.getByText("English 7")).toBeInTheDocument();
        expect(screen.getByText("88.00")).toBeInTheDocument();
        expect(screen.getByText("91.50")).toBeInTheDocument();
        expect(mocks.getAcademicRecord).toHaveBeenCalledWith(
            "student-1",
            "current"
        );
    });

    it("switches between the current and all-year scopes", async () => {
        const user = userEvent.setup();
        mocks.getAcademicRecord
            .mockResolvedValueOnce({ data: { data: RECORD } })
            .mockResolvedValueOnce({ data: { data: ALL_RECORD } });
        renderPage();

        await screen.findByText("School Year 2025-2026");
        await user.click(screen.getByRole("button", { name: "All Years" }));

        await waitFor(() =>
            expect(mocks.getAcademicRecord).toHaveBeenLastCalledWith(
                "student-1",
                "all"
            )
        );
        expect(
            await screen.findByText("School Year 2024-2025")
        ).toBeInTheDocument();
    });

    it("prints the record", async () => {
        const user = userEvent.setup();
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
        mocks.getAcademicRecord.mockResolvedValue({
            data: { data: RECORD },
        });
        renderPage();

        await screen.findByText("School Year 2025-2026");
        await user.click(screen.getByRole("button", { name: "Print" }));

        expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it("shows an error toast and the empty state when loading fails", async () => {
        mocks.getAcademicRecord.mockRejectedValue(new Error("network"));
        renderPage();

        expect(
            await screen.findByText("Failed to load academic record")
        ).toBeInTheDocument();
        expect(
            screen.getByText("No academic record found for this student.")
        ).toBeInTheDocument();
    });

    it("shows the empty state when the API returns no record", async () => {
        mocks.getAcademicRecord.mockResolvedValue({ data: { data: null } });
        renderPage();

        expect(
            await screen.findByText("No academic record found for this student.")
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Failed to load academic record")
        ).not.toBeInTheDocument();
    });
});
