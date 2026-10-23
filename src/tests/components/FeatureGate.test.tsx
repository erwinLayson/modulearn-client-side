import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FeatureGate from "../../components/FeatureGate";

const state = vi.hoisted(() => ({ loading: false, enabled: true }));

vi.mock("../../context/FeaturesContext", () => ({
    useFeatures: () => ({
        loading: state.loading,
        isEnabled: () => state.enabled,
    }),
}));

function renderGate() {
    return render(
        <MemoryRouter initialEntries={["/gated"]}>
            <Routes>
                <Route
                    path="/gated"
                    element={
                        <FeatureGate feature="gradebook">
                            <div>Gradebook content</div>
                        </FeatureGate>
                    }
                />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("FeatureGate", () => {
    it("shows the checking state while switches are loading", () => {
        state.loading = true;
        state.enabled = true;
        renderGate();

        expect(screen.getByText(/Checking availability/)).toBeInTheDocument();
        expect(screen.queryByText("Gradebook content")).not.toBeInTheDocument();
    });

    it("renders children when the feature is enabled", () => {
        state.loading = false;
        state.enabled = true;
        renderGate();

        expect(screen.getByText("Gradebook content")).toBeInTheDocument();
    });

    it("shows the disabled screen with the feature label and navigates back", async () => {
        const user = userEvent.setup();
        state.loading = false;
        state.enabled = false;
        renderGate();

        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Feature not available");
        expect(alert).toHaveTextContent("Gradebook");

        await user.click(screen.getByRole("button", { name: "Back to dashboard" }));
        expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    });
});
