import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPage from "../../pages/SettingsPage";

vi.mock("../../components/CredentialsSection", () => ({
    default: () => <div>Credentials form</div>,
}));

describe("SettingsPage", () => {
    it("renders the settings header and the credentials section", () => {
        render(<SettingsPage />);

        expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
        expect(
            screen.getByText("Manage your account credentials")
        ).toBeInTheDocument();
        expect(screen.getByText("Credentials form")).toBeInTheDocument();
    });
});
