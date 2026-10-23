import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(),
    getBySchoolId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getSubjects: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/modules", () => ({
    moduleApi: {
        getAll: mocks.getAll,
        getBySchoolId: mocks.getBySchoolId,
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
    },
}));

vi.mock("../../../api/subjects", () => ({
    subjectApi: { getBySchoolId: mocks.getSubjects },
}));

import ManageModules from "../../../pages/admin/ManageModules";

const MODULE = {
    id: "module-1",
    title: "Algebra Basics",
    description: "An introduction to algebra.",
    subject: "Math",
    subject_id: "subject-1",
    school_id: 1,
    admin_id: "admin-1",
    owner_faculty_id: null,
    status: "draft" as const,
    lesson_content: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: null,
};

const SUBJECTS = [
    {
        id: "subject-1",
        name: "Math",
        subject_code: "MATH",
        description: null,
        school_id: 1,
        admin_id: "admin-1",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: null,
    },
];

function modulesResponse(modules = [MODULE]) {
    return { data: { data: modules } };
}

function controlFor(label: string, scope: HTMLElement): HTMLElement {
    const labelEl = within(scope).getByText(label);
    const control = labelEl.nextElementSibling;
    if (!control) throw new Error(`No form control after "${label}"`);
    return control as HTMLElement;
}

function setupSchoolAdmin() {
    state.user = {
        id: "admin-1",
        name: "School Admin",
        email: "admin@school.test",
        role: "school_admin",
        school_id: 1,
    };
    mocks.getBySchoolId.mockResolvedValue(modulesResponse());
    mocks.getSubjects.mockResolvedValue({ data: { data: SUBJECTS } });
}

describe("ManageModules admin page", () => {
    beforeEach(() => {
        state.user = {
            id: "root-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.getAll.mockResolvedValue(modulesResponse());
        mocks.getBySchoolId.mockResolvedValue(modulesResponse());
        mocks.getSubjects.mockResolvedValue({ data: { data: SUBJECTS } });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
    });

    it("lists all platform modules for a super admin without edit actions", async () => {
        render(<ManageModules />);

        expect(await screen.findByText("Algebra Basics")).toBeInTheDocument();
        expect(screen.getByText("An introduction to algebra.")).toBeInTheDocument();
        expect(screen.getByText("Math")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith();
        expect(screen.queryByRole("button", { name: "+ Add Module" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Edit module" })).not.toBeInTheDocument();
    });

    it("shows the empty state when no modules exist", async () => {
        mocks.getAll.mockResolvedValue(modulesResponse([]));
        render(<ManageModules />);

        expect(await screen.findByText("No modules registered yet.")).toBeInTheDocument();
    });

    it("shows an error toast when loading modules fails", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        render(<ManageModules />);

        expect(await screen.findByText("Failed to load data")).toBeInTheDocument();
    });

    it("requires a subject and then creates a module for the school", async () => {
        const user = userEvent.setup();
        setupSchoolAdmin();
        render(<ManageModules />);

        await user.click(await screen.findByRole("button", { name: "+ Add Module" }));
        const modal = screen
            .getByRole("heading", { name: "Add Module" })
            .closest(".mgmt-modal") as HTMLElement;

        await user.type(controlFor("Title *", modal), "Geometry Basics");
        expect(controlFor("Subject *", modal)).toBeRequired();
        expect(controlFor("Subject (Link) *", modal)).toBeRequired();

        await user.click(within(modal).getByRole("button", { name: "Create" }));
        expect(mocks.create).not.toHaveBeenCalled();

        await user.selectOptions(controlFor("Subject *", modal), "Math");
        await user.selectOptions(controlFor("Subject (Link) *", modal), "subject-1");
        await user.type(controlFor("Description", modal), "Angles and shapes.");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith({
                title: "Geometry Basics",
                description: "Angles and shapes.",
                subject: "Math",
                subject_id: "subject-1",
                school_id: 1,
                admin_id: "admin-1",
            })
        );
        expect(await screen.findByText("Module created successfully")).toBeInTheDocument();
    });

    it("edits a module", async () => {
        const user = userEvent.setup();
        setupSchoolAdmin();
        render(<ManageModules />);

        await user.click(await screen.findByRole("button", { name: "Edit module" }));
        const modal = screen
            .getByRole("heading", { name: "Edit Module" })
            .closest(".mgmt-modal") as HTMLElement;

        const title = controlFor("Title *", modal) as HTMLInputElement;
        expect(title).toHaveValue("Algebra Basics");
        await user.clear(title);
        await user.type(title, "Algebra Advanced");
        await user.click(within(modal).getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mocks.update).toHaveBeenCalledWith(
                "module-1",
                expect.objectContaining({ title: "Algebra Advanced" })
            )
        );
        expect(await screen.findByText("Module updated successfully")).toBeInTheDocument();
    });

    it("deletes a module only after confirmation", async () => {
        const user = userEvent.setup();
        setupSchoolAdmin();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
        render(<ManageModules />);

        const deleteButton = await screen.findByRole("button", { name: "Delete module" });

        await user.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalledWith("Delete Algebra Basics?");
        expect(mocks.remove).not.toHaveBeenCalled();

        confirmSpy.mockReturnValueOnce(true);
        await user.click(deleteButton);

        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("module-1"));
        expect(await screen.findByText("Module deleted")).toBeInTheDocument();
    });
});
