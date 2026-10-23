import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Navbar from "../../components/Navbar";

function renderNavbar() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Navbar />
            <Routes>
                <Route path="/" element={<div>Home page</div>} />
                <Route path="/login" element={<div>Login page</div>} />
                <Route path="/register" element={<div>Register page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Navbar", () => {
    it("renders the brand and section links", () => {
        renderNavbar();

        expect(screen.getByText("ModuLearn")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
        expect(screen.getByRole("link", { name: "How It Works" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "FAQ" })).toBeInTheDocument();
    });

    it("navigates to login and register", async () => {
        const user = userEvent.setup();
        renderNavbar();

        await user.click(screen.getByRole("button", { name: "Sign in" }));
        expect(screen.getByText("Login page")).toBeInTheDocument();
    });

    it("navigates to register from Get Started", async () => {
        const user = userEvent.setup();
        renderNavbar();

        await user.click(screen.getByRole("button", { name: "Get Started" }));
        expect(screen.getByText("Register page")).toBeInTheDocument();
    });
});
