import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test-utils";
import ManageStudents from "../../../pages/school_admin/ManageStudents";

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    importPreview: vi.fn(),
    importStudents: vi.fn(),
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

vi.mock("../../../api/students", () => ({
    studentApi: {
        getAll: mocks.getAll,
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
        importPreview: mocks.importPreview,
        import: mocks.importStudents,
    },
}));

const STUDENT = {
    id: "student-1",
    first_name: "Alice",
    middle_name: "B",
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

const PREVIEW = {
    totalRows: 3,
    validRows: 2,
    validationErrors: [
        {
            row: 3,
            email: "bad@test.local",
            error: "Invalid email address",
            field: "email",
            value: "bad@test.local",
            expected: "valid email",
        },
    ],
    warnings: ["Row 4 was skipped"],
    columnMapping: { "First Name": "first_name", Email: "email" },
    previewData: [
        {
            first_name: "Grace",
            last_name: "Hopper",
            email: "grace@test.local",
            sex: "female",
            contact_number: "555-0202",
        },
        {
            first_name: "Alan",
            last_name: "Turing",
            email: "alan@test.local",
            sex: "male",
            contact_number: "555-0303",
        },
    ],
};

function renderPage() {
    return renderWithRouter(<ManageStudents />, {
        route: "/dashboard/students",
    });
}

function modalFor(name: RegExp | string) {
    return screen
        .getByRole("heading", { name })
        .closest(".mgmt-modal") as HTMLElement;
}

async function fillRequiredCreateFields(
    user: ReturnType<typeof userEvent.setup>,
    modal: HTMLElement,
    values: [string, string, string]
) {
    const required = Array.from(
        modal.querySelectorAll<HTMLInputElement>("input[required]")
    );
    expect(required).toHaveLength(3);
    required.forEach((input) => expect(input).toBeRequired());

    await user.type(required[0], values[0]);
    await user.type(required[1], values[1]);
    await user.type(required[2], values[2]);
}

describe("ManageStudents page", () => {
    beforeEach(() => {
        mocks.getAll.mockResolvedValue({ data: { data: [STUDENT] } });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
        mocks.importPreview.mockResolvedValue({ data: { data: PREVIEW } });
        mocks.importStudents.mockResolvedValue({
            data: { data: { success: 2, failed: 0, errors: [], warnings: [] } },
        });
        mocks.isEnabled.mockReturnValue(true);
    });

    it("shows a loading state and then renders the student list", async () => {
        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(await screen.findByText("Alice B Smith")).toBeInTheDocument();
        expect(screen.getByText("alice@test.local")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith(7);
    });

    it("renders the empty state when there are no students", async () => {
        mocks.getAll.mockResolvedValue({ data: { data: [] } });
        renderPage();

        expect(
            await screen.findByText("No students yet. Add one to get started.")
        ).toBeInTheDocument();
    });

    it("shows an error message when the student list fails to load", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        renderPage();

        expect(
            (await screen.findAllByText("Failed to load students")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("creates a student, validates required fields and surfaces a duplicate email error", async () => {
        const user = userEvent.setup();
        mocks.create
            .mockResolvedValueOnce({ data: { isOk: true } })
            .mockRejectedValueOnce({
                response: { data: { message: "Email already registered" } },
            });
        renderPage();
        await screen.findByText("Alice B Smith");

        await user.click(screen.getByRole("button", { name: "+ Add Student" }));
        const modal = modalFor("Add Student");
        await fillRequiredCreateFields(user, modal, [
            "Grace",
            "Hopper",
            "grace@test.local",
        ]);
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    first_name: "Grace",
                    last_name: "Hopper",
                    email: "grace@test.local",
                    school_id: 7,
                })
            )
        );
        expect(
            await screen.findByText("Student created successfully")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "+ Add Student" }));
        const secondModal = modalFor("Add Student");
        await fillRequiredCreateFields(user, secondModal, [
            "Grace",
            "Hopper",
            "taken@test.local",
        ]);
        await user.click(
            within(secondModal).getByRole("button", { name: "Create" })
        );

        expect(
            (await screen.findAllByText("Email already registered")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("edits a student and deletes one after confirmation", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Alice B Smith");

        await user.click(screen.getByRole("button", { name: "Edit student" }));
        const modal = modalFor("Edit Student");
        const required = Array.from(
            modal.querySelectorAll<HTMLInputElement>("input[required]")
        );
        await user.clear(required[0]);
        await user.type(required[0], "Alicia");
        await user.click(within(modal).getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mocks.update).toHaveBeenCalledWith(
                "student-1",
                expect.objectContaining({ first_name: "Alicia" })
            )
        );
        expect(
            await screen.findByText("Student updated successfully")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Delete student" }));
        await waitFor(() =>
            expect(mocks.remove).toHaveBeenCalledWith("student-1")
        );
        expect(await screen.findByText("Student deleted")).toBeInTheDocument();
        expect(confirmSpy).toHaveBeenCalledWith("Delete Alice Smith?");
    });

    it("previews and commits a student import", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Alice B Smith");

        await user.click(
            screen.getByRole("button", { name: "Import CSV/Excel" })
        );
        const modal = modalFor("Import Students (CSV/Excel)");
        const fileInput = modal.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;

        await user.upload(
            fileInput,
            new File(["first_name,last_name,email"], "students.csv", {
                type: "text/csv",
            })
        );

        expect(await screen.findByText("Import Preview")).toBeInTheDocument();
        expect(screen.getByText("2 valid / 3 total rows")).toBeInTheDocument();
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        expect(screen.getByText("grace@test.local")).toBeInTheDocument();
        expect(mocks.importPreview).toHaveBeenCalledOnce();

        await user.click(
            screen.getByRole("button", { name: "Confirm Import (2)" })
        );

        await waitFor(() =>
            expect(mocks.importStudents).toHaveBeenCalledOnce()
        );
        expect(
            await screen.findByText(
                "Import completed: 2 success, 0 failed"
            )
        ).toBeInTheDocument();
        expect(
            (await screen.findAllByText(/Import Complete/)).length
        ).toBeGreaterThanOrEqual(1);
    });
});
