import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "../../pages/Dashboard";
import type { AuthUser } from "../../context/AuthContext";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../pages/admin/SuperAdminDashboard", () => ({
    default: () => <div>Super admin dashboard</div>,
}));
vi.mock("../../pages/school_admin/SchoolAdminDashboard", () => ({
    default: () => <div>School admin dashboard</div>,
}));
vi.mock("../../pages/faculty/FacultyDashboard", () => ({
    default: () => <div>Faculty dashboard</div>,
}));
vi.mock("../../pages/student/StudentDashboard", () => ({
    default: () => <div>Student dashboard</div>,
}));

function user(role: AuthUser["role"]): AuthUser {
    return { id: "1", name: "User", email: "user@test.local", role };
}

describe("Dashboard", () => {
    it.each([
        ["super_admin", "Super admin dashboard"],
        ["school_admin", "School admin dashboard"],
        ["faculty", "Faculty dashboard"],
        ["student", "Student dashboard"],
    ] as const)("renders the %s dashboard", (role, expected) => {
        state.user = user(role);
        render(<Dashboard />);
        expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it("renders nothing without a user", () => {
        state.user = null;
        const { container } = render(<Dashboard />);
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the unknown-role placeholder", () => {
        state.user = user("faculty");
        state.user = { ...state.user, role: "guest" as AuthUser["role"] };
        render(<Dashboard />);

        expect(screen.getByText("Unknown Role")).toBeInTheDocument();
        expect(screen.getByText(/guest/)).toBeInTheDocument();
    });
});
