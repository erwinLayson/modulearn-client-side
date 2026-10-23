import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FinalizationsPage from "../../../pages/school_admin/FinalizationsPage";

const mocks = vi.hoisted(() => ({
    getCurrentSchoolYear: vi.fn(),
    getClasses: vi.fn(),
    getPeriods: vi.fn(),
    getFaculties: vi.fn(),
    getFinalizations: vi.fn(),
    finalizeGrades: vi.fn(),
    correctFinalization: vi.fn(),
    getApiErrorMessage: vi.fn(),
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
        getFaculties: mocks.getFaculties,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentSchoolYear,
    },
}));

vi.mock("../../../api/academicPeriods", () => ({
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getPeriods,
    },
}));

vi.mock("../../../api/gradebook", () => ({
    gradebookApi: {
        getFinalizations: mocks.getFinalizations,
        finalizeGrades: mocks.finalizeGrades,
        correctFinalization: mocks.correctFinalization,
    },
}));

vi.mock("../../../api/client", () => ({
    getApiErrorMessage: mocks.getApiErrorMessage,
}));

const CLASSES = [
    {
        id: "class-1",
        class_name: "Grade 7",
        section: "Diamond",
        grade_level: "Grade 7",
    },
];

const FACULTIES = [
    {
        id: "faculty-1",
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@test.local",
        subject_id: "subject-1",
        subject_name: "English 7",
    },
];

const PERIODS = [
    {
        id: 1,
        school_id: 1,
        school_year_id: 1,
        name: "Q1",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
        is_current: 1,
    },
];

const FINALIZATIONS = [
    {
        id: 10,
        period_id: 1,
        student_id: "student-1",
        student_name: "Maria Santos",
        student_lrn: "123456789012",
        final_grade: 88.5,
        finalized_at: "2026-03-01T10:00:00Z",
        updated_at: null,
        correction_reason: null,
    },
];

function setupDefaults() {
    mocks.getCurrentSchoolYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getClasses.mockResolvedValue({ data: { data: CLASSES } });
    mocks.getPeriods.mockResolvedValue({ data: { data: PERIODS } });
    mocks.getFaculties.mockResolvedValue({ data: { data: FACULTIES } });
    mocks.getFinalizations.mockResolvedValue({ data: { data: FINALIZATIONS } });
    mocks.finalizeGrades.mockResolvedValue({
        data: { data: { finalized_count: 2 } },
    });
    mocks.correctFinalization.mockResolvedValue({ data: { message: "ok" } });
    mocks.getApiErrorMessage.mockImplementation(
        (_error: unknown, fallback: string) => fallback
    );
}

async function selectClassAndSubject(
    user: ReturnType<typeof userEvent.setup>,
    expectRow = true
) {
    await user.selectOptions(
        await screen.findByDisplayValue("Select a class"),
        "class-1"
    );
    if (expectRow) {
        expect(await screen.findByText("Maria Santos")).toBeInTheDocument();
    }
}

beforeEach(() => {
    setupDefaults();
});

describe("FinalizationsPage", () => {
    it("shows a loading state and then the selection controls", async () => {
        let resolveYear!: (value: unknown) => void;
        mocks.getCurrentSchoolYear.mockReturnValue(
            new Promise((resolve) => {
                resolveYear = resolve;
            })
        );

        render(<FinalizationsPage />);
        expect(screen.getByText("Loading finalizations...")).toBeInTheDocument();

        await act(async () => {
            resolveYear({
                data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
            });
        });

        expect(
            await screen.findByRole("heading", { name: "Finalizations" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("option", { name: "Grade 7 · Diamond" })
        ).toBeInTheDocument();
        expect(
            screen.getByText("Select a class and subject to view finalized grades.")
        ).toBeInTheDocument();
    });

    it("loads and displays finalized grades for the selected class and subject", async () => {
        const user = userEvent.setup();
        render(<FinalizationsPage />);

        await selectClassAndSubject(user);

        expect(screen.getByRole("cell", { name: "Maria Santos" })).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument();
        expect(screen.getByText("Passed")).toBeInTheDocument();
        expect(screen.getAllByText("Q1").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("1 finalized record")).toBeInTheDocument();
        expect(mocks.getFinalizations).toHaveBeenCalledWith(
            "class-1",
            "subject-1"
        );
    });

    it("validates the correction reason and the 0-100 grade range", async () => {
        const user = userEvent.setup();
        render(<FinalizationsPage />);
        await selectClassAndSubject(user);

        await user.click(
            screen.getByRole("button", { name: "Correct finalized grade" })
        );
        expect(
            screen.getByRole("heading", { name: "Correct Finalized Grade" })
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Save Correction" }));
        expect(
            await screen.findByText("Correction reason is required")
        ).toBeInTheDocument();
        expect(mocks.correctFinalization).not.toHaveBeenCalled();

        const gradeInput = screen.getByDisplayValue("88.5");
        await user.clear(gradeInput);
        await user.type(gradeInput, "150");
        await user.type(
            screen.getByPlaceholderText(
                "Explain why this finalized grade is being changed"
            ),
            "Encoding error"
        );
        await user.click(screen.getByRole("button", { name: "Save Correction" }));

        expect(
            await screen.findByText("Final grade must be between 0 and 100")
        ).toBeInTheDocument();
        expect(mocks.correctFinalization).not.toHaveBeenCalled();
    });

    it("saves a valid correction and refreshes the list", async () => {
        const user = userEvent.setup();
        render(<FinalizationsPage />);
        await selectClassAndSubject(user);

        await user.click(
            screen.getByRole("button", { name: "Correct finalized grade" })
        );
        const gradeInput = screen.getByDisplayValue("88.5");
        await user.clear(gradeInput);
        await user.type(gradeInput, "90");
        await user.type(
            screen.getByPlaceholderText(
                "Explain why this finalized grade is being changed"
            ),
            "Encoding error"
        );
        await user.click(screen.getByRole("button", { name: "Save Correction" }));

        expect(
            await screen.findByText("Finalized grade corrected successfully")
        ).toBeInTheDocument();
        expect(mocks.correctFinalization).toHaveBeenCalledWith(10, {
            final_grade: 90,
            reason: "Encoding error",
        });
        await waitFor(() =>
            expect(mocks.getFinalizations).toHaveBeenCalledTimes(2)
        );
    });

    it("finalizes year-end grades from the modal", async () => {
        const user = userEvent.setup();
        render(<FinalizationsPage />);
        await selectClassAndSubject(user);

        await user.click(screen.getByRole("button", { name: "Finalize Grades" }));
        expect(
            screen.getByRole("heading", { name: "Finalize Grades" })
        ).toBeInTheDocument();

        await user.selectOptions(
            screen.getByDisplayValue("Academic Period"),
            "year-end"
        );

        const finalizeButtons = screen.getAllByRole("button", {
            name: "Finalize Grades",
        });
        await user.click(finalizeButtons[finalizeButtons.length - 1]);

        expect(
            await screen.findByText("Finalized 2 grades successfully")
        ).toBeInTheDocument();
        expect(mocks.finalizeGrades).toHaveBeenCalledWith({
            class_id: "class-1",
            subject_id: "subject-1",
            period_id: null,
        });
    });

    it("shows the API error message when finalizations cannot be loaded", async () => {
        const user = userEvent.setup();
        mocks.getFinalizations.mockRejectedValue(new Error("network"));
        render(<FinalizationsPage />);
        await selectClassAndSubject(user, false);

        expect(
            await screen.findByText("Failed to load finalizations")
        ).toBeInTheDocument();
        expect(
            screen.getByText(/No finalized grades found for this selection/)
        ).toBeInTheDocument();
    });
});
