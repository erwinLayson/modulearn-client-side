import { describe, expect, it, vi } from "vitest";
import { academicPeriodApi, resolveCurrentPeriodId } from "../../api/academicPeriods";
import { schoolYearApi } from "../../api/school-years";

function response<T>(data: T) {
    return { data: { data } } as never;
}

describe("resolveCurrentPeriodId", () => {
    it("returns the current period when one is marked", async () => {
        vi.spyOn(academicPeriodApi, "getCurrent").mockResolvedValue(
            response({ id: 7, name: "Q2" })
        );
        vi.spyOn(schoolYearApi, "getCurrent").mockResolvedValue(response(null));

        await expect(resolveCurrentPeriodId(1)).resolves.toBe(7);
        expect(schoolYearApi.getCurrent).not.toHaveBeenCalled();
    });

    it("falls back to the first period of the current school year", async () => {
        vi.spyOn(academicPeriodApi, "getCurrent").mockResolvedValue(response(null));
        vi.spyOn(schoolYearApi, "getCurrent").mockResolvedValue(response({ id: 3, name: "2025-2026" }));
        vi.spyOn(academicPeriodApi, "getBySchoolAndYear").mockResolvedValue(
            response([
                { id: 20, period_number: 2, name: "Q2" },
                { id: 10, period_number: 1, name: "Q1" },
            ])
        );

        await expect(resolveCurrentPeriodId(1)).resolves.toBe(10);
        expect(academicPeriodApi.getBySchoolAndYear).toHaveBeenCalledWith(1, 3);
    });

    it("returns null when the current year has no periods", async () => {
        vi.spyOn(academicPeriodApi, "getCurrent").mockResolvedValue(response(null));
        vi.spyOn(schoolYearApi, "getCurrent").mockResolvedValue(response({ id: 3, name: "2025-2026" }));
        vi.spyOn(academicPeriodApi, "getBySchoolAndYear").mockResolvedValue(response([]));

        await expect(resolveCurrentPeriodId(1)).resolves.toBeNull();
    });

    it("returns null when the period and school-year lookups fail", async () => {
        vi.spyOn(academicPeriodApi, "getCurrent").mockRejectedValue(new Error("offline"));
        vi.spyOn(schoolYearApi, "getCurrent").mockRejectedValue(new Error("offline"));

        await expect(resolveCurrentPeriodId(1)).resolves.toBeNull();
    });
});
