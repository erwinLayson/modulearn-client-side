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
        testTimeout: 15_000,
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
