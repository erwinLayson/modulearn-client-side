import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test-utils";
import ManageSubjects from "../../../pages/school_admin/ManageSubjects";

const mocks = vi.hoisted(() => ({
    getSubjects: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getFaculties: vi.fn(),
    getAvailableFaculties: vi.fn(),
    assignFaculty: vi.fn(),
    removeFaculty: vi.fn(),
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

vi.mock("../../../api/subjects", () => ({
    subjectApi: {
        getBySchoolId: mocks.getSubjects,
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
        getFaculties: mocks.getFaculties,
        getAvailableFaculties: mocks.getAvailableFaculties,
        assignFaculty: mocks.assignFaculty,
        removeFaculty: mocks.removeFaculty,
    },
}));

const SUBJECT = {
    id: "sub-1",
    name: "Mathematics",
    subject_code: "MATH101",
    description: "Numbers and algebra",
    school_id: 7,
    admin_id: "admin-1",
    created_at: "2025-06-01T00:00:00.000Z",
    updated_at: null,
};

const ASSIGNED = {
    id: "fac-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@test.local",
};

const CANDIDATE = {
    id: "fac-2",
    first_name: "Grace",
    last_name: "Hopper",
    email: "grace@test.local",
};

function renderPage() {
    return renderWithRouter(<ManageSubjects />, {
        route: "/dashboard/subjects",
    });
}

function modalFor(name: RegExp | string) {
    return screen
        .getByRole("heading", { name })
        .closest(".mgmt-modal") as HTMLElement;
}

describe("ManageSubjects page", () => {
    beforeEach(() => {
        mocks.getSubjects.mockResolvedValue({ data: { data: [SUBJECT] } });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
        mocks.getFaculties.mockResolvedValue({ data: { data: [ASSIGNED] } });
        mocks.getAvailableFaculties.mockResolvedValue({
            data: { data: [ASSIGNED, CANDIDATE] },
        });
        mocks.assignFaculty.mockResolvedValue({ data: { isOk: true } });
        mocks.removeFaculty.mockResolvedValue({ data: { isOk: true } });
    });

    it("shows a loading state and then renders the subject cards", async () => {
        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(await screen.findByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("MATH101")).toBeInTheDocument();
        expect(screen.getByText("Numbers and algebra")).toBeInTheDocument();
        expect(mocks.getSubjects).toHaveBeenCalledWith(7);
    });

    it("renders the empty state when there are no subjects", async () => {
        mocks.getSubjects.mockResolvedValue({ data: { data: [] } });
        renderPage();

        expect(
            await screen.findByText("No subjects yet. Add one to get started.")
        ).toBeInTheDocument();
    });

    it("shows an error message when the subject list fails to load", async () => {
        mocks.getSubjects.mockRejectedValue(new Error("network down"));
        renderPage();

        expect(
            (await screen.findAllByText("Failed to load subjects")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("validates the subject name and creates a subject", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Mathematics");

        await user.click(screen.getByRole("button", { name: "+ Add Subject" }));
        const modal = modalFor("Add Subject");
        const inputs = within(modal).getAllByRole("textbox");
        expect(inputs[0]).toBeRequired();

        await user.type(inputs[0], "Science");
        await user.type(inputs[1], "SCI101");
        await user.type(inputs[2], "Matter and energy");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Science",
                    subject_code: "SCI101",
                    description: "Matter and energy",
                    school_id: 7,
                    admin_id: "admin-1",
                })
            )
        );
        expect(
            await screen.findByText("Subject created successfully")
        ).toBeInTheDocument();
    });

    it("edits a subject and deletes one after confirmation", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Mathematics");

        await user.click(screen.getByRole("button", { name: "Edit subject" }));
        const modal = modalFor("Edit Subject");
        const inputs = within(modal).getAllByRole("textbox");
        await user.clear(inputs[0]);
        await user.type(inputs[0], "Advanced Mathematics");
        await user.click(within(modal).getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mocks.update).toHaveBeenCalledWith(
                "sub-1",
                expect.objectContaining({ name: "Advanced Mathematics" })
            )
        );
        expect(
            await screen.findByText("Subject updated successfully")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Delete subject" }));
        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("sub-1"));
        expect(await screen.findByText("Subject deleted")).toBeInTheDocument();
        expect(confirmSpy).toHaveBeenCalledWith("Delete Mathematics?");
    });

    it("opens the subject detail to assign and remove a faculty", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Mathematics");

        await user.click(screen.getByRole("heading", { name: "Mathematics" }));
        expect(
            await screen.findByRole("heading", { name: /Assigned Teachers/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("cell", { name: "ada@test.local" })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "+ Assign Faculty" })
        );
        const modal = modalFor("Assign Faculty to Mathematics");
        expect(await within(modal).findByText("Grace Hopper")).toBeInTheDocument();
        await user.click(within(modal).getByRole("button", { name: "Assign" }));

        await waitFor(() =>
            expect(mocks.assignFaculty).toHaveBeenCalledWith("sub-1", "fac-2")
        );
        expect(await screen.findByText("Faculty assigned")).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Remove from subject" })
        );
        await waitFor(() =>
            expect(mocks.removeFaculty).toHaveBeenCalledWith("sub-1", "fac-1")
        );
        expect(await screen.findByText("Faculty removed")).toBeInTheDocument();
        expect(confirmSpy).toHaveBeenCalledWith(
            "Remove this faculty from the subject?"
        );
    });
});
