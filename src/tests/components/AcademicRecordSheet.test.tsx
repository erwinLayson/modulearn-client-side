import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AcademicRecordSheet, {
    formatDate,
    formatGrade,
} from "../../components/AcademicRecordSheet";
import type { AcademicRecordResponse } from "../../api/students";

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
                { id: 1, name: "Q1", period_number: 1, start_date: "2025-06-01", end_date: "2025-08-31" },
                { id: 2, name: "Q2", period_number: 2, start_date: "2025-09-01", end_date: "2025-11-30" },
            ],
            subjects: [
                {
                    subject_id: "sub-1",
                    subject_name: "English 7",
                    grades: [
                        { period_id: 1, final_grade: 88 },
                        { period_id: 2, final_grade: null },
                    ],
                    final_grade: 91.5,
                },
            ],
        },
    ],
};

describe("AcademicRecordSheet", () => {
    it("renders the school header, student details and grade table", () => {
        render(<AcademicRecordSheet record={RECORD} />);

        expect(screen.getByText("Springfield National High School")).toBeInTheDocument();
        expect(screen.getByText(/12 Main St, Calamba, Laguna, Region IV-A/)).toBeInTheDocument();
        expect(screen.getByText(/Maria Cruz Santos Jr\./)).toBeInTheDocument();
        expect(screen.getByText("123456789012")).toBeInTheDocument();
        expect(screen.getByText("School Year 2025-2026")).toBeInTheDocument();
        expect(screen.getByText(/Grade 7 - Diamond/)).toBeInTheDocument();
        expect(screen.getByText("English 7")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Q1" })).toBeInTheDocument();
        expect(screen.getByText("88.00")).toBeInTheDocument();
        expect(screen.getByText("91.50")).toBeInTheDocument();
    });

    it("shows empty states when there are no records or subjects", () => {
        render(
            <AcademicRecordSheet
                record={{
                    ...RECORD,
                    records: [
                        {
                            ...RECORD.records[0],
                            subjects: [],
                        },
                    ],
                }}
            />
        );
        expect(
            screen.getByText("No subjects recorded for this school year.")
        ).toBeInTheDocument();

        render(<AcademicRecordSheet record={{ ...RECORD, records: [] }} />);
        expect(
            screen.getByText("No enrollment records for the selected scope.")
        ).toBeInTheDocument();
    });
});

describe("academic record formatters", () => {
    it("formats grades to two decimals and null as a dash", () => {
        expect(formatGrade(90)).toBe("90.00");
        expect(formatGrade(88.456)).toBe("88.46");
        expect(formatGrade(null)).toBe("—");
    });

    it("formats valid dates, keeps invalid input and handles missing dates", () => {
        expect(formatDate("2012-05-14")).toContain("2012");
        expect(formatDate("not-a-date")).toBe("not-a-date");
        expect(formatDate(null)).toBe("—");
    });
});
