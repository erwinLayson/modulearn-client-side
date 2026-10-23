import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PlaceholderPage from "../../pages/PlaceholderPage";

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/dashboard/*" element={<PlaceholderPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("PlaceholderPage", () => {
    it("renders the known title for a known slug", () => {
        renderAt("/dashboard/reports");
        expect(screen.getByRole("heading", { name: "Reports" })).toBeInTheDocument();
        expect(screen.getByText("This page is under construction.")).toBeInTheDocument();
        expect(screen.getByText("Content coming soon")).toBeInTheDocument();
    });

    it("falls back to a generic title for an unknown slug", () => {
        renderAt("/dashboard/something-else");
        expect(screen.getByRole("heading", { name: "Page" })).toBeInTheDocument();
    });
});
