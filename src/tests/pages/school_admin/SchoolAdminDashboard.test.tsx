import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchoolAdminDashboard from "../../../pages/school_admin/SchoolAdminDashboard";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    isEnabled: vi.fn(),
    authUser: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@test.local",
        role: "school_admin",
        school_id: 1,
        school_name: "Springfield High",
        academic_config_completed: true as boolean,
    },
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: mocks.authUser }),
}));

vi.mock("../../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: mocks.isEnabled }),
}));

vi.mock("../../../api/client", () => ({
    default: {
        get: mocks.get,
    },
}));

const FACULTIES = [
    { id: "f1", first_name: "Ada", last_name: "Lovelace", email: "ada@test.local" },
    { id: "f2", first_name: "Alan", last_name: "Turing", email: "alan@test.local" },
];

const STUDENTS = [
    { id: "s1", first_name: "Maria", last_name: "Santos", email: "maria@test.local" },
    { id: "s2", first_name: "Jose", last_name: "Rizal", email: "jose@test.local" },
    { id: "s3", first_name: "Andres", last_name: "Bonifacio", email: "andres@test.local" },
];

const MODULES = [{ id: "m1", title: "Life of Rizal", subject: "English 7" }];

const SUBJECTS = [
    { id: "sub1", name: "English 7" },
    { id: "sub2", name: "Mathematics 7" },
];

const CLASSES = [
    {
        id: "c1",
        class_name: "Grade 7 - Diamond",
        module_title: "Life of Rizal",
        faculty_name: "Ada Lovelace",
        capacity: 40,
    },
];

function setupDefaults() {
    mocks.get.mockImplementation((url: string) => {
        if (url.startsWith("/faculties/")) {
            return Promise.resolve({ data: { data: FACULTIES } });
        }
        if (url.startsWith("/students/")) {
            return Promise.resolve({ data: { data: STUDENTS } });
        }
        if (url.startsWith("/modules/")) {
            return Promise.resolve({ data: { data: MODULES } });
        }
        if (url.startsWith("/subjects/")) {
            return Promise.resolve({ data: { data: SUBJECTS } });
        }
        if (url.startsWith("/classes/")) {
            return Promise.resolve({ data: { data: CLASSES } });
        }
        return Promise.resolve({ data: { data: [] } });
    });
    mocks.isEnabled.mockReturnValue(false);
    mocks.authUser = {
        id: "admin-1",
        name: "Admin User",
        email: "admin@test.local",
        role: "school_admin",
        school_id: 1,
        school_name: "Springfield High",
        academic_config_completed: true,
    };
}

function renderDashboard() {
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
                <Route path="/dashboard" element={<SchoolAdminDashboard />} />
                <Route
                    path="/dashboard/attendance-report"
                    element={<div>Attendance report page</div>}
                />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    setupDefaults();
});

describe("SchoolAdminDashboard", () => {
    it("shows counters and recent lists from the API data", async () => {
        renderDashboard();

        expect(
            (await screen.findAllByText("Ada Lovelace")).length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Students")).toBeInTheDocument();

        expect(
            screen.getByText("Faculties").parentElement
        ).toHaveTextContent("2");
        expect(
            screen.getByText("Students").parentElement
        ).toHaveTextContent("3");
        expect(
            screen.getByText("Modules").parentElement
        ).toHaveTextContent("1");
        expect(
            screen.getByText("Subjects").parentElement
        ).toHaveTextContent("2");
        expect(
            screen.getByText("Classes").parentElement
        ).toHaveTextContent("1");

        expect(screen.getByText("Maria Santos")).toBeInTheDocument();
        expect(screen.getByText("Grade 7 - Diamond")).toBeInTheDocument();
        expect(screen.getByText("Life of Rizal")).toBeInTheDocument();
        expect(screen.getByText("40")).toBeInTheDocument();
    });

    it("shows loading placeholders while the API requests are pending", async () => {
        let resolveGet!: (value: unknown) => void;
        mocks.get.mockReturnValue(
            new Promise((resolve) => {
                resolveGet = resolve;
            })
        );

        renderDashboard();

        expect(screen.getAllByText("...")).toHaveLength(5);
        expect(screen.getAllByText("Loading...")).toHaveLength(3);

        await act(async () => {
            resolveGet({ data: { data: [] } });
        });

        expect(await screen.findByText("No faculties yet.")).toBeInTheDocument();
    });

    it("renders empty states when there is no data", async () => {
        mocks.get.mockResolvedValue({ data: { data: [] } });
        renderDashboard();

        expect(await screen.findByText("No faculties yet.")).toBeInTheDocument();
        expect(screen.getByText("No students yet.")).toBeInTheDocument();
        expect(screen.getByText("No classes yet.")).toBeInTheDocument();
        expect(
            screen.getByText("Faculties").parentElement
        ).toHaveTextContent("0");
    });

    it("falls back to empty states when the API requests fail", async () => {
        mocks.get.mockRejectedValue(new Error("network"));
        renderDashboard();

        expect(await screen.findByText("No faculties yet.")).toBeInTheDocument();
        expect(screen.getByText("No students yet.")).toBeInTheDocument();
        expect(screen.getByText("No classes yet.")).toBeInTheDocument();
        expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });

    it("shows the attendance report card and navigates to it when enabled", async () => {
        const user = userEvent.setup();
        mocks.isEnabled.mockImplementation(
            (key: string) => key === "attendance_reports"
        );
        renderDashboard();

        const card = (await screen.findByText("Attendance Report")).closest(
            ".dash-stat-card"
        );
        expect(card).not.toBeNull();

        await user.click(card as HTMLElement);
        expect(screen.getByText("Attendance report page")).toBeInTheDocument();
    });

    it("hides the attendance card and shows the setup prompt when configuration is incomplete", async () => {
        mocks.authUser = {
            ...mocks.authUser,
            academic_config_completed: false,
        };
        renderDashboard();

        expect(
            await screen.findByText("Complete your academic configuration")
        ).toBeInTheDocument();
        expect(screen.queryByText("Attendance Report")).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Configure Now" })).toHaveAttribute(
            "href",
            "/dashboard/settings"
        );
    });
});
