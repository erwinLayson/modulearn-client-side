import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getForClass: vi.fn(),
    instantiate: vi.fn(),
    getBySchoolAndYear: vi.fn(),
}));

vi.mock("../../api/classModules", () => ({
    classModuleApi: {
        getForClass: mocks.getForClass,
        instantiate: mocks.instantiate,
    },
}));

vi.mock("../../api/academicPeriods", () => ({
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getBySchoolAndYear,
    },
}));

import ClassModulesPanel from "../../components/ClassModulesPanel";

const TEST_ASSIGNED_MODULE = {
    id: "cm-assignment-1",
    module_id: "mod-1",
    classroom_id: "class-1",
    school_year_id: 1,
    title: "Philippine History and Rizal",
    description: "Assigned module for Grade 7",
    status: "published",
    subject_name: "Araling Panlipunan",
    school_year_name: "2025-2026",
    assigned_at: "2026-01-01T00:00:00.000Z",
    templates: [
        {
            id: "tmpl-1",
            module_id: "mod-1",
            title: "Noli Me Tangere Chapter Review",
            category: "activities",
            instructions: "Answer guide questions 1-5",
            max_score: 25,
            sort_order: 0,
            created_at: "2026-01-01T00:00:00.000Z",
        },
    ],
    lessons: [],
};

describe("ClassModulesPanel", () => {
    it("renders assigned class modules and opens create activity modal with template defaults", async () => {
        const user = userEvent.setup();
        mocks.getForClass.mockResolvedValue({ data: { data: [TEST_ASSIGNED_MODULE] } });
        mocks.getBySchoolAndYear.mockResolvedValue({
            data: {
                data: [
                    { id: 10, period_number: 1, period_name: "Q1", is_current: 1 },
                ],
            },
        });

        render(<ClassModulesPanel classId="class-1" schoolYearId={1} schoolId={1} />);

        // Header and module title
        expect(await screen.findByText("Philippine History and Rizal")).toBeInTheDocument();
        expect(screen.getByText("Noli Me Tangere Chapter Review")).toBeInTheDocument();

        // Click Create Activity
        const createBtn = screen.getByRole("button", { name: "Create Activity" });
        await user.click(createBtn);

        // Modal opens with template defaults prefilled
        expect(await screen.findByRole("heading", { name: "Create Activity from Template" })).toBeInTheDocument();
        expect(screen.getAllByDisplayValue("Noli Me Tangere Chapter Review").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByDisplayValue("25")).toBeInTheDocument();
    });

    it("submits and instantiates an activity in the gradebook from the module template", async () => {
        const user = userEvent.setup();
        mocks.getForClass.mockResolvedValue({ data: { data: [TEST_ASSIGNED_MODULE] } });
        mocks.getBySchoolAndYear.mockResolvedValue({
            data: {
                data: [
                    { id: 10, period_number: 1, period_name: "Q1", is_current: 1 },
                ],
            },
        });
        mocks.instantiate.mockResolvedValue({
            data: {
                data: {
                    id: "activity-instantiated-1",
                    title: "Noli Me Tangere Chapter Review",
                    max_score: 25,
                },
            },
        });

        const { container } = render(<ClassModulesPanel classId="class-1" schoolYearId={1} schoolId={1} />);
        await user.click(await screen.findByRole("button", { name: "Create Activity" }));

        // Fill due date
        const dueDateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
        expect(dueDateInput).toBeInTheDocument();
        await user.type(dueDateInput, "2026-03-25");

        // Submit form via the modal's Create Activity submit button
        const modalActions = document.querySelector(".mgmt-modal-actions") as HTMLElement;
        const submitBtn = within(modalActions).getByRole("button", { name: "Create Activity" });
        await user.click(submitBtn);

        expect(mocks.instantiate).toHaveBeenCalledWith("cm-assignment-1", {
            template_id: "tmpl-1",
            period_id: 10,
            due_date: "2026-03-25",
            title: "Noli Me Tangere Chapter Review",
            max_score: 25,
        });

        // Toast feedback is displayed
        expect(await screen.findByText("Activity created. It is now available in the gradebook.")).toBeInTheDocument();
    });

    it("shows the empty state when no modules are assigned", async () => {
        mocks.getForClass.mockResolvedValue({ data: { data: [] } });

        render(<ClassModulesPanel classId="class-1" schoolYearId={1} schoolId={1} />);

        expect(
            await screen.findByText("No modules assigned to this class. Assign one from My Modules.")
        ).toBeInTheDocument();
    });

    it("shows the load error message from the server", async () => {
        mocks.getForClass.mockRejectedValue({
            response: { data: { message: "Class not found" } },
        });

        render(<ClassModulesPanel classId="class-1" schoolYearId={1} schoolId={1} />);

        expect(await screen.findByText("Class not found")).toBeInTheDocument();
    });

    it("shows the server error when instantiating an activity fails", async () => {
        const user = userEvent.setup();
        mocks.getForClass.mockResolvedValue({ data: { data: [TEST_ASSIGNED_MODULE] } });
        mocks.getBySchoolAndYear.mockResolvedValue({
            data: { data: [{ id: 10, period_number: 1, period_name: "Q1", is_current: 1 }] },
        });
        mocks.instantiate.mockRejectedValue({
            response: { data: { message: "An activity with this title already exists" } },
        });

        render(<ClassModulesPanel classId="class-1" schoolYearId={1} schoolId={1} />);
        await user.click(await screen.findByRole("button", { name: "Create Activity" }));

        const modalActions = document.querySelector(".mgmt-modal-actions") as HTMLElement;
        await user.click(within(modalActions).getByRole("button", { name: "Create Activity" }));

        expect(
            await screen.findByText("An activity with this title already exists")
        ).toBeInTheDocument();
    });
});
