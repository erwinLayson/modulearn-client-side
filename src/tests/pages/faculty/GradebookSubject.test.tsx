import { act, render, screen, within } from "@testing-library/react";
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
    getWeights: vi.fn(),
    updateWeights: vi.fn(),
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    getGrades: vi.fn(),
    upsertGrades: vi.fn(),
    finalizeGrades: vi.fn(),
    getFinalizations: vi.fn(),
    getCurrentYear: vi.fn(),
    resolveCurrentPeriodId: vi.fn(),
    getPeriods: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../../../api/gradebook", () => ({
    gradebookApi: {
        getWeights: mocks.getWeights,
        updateWeights: mocks.updateWeights,
        getItems: mocks.getItems,
        createItem: mocks.createItem,
        updateItem: mocks.updateItem,
        deleteItem: mocks.deleteItem,
        getGrades: mocks.getGrades,
        upsertGrades: mocks.upsertGrades,
        finalizeGrades: mocks.finalizeGrades,
        getFinalizations: mocks.getFinalizations,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getCurrent: mocks.getCurrentYear,
    },
}));

vi.mock("../../../api/academicPeriods", () => ({
    resolveCurrentPeriodId: mocks.resolveCurrentPeriodId,
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getPeriods,
        getCurrent: vi.fn().mockResolvedValue({ data: { data: null } }),
    },
}));

import GradebookSubject from "../../../pages/faculty/GradebookSubject";

const WEIGHTS = [
    { id: 1, category: "activities", weight: 30 },
    { id: 2, category: "quizzes", weight: 30 },
    { id: 3, category: "exams", weight: 30 },
    { id: 4, category: "attendance", weight: 10 },
];

const ITEMS = [
    {
        id: "item-1",
        class_id: "class-1",
        subject_id: "subject-1",
        faculty_id: "faculty-1",
        category: "activities",
        title: "Quiz 1",
        max_score: 20,
        due_date: "2026-03-15",
        period_id: 10,
        created_at: "2026-03-01T00:00:00.000Z",
    },
    {
        id: "item-2",
        class_id: "class-1",
        subject_id: "subject-1",
        faculty_id: "faculty-1",
        category: "quizzes",
        title: "Long Quiz",
        max_score: 50,
        due_date: null,
        period_id: 10,
        created_at: "2026-03-02T00:00:00.000Z",
    },
];

const GRADES = {
    class: { id: "class-1", name: "Grade 7 - Diamond", section: "Diamond", grade_level: "Grade 7" },
    subject: { id: "subject-1", name: "English 7" },
    weights: WEIGHTS.map(w => ({ category: w.category, weight: w.weight })),
    items: ITEMS.map(i => ({
        id: i.id,
        category: i.category,
        title: i.title,
        max_score: i.max_score,
        due_date: i.due_date,
        period_id: i.period_id,
    })),
    students: [
        {
            student_id: "student-1",
            student_name: "Ana Santos",
            student_email: "ana@test.local",
            lrn: "123456",
            items: [
                { id: "item-1", category: "activities", title: "Quiz 1", max_score: 20, score: 18 },
                { id: "item-2", category: "quizzes", title: "Long Quiz", max_score: 50, score: 45 },
            ],
            attendance_rate: 95,
            final_grade: 88.5,
        },
    ],
};

const FINALIZATION = {
    id: 1,
    period_id: 10,
    student_id: "student-1",
    student_name: "Ana Santos",
    student_lrn: "123456",
    final_grade: 88.5,
    finalized_at: "2026-03-20T00:00:00.000Z",
    updated_at: null,
    correction_reason: null,
};

const PERIODS = [
    {
        id: 10,
        name: "First Quarter",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
    },
];

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/dashboard/gradebook/class-1/subject-1?period_id=10"]}>
            <Routes>
                <Route path="/dashboard/gradebook/:classId/:subjectId" element={<GradebookSubject />} />
                <Route path="/dashboard/gradebook" element={<div>Gradebook list route</div>} />
                <Route path="/dashboard" element={<div>Dashboard route</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    mocks.getCurrentYear.mockResolvedValue({
        data: { data: { id: 1, name: "2025-2026", is_current: 1 } },
    });
    mocks.getPeriods.mockResolvedValue({ data: { data: PERIODS } });
    mocks.getWeights.mockResolvedValue({ data: { data: WEIGHTS } });
    mocks.getItems.mockResolvedValue({ data: { data: ITEMS } });
    mocks.getGrades.mockResolvedValue({ data: { data: GRADES } });
    mocks.getFinalizations.mockResolvedValue({ data: { data: [] } });
    mocks.updateWeights.mockResolvedValue({ data: { message: "Grading weights saved" } });
    mocks.createItem.mockResolvedValue({ data: { data: { id: "item-new", message: "Grade item created" } } });
    mocks.deleteItem.mockResolvedValue({ data: { message: "Grade item deleted" } });
    mocks.upsertGrades.mockResolvedValue({ data: { message: "ok" } });
    mocks.finalizeGrades.mockResolvedValue({
        data: { data: { message: "Grades finalized successfully", finalized_count: 1 } },
    });
});

describe("GradebookSubject", () => {
    it("shows the loading state, then the gradebook load error", async () => {
        let rejectItems!: (reason?: unknown) => void;
        mocks.getItems.mockImplementation(
            () => new Promise((_resolve, reject) => { rejectItems = reject; })
        );

        renderPage();

        expect(screen.getByText("Loading gradebook...")).toBeInTheDocument();
        await act(async () => { rejectItems(new Error("offline")); });

        expect(await screen.findByText("Failed to load gradebook data")).toBeInTheDocument();
    });

    it("renders the class header, weights, spreadsheet, scores and final grade", async () => {
        renderPage();

        expect(
            await screen.findByText("Grade 7 - Diamond · Section Diamond · Grade 7 — English 7")
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Grading Weights" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Grade Sheet" })).toBeInTheDocument();
        expect(screen.getByText("Total: 100%")).toBeInTheDocument();

        expect(screen.getByText("Ana Santos")).toBeInTheDocument();
        expect(screen.getByText("123456")).toBeInTheDocument();
        expect(screen.getByText("Quiz 1")).toBeInTheDocument();
        expect(screen.getByText("Long Quiz")).toBeInTheDocument();
        expect(screen.getByText("No items")).toBeInTheDocument();
        expect(screen.getAllByText("/20").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("95%")).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument();
        expect(screen.getByText("Passed")).toBeInTheDocument();

        const scoreInputs = screen.getAllByPlaceholderText("—") as HTMLInputElement[];
        expect(scoreInputs[0]).toHaveValue(18);
        expect(scoreInputs[1]).toHaveValue(45);
    });

    it("validates that grading weights total 100% before saving", async () => {
        const user = userEvent.setup();
        const { container } = renderPage();
        await screen.findByText("Ana Santos");

        const weightInputs = container.querySelectorAll<HTMLInputElement>(".gb-weight-input input");
        expect(weightInputs).toHaveLength(4);

        await user.clear(weightInputs[0]);
        await user.type(weightInputs[0], "40");

        expect(screen.getByText("Total: 110%")).toBeInTheDocument();
        expect(screen.getByText("Must equal 100%")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save Weights" })).toBeDisabled();

        await user.clear(weightInputs[1]);
        await user.type(weightInputs[1], "20");

        expect(screen.getByText("Total: 100%")).toBeInTheDocument();
        const saveButton = screen.getByRole("button", { name: "Save Weights" });
        expect(saveButton).toBeEnabled();
        await user.click(saveButton);

        expect(mocks.updateWeights).toHaveBeenCalledWith("class-1", "subject-1", [
            { category: "activities", weight: 40 },
            { category: "quizzes", weight: 20 },
            { category: "exams", weight: 30 },
            { category: "attendance", weight: 10 },
        ]);
        expect(await screen.findByText("Grading weights saved")).toBeInTheDocument();
    });

    it("creates a grade item and deletes an existing item after confirmation", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Ana Santos");

        await user.click(screen.getByRole("button", { name: "Add Item" }));
        const addModal = (await screen.findByRole("heading", { name: "Add Grade Item" })).closest(".mgmt-modal") as HTMLElement;
        await user.type(
            within(addModal).getByPlaceholderText("e.g., Quiz 1, Midterm Exam"),
            "Oral Recitation"
        );
        const maxScore = within(addModal).getByRole("spinbutton");
        await user.clear(maxScore);
        await user.type(maxScore, "20");
        await user.click(within(addModal).getByRole("button", { name: "Create" }));

        expect(mocks.createItem).toHaveBeenCalledWith("class-1", "subject-1", {
            category: "activities",
            title: "Oral Recitation",
            max_score: 20,
            due_date: null,
            period_id: 10,
        });
        expect(await screen.findByText("Grade item created")).toBeInTheDocument();

        const deleteButtons = await screen.findAllByTitle("Delete item");
        await user.click(deleteButtons[0]);
        const deleteModal = (await screen.findByRole("heading", { name: "Delete Grade Item" })).closest(".mgmt-modal") as HTMLElement;
        await user.click(within(deleteModal).getByRole("button", { name: "Delete" }));

        expect(mocks.deleteItem).toHaveBeenCalledWith("item-1");
        expect(await screen.findByText("Grade item deleted")).toBeInTheDocument();
    });

    it("rejects scores above the item maximum and saves valid scores", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Ana Santos");

        const scoreInputs = screen.getAllByPlaceholderText("—") as HTMLInputElement[];
        await user.clear(scoreInputs[0]);
        await user.type(scoreInputs[0], "25");
        await user.click(screen.getByRole("button", { name: "Save All" }));

        expect(
            await screen.findByText("Score exceeds max (20) for Ana Santos in Quiz 1")
        ).toBeInTheDocument();
        expect(mocks.upsertGrades).not.toHaveBeenCalled();

        await user.clear(scoreInputs[0]);
        await user.type(scoreInputs[0], "19");
        await user.click(screen.getByRole("button", { name: "Save All" }));

        expect(mocks.upsertGrades).toHaveBeenCalledWith("item-1", [
            { student_id: "student-1", score: 19 },
        ]);
        expect(await screen.findByText("Grades saved successfully")).toBeInTheDocument();
    });

    it("confirms finalization and locks the finalized period", async () => {
        const user = userEvent.setup();
        mocks.getFinalizations
            .mockResolvedValueOnce({ data: { data: [] } })
            .mockResolvedValue({ data: { data: [FINALIZATION] } });

        renderPage();
        await screen.findByText("Ana Santos");

        await user.click(screen.getByRole("button", { name: "Finalize Grades" }));
        const finalizeModal = (await screen.findByRole("heading", { name: "Finalize Grades" })).closest(".mgmt-modal") as HTMLElement;
        expect(within(finalizeModal).getByText(/1 student/)).toBeInTheDocument();
        await user.click(within(finalizeModal).getByRole("button", { name: "Finalize Grades" }));

        expect(mocks.finalizeGrades).toHaveBeenCalledWith({
            class_id: "class-1",
            subject_id: "subject-1",
            period_id: 10,
        });
        expect(await screen.findByText("Grades finalized successfully")).toBeInTheDocument();
        expect(await screen.findByText("Finalized")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Add Item" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Finalize Grades" })).toBeDisabled();
    });
});
