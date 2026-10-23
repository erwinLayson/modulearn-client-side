import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));
const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/client", () => ({
    default: { get: mocks.get },
}));

import SuperAdminDashboard from "../../../pages/admin/SuperAdminDashboard";

const SCHOOLS = [
    {
        id: "school-1",
        school_name: "Springfield High",
        school_id: 1,
        school_email: "info@springfield.edu",
        school_level: 2,
        address: "12 Main St",
        city: "Calamba",
        registered_at: "2026-01-01T00:00:00.000Z",
        school_logo: "",
    },
    {
        id: "school-2",
        school_name: "Shelbyville Elementary",
        school_id: 2,
        school_email: "info@shelbyville.edu",
        school_level: 1,
        address: "8 Oak Ave",
        city: "Los Banos",
        registered_at: "2026-02-01T00:00:00.000Z",
        school_logo: "",
    },
];

function schoolsResponse(schools = SCHOOLS) {
    return { data: { data: schools } };
}

function statCard(label: string) {
    return screen.getByText(label).closest(".dash-stat-card") as HTMLElement;
}

describe("SuperAdminDashboard", () => {
    beforeEach(() => {
        state.user = {
            id: "root-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.get.mockResolvedValue(schoolsResponse());
    });

    it("shows placeholders while the school list is loading", () => {
        mocks.get.mockReturnValue(new Promise(() => {}));
        render(<SuperAdminDashboard />);

        expect(screen.getByRole("heading", { name: "Super Admin Dashboard" })).toBeInTheDocument();
        expect(screen.getByText("Root Admin")).toBeInTheDocument();
        expect(screen.getAllByText("...")).toHaveLength(3);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(mocks.get).toHaveBeenCalledWith("/schools");
    });

    it("shows school-derived counters and the registered school table", async () => {
        render(<SuperAdminDashboard />);

        expect(await screen.findByText("Springfield High")).toBeInTheDocument();
        expect(within(statCard("Total Schools")).getByText("2")).toBeInTheDocument();
        expect(within(statCard("Platform Users")).getByText("6")).toBeInTheDocument();
        expect(within(statCard("Reports")).getByText("--")).toBeInTheDocument();
        expect(within(statCard("Settings")).getByText("Active")).toBeInTheDocument();

        expect(screen.getByText("Shelbyville Elementary")).toBeInTheDocument();
        expect(screen.getByText("info@springfield.edu")).toBeInTheDocument();
        expect(screen.getByText("Calamba")).toBeInTheDocument();
        expect(screen.getByText("Junior High")).toBeInTheDocument();
        expect(screen.getByText("Elementary")).toBeInTheDocument();
    });

    it("shows zero counters and the empty state when there are no schools", async () => {
        mocks.get.mockResolvedValue(schoolsResponse([]));
        render(<SuperAdminDashboard />);

        expect(await screen.findByText("No schools registered yet.")).toBeInTheDocument();
        expect(within(statCard("Total Schools")).getByText("0")).toBeInTheDocument();
        expect(within(statCard("Platform Users")).getByText("0")).toBeInTheDocument();
    });

    it("falls back to the empty state when the school request fails", async () => {
        mocks.get.mockRejectedValue(new Error("network down"));
        render(<SuperAdminDashboard />);

        expect(await screen.findByText("No schools registered yet.")).toBeInTheDocument();
        expect(within(statCard("Total Schools")).getByText("0")).toBeInTheDocument();
        expect(screen.queryByText(/Failed to load/i)).not.toBeInTheDocument();
    });
});
