/* eslint-disable react-refresh/only-export-components */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";
import type { AuthUser } from "../context/AuthContext";
import type { UserRole } from "../constant/users";

export function mkUser(
    role: UserRole = "faculty",
    overrides: Partial<AuthUser> = {}
): AuthUser {
    return {
        id: `user-${role}`,
        name: `${role} user`,
        email: `${role}@test.local`,
        role,
        school_id: 1,
        ...overrides,
    };
}

export function renderWithRouter(
    ui: ReactElement,
    { route = "/" }: { route?: string } = {}
) {
    return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

export function RouterWrapper({
    children,
    route = "/",
}: {
    children: ReactNode;
    route?: string;
}) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

export async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}
