import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import MasterLayout from "../../components/MasterLayout";

const state = vi.hoisted(() => ({ authenticated: true }));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ isAuthenticated: state.authenticated }),
}));

vi.mock("../../components/Sidebar", () => ({
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
        <div>
            <span>Sidebar {isOpen ? "open" : "closed"}</span>
            <button onClick={onClose}>close-sidebar</button>
        </div>
    ),
}));

function renderLayout() {
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
                <Route path="/dashboard" element={<MasterLayout />}>
                    <Route index element={<div>Outlet content</div>} />
                </Route>
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("MasterLayout", () => {
    it("redirects to login when no user is authenticated", () => {
        state.authenticated = false;
        renderLayout();

        expect(screen.getByText("Login page")).toBeInTheDocument();
    });

    it("renders the sidebar and the routed outlet", () => {
        state.authenticated = true;
        renderLayout();

        expect(screen.getByText("Sidebar closed")).toBeInTheDocument();
        expect(screen.getByText("Outlet content")).toBeInTheDocument();
    });

    it("opens and closes the sidebar from the burger button", async () => {
        const user = userEvent.setup();
        state.authenticated = true;
        const { container } = renderLayout();

        await user.click(container.querySelector(".master-burger") as HTMLElement);
        expect(screen.getByText("Sidebar open")).toBeInTheDocument();
        expect(container.querySelector(".sidebar-overlay")).toBeInTheDocument();

        await user.click(container.querySelector(".sidebar-overlay") as HTMLElement);
        expect(screen.getByText("Sidebar closed")).toBeInTheDocument();
    });
});
