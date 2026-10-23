import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SchedulePicker from "../../components/SchedulePicker";
import type { ScheduleItem } from "../../api/classes";

function Harness({ initial = [] as ScheduleItem[], onChange = vi.fn() }) {
    const [value, setValue] = useState<ScheduleItem[]>(initial);
    return (
        <SchedulePicker
            value={value}
            onChange={(next) => {
                setValue(next);
                onChange(next);
            }}
        />
    );
}

describe("SchedulePicker", () => {
    it("renders every weekday and the empty hint", () => {
        render(<Harness />);

        for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
            expect(screen.getByText(day)).toBeInTheDocument();
        }
        expect(screen.getByText(/No schedule set/)).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "+ Add Slot" })).toHaveLength(5);
    });

    it("adds a slot and shows it in the day column", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        await user.click(screen.getAllByRole("button", { name: "+ Add Slot" })[0]);
        await user.click(screen.getByRole("button", { name: "Save" }));

        expect(onChange).toHaveBeenLastCalledWith([
            { day: "Mon", start_time: "08:00", end_time: "09:30", room: undefined },
        ]);
        expect(screen.getAllByText("08:00 - 09:30").length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText(/No schedule set/)).not.toBeInTheDocument();
    });

    it("edits an existing slot", async () => {
        const onChange = vi.fn();
        const { container } = render(
            <Harness
                initial={[{ day: "Tue", start_time: "10:00", end_time: "11:00" }]}
                onChange={onChange}
            />
        );

        await userEvent.setup().click(screen.getByTitle("Edit"));
        const roomInput = container.querySelector('input[name="room"]') as HTMLInputElement;
        fireEvent.change(roomInput, { target: { value: "Room 101" } });
        await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));

        expect(onChange).toHaveBeenLastCalledWith([
            { day: "Tue", start_time: "10:00", end_time: "11:00", room: "Room 101" },
        ]);
    });

    it("removes a slot", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <Harness
                initial={[{ day: "Wed", start_time: "09:00", end_time: "10:00" }]}
                onChange={onChange}
            />
        );

        await user.click(screen.getByTitle("Remove"));
        expect(onChange).toHaveBeenLastCalledWith([]);
        expect(screen.getByText(/No schedule set/)).toBeInTheDocument();
    });

    it("cancels without changing the schedule", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        await user.click(screen.getAllByRole("button", { name: "+ Add Slot" })[1]);
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it("treats a non-array value as an empty schedule", () => {
        render(
            <SchedulePicker
                value={null as unknown as ScheduleItem[]}
                onChange={() => {}}
            />
        );
        expect(screen.getByText(/No schedule set/)).toBeInTheDocument();
    });
});
