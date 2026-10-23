import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CredentialsSection from "../../components/CredentialsSection";

const mocks = vi.hoisted(() => ({
    updateCredentials: vi.fn(),
    login: vi.fn(),
}));

const user = {
    id: "user-1",
    name: "Teacher One",
    email: "teacher@test.local",
    role: "faculty" as const,
};

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user, login: mocks.login }),
}));

vi.mock("../../api/auth", () => ({
    updateCredentials: mocks.updateCredentials,
}));

describe("CredentialsSection", () => {
    it("requires the current password before updating the email", async () => {
        const u = userEvent.setup();
        render(<CredentialsSection />);

        const emailInput = screen.getByDisplayValue("teacher@test.local");
        await u.clear(emailInput);
        await u.type(emailInput, "new@test.local");
        await u.click(screen.getByRole("button", { name: "Update Email" }));

        expect(screen.getByText("Current password is required")).toBeInTheDocument();
        expect(mocks.updateCredentials).not.toHaveBeenCalled();
    });

    it("rejects an email update when the email did not change", async () => {
        const u = userEvent.setup();
        render(<CredentialsSection />);

        await u.type(screen.getByPlaceholderText("Required to confirm changes"), "secret");
        await u.click(screen.getByRole("button", { name: "Update Email" }));

        expect(screen.getByText("No changes to save")).toBeInTheDocument();
        expect(mocks.updateCredentials).not.toHaveBeenCalled();
    });

    it("updates the email, persists the user and shows success", async () => {
        const u = userEvent.setup();
        mocks.updateCredentials.mockResolvedValue({ data: { isOk: true } });
        render(<CredentialsSection />);

        const emailInput = screen.getByDisplayValue("teacher@test.local");
        await u.clear(emailInput);
        await u.type(emailInput, "new@test.local");
        await u.type(screen.getByPlaceholderText("Required to confirm changes"), "secret");
        await u.click(screen.getByRole("button", { name: "Update Email" }));

        expect(mocks.updateCredentials).toHaveBeenCalledWith({
            current_password: "secret",
            email: "new@test.local",
        });
        expect(mocks.login).toHaveBeenCalledWith({ ...user, email: "new@test.local" });
        expect(await screen.findByText("Email updated successfully")).toBeInTheDocument();
    });

    it("shows the server message when the email update fails", async () => {
        const u = userEvent.setup();
        mocks.updateCredentials.mockRejectedValue({
            response: { data: { message: "Email already in use" } },
        });
        render(<CredentialsSection />);

        const emailInput = screen.getByDisplayValue("teacher@test.local");
        await u.clear(emailInput);
        await u.type(emailInput, "taken@test.local");
        await u.type(screen.getByPlaceholderText("Required to confirm changes"), "secret");
        await u.click(screen.getByRole("button", { name: "Update Email" }));

        expect(await screen.findByText("Email already in use")).toBeInTheDocument();
    });

    it("validates the password change fields", async () => {
        const u = userEvent.setup();
        render(<CredentialsSection />);

        await u.click(screen.getByRole("button", { name: "Update Password" }));
        expect(screen.getByText("Current password is required")).toBeInTheDocument();

        await u.type(screen.getByPlaceholderText("Enter current password"), "secret");
        await u.click(screen.getByRole("button", { name: "Update Password" }));
        expect(screen.getByText("New password is required")).toBeInTheDocument();

        await u.type(screen.getByPlaceholderText("At least 6 characters"), "abcdef");
        await u.type(screen.getByPlaceholderText("Re-enter new password"), "abcdeg");
        await u.click(screen.getByRole("button", { name: "Update Password" }));
        expect(screen.getByText("New passwords do not match")).toBeInTheDocument();

        await u.clear(screen.getByPlaceholderText("Re-enter new password"));
        await u.type(screen.getByPlaceholderText("Re-enter new password"), "abcdef");
        await u.clear(screen.getByPlaceholderText("At least 6 characters"));
        await u.type(screen.getByPlaceholderText("At least 6 characters"), "abc");
        await u.clear(screen.getByPlaceholderText("Re-enter new password"));
        await u.type(screen.getByPlaceholderText("Re-enter new password"), "abc");
        await u.click(screen.getByRole("button", { name: "Update Password" }));
        expect(
            screen.getByText("New password must be at least 6 characters")
        ).toBeInTheDocument();
    });

    it("updates the password and clears the fields on success", async () => {
        const u = userEvent.setup();
        mocks.updateCredentials.mockResolvedValue({ data: { isOk: true } });
        render(<CredentialsSection />);

        await u.type(screen.getByPlaceholderText("Enter current password"), "secret");
        await u.type(screen.getByPlaceholderText("At least 6 characters"), "newpass");
        await u.type(screen.getByPlaceholderText("Re-enter new password"), "newpass");
        await u.click(screen.getByRole("button", { name: "Update Password" }));

        expect(mocks.updateCredentials).toHaveBeenCalledWith({
            current_password: "secret",
            password: "newpass",
        });
        expect(await screen.findByText("Password updated successfully")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("At least 6 characters")).toHaveValue("");
    });

    it("shows the server message when the password update fails", async () => {
        const u = userEvent.setup();
        mocks.updateCredentials.mockRejectedValue({
            response: { data: { message: "Incorrect password" } },
        });
        render(<CredentialsSection />);

        await u.type(screen.getByPlaceholderText("Enter current password"), "wrong");
        await u.type(screen.getByPlaceholderText("At least 6 characters"), "newpass");
        await u.type(screen.getByPlaceholderText("Re-enter new password"), "newpass");
        await u.click(screen.getByRole("button", { name: "Update Password" }));

        expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
    });
});
