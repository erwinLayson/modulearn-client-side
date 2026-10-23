import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchoolSettings from "../../../pages/school_admin/SchoolSettings";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    put: vi.fn(),
    getBySchoolAndYear: vi.fn(),
    generate: vi.fn(),
    setCurrent: vi.fn(),
    update: vi.fn(),
    deletePeriod: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({
        user: {
            id: "admin-1",
            name: "Admin User",
            email: "admin@test.local",
            role: "school_admin",
            school_id: 1,
            school_name: "Springfield High",
        },
    }),
}));

vi.mock("../../../api/academicPeriods", () => ({
    academicPeriodApi: {
        getBySchoolAndYear: mocks.getBySchoolAndYear,
        generate: mocks.generate,
        setCurrent: mocks.setCurrent,
        update: mocks.update,
        delete: mocks.deletePeriod,
    },
}));

vi.mock("../../../api/client", () => ({
    default: {
        get: mocks.get,
        put: mocks.put,
    },
}));

vi.mock("../../../components/CredentialsSection", () => ({
    default: () => <div>Credentials form</div>,
}));

const PERIODS = [
    {
        id: 1,
        school_id: 1,
        school_year_id: 1,
        name: "First Quarter",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
        is_current: 1,
    },
    {
        id: 2,
        school_id: 1,
        school_year_id: 1,
        name: "Second Quarter",
        period_number: 2,
        start_date: "2025-09-01",
        end_date: "2025-11-30",
        is_current: 0,
    },
];

function setupDefaults() {
    mocks.get.mockImplementation((url: string) => {
        if (url.includes("/config")) {
            return Promise.resolve({
                data: {
                    data: {
                        academic_system: "quarter",
                        period_count: 4,
                        academic_config_completed: 1,
                    },
                },
            });
        }
        if (url.includes("school-years")) {
            return Promise.resolve({
                data: { data: [{ id: 1, is_current: 1 }] },
            });
        }
        return Promise.resolve({ data: { data: [] } });
    });
    mocks.put.mockResolvedValue({ data: { message: "ok" } });
    mocks.getBySchoolAndYear.mockResolvedValue({ data: { data: PERIODS } });
    mocks.generate.mockResolvedValue({ data: { data: { generated: 2 } } });
}

beforeEach(() => {
    setupDefaults();
});

describe("SchoolSettings", () => {
    it("shows the loading state before the configuration arrives", async () => {
        let resolveConfig!: (value: unknown) => void;
        mocks.get.mockImplementation((url: string) => {
            if (url.includes("/config")) {
                return new Promise((resolve) => {
                    resolveConfig = resolve;
                });
            }
            return Promise.resolve({
                data: { data: [{ id: 1, is_current: 1 }] },
            });
        });

        render(<SchoolSettings />);
        expect(screen.getByText("Loading configuration...")).toBeInTheDocument();

        await act(async () => {
            resolveConfig({
                data: {
                    data: {
                        academic_system: "quarter",
                        period_count: 4,
                        academic_config_completed: 1,
                    },
                },
            });
        });

        expect(await screen.findByText("Configuration complete")).toBeInTheDocument();
    });

    it("loads the configuration, periods and credentials section", async () => {
        render(<SchoolSettings />);

        expect(await screen.findByText("Configuration complete")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Quarter System")).toBeInTheDocument();
        expect(screen.getByDisplayValue("4")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Academic Periods" })).toBeInTheDocument();
        expect(screen.getByText("First Quarter")).toBeInTheDocument();
        expect(screen.getByText("Second Quarter")).toBeInTheDocument();
        expect(screen.getByText("Yes")).toBeInTheDocument();
        expect(screen.getByText("Credentials form")).toBeInTheDocument();
    });

    it("saves the academic system and period count", async () => {
        const user = userEvent.setup();
        render(<SchoolSettings />);

        await screen.findByText("First Quarter");
        await user.selectOptions(
            screen.getByDisplayValue("Quarter System"),
            "semester"
        );

        const periodCount = screen.getByDisplayValue("2");
        await user.clear(periodCount);
        await user.type(periodCount, "3");
        await user.click(screen.getByRole("button", { name: "Save Configuration" }));

        expect(mocks.put).toHaveBeenCalledWith("/schools/1/config", {
            academic_system: "semester",
            period_count: 3,
        });
        expect(
            await screen.findByText("Academic configuration saved successfully")
        ).toBeInTheDocument();
    });

    it("shows an error toast when saving the configuration fails", async () => {
        const user = userEvent.setup();
        mocks.put.mockRejectedValue(new Error("network"));
        render(<SchoolSettings />);

        await screen.findByText("First Quarter");
        await user.click(screen.getByRole("button", { name: "Save Configuration" }));

        expect(
            await screen.findByText("Failed to save configuration")
        ).toBeInTheDocument();
    });

    it("generates missing periods and refreshes the period list", async () => {
        const user = userEvent.setup();
        render(<SchoolSettings />);

        await screen.findByText("First Quarter");
        await user.click(
            screen.getByRole("button", { name: "Generate Missing Periods" })
        );

        expect(
            await screen.findByText("Generated 2 period(s)")
        ).toBeInTheDocument();
        expect(mocks.generate).toHaveBeenCalledWith(1);
        await waitFor(() =>
            expect(mocks.getBySchoolAndYear).toHaveBeenCalledTimes(2)
        );
    });

    it("shows the empty period state when no periods are configured", async () => {
        mocks.getBySchoolAndYear.mockResolvedValue({ data: { data: [] } });
        render(<SchoolSettings />);

        expect(
            await screen.findByText("No periods configured for this school year.")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Generate Missing Periods" })
        ).toBeInTheDocument();
        expect(screen.getByText("Credentials form")).toBeInTheDocument();
    });
});
