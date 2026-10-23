import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Footer from "../../components/Footer";

function renderFooter() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Footer />
            <Routes>
                <Route path="/" element={<div>Home page</div>} />
                <Route path="/register" element={<div>Register page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Footer", () => {
    it("renders the links and the current year", () => {
        renderFooter();

        expect(screen.getByText("ModuLearn")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
        expect(
            screen.getByText(new RegExp(`${new Date().getFullYear()} ModuLearn`))
        ).toBeInTheDocument();
    });

    it("navigates to school registration", async () => {
        const user = userEvent.setup();
        renderFooter();

        await user.click(screen.getByRole("button", { name: "Register your school" }));
        expect(screen.getByText("Register page")).toBeInTheDocument();
    });
});
