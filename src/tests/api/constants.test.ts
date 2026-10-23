import { describe, expect, it } from "vitest";
import { FEATURE_KEYS, FEATURE_LABELS } from "../../constant/features";
import { ROLE_LABELS, ROLE_SIDEBAR } from "../../constant/users";
import { COLORS } from "../../constant/colors";

describe("feature constants", () => {
    it("defines a non-empty label for every feature key", () => {
        for (const key of FEATURE_KEYS) {
            expect(FEATURE_LABELS[key]).toBeTruthy();
        }
    });

    it("keeps feature keys unique", () => {
        expect(new Set(FEATURE_KEYS).size).toBe(FEATURE_KEYS.length);
    });
});

describe("user role constants", () => {
    it("labels every role and gives every role a sidebar", () => {
        for (const role of ["super_admin", "school_admin", "faculty", "student"] as const) {
            expect(ROLE_LABELS[role]).toBeTruthy();
            expect(ROLE_SIDEBAR[role].length).toBeGreaterThan(0);
        }
    });

    it("uses unique paths inside each role sidebar", () => {
        for (const items of Object.values(ROLE_SIDEBAR)) {
            expect(new Set(items.map((item) => item.path)).size).toBe(items.length);
        }
    });

    it("only tags sidebar items with known feature keys", () => {
        const known = new Set<string>(FEATURE_KEYS);
        for (const items of Object.values(ROLE_SIDEBAR)) {
            for (const item of items) {
                if (item.feature) expect(known.has(item.feature)).toBe(true);
            }
        }
    });
});

describe("color palette", () => {
    it("exposes non-empty values for the core colors", () => {
        expect(COLORS.primary).toMatch(/^#/);
        expect(COLORS.accent).toMatch(/^#/);
        expect(COLORS.success).toMatch(/^#/);
        expect(COLORS.error).toMatch(/^#/);
    });
});
