import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { FeaturesProvider, useFeatures } from "../../context/FeaturesContext";
import { FEATURE_KEYS, FEATURE_LABELS, type FeatureKey } from "../../constant/features";
import { mkUser } from "../test-utils";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../api/features", () => ({
    featureApi: { get: mocks.get },
}));

function featureResponse(disabled: FeatureKey[] = []) {
    return {
        data: {
            data: {
                school_id: 1,
                features: FEATURE_KEYS.map((key) => ({
                    key,
                    label: FEATURE_LABELS[key],
                    description: "",
                    is_enabled: !disabled.includes(key),
                })),
            },
        },
    };
}

function Probe() {
    const { loading, error, isEnabled, refresh } = useFeatures();
    return (
        <div>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="error">{String(error)}</span>
            <span data-testid="gradebook">{String(isEnabled("gradebook"))}</span>
            <span data-testid="attendance">{String(isEnabled("attendance"))}</span>
            <button onClick={() => void refresh()}>refresh</button>
        </div>
    );
}

function renderProbe(user = mkUser("school_admin")) {
    localStorage.setItem("modulearn_user", JSON.stringify(user));
    return render(
        <AuthProvider>
            <FeaturesProvider>
                <Probe />
            </FeaturesProvider>
        </AuthProvider>
    );
}

describe("FeaturesContext", () => {
    it("loads switches for a school user and applies disabled keys", async () => {
        mocks.get.mockResolvedValue(featureResponse(["gradebook"]));

        renderProbe();

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false")
        );
        expect(mocks.get).toHaveBeenCalledWith(1);
        expect(screen.getByTestId("gradebook")).toHaveTextContent("false");
        expect(screen.getByTestId("attendance")).toHaveTextContent("true");
        expect(screen.getByTestId("error")).toHaveTextContent("false");
    });

    it("does not fetch for a super admin", async () => {
        renderProbe(mkUser("super_admin", { school_id: undefined }));

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false")
        );
        expect(mocks.get).not.toHaveBeenCalled();
        expect(screen.getByTestId("gradebook")).toHaveTextContent("true");
    });

    it("does not fetch for a user without a school id", async () => {
        renderProbe(mkUser("faculty", { school_id: undefined }));

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false")
        );
        expect(mocks.get).not.toHaveBeenCalled();
    });

    it("fails open when the switches cannot be loaded", async () => {
        mocks.get.mockRejectedValue(new Error("offline"));

        renderProbe();

        await waitFor(() =>
            expect(screen.getByTestId("error")).toHaveTextContent("true")
        );
        expect(screen.getByTestId("gradebook")).toHaveTextContent("true");
        expect(screen.getByTestId("attendance")).toHaveTextContent("true");
    });

    it("refetches on refresh and applies the new switches", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue(featureResponse([]));

        renderProbe();
        await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
        expect(screen.getByTestId("gradebook")).toHaveTextContent("true");

        mocks.get.mockResolvedValue(featureResponse(["gradebook", "attendance"]));
        await user.click(screen.getByRole("button", { name: "refresh" }));

        await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
        await waitFor(() =>
            expect(screen.getByTestId("gradebook")).toHaveTextContent("false")
        );
        expect(screen.getByTestId("attendance")).toHaveTextContent("false");
    });

    it("throws when useFeatures is used outside the provider", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow(
            "useFeatures must be used within a FeaturesProvider"
        );
        spy.mockRestore();
    });
});
