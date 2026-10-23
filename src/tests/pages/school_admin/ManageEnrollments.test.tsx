import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test-utils";
import ManageEnrollments from "../../../pages/school_admin/ManageEnrollments";

const mocks = vi.hoisted(() => ({
    getStudents: vi.fn(),
    getClasses: vi.fn(),
    getSchoolYears: vi.fn(),
    autoGenerate: vi.fn(),
    getEnrollments: vi.fn(),
    getClassFaculties: vi.fn(),
    getAcademicRecord: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
    isEnabled: vi.fn(),
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

vi.mock("../../../context/FeaturesContext", () => ({
    useFeatures: () => ({ isEnabled: mocks.isEnabled }),
}));

vi.mock("../../../api/client", () => ({
    getApiErrorMessage: (err: unknown, fallback: string) => {
        const response = (err as { response?: { data?: { message?: string } } })
            ?.response;
        return response?.data?.message || fallback;
    },
}));

vi.mock("../../../api/students", () => ({
    studentApi: {
        getAll: mocks.getStudents,
        getAcademicRecord: mocks.getAcademicRecord,
    },
}));

vi.mock("../../../api/classes", () => ({
    classApi: {
        getBySchoolId: mocks.getClasses,
        getFaculties: mocks.getClassFaculties,
    },
}));

vi.mock("../../../api/school-years", () => ({
    schoolYearApi: {
        getBySchoolId: mocks.getSchoolYears,
        autoGenerate: mocks.autoGenerate,
    },
}));

vi.mock("../../../api/enrollments", () => ({
    enrollmentApi: {
        getByClassAndSchoolYear: mocks.getEnrollments,
        create: mocks.create,
        updateStatus: mocks.updateStatus,
        delete: mocks.remove,
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

const STUDENT = {
    id: "student-1",
    first_name: "Alice",
    middle_name: "",
    last_name: "Smith",
    extension_name: "",
    email: "alice@test.local",
    school_id: 7,
    lrn: "123456789012",
    date_of_birth: "2010-05-15",
    place_of_birth: "Manila",
    sex: "female" as const,
    nationality: "Filipino",
    contact_number: "555-0101",
    region: "NCR",
    province: "Metro Manila",
    city_municipality: "Quezon City",
    barangay: "Barangay 1",
    purok_street: "Purok 1",
    admin_id: "admin-1",
    age: 15,
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
    schedule: [],
    created_at: "2025-06-01T00:00:00.000Z",
};

const CLASS_SUBJECT_FACULTY = {
    id: "fac-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@test.local",
    subject_id: "sub-1",
    subject_name: "Mathematics",
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
    subjects: [
        { id: "sub-1", name: "Mathematics", teacher_name: "Ada Lovelace" },
    ],
};

function renderPage() {
    return renderWithRouter(<ManageEnrollments />, {
        route: "/dashboard/enrollments",
    });
}

async function chooseStudentAndClass(
    user: ReturnType<typeof userEvent.setup>
) {
    const search = screen.getByPlaceholderText("Search by name or email…");
    await user.type(search, "Alice");
    await user.click(await screen.findByText("Alice Smith"));

    await user.click(screen.getByRole("button", { name: "1" }));
    const classCard = await screen.findByRole("button", {
        name: /Grade 1 - A/,
    });
    await user.click(classCard);

    expect(await screen.findByRole("checkbox")).toBeChecked();
}

async function statusSelect() {
    return waitFor(() => {
        const select = screen
            .getAllByRole("combobox")
            .find((el) => (el as HTMLSelectElement).value === "active");
        if (!select) throw new Error("Status select is not ready");
        return select as HTMLSelectElement;
    });
}

describe("ManageEnrollments page", () => {
    beforeEach(() => {
        mocks.getStudents.mockResolvedValue({ data: { data: [STUDENT] } });
        mocks.getClasses.mockResolvedValue({ data: { data: [CLASS] } });
        mocks.getSchoolYears.mockResolvedValue({
            data: { data: [SCHOOL_YEAR] },
        });
        mocks.autoGenerate.mockResolvedValue({ data: { data: null } });
        mocks.getEnrollments.mockResolvedValue({ data: { data: [ENROLLMENT] } });
        mocks.getClassFaculties.mockResolvedValue({
            data: { data: [CLASS_SUBJECT_FACULTY] },
        });
        mocks.getAcademicRecord.mockResolvedValue({
            data: { data: { records: [] } },
        });
        mocks.create.mockResolvedValue({ data: {} });
        mocks.updateStatus.mockResolvedValue({ data: {} });
        mocks.remove.mockResolvedValue({ data: {} });
        mocks.isEnabled.mockReturnValue(false);
    });

    it("shows a loading state then the enrollment stepper with the current year", async () => {
        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(
            await screen.findByRole("heading", { name: "School Year" })
        ).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveValue("1");
        expect(
            screen.getByRole("option", { name: "2025-2026 — Current" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Enrollment summary" })
        ).toBeInTheDocument();
    });

    it("shows an error message when the base data fails to load", async () => {
        mocks.getStudents.mockRejectedValue(new Error("network down"));
        renderPage();

        expect(
            (await screen.findAllByText("Failed to load data")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("enrolls a student into the selected class and subjects", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByRole("heading", { name: "School Year" });

        await chooseStudentAndClass(user);
        const enrollButton = screen.getByRole("button", {
            name: "Enroll student",
        });
        await waitFor(() => expect(enrollButton).toBeEnabled());
        await user.click(enrollButton);

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith({
                student_id: "student-1",
                class_id: "class-1",
                school_year_id: 1,
                grade_level: 1,
                subject_ids: ["sub-1"],
            })
        );
        expect(
            await screen.findByText("Alice enrolled in Grade 1 - A")
        ).toBeInTheDocument();
    });

    it("shows the server message when the student is already enrolled", async () => {
        const user = userEvent.setup();
        mocks.create.mockRejectedValueOnce({
            response: {
                data: { message: "Student is already enrolled in this class" },
            },
        });
        renderPage();
        await screen.findByRole("heading", { name: "School Year" });

        await chooseStudentAndClass(user);
        const enrollButton = screen.getByRole("button", {
            name: "Enroll student",
        });
        await waitFor(() => expect(enrollButton).toBeEnabled());
        await user.click(enrollButton);

        expect(
            (
                await screen.findAllByText(
                    "Student is already enrolled in this class"
                )
            ).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("changes an enrollment status and removes an enrollment", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByRole("heading", { name: "School Year" });

        await chooseStudentAndClass(user);

        const select = await statusSelect();
        await user.selectOptions(select, "dropped");
        await waitFor(() =>
            expect(mocks.updateStatus).toHaveBeenCalledWith("enroll-1", {
                status: "dropped",
            })
        );
        expect(await screen.findByText("Status updated")).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Remove from class" })
        );
        await waitFor(() =>
            expect(mocks.remove).toHaveBeenCalledWith("enroll-1")
        );
        expect(
            await screen.findByText("Enrollment removed")
        ).toBeInTheDocument();
        expect(confirmSpy).toHaveBeenCalledWith("Remove this enrollment?");
    });

    it("renders an empty roster for a class with no enrollments", async () => {
        const user = userEvent.setup();
        mocks.getEnrollments.mockResolvedValue({ data: { data: [] } });
        renderPage();
        await screen.findByRole("heading", { name: "School Year" });

        await chooseStudentAndClass(user);

        expect(
            await screen.findByText(
                "No enrollments for this class in this school year yet."
            )
        ).toBeInTheDocument();
    });
});
