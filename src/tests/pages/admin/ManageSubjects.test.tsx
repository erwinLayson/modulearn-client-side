import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";
import type { SubjectListItem } from "../../../api/subjects";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));
const mocks = vi.hoisted(() => ({ getAll: vi.fn() }));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/subjects", () => ({
    subjectApi: { getAll: mocks.getAll },
}));

import ManageSubjects from "../../../pages/admin/ManageSubjects";

const SUBJECT: SubjectListItem = {
    id: "subject-1",
    name: "Mathematics",
    subject_code: "MATH",
    description: "Numbers, algebra and geometry.",
    school_id: 1,
    admin_id: "admin-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: null,
};

function subjectsResponse(subjects = [SUBJECT]) {
    return { data: { data: subjects } };
}

describe("ManageSubjects admin page", () => {
    beforeEach(() => {
        state.user = {
            id: "root-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.getAll.mockResolvedValue(subjectsResponse());
    });

    it("shows a loading state and then the subject list", async () => {
        let resolveSubjects!: (value: unknown) => void;
        mocks.getAll.mockReturnValue(
            new Promise((resolve) => {
                resolveSubjects = resolve;
            })
        );

        render(<ManageSubjects />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        resolveSubjects(subjectsResponse());
        expect(await screen.findByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("MATH")).toBeInTheDocument();
        expect(screen.getByText("School #1")).toBeInTheDocument();
        expect(screen.getByText("Numbers, algebra and geometry.")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith();
    });

    it("shows the empty state when no subjects exist", async () => {
        mocks.getAll.mockResolvedValue(subjectsResponse([]));
        render(<ManageSubjects />);

        expect(await screen.findByText("No subjects registered yet.")).toBeInTheDocument();
    });

    it("shows an error toast when loading subjects fails", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        render(<ManageSubjects />);

        expect(await screen.findByText("Failed to load subjects")).toBeInTheDocument();
    });

    it("shows a description fallback when a subject has none", async () => {
        mocks.getAll.mockResolvedValue(
            subjectsResponse([{ ...SUBJECT, subject_code: null, description: null }])
        );
        render(<ManageSubjects />);

        expect(await screen.findByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("No description provided.")).toBeInTheDocument();
    });
});
