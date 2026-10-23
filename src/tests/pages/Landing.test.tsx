import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Landing from "../../pages/Landing";

function renderLanding() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<div>Login page</div>} />
                <Route path="/register" element={<div>Register page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Landing page", () => {
    it("renders the hero, feature sections, pricing, FAQ and footer", () => {
        renderLanding();

        expect(
            screen.getByRole("heading", { name: /Classes, attendance & grades/i })
        ).toBeInTheDocument();
        expect(screen.getByText("Class & subject management")).toBeInTheDocument();
        expect(screen.getByText("Attendance tracking")).toBeInTheDocument();
        expect(screen.getByText("Gradebook", { selector: "h3, h2, p, div, span" })).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: "Register your school" }).length
        ).toBeGreaterThan(0);
        expect(screen.getByText("How do I register my school?")).toBeInTheDocument();
        expect(screen.getByText(/ModuLearn. All rights reserved/)).toBeInTheDocument();
    });

    it("expands an FAQ answer on click", async () => {
        const user = userEvent.setup();
        renderLanding();

        const question = screen.getByRole("button", {
            name: /How do I register my school\?/,
        });
        expect(question).toHaveAttribute("aria-expanded", "false");
        await user.click(question);
        expect(question).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText(/fill in the school registration form/i)).toBeInTheDocument();
    });

    it("navigates to registration from the hero CTA", async () => {
        const user = userEvent.setup();
        renderLanding();

        await user.click(screen.getAllByRole("button", { name: "Register your school" })[0]);
        expect(screen.getByText("Register page")).toBeInTheDocument();
    });

    it("navigates to login from the navbar", async () => {
        const user = userEvent.setup();
        renderLanding();

        await user.click(screen.getByRole("button", { name: "Sign in" }));
        expect(screen.getByText("Login page")).toBeInTheDocument();
    });
});
