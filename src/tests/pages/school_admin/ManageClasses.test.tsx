import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test-utils";
import ManageClasses from "../../../pages/school_admin/ManageClasses";

const mocks = vi.hoisted(() => ({
    getClasses: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getClassFaculties: vi.fn(),
    getAvailableAdvisers: vi.fn(),
    assignFaculty: vi.fn(),
    removeFaculty: vi.fn(),
    replaceFaculty: vi.fn(),
    getSubjects: vi.fn(),
    getSubjectFaculties: vi.fn(),
    getSchoolYears: vi.fn(),
    getEnrollments: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
    useAuth: () => ({
        user: {
            id: "admin-1",
            name: "School Admin",
            email: "admin@test.local",
            role: "school_admin",
            school_id: 7,
        },
    }),
}));

vi.mock("../../../api/client", () => ({
    getApiErrorMessage: (err: unknown, fallback: string) => {
        const response = (err as { response?: { data?: { message?: string } } })
            ?.response;
        return response?.data?.message || fallback;
    },
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getBySchoolId: mocks.getClasses,
        getById: mocks.getById,
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
        getFaculties: mocks.getClassFaculties,
        getAvailableAdvisers: mocks.getAvailableAdvisers,
        assignFaculty: mocks.assignFaculty,
        removeFaculty: mocks.removeFaculty,
        replaceFaculty: mocks.replaceFaculty,
    },
}));

vi.mock("../../../api/subjects", () => ({
    subjectApi: {
        getBySchoolId: mocks.getSubjects,
        getFaculties: mocks.getSubjectFaculties,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getBySchoolId: mocks.getSchoolYears,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getByClassAndSchoolYear: mocks.getEnrollments,
    },
}));

const SCHOOL_YEAR = {
    id: 1,
    name: "2025-2026",
    start_date: "2025-06-01",
    end_date: "2026-03-31",
    school_id: 7,
    is_current: 1,
};

const CLASS = {
    id: "class-1",
    class_name: "Grade 1 - A",
    module_id: "",
    module_title: "",
    faculty_id: "fac-1",
    faculty_name: "Ada Lovelace",
    school_id: 7,
    school_year_id: 1,
    capacity: 30,
    section: "A",
    grade_level: "1",
    schedule: [
        { day: "Mon", start_time: "08:00", end_time: "09:00", room: "Room 101" },
    ],
    created_at: "2025-06-01T00:00:00.000Z",
};

const ADVISER = {
    id: "fac-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@test.local",
};

const CLASS_FACULTY = {
    id: "fac-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@test.local",
    subject_id: "sub-1",
    subject_name: "Mathematics",
};

const SUBJECT = {
    id: "sub-1",
    name: "Mathematics",
    subject_code: "MATH101",
    description: "Numbers",
    school_id: 7,
    admin_id: "admin-1",
    created_at: "2025-06-01T00:00:00.000Z",
    updated_at: null,
};

const CANDIDATE = {
    id: "fac-2",
    first_name: "Grace",
    last_name: "Hopper",
    email: "grace@test.local",
};

const ENROLLMENT = {
    id: "enroll-1",
    student_id: "student-1",
    student_name: "Alice Smith",
    student_email: "alice@test.local",
    lrn: "123456789012",
    class_id: "class-1",
    class_name: "Grade 1 - A",
    section: "A",
    grade_level: 1,
    school_year_id: 1,
    school_year_name: "2025-2026",
    status: "active" as const,
    enrolled_at: "2025-06-15T00:00:00.000Z",
    subjects: [{ id: "sub-1", name: "Mathematics", teacher_name: "Ada Lovelace" }],
};

function renderPage() {
    return renderWithRouter(<ManageClasses />, {
        route: "/dashboard/classes",
    });
}

function modalFor(name: RegExp | string) {
    return screen
        .getByRole("heading", { name })
        .closest(".mgmt-modal") as HTMLElement;
}

describe("ManageClasses page", () => {
    beforeEach(() => {
        mocks.getClasses.mockResolvedValue({ data: { data: [CLASS] } });
        mocks.getById.mockResolvedValue({ data: { data: CLASS } });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
        mocks.getClassFaculties.mockResolvedValue({
            data: { data: [CLASS_FACULTY] },
        });
        mocks.getAvailableAdvisers.mockResolvedValue({
            data: { data: [ADVISER] },
        });
        mocks.assignFaculty.mockResolvedValue({ data: { isOk: true } });
        mocks.removeFaculty.mockResolvedValue({ data: { isOk: true } });
        mocks.replaceFaculty.mockResolvedValue({ data: { isOk: true } });
        mocks.getSubjects.mockResolvedValue({ data: { data: [SUBJECT] } });
        mocks.getSubjectFaculties.mockResolvedValue({
            data: { data: [CANDIDATE] },
        });
        mocks.getSchoolYears.mockResolvedValue({
            data: { data: [SCHOOL_YEAR] },
        });
        mocks.getEnrollments.mockResolvedValue({ data: { data: [ENROLLMENT] } });
    });

    it("shows a loading state while classes are fetched", () => {
        mocks.getClasses.mockReturnValue(new Promise(() => {}));
        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders the class list with adviser, section, capacity and schedule", async () => {
        renderPage();

        expect(
            await screen.findByRole("heading", { name: "Grade 1 - A" })
        ).toBeInTheDocument();
        expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
        expect(screen.getByText("A")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("Click to view details")).toBeInTheDocument();
    });

    it("renders the empty state when the school year has no classes", async () => {
        mocks.getClasses.mockResolvedValue({ data: { data: [] } });
        renderPage();

        expect(
            await screen.findByText(
                "No classes for this school year. Add one to get started."
            )
        ).toBeInTheDocument();
    });

    it("shows an error message when the class list fails to load", async () => {
        mocks.getClasses.mockRejectedValue(new Error("network down"));
        renderPage();

        expect(
            (await screen.findAllByText("Failed to load data")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("validates the required fields and creates a class with an adviser", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByRole("heading", { name: "Grade 1 - A" });

        const addButton = screen.getByRole("button", { name: "+ Add Class" });
        await waitFor(() => expect(addButton).toBeEnabled());
        await user.click(addButton);

        const modal = modalFor("Add Class");
        const nameInput = within(modal).getAllByRole("textbox")[0];
        const adviserSelect = within(modal).getByRole("combobox");
        expect(nameInput).toBeRequired();
        expect(adviserSelect).toBeRequired();
        await within(modal).findByRole("option", { name: "Ada Lovelace" });

        await user.type(nameInput, "Grade 2 - A");
        await user.selectOptions(adviserSelect, "fac-1");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    class_name: "Grade 2 - A",
                    faculty_id: "fac-1",
                    school_id: 7,
                    school_year_id: 1,
                })
            )
        );
        expect(
            await screen.findByText("Class created successfully")
        ).toBeInTheDocument();
    });

    it("reports a blocked delete, opens the class detail and assigns a teacher", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        mocks.remove.mockRejectedValueOnce({
            response: { data: { message: "Class has enrolled students" } },
        });
        renderPage();
        await screen.findByRole("heading", { name: "Grade 1 - A" });

        await user.click(screen.getByRole("button", { name: "Delete class" }));
        expect(
            (await screen.findAllByText("Failed to delete class")).length
        ).toBeGreaterThanOrEqual(1);
        expect(confirmSpy).toHaveBeenCalledWith("Delete Grade 1 - A?");

        await user.click(screen.getByRole("heading", { name: "Grade 1 - A" }));
        expect(
            await screen.findByRole("heading", { name: /Subject Teachers/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("cell", { name: "ada@test.local" })
        ).toBeInTheDocument();
        expect(screen.getByText("Mathematics")).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: /Students \(1\)/ })
        );
        expect(
            await screen.findByRole("cell", { name: "Alice Smith" })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "+ Assign Teacher" })
        );
        const modal = modalFor(/Assign Teacher to Grade 1 - A/);
        await within(modal).findByRole("option", { name: "Mathematics" });
        const subjectSelect = within(modal).getAllByRole("combobox")[0];
        await user.selectOptions(subjectSelect, "sub-1");

        await waitFor(() =>
            expect(
                within(modal).getAllByRole("combobox")[1]
            ).toBeEnabled()
        );
        const teacherSelect = within(modal).getAllByRole("combobox")[1];
        await user.selectOptions(teacherSelect, "fac-2");
        await user.click(
            within(modal).getByRole("button", { name: "Assign Teacher" })
        );

        await waitFor(() =>
            expect(mocks.assignFaculty).toHaveBeenCalledWith(
                "class-1",
                "fac-2",
                "sub-1"
            )
        );
        expect(await screen.findByText("Teacher assigned")).toBeInTheDocument();
    });
});
