import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

configure({ asyncUtilTimeout: 5_000 });

afterEach(() => {
    cleanup();
    localStorage.clear();
});

// jsdom does not implement these browser APIs, and components touch them
// indirectly (responsive hooks, scroll restoration, file previews).
if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
    });
}

if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
        writable: true,
        value: ResizeObserverStub,
    });
}

window.scrollTo = vi.fn();

if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
        writable: true,
        value: vi.fn(() => "blob:vitest"),
    });
}
