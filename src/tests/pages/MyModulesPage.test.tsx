import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listMine: vi.fn(),
    getMine: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: { id: "user-1", school_id: 1 } }),
}));

vi.mock("../../api/modules", () => ({
    teachingModuleApi: {
        listMine: mocks.listMine,
        getMine: mocks.getMine,
    },
}));

vi.mock("../../api/subjects", () => ({
    subjectApi: {
        getAssigned: vi.fn().mockResolvedValue({ data: { data: [] } }),
    },
}));

vi.mock("../../api/classes", () => ({
    classApi: {
        getAssignedClasses: vi.fn().mockResolvedValue({ data: { data: [] } }),
    },
}));

vi.mock("../../api/classModules", () => ({
    classModuleApi: {
        instantiate: vi.fn(),
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

describe("MyModulesPage list", () => {
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
});
