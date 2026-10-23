import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PeriodSelector from "../../components/PeriodSelector";

const mocks = vi.hoisted(() => ({ getBySchoolAndYear: vi.fn() }));

vi.mock("../../api/academicPeriods", () => ({
    academicPeriodApi: { getBySchoolAndYear: mocks.getBySchoolAndYear },
}));

const PERIODS = [
    {
        id: 11,
        name: "First Quarter",
        period_number: 1,
        start_date: "2025-06-01",
        end_date: "2025-08-31",
    },
    {
        id: 12,
        name: "Second Quarter",
        period_number: 2,
        start_date: "2025-09-01",
        end_date: "2025-11-30",
    },
];

describe("PeriodSelector", () => {
    it("shows a loading placeholder until the periods arrive", async () => {
        mocks.getBySchoolAndYear.mockResolvedValue({ data: { data: PERIODS } });
        render(<PeriodSelector schoolId={1} schoolYearId={2} value="" onChange={() => {}} />);

        expect(screen.getByRole("option", { name: "Loading..." })).toBeInTheDocument();
        expect(await screen.findByRole("option", { name: /First Quarter/ })).toBeInTheDocument();
        expect(mocks.getBySchoolAndYear).toHaveBeenCalledWith(1, 2);
    });

    it("renders an all-periods option and calls onChange", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        mocks.getBySchoolAndYear.mockResolvedValue({ data: { data: PERIODS } });
        render(<PeriodSelector schoolId={1} schoolYearId={2} value="" onChange={onChange} />);

        expect(await screen.findByRole("option", { name: "All Periods" })).toBeInTheDocument();
        await user.selectOptions(screen.getByRole("combobox"), "12");
        expect(onChange).toHaveBeenCalledWith("12");
    });

    it("hides the all-periods option when showAllOption is false", async () => {
        mocks.getBySchoolAndYear.mockResolvedValue({ data: { data: PERIODS } });
        render(
            <PeriodSelector
                schoolId={1}
                schoolYearId={2}
                value=""
                onChange={() => {}}
                showAllOption={false}
                disabled
            />
        );

        await screen.findByRole("option", { name: /First Quarter/ });
        expect(screen.queryByRole("option", { name: "All Periods" })).not.toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("falls back to an empty list when loading fails", async () => {
        mocks.getBySchoolAndYear.mockRejectedValue(new Error("offline"));
        render(<PeriodSelector schoolId={1} schoolYearId={2} value="" onChange={() => {}} />);

        await waitFor(() =>
            expect(screen.queryByRole("option", { name: "Loading..." })).not.toBeInTheDocument()
        );
        expect(screen.getByRole("option", { name: "All Periods" })).toBeInTheDocument();
        expect(screen.getAllByRole("option")).toHaveLength(1);
    });
});
