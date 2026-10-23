import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Toast from "../../components/Toast";

afterEach(() => {
    vi.useRealTimers();
});

describe("Toast", () => {
    it("renders a success message with the success styles", () => {
        const { container } = render(
            <Toast message="Saved" type="success" onClose={() => {}} />
        );

        expect(screen.getByText("Saved")).toBeInTheDocument();
        expect(container.querySelector(".toast")).toHaveClass("toast--success");
    });

    it("renders an error message and closes when the close button is clicked", () => {
        const onClose = vi.fn();
        const { container } = render(
            <Toast message="Failed" type="error" onClose={onClose} />
        );

        expect(container.querySelector(".toast")).toHaveClass("toast--error");
        fireEvent.click(container.querySelector(".toast-close") as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("auto-closes after four seconds", () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        render(<Toast message="Saved" type="success" onClose={onClose} />);

        expect(onClose).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(3999);
        });
        expect(onClose).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
