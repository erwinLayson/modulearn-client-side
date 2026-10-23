import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../../context/AuthContext";
import type { ClassListItem } from "../../../api/classes";

const state = vi.hoisted(() => ({ user: null as AuthUser | null }));
const mocks = vi.hoisted(() => ({ getAll: vi.fn() }));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: state.user }),
}));

vi.mock("../../../api/classes", () => ({
    classApi: { getAll: mocks.getAll },
}));

import ManageClasses from "../../../pages/admin/ManageClasses";

const CLASS_ITEM: ClassListItem = {
    id: "class-1",
    class_name: "Grade 7 - A",
    module_id: "module-1",
    module_title: "Algebra Basics",
    faculty_id: "faculty-1",
    faculty_name: "Ada Teacher",
    school_id: 1,
    school_year_id: 1,
    school_name: "Springfield High",
    capacity: 30,
    section: "A",
    grade_level: "Grade 7",
    schedule: [{ day: "Mon", start_time: "08:00", end_time: "09:00", room: "Rm 1" }],
    created_at: "2026-01-01T00:00:00.000Z",
};

function classesResponse(classes = [CLASS_ITEM]) {
    return { data: { data: classes } };
}

describe("ManageClasses admin page", () => {
    beforeEach(() => {
        state.user = {
            id: "root-1",
            name: "Root Admin",
            email: "root@test.local",
            role: "super_admin",
        };
        mocks.getAll.mockResolvedValue(classesResponse());
    });

    it("shows a loading state and then the platform class list", async () => {
        let resolveClasses!: (value: unknown) => void;
        mocks.getAll.mockReturnValue(
            new Promise((resolve) => {
                resolveClasses = resolve;
            })
        );

        render(<ManageClasses />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        resolveClasses(classesResponse());
        expect(await screen.findByText("Grade 7 - A")).toBeInTheDocument();
        expect(screen.getByText("Manage all platform classes.")).toBeInTheDocument();
        expect(screen.getByText("Springfield High")).toBeInTheDocument();
        expect(screen.getByText("Ada Teacher")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("Mon")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith();
    });

    it("shows the empty state when no classes exist", async () => {
        mocks.getAll.mockResolvedValue(classesResponse([]));
        render(<ManageClasses />);

        expect(await screen.findByText("No classes registered yet.")).toBeInTheDocument();
    });

    it("shows an error toast when loading classes fails", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        render(<ManageClasses />);

        expect(await screen.findByText("Failed to load classes")).toBeInTheDocument();
    });

    it("renders read-only cards with school and capacity fallbacks", async () => {
        state.user = {
            id: "admin-1",
            name: "School Admin",
            email: "admin@school.test",
            role: "school_admin",
            school_id: 2,
        };
        mocks.getAll.mockResolvedValue(
            classesResponse([
                {
                    ...CLASS_ITEM,
                    id: "class-2",
                    class_name: "Grade 8 - B",
                    school_id: 2,
                    school_name: undefined,
                    capacity: null,
                    section: null,
                    grade_level: null,
                    schedule: null,
                },
            ])
        );

        render(<ManageClasses />);

        expect(await screen.findByText("Grade 8 - B")).toBeInTheDocument();
        expect(screen.getByText("View classes.")).toBeInTheDocument();
        expect(screen.getByText("School #2")).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
