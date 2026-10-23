import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    remove: vi.fn(),
    getSchools: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/users", () => ({
    userApi: {
        getAll: mocks.getAll,
        create: mocks.create,
        update: mocks.update,
        updatePassword: mocks.updatePassword,
        delete: mocks.remove,
    },
}));

vi.mock("../../../api/schools", () => ({
    schoolApi: { getAll: mocks.getSchools },
}));

import ManageUsers from "../../../pages/admin/ManageUsers";

const TARGET = {
    id: "user-2",
    email: "ada@test.local",
    name: "Ada Teacher",
    role: "faculty" as const,
    status: "active" as const,
    school_id: 1,
    created_at: "2026-01-01T00:00:00.000Z",
};

const OTHER = {
    id: "user-3",
    email: "ben@test.local",
    name: "Ben Student",
    role: "student" as const,
    status: "inactive" as const,
    school_id: 1,
    created_at: "2026-01-02T00:00:00.000Z",
};

function usersResponse(users = [TARGET, OTHER]) {
    return { data: { data: users } };
}

function controlFor(label: string, scope: HTMLElement = document.body): HTMLElement {
    const labelEl = within(scope).getByText(label);
    const control = labelEl.nextElementSibling;
    if (!control) throw new Error(`No form control after "${label}"`);
    return control as HTMLElement;
}

describe("ManageUsers admin page", () => {
    beforeEach(() => {
        state.user = {
            id: "admin-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.getAll.mockResolvedValue(usersResponse());
        mocks.getSchools.mockResolvedValue({
            data: {
                data: [{ id: "school-1", school_id: 1, school_name: "Springfield High" }],
            },
        });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.updatePassword.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
    });

    it("shows a loading state and then the user list", async () => {
        let resolveUsers!: (value: unknown) => void;
        mocks.getAll.mockReturnValue(
            new Promise((resolve) => {
                resolveUsers = resolve;
            })
        );

        render(<ManageUsers />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        resolveUsers(usersResponse());
        expect(await screen.findByText("Ada Teacher")).toBeInTheDocument();
        expect(screen.getByText("Ben Student")).toBeInTheDocument();
        expect(screen.getByText("Showing 2 of 2 users")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Springfield High" })).toBeInTheDocument();
    });

    it("shows the empty state when there are no users", async () => {
        mocks.getAll.mockResolvedValue(usersResponse([]));
        render(<ManageUsers />);

        expect(
            await screen.findByText(/No users yet\. Add one to get started\./)
        ).toBeInTheDocument();
    });

    it("shows an error toast when the user list fails to load", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        render(<ManageUsers />);

        expect(await screen.findByText("Failed to load users")).toBeInTheDocument();
    });

    it("validates the create form and creates a user for the chosen role", async () => {
        const user = userEvent.setup();
        render(<ManageUsers />);

        await user.click(await screen.findByRole("button", { name: "+ Add User" }));
        const modal = screen
            .getByRole("heading", { name: "Add User" })
            .closest(".mgmt-modal") as HTMLElement;

        expect(controlFor("Email *", modal)).toBeRequired();
        expect(controlFor("Password *", modal)).toBeRequired();

        await user.click(within(modal).getByRole("button", { name: "Create" }));
        expect(mocks.create).not.toHaveBeenCalled();

        await user.type(controlFor("Name", modal), "New Teacher");
        await user.type(controlFor("Email *", modal), "new@test.local");
        await user.type(controlFor("Password *", modal), "secret1");
        await user.selectOptions(controlFor("Role *", modal), "faculty");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith({
                email: "new@test.local",
                password: "secret1",
                role: "faculty",
                school_id: 0,
                status: "active",
                name: "New Teacher",
            })
        );
        expect(await screen.findByText("User created successfully")).toBeInTheDocument();
    });

    it("validates the password reset fields before calling the API", async () => {
        const user = userEvent.setup();
        mocks.getAll.mockResolvedValue(usersResponse([TARGET]));
        render(<ManageUsers />);

        await user.click(
            await screen.findByRole("button", { name: "Set a new password" })
        );
        expect(
            screen.getByRole("heading", { name: "Set Password" })
        ).toBeInTheDocument();

        await user.type(controlFor("New Password *"), "abcdef");
        await user.type(controlFor("Confirm New Password *"), "abcdeg");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        expect(await screen.findByText("New passwords do not match")).toBeInTheDocument();
        expect(mocks.updatePassword).not.toHaveBeenCalled();

        await user.clear(controlFor("New Password *"));
        await user.type(controlFor("New Password *"), "abc");
        await user.clear(controlFor("Confirm New Password *"));
        await user.type(controlFor("Confirm New Password *"), "abc");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        expect(
            await screen.findByText("New password must be at least 6 characters")
        ).toBeInTheDocument();
        expect(mocks.updatePassword).not.toHaveBeenCalled();
    });

    it("deletes a user only after confirmation", async () => {
        const user = userEvent.setup();
        mocks.getAll.mockResolvedValue(usersResponse([TARGET]));
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
        render(<ManageUsers />);

        const deleteButton = await screen.findByRole("button", { name: "Delete user" });

        await user.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalledWith("Delete Ada Teacher?");
        expect(mocks.remove).not.toHaveBeenCalled();

        confirmSpy.mockReturnValueOnce(true);
        await user.click(deleteButton);

        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("user-2"));
        expect(await screen.findByText("User deleted")).toBeInTheDocument();
    });
});
