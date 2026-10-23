import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ActionIcon, { type ActionIconName } from "../../components/ActionIcon";

const NAMES: ActionIconName[] = [
    "edit",
    "delete",
    "remove",
    "record",
    "password",
    "features",
];

describe("ActionIcon", () => {
    it.each(NAMES)("renders the %s icon as a decorative svg", (name) => {
        const { container } = render(<ActionIcon name={name} />);
        const svg = container.querySelector("svg");

        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(svg).toHaveAttribute("focusable", "false");
        expect(svg?.querySelector("path")?.getAttribute("d")).toBeTruthy();
    });
});
