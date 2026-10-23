import { afterEach, describe, expect, it, vi } from "vitest";
import apiClient, { getApiErrorMessage } from "../../api/client";

function rejectedHandler() {
    const interceptors = apiClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
    };
    return interceptors.handlers[0].rejected;
}

function axiosError(status: number, url: string, method = "get") {
    return {
        config: { url, method },
        response: { status, data: { message: "server says no" } },
    };
}

function stubLocation() {
    const location = { href: "/dashboard", pathname: "/dashboard" };
    vi.stubGlobal("location", location);
    return location;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("getApiErrorMessage", () => {
    it("returns the message from an axios error response", () => {
        expect(
            getApiErrorMessage(
                { response: { data: { message: "Email already exists" } } },
                "fallback"
            )
        ).toBe("Email already exists");
    });

    it("falls back when the error has no server message", () => {
        expect(getApiErrorMessage({ response: { data: {} } }, "fallback")).toBe("fallback");
        expect(getApiErrorMessage(new Error("network"), "fallback")).toBe("fallback");
        expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
        expect(getApiErrorMessage("boom", "fallback")).toBe("fallback");
    });
});

describe("401 response interceptor", () => {
    it("clears the stored user and redirects to the login page", async () => {
        const location = stubLocation();
        localStorage.setItem("modulearn_user", JSON.stringify({ id: "1", role: "faculty" }));

        const error = axiosError(401, "/students");
        await expect(rejectedHandler()(error)).rejects.toBe(error);

        expect(localStorage.getItem("modulearn_user")).toBeNull();
        expect(location.href).toBe("/login");
    });

    it.each([
        ["/auth/login", "post"],
        ["/auth/credentials", "put"],
        ["/logout", "post"],
        ["/schools", "post"],
        ["/login", "post"],
    ])("does not redirect for the auth/public route %s", async (url, method) => {
        const location = stubLocation();
        localStorage.setItem("modulearn_user", JSON.stringify({ id: "1", role: "faculty" }));

        const error = axiosError(401, url, method);
        await expect(rejectedHandler()(error)).rejects.toBe(error);

        expect(localStorage.getItem("modulearn_user")).not.toBeNull();
        expect(location.href).toBe("/dashboard");
    });

    it("does not clear or redirect for a non-401 response", async () => {
        const location = stubLocation();
        localStorage.setItem("modulearn_user", JSON.stringify({ id: "1", role: "faculty" }));

        const error = axiosError(500, "/students");
        await expect(rejectedHandler()(error)).rejects.toBe(error);

        expect(localStorage.getItem("modulearn_user")).not.toBeNull();
        expect(location.href).toBe("/dashboard");
    });
});
