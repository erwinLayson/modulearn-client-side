import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BackHome from "../../components/BackHome";

describe("BackHome", () => {
    it("renders a link back to the home page", () => {
        render(
            <MemoryRouter>
                <BackHome />
            </MemoryRouter>
        );

        const link = screen.getByRole("link", { name: "Back to home" });
        expect(link).toHaveAttribute("href", "/");
        expect(link).not.toHaveClass("auth-back--dark");
    });

    it("supports the dark variant", () => {
        render(
            <MemoryRouter>
                <BackHome variant="dark" />
            </MemoryRouter>
        );

        expect(screen.getByRole("link", { name: "Back to home" })).toHaveClass(
            "auth-back--dark"
        );
    });
});
