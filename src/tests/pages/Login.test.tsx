import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "../../pages/Login";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    login: vi.fn(),
    authLogin: vi.fn(),
}));

vi.mock("../../api/client", () => ({
    default: { get: mocks.get },
}));

vi.mock("../../api/auth", () => ({
    login: mocks.login,
}));

vi.mock("../../context/AuthContext", () => ({
    useAuth: () => ({ login: mocks.authLogin }),
}));

const SCHOOLS = [{ school_id: 1, school_name: "Springfield High" }];

const backendUser = {
    id: "user-1",
    email: "ada@test.local",
    role: "faculty",
    school_id: 1,
    first_name: "Ada",
    last_name: "Lovelace",
    school_name: "Springfield High",
    academic_config_completed: true,
};

function renderLogin() {
    return render(
        <MemoryRouter initialEntries={["/login"]}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<div>Dashboard page</div>} />
                <Route path="/register" element={<div>Register page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Login page", () => {
    it("loads the public school list into the selector", async () => {
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        renderLogin();

        expect(await screen.findByRole("option", { name: "Springfield High" })).toBeInTheDocument();
        expect(mocks.get).toHaveBeenCalledWith("/schools/list");
    });

    it("requires email and password before submitting", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        renderLogin();

        const email = screen.getByLabelText("Email");
        const password = screen.getByLabelText("Password");
        expect(email).toBeRequired();
        expect(password).toBeRequired();

        await user.click(screen.getByRole("button", { name: "Sign In" }));
        expect(mocks.login).not.toHaveBeenCalled();
    });

    it("logs in, stores the mapped user and shows a success message", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        mocks.login.mockResolvedValue({
            data: { isOk: true, data: { user: backendUser } },
        });
        renderLogin();

        await screen.findByRole("option", { name: "Springfield High" });
        await user.selectOptions(screen.getByLabelText("School"), "1");
        await user.type(screen.getByLabelText("Email"), "ada@test.local");
        await user.type(screen.getByLabelText("Password"), "secret");
        await user.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() =>
            expect(mocks.login).toHaveBeenCalledWith({
                email: "ada@test.local",
                password: "secret",
                school_id: 1,
            })
        );
        expect(mocks.authLogin).toHaveBeenCalledWith({
            id: "user-1",
            name: "Ada Lovelace",
            email: "ada@test.local",
            role: "faculty",
            school_id: 1,
            school_name: "Springfield High",
            academic_config_completed: true,
        });
        expect(
            await screen.findByText("Login successful! Redirecting...")
        ).toBeInTheDocument();
    });

    it("omits school_id for a super admin login", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        mocks.login.mockResolvedValue({
            data: {
                isOk: true,
                data: { user: { ...backendUser, role: "super_admin", school_id: 0 } },
            },
        });
        renderLogin();

        await user.type(screen.getByLabelText("Email"), "root@test.local");
        await user.type(screen.getByLabelText("Password"), "secret");
        await user.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() =>
            expect(mocks.login).toHaveBeenCalledWith({
                email: "root@test.local",
                password: "secret",
            })
        );
    });

    it("shows the server error message when login fails", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        mocks.login.mockRejectedValue({
            response: { data: { message: "Incorrect password" } },
        });
        renderLogin();

        await user.type(screen.getByLabelText("Email"), "ada@test.local");
        await user.type(screen.getByLabelText("Password"), "wrong");
        await user.click(screen.getByRole("button", { name: "Sign In" }));

        expect(
            (await screen.findAllByText("Incorrect password")).length
        ).toBeGreaterThanOrEqual(1);
        expect(mocks.authLogin).not.toHaveBeenCalled();
    });

    it("navigates to the registration page", async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue({ data: { data: SCHOOLS } });
        renderLogin();

        await user.click(screen.getByRole("button", { name: "Register" }));
        expect(screen.getByText("Register page")).toBeInTheDocument();
    });
});
