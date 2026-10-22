import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        include: ["src/tests/**/*.test.{ts,tsx}"],
        setupFiles: ["src/tests/setup.ts"],
        css: false,
        restoreMocks: true,
        clearMocks: true,
        // Remove once the first client test file lands (phase 7 of the plan).
        passWithNoTests: true,
        coverage: {
            provider: "v8",
            reportsDirectory: "coverage",
            include: [
                "src/api/**/*.ts",
                "src/components/**/*.tsx",
                "src/context/**/*.tsx",
                "src/pages/**/*.tsx",
            ],
            exclude: ["src/tests/**"],
        },
    },
});
