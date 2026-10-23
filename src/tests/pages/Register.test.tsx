import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Register from "../../pages/Register";

const mocks = vi.hoisted(() => ({ registerSchool: vi.fn() }));

vi.mock("../../api/schools", () => ({
    registerSchool: mocks.registerSchool,
}));

function renderRegister() {
    return render(
        <MemoryRouter initialEntries={["/register"]}>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<div>Login page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("School Name"), "Springfield High");
    await user.type(screen.getByLabelText("School ID"), "12345");
    await user.selectOptions(screen.getByLabelText("School Level"), "2");
    await user.type(screen.getByLabelText("School Email"), "school@test.local");
    await user.type(screen.getByLabelText("Street Address"), "12 Main St");
    await user.type(screen.getByLabelText("Region"), "Region IV-A");
    await user.type(screen.getByLabelText("Province"), "Laguna");
    await user.type(screen.getByLabelText("City"), "Calamba");
    await user.type(screen.getByLabelText("Contact Number"), "09170000000");
    await user.type(screen.getByLabelText("School Admin"), "Ada Admin");
}

describe("Register page", () => {
    it("marks the required school fields", () => {
        renderRegister();

        expect(screen.getByLabelText("School Name")).toBeRequired();
        expect(screen.getByLabelText("School ID")).toBeRequired();
        expect(screen.getByLabelText("School Email")).toBeRequired();
        expect(screen.getByLabelText("School Admin")).toBeRequired();
    });

    it("does not submit an empty form", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(screen.getByRole("button", { name: "Register School" }));
        expect(mocks.registerSchool).not.toHaveBeenCalled();
    });

    it("wires the academic system to the period count", async () => {
        const user = userEvent.setup();
        renderRegister();

        expect(screen.getByText("Number of Quarters")).toBeInTheDocument();
        expect(screen.getByLabelText("Number of Quarters")).toHaveValue(4);

        await user.selectOptions(screen.getByLabelText("Academic System"), "semester");

        expect(screen.getByText("Number of Semesters")).toBeInTheDocument();
        expect(screen.getByLabelText("Number of Semesters")).toHaveValue(2);
        expect(screen.getByText(/Your school will have 2 semester/)).toBeInTheDocument();
    });

    it("submits the registration payload and shows the success message", async () => {
        const user = userEvent.setup();
        mocks.registerSchool.mockResolvedValue({ data: { isOk: true } });
        renderRegister();

        await fillRequiredFields(user);
        await user.click(screen.getByRole("button", { name: "Register School" }));

        await waitFor(() =>
            expect(mocks.registerSchool).toHaveBeenCalledWith({
                school_name: "Springfield High",
                school_id: 12345,
                school_level: 2,
                school_email: "school@test.local",
                address: "12 Main St",
                region: "Region IV-A",
                province: "Laguna",
                city: "Calamba",
                contact_number: "09170000000",
                school_logo: "",
                school_admin: "Ada Admin",
                academic_system: "quarter",
                period_count: 4,
            })
        );
        expect(
            await screen.findByText("School registered successfully! Redirecting to login...")
        ).toBeInTheDocument();
    });

    it("shows the server error message when registration fails", async () => {
        const user = userEvent.setup();
        mocks.registerSchool.mockRejectedValue({
            response: { data: { message: "School email already exists" } },
        });
        renderRegister();

        await fillRequiredFields(user);
        await user.click(screen.getByRole("button", { name: "Register School" }));

        expect(
            (await screen.findAllByText("School email already exists")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("navigates back to login", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(screen.getByRole("button", { name: "Sign In" }));
        expect(screen.getByText("Login page")).toBeInTheDocument();
    });
});
