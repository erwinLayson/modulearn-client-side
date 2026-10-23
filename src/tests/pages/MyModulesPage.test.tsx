import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listMine: vi.fn(),
    getMine: vi.fn(),
    createMine: vi.fn(),
    updateMine: vi.fn(),
    getEligibleClassrooms: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    getAssigned: vi.fn(),
    getAssignedClasses: vi.fn(),
    assign: vi.fn(),
    instantiate: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: { id: "user-1", school_id: 1 } }),
}));

vi.mock("../../api/modules", () => ({
    teachingModuleApi: {
        listMine: mocks.listMine,
        getMine: mocks.getMine,
        createMine: mocks.createMine,
        updateMine: mocks.updateMine,
        getEligibleClassrooms: mocks.getEligibleClassrooms,
        createTemplate: mocks.createTemplate,
        updateTemplate: mocks.updateTemplate,
        deleteTemplate: mocks.deleteTemplate,
    },
}));

vi.mock("../../api/subjects", () => ({
    subjectApi: {
        getAssigned: mocks.getAssigned,
    },
}));

vi.mock("../../api/classes", () => ({
    classApi: {
        getAssignedClasses: mocks.getAssignedClasses,
    },
}));

vi.mock("../../api/classModules", () => ({
    classModuleApi: {
        assign: mocks.assign,
        instantiate: mocks.instantiate,
    },
}));

import MyModulesPage from "../../pages/faculty/MyModulesPage";

const TEST_MODULE = {
    id: "module-1",
    title: "Life of rizal",
    subject_id: "subject-1",
    subject: "English",
    description: "A reusable module about Rizal.",
    status: "draft",
    lesson_count: 2,
    template_count: 1,
    assignment_count: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
};

const SUBJECT = {
    id: "subject-1",
    name: "English",
    subject_code: null,
    description: null,
    school_id: 1,
    admin_id: "admin-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: null,
};

const TEMPLATE = {
    id: "template-1",
    module_id: "module-1",
    title: "Chapter Quiz",
    instructions: "Answer all items.",
    category: "quizzes" as const,
    max_score: 20,
    sort_order: 0,
};

function detail(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        module: TEST_MODULE,
        templates: [],
        assignments: [],
        lessons: [],
        ...overrides,
    };
}

function modal(title: string) {
    return screen.getByRole("heading", { name: title }).closest(".mgmt-modal") as HTMLElement;
}

describe("MyModulesPage list", () => {
    beforeEach(() => {
        mocks.listMine.mockResolvedValue({ data: { data: [TEST_MODULE] } });
        mocks.getMine.mockResolvedValue({ data: { data: detail() } });
        mocks.createMine.mockResolvedValue({ data: { data: { id: "module-2" } } });
        mocks.updateMine.mockResolvedValue({ data: { data: detail() } });
        mocks.getEligibleClassrooms.mockResolvedValue({ data: { data: [] } });
        mocks.createTemplate.mockResolvedValue({ data: { data: { id: "template-2" } } });
        mocks.updateTemplate.mockResolvedValue({ data: {} });
        mocks.deleteTemplate.mockResolvedValue({ data: {} });
        mocks.getAssigned.mockResolvedValue({ data: { data: [SUBJECT] } });
        mocks.getAssignedClasses.mockResolvedValue({ data: { data: [] } });
        mocks.assign.mockResolvedValue({ data: { data: { id: "class-module-1" } } });
        mocks.instantiate.mockResolvedValue({ data: { data: { id: "activity-1" } } });
    });

    it("shows filter feedback and a distinct no-match state", async () => {
        const user = userEvent.setup();
        mocks.listMine.mockImplementation(async (filters?: { q?: string }) => ({
            data: { data: filters?.q ? [] : [TEST_MODULE] },
        }));

        render(<MyModulesPage />);
        expect(await screen.findByText("Life of rizal")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Search modules"), "zzz");

        expect(await screen.findByText("No modules match your filters.")).toBeInTheDocument();
        expect(screen.queryByText(/No modules found/)).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Clear filters" }));
        expect(await screen.findByText("Life of rizal")).toBeInTheDocument();
    });

    it("opens the card action menu without navigating and closes it on Escape or outside click", async () => {
        const user = userEvent.setup();
        mocks.listMine.mockResolvedValue({ data: { data: [TEST_MODULE] } });
        mocks.getMine.mockResolvedValue({ data: { data: null } });

        render(<MyModulesPage />);
        const trigger = await screen.findByRole("button", {
            name: "Actions for Life of rizal",
        });

        await user.click(trigger);
        const menu = screen.getByRole("menu");
        expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
        expect(mocks.getMine).not.toHaveBeenCalled();

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        await user.click(trigger);
        expect(screen.getByRole("menu")).toBeInTheDocument();
        await user.click(screen.getByRole("heading", { name: "My Modules" }));
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        await user.click(trigger);
        await user.click(screen.getByRole("menuitem", { name: "Edit" }));
        expect(await screen.findByRole("heading", { name: "Edit Module" })).toBeInTheDocument();
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(mocks.getMine).not.toHaveBeenCalled();
    });

    it("validates required module fields before creating", async () => {
        const user = userEvent.setup();
        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");

        await user.click(screen.getByRole("button", { name: "+ New Module" }));
        const dialog = modal("New Module");
        const form = dialog.querySelector("form") as HTMLFormElement;

        fireEvent.submit(form);
        expect(await screen.findByText("Title is required")).toBeInTheDocument();

        await user.type(within(dialog).getAllByRole("textbox")[0], "New Module");
        fireEvent.submit(form);
        expect(await screen.findByText("Subject is required")).toBeInTheDocument();
        expect(mocks.createMine).not.toHaveBeenCalled();
    });

    it("creates a module with the selected subject", async () => {
        const user = userEvent.setup();
        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");

        await user.click(screen.getByRole("button", { name: "+ New Module" }));
        const dialog = modal("New Module");
        await user.type(within(dialog).getAllByRole("textbox")[0], "New Module");
        await within(dialog).findByRole("option", { name: "English" });
        await user.selectOptions(within(dialog).getAllByRole("combobox")[0], "subject-1");
        await user.click(within(dialog).getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Module created")).toBeInTheDocument();
        expect(mocks.createMine).toHaveBeenCalledWith({
            title: "New Module",
            subject_id: "subject-1",
            description: null,
            lesson_content: null,
            status: "draft",
        });
    });

    it("shows the server message when module creation fails", async () => {
        const user = userEvent.setup();
        mocks.createMine.mockRejectedValue({
            response: { data: { message: "Subject not assigned to you" } },
        });

        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");
        await user.click(screen.getByRole("button", { name: "+ New Module" }));
        const dialog = modal("New Module");
        await user.type(within(dialog).getAllByRole("textbox")[0], "New Module");
        await within(dialog).findByRole("option", { name: "English" });
        await user.selectOptions(within(dialog).getAllByRole("combobox")[0], "subject-1");
        await user.click(within(dialog).getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Subject not assigned to you")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "New Module" })).toBeInTheDocument();
    });

    it("edits a module and refreshes the list", async () => {
        const user = userEvent.setup();
        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");

        await user.click(screen.getByRole("button", { name: "Edit" }));
        const dialog = modal("Edit Module");
        const titleInput = within(dialog).getByDisplayValue("Life of rizal");
        await user.clear(titleInput);
        await user.type(titleInput, "Life of Rizal v2");
        await user.click(within(dialog).getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Module updated")).toBeInTheDocument();
        expect(mocks.updateMine).toHaveBeenCalledWith(
            "module-1",
            expect.objectContaining({
                title: "Life of Rizal v2",
                subject_id: "subject-1",
                status: "draft",
            })
        );
        expect(mocks.listMine.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("archives a module after confirmation", async () => {
        const user = userEvent.setup();
        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");

        await user.click(screen.getByRole("button", { name: "Archive" }));
        const dialog = modal("Archive Module");
        expect(dialog).toHaveTextContent('Archive "Life of rizal"');

        await user.click(within(dialog).getByRole("button", { name: "Archive" }));
        expect(await screen.findByText("Module archived")).toBeInTheDocument();
        expect(mocks.updateMine).toHaveBeenCalledWith("module-1", { status: "archived" });
    });

    it("assigns a module to an eligible classroom", async () => {
        const user = userEvent.setup();
        mocks.getEligibleClassrooms.mockResolvedValue({
            data: {
                data: [
                    {
                        classroom_id: "class-1",
                        class_name: "Grade 7 - Diamond",
                        section: "Diamond",
                        grade_level: "Grade 7",
                        school_year_id: 1,
                        school_year_name: "2025-2026",
                        already_assigned: false,
                        class_module_id: null,
                    },
                    {
                        classroom_id: "class-2",
                        class_name: "Grade 7 - Emerald",
                        section: "Emerald",
                        grade_level: "Grade 7",
                        school_year_id: 1,
                        school_year_name: "2025-2026",
                        already_assigned: true,
                        class_module_id: "class-module-2",
                    },
                ],
            },
        });

        render(<MyModulesPage />);
        await screen.findByText("Life of rizal");
        await user.click(screen.getByRole("button", { name: "Assign" }));

        const dialog = modal("Assign Module to a Class");
        expect(await within(dialog).findByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(within(dialog).getByText("Assigned")).toBeInTheDocument();
        expect(within(dialog).getAllByRole("button", { name: "Assign" })).toHaveLength(1);

        await user.click(within(dialog).getByRole("button", { name: "Assign" }));
        expect(
            await screen.findByText("Module assigned to Grade 7 - Diamond")
        ).toBeInTheDocument();
        expect(mocks.assign).toHaveBeenCalledWith({
            module_id: "module-1",
            classroom_id: "class-1",
            school_year_id: 1,
        });
    });

    it("adds an activity template from the module detail view", async () => {
        const user = userEvent.setup();
        mocks.getMine
            .mockResolvedValueOnce({ data: { data: detail() } })
            .mockResolvedValue({ data: { data: detail({ templates: [TEMPLATE] }) } });

        render(<MyModulesPage />);
        await user.click(
            await screen.findByRole("button", { name: "Open module Life of rizal" })
        );

        expect(
            await screen.findByRole("heading", { name: "Activity Templates (0)" })
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "+ Add Template" }));

        const dialog = modal("Add Template");
        await user.type(within(dialog).getAllByRole("textbox")[0], "Chapter Quiz");
        await user.click(within(dialog).getByRole("button", { name: "Save" }));

        expect(await screen.findByText("Template added")).toBeInTheDocument();
        expect(mocks.createTemplate).toHaveBeenCalledWith(
            "module-1",
            expect.objectContaining({
                title: "Chapter Quiz",
                category: "activities",
                max_score: 100,
                sort_order: 0,
            })
        );
        expect(
            await screen.findByRole("heading", { name: "Activity Templates (1)" })
        ).toBeInTheDocument();
    });
});
