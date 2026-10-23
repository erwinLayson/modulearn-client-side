import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../../components/ProtectedRoute";
import type { AuthUser } from "../../context/AuthContext";

const state = vi.hoisted(() => ({
    user: null as AuthUser | null,
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({
        user: state.user,
        isAuthenticated: !!state.user,
    }),
}));

function renderRoute(initialEntry: string) {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route element={<ProtectedRoute allowedRoles={["school_admin"]} />}>
                    <Route path="/secret" element={<div>Secret page</div>} />
                </Route>
                <Route path="/login" element={<div>Login page</div>} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("ProtectedRoute", () => {
    it("redirects an unauthenticated visitor to the login page", () => {
        state.user = null;
        renderRoute("/secret");

        expect(screen.getByText("Login page")).toBeInTheDocument();
    });

    it("redirects a user with the wrong role to the dashboard", () => {
        state.user = {
            id: "1",
            name: "Teacher",
            email: "teacher@test.local",
            role: "faculty",
        };
        renderRoute("/secret");

        expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    });

    it("renders the outlet for an allowed role", () => {
        state.user = {
            id: "1",
            name: "Admin",
            email: "admin@test.local",
            role: "school_admin",
        };
        renderRoute("/secret");

        expect(screen.getByText("Secret page")).toBeInTheDocument();
    });
});
