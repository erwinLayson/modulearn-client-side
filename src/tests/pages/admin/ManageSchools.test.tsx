import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(),
    getFeatures: vi.fn(),
    updateFeatures: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/schools", () => ({
    schoolApi: { getAll: mocks.getAll },
}));

vi.mock("../../../api/features", () => ({
    featureApi: { get: mocks.getFeatures, update: mocks.updateFeatures },
}));

import ManageSchools from "../../../pages/admin/ManageSchools";

const SCHOOL = {
    id: "school-1",
    school_id: 1,
    school_name: "Springfield High",
    school_email: "info@springfield.edu",
    school_level: 2,
    address: "12 Main St",
    region: "Region IV-A",
    province: "Laguna",
    city: "Calamba",
    contact_number: "09170000000",
    school_logo: "",
    school_admin: "Ada Admin",
    admin_id: "admin-1",
    registered_at: "2026-01-01T00:00:00.000Z",
};

const FEATURES = [
    {
        key: "gradebook",
        label: "Gradebook",
        description: "Enable the gradebook module for this school.",
        is_enabled: true,
    },
];

function schoolResponse(schools = [SCHOOL]) {
    return { data: { data: schools } };
}

function featureResponse(features = FEATURES) {
    return { data: { data: { school_id: 1, features } } };
}

describe("ManageSchools admin page", () => {
    beforeEach(() => {
        state.user = {
            id: "admin-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.getAll.mockResolvedValue(schoolResponse());
        mocks.getFeatures.mockResolvedValue(featureResponse());
    });

    it("shows a loading state and then the school list", async () => {
        let resolveSchools!: (value: unknown) => void;
        mocks.getAll.mockReturnValue(
            new Promise((resolve) => {
                resolveSchools = resolve;
            })
        );

        render(<ManageSchools />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        resolveSchools(schoolResponse());
        expect(await screen.findByText("Springfield High")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith();
        expect(screen.getByText("Junior High")).toBeInTheDocument();
        expect(screen.getByText("info@springfield.edu")).toBeInTheDocument();
    });

    it("shows the empty state when no schools are registered", async () => {
        mocks.getAll.mockResolvedValue(schoolResponse([]));
        render(<ManageSchools />);

        expect(
            await screen.findByText(/No schools registered yet\. Add one to get started\./)
        ).toBeInTheDocument();
    });

    it("shows an error toast when the school list fails to load", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        render(<ManageSchools />);

        expect(await screen.findByText("Failed to load schools")).toBeInTheDocument();
    });

    it("opens a school detail and loads its feature switches", async () => {
        const user = userEvent.setup();
        render(<ManageSchools />);

        await user.click(await screen.findByText("Springfield High"));

        expect(
            await screen.findByRole("heading", { name: "Springfield High", level: 2 })
        ).toBeInTheDocument();
        expect(await screen.findByText("Gradebook")).toBeInTheDocument();
        expect(mocks.getFeatures).toHaveBeenCalledWith(1);
        expect(screen.getByText("All changes saved.")).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Gradebook enabled" })).toBeChecked();
    });

    it("toggles a feature and saves the new state", async () => {
        const user = userEvent.setup();
        mocks.updateFeatures.mockResolvedValue(
            featureResponse([{ ...FEATURES[0], is_enabled: false }])
        );
        render(<ManageSchools />);

        await user.click(await screen.findByText("Springfield High"));
        const toggle = await screen.findByRole("checkbox", { name: "Gradebook enabled" });

        await user.click(toggle);
        expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(mocks.updateFeatures).toHaveBeenCalledWith(1, [
            { key: "gradebook", is_enabled: false },
        ]);
        expect(await screen.findByText("Feature settings saved")).toBeInTheDocument();
        expect(screen.getByText("All changes saved.")).toBeInTheDocument();
    });

    it("shows the server message when saving features fails", async () => {
        const user = userEvent.setup();
        mocks.updateFeatures.mockRejectedValue({
            response: { data: { message: "Feature update failed" } },
        });
        render(<ManageSchools />);

        await user.click(await screen.findByText("Springfield High"));
        await user.click(await screen.findByRole("checkbox", { name: "Gradebook enabled" }));
        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(await screen.findByText("Feature update failed")).toBeInTheDocument();
    });
});
