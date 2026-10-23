import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { mkUser } from "../test-utils";

function Probe() {
    const { user, login, logout, isAuthenticated } = useAuth();
    return (
        <div>
            <span data-testid="name">{user?.name ?? "none"}</span>
            <span data-testid="role">{user?.role ?? "none"}</span>
            <span data-testid="auth">{String(isAuthenticated)}</span>
            <button onClick={() => login(mkUser("faculty"))}>do-login</button>
            <button onClick={() => logout()}>do-logout</button>
        </div>
    );
}

function renderProbe() {
    return render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
    );
}

describe("AuthContext", () => {
    it("restores a user stored in localStorage", () => {
        localStorage.setItem(
            "modulearn_user",
            JSON.stringify(mkUser("student", { name: "Maria Santos" }))
        );

        renderProbe();

        expect(screen.getByTestId("name")).toHaveTextContent("Maria Santos");
        expect(screen.getByTestId("role")).toHaveTextContent("student");
        expect(screen.getByTestId("auth")).toHaveTextContent("true");
    });

    it("ignores corrupt JSON and entries missing id or role", () => {
        localStorage.setItem("modulearn_user", "{not json");
        const first = renderProbe();
        expect(screen.getByTestId("name")).toHaveTextContent("none");
        expect(screen.getByTestId("auth")).toHaveTextContent("false");
        first.unmount();

        localStorage.setItem("modulearn_user", JSON.stringify({ name: "No Id" }));
        renderProbe();
        expect(screen.getByTestId("name")).toHaveTextContent("none");
    });

    it("persists a login and clears it on logout", async () => {
        const user = userEvent.setup();
        renderProbe();

        await user.click(screen.getByRole("button", { name: "do-login" }));

        expect(screen.getByTestId("auth")).toHaveTextContent("true");
        const stored = JSON.parse(localStorage.getItem("modulearn_user") ?? "{}");
        expect(stored.role).toBe("faculty");

        await user.click(screen.getByRole("button", { name: "do-logout" }));

        expect(screen.getByTestId("auth")).toHaveTextContent("false");
        expect(localStorage.getItem("modulearn_user")).toBeNull();
    });

    it("throws when useAuth is used outside the provider", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow(
            "useAuth must be used within an AuthProvider"
        );
        spy.mockRestore();
    });
});
