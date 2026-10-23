import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../../components/Sidebar";
import type { AuthUser } from "../../context/AuthContext";
import { mkUser } from "../test-utils";

const state = vi.hoisted(() => ({
    user: null as AuthUser | null,
    isEnabled: (() => true) as (key: string) => boolean,
    logout: vi.fn(),
    post: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user, logout: state.logout }),
}));

vi.mock("../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: state.isEnabled }),
}));

vi.mock("../../api/client", () => ({
    default: { post: state.post },
}));

function renderSidebar(route = "/dashboard") {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route
                    path="/dashboard"
                    element={<Sidebar isOpen onClose={() => {}} />}
                />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Sidebar", () => {
    it("renders the navigation for a school admin", () => {
        state.user = mkUser("school_admin", { name: "Ada Admin" });
        state.isEnabled = () => true;
        renderSidebar();

        expect(screen.getByText("Ada Admin")).toBeInTheDocument();
        expect(screen.getByText("School Admin")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Faculties/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Students/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Enrollments/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Finalizations/ })).toBeInTheDocument();
    });

    it("hides feature-tagged items when the feature is disabled", () => {
        state.user = mkUser("faculty");
        state.isEnabled = (key: string) => key !== "attendance" && key !== "gradebook";
        renderSidebar();

        expect(screen.getByRole("link", { name: /My Classes/ })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Attendance/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Gradebook/ })).not.toBeInTheDocument();
    });

    it("renders the student navigation", () => {
        state.user = mkUser("student");
        state.isEnabled = () => true;
        renderSidebar();

        expect(screen.getByRole("link", { name: /My Class/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /My Attendance/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Grades/ })).toBeInTheDocument();
    });

    it("highlights the active route", () => {
        state.user = mkUser("faculty");
        state.isEnabled = () => true;
        renderSidebar("/dashboard");

        const link = screen.getByRole("link", { name: /^Dashboard/ });
        expect(link.className).toContain("sidebar-link--active");
    });

    it("logs out, clears auth and navigates to login", async () => {
        const user = userEvent.setup();
        state.user = mkUser("faculty");
        state.isEnabled = () => true;
        renderSidebar();

        await user.click(screen.getByTitle("Log out"));

        expect(state.post).toHaveBeenCalledWith("/logout");
        expect(state.logout).toHaveBeenCalled();
        await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
    });
});
