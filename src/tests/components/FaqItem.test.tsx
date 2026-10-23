import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import FaqItem from "../../components/FaqItem";

describe("FaqItem", () => {
    it("is collapsed by default and toggles the answer", async () => {
        const user = userEvent.setup();
        render(<FaqItem question="What is ModuLearn?" answer="A school platform." />);

        const trigger = screen.getByRole("button", { name: /What is ModuLearn\?/ });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("A school platform.")).not.toBeInTheDocument();

        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("A school platform.")).toBeInTheDocument();

        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("A school platform.")).not.toBeInTheDocument();
    });
});
