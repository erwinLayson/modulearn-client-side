import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PricingCard from "../../components/PricingCard";

describe("PricingCard", () => {
    it("renders the plan details and calls the CTA handler", async () => {
        const user = userEvent.setup();
        const onCta = vi.fn();
        const { container } = render(
            <PricingCard
                name="School Plan"
                price="₱1,999"
                period="/month"
                description="For growing schools"
                features={["Unlimited classes", "Attendance"]}
                cta="Choose plan"
                onCta={onCta}
            />
        );

        expect(screen.getByText("School Plan")).toBeInTheDocument();
        expect(screen.getByText("₱1,999")).toBeInTheDocument();
        expect(screen.getByText("/month")).toBeInTheDocument();
        expect(screen.getByText("For growing schools")).toBeInTheDocument();
        expect(screen.getByText("Unlimited classes")).toBeInTheDocument();
        expect(screen.getByText("Attendance")).toBeInTheDocument();
        expect(container.querySelector(".land-price")).not.toHaveClass("land-price--dark");

        await user.click(screen.getByRole("button", { name: "Choose plan" }));
        expect(onCta).toHaveBeenCalledTimes(1);
    });

    it("uses the featured styles when featured", () => {
        const { container } = render(
            <PricingCard
                name="Pro"
                price="₱0"
                description="Free"
                features={[]}
                cta="Start"
                onCta={() => {}}
                featured
            />
        );

        expect(container.querySelector(".land-price")).toHaveClass("land-price--dark");
        expect(screen.getByRole("button", { name: "Start" })).toHaveClass("land-btn--primary");
    });
});
