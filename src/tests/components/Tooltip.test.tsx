import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Tooltip from "../../components/Tooltip";

describe("Tooltip", () => {
    it("shows the label on hover and hides it on leave", async () => {
        const user = userEvent.setup();
        render(
            <Tooltip label="Helpful text">
                <button>Trigger</button>
            </Tooltip>
        );

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

        await user.hover(screen.getByRole("button", { name: "Trigger" }));
        expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful text");

        await user.unhover(screen.getByRole("button", { name: "Trigger" }));
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the label on keyboard focus and hides it on blur", async () => {
        const user = userEvent.setup();
        render(
            <Tooltip label="Focus text">
                <button>Trigger</button>
            </Tooltip>
        );

        await user.tab();
        expect(await screen.findByRole("tooltip")).toHaveTextContent("Focus text");

        await user.tab();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
});
