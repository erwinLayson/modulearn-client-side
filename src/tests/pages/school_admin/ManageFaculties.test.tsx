import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test-utils";
import ManageFaculties from "../../../pages/school_admin/ManageFaculties";

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

vi.mock("../../../api/faculties", () => ({
    facultyApi: {
        getAll: mocks.getAll,
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
    },
}));

const FACULTY = {
    id: "fac-1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@test.local",
    school_id: 7,
    contact_number: "555-0101",
    admin_id: "admin-1",
    faculty_role: "teacher" as const,
};

function renderPage() {
    return renderWithRouter(<ManageFaculties />, {
        route: "/dashboard/faculties",
    });
}

describe("ManageFaculties page", () => {
    beforeEach(() => {
        mocks.getAll.mockResolvedValue({ data: { data: [FACULTY] } });
        mocks.create.mockResolvedValue({ data: { isOk: true } });
        mocks.update.mockResolvedValue({ data: { isOk: true } });
        mocks.remove.mockResolvedValue({ data: { isOk: true } });
    });

    it("shows a loading state and then renders the faculty table", async () => {
        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
        expect(screen.getByText("ada@test.local")).toBeInTheDocument();
        expect(screen.getByText("555-0101")).toBeInTheDocument();
        expect(screen.getByText("Teacher")).toBeInTheDocument();
        expect(mocks.getAll).toHaveBeenCalledWith(7);
    });

    it("renders the empty state when there are no faculties", async () => {
        mocks.getAll.mockResolvedValue({ data: { data: [] } });
        renderPage();

        expect(
            await screen.findByText("No faculties yet. Add one to get started.")
        ).toBeInTheDocument();
    });

    it("shows an error message when the faculty list fails to load", async () => {
        mocks.getAll.mockRejectedValue(new Error("network down"));
        renderPage();

        expect(
            (await screen.findAllByText("Failed to load faculties")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("validates required fields and creates a faculty", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Ada Lovelace");

        await user.click(screen.getByRole("button", { name: "+ Add Faculty" }));
        const modal = screen
            .getByRole("heading", { name: "Add Faculty" })
            .closest(".mgmt-modal") as HTMLElement;
        const inputs = within(modal).getAllByRole("textbox");

        expect(inputs[0]).toBeRequired();
        expect(inputs[1]).toBeRequired();
        expect(inputs[2]).toBeRequired();

        await user.type(inputs[0], "Grace");
        await user.type(inputs[1], "Hopper");
        await user.type(inputs[2], "grace@test.local");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        await waitFor(() =>
            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    first_name: "Grace",
                    last_name: "Hopper",
                    email: "grace@test.local",
                    school_id: 7,
                    faculty_role: "teacher",
                })
            )
        );
        expect(
            await screen.findByText("Faculty created successfully")
        ).toBeInTheDocument();
    });

    it("shows the server message when creating a duplicate faculty", async () => {
        const user = userEvent.setup();
        mocks.create.mockRejectedValueOnce({
            response: { data: { message: "Email already in use" } },
        });
        renderPage();
        await screen.findByText("Ada Lovelace");

        await user.click(screen.getByRole("button", { name: "+ Add Faculty" }));
        const modal = screen
            .getByRole("heading", { name: "Add Faculty" })
            .closest(".mgmt-modal") as HTMLElement;
        const inputs = within(modal).getAllByRole("textbox");
        await user.type(inputs[0], "Grace");
        await user.type(inputs[1], "Hopper");
        await user.type(inputs[2], "taken@test.local");
        await user.click(within(modal).getByRole("button", { name: "Create" }));

        expect(
            (await screen.findAllByText("Email already in use")).length
        ).toBeGreaterThanOrEqual(1);
    });

    it("edits a faculty and deletes one after confirmation", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPage();
        await screen.findByText("Ada Lovelace");

        await user.click(screen.getByRole("button", { name: "Edit teacher" }));
        const editModal = screen
            .getByRole("heading", { name: "Edit Faculty" })
            .closest(".mgmt-modal") as HTMLElement;
        const editInputs = within(editModal).getAllByRole("textbox");
        await user.clear(editInputs[0]);
        await user.type(editInputs[0], "Grace");
        await user.click(
            within(editModal).getByRole("button", { name: "Save" })
        );

        await waitFor(() =>
            expect(mocks.update).toHaveBeenCalledWith(
                "fac-1",
                expect.objectContaining({ first_name: "Grace" })
            )
        );
        expect(
            await screen.findByText("Faculty updated successfully")
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Delete teacher" }));
        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("fac-1"));
        expect(await screen.findByText("Faculty deleted")).toBeInTheDocument();
        expect(confirmSpy).toHaveBeenCalledWith("Delete Ada Lovelace?");
    });
});
