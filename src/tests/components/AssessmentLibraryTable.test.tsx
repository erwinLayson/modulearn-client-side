import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssessmentLibraryTable from "../../components/faculty/assessments/AssessmentLibraryTable";
import type { ModuleActivityTemplate } from "../../service/faculty/myModulesService";

describe("AssessmentLibraryTable", () => {
  const mockTemplates: ModuleActivityTemplate[] = [
    {
      id: "tmpl-1",
      module_id: "mod-1",
      title: "Algebra Fundamentals Quiz",
      category: "quizzes",
      max_score: 25,
      instructions: "1. Solve for x: 2x + 4 = 12\n2. Factor x^2 - 9\n3. Simplify (x+1)(x-1)",
      sort_order: 1,
      created_at: "2026-02-15T08:30:00.000Z",
    },
    {
      id: "tmpl-2",
      module_id: "mod-1",
      title: "Quarterly Periodical Exam",
      category: "exams",
      max_score: 100,
      instructions: "Comprehensive examination covering Units 1 to 4.\n- Section A: Multiple choice\n- Section B: Problem solving\n- Section C: Essay",
      sort_order: 2,
      created_at: "2026-03-01T10:00:00.000Z",
    },
    {
      id: "tmpl-3",
      module_id: "mod-1",
      title: "Quadratic Equation Worksheet",
      category: "activities",
      max_score: 15,
      instructions: "Complete all practice problems on page 42.",
      sort_order: 3,
      created_at: "2026-01-20T09:15:00.000Z",
    },
    {
      id: "tmpl-4",
      module_id: "mod-1",
      title: "Linear Graphing Activity",
      category: "activities",
      max_score: 20,
      instructions: null,
      sort_order: 4,
      created_at: undefined, // missing date testing
    },
  ];

  const defaultProps = {
    templates: mockTemplates,
    creatorName: "Prof. Dennis Dela Cruz",
    moduleTitle: "Algebra & Trigonometry",
    moduleSubject: "Mathematics",
    hasAssignments: true,
    isArchived: false,
    loading: false,
    error: null,
    onCreateTemplate: vi.fn(),
    onEditTemplate: vi.fn(),
    onDeleteTemplate: vi.fn(),
    onAssignTemplate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the table headers, activity items, points, creator, and formatted dates", () => {
    render(<AssessmentLibraryTable {...defaultProps} />);

    // Header count
    expect(screen.getByText("Activity Templates (4)")).toBeInTheDocument();

    // Column headers
    expect(screen.getByText("Activity Name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Creator")).toBeInTheDocument();
    expect(screen.getByText("Date Created")).toBeInTheDocument();

    // Check row data
    expect(screen.getByText("Algebra Fundamentals Quiz")).toBeInTheDocument();
    expect(screen.getByText("Quarterly Periodical Exam")).toBeInTheDocument();
    expect(screen.getByText("Quadratic Equation Worksheet")).toBeInTheDocument();
    expect(screen.getByText("Linear Graphing Activity")).toBeInTheDocument();

    // Points formatting
    expect(screen.getByText("25 pts")).toBeInTheDocument();
    expect(screen.getByText("100 pts")).toBeInTheDocument();
    expect(screen.getByText("15 pts")).toBeInTheDocument();
    expect(screen.getByText("20 pts")).toBeInTheDocument();

    // Calculated item counts
    expect(screen.getByText("3 items")).toBeInTheDocument(); // from "1.", "2.", "3."
    expect(screen.getByText("3 tasks")).toBeInTheDocument(); // from "- Section A", "- Section B", "- Section C"
    expect(screen.getAllByText("1 task")).toHaveLength(2); // single / unitemized fallback

    // Creator displayed without exposing user IDs
    const creatorInstances = screen.getAllByText("Prof. Dennis Dela Cruz");
    expect(creatorInstances.length).toBe(4);

    // Safe date handling
    expect(screen.getByText("Feb 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("Mar 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jan 20, 2026")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); // missing date
  });

  it("filters activities by search query and shows clear button", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search activities by name/i);
    await user.type(searchInput, "Algebra");

    // Only Algebra Fundamentals Quiz should be visible
    expect(screen.getByText("Algebra Fundamentals Quiz")).toBeInTheDocument();
    expect(screen.queryByText("Quarterly Periodical Exam")).not.toBeInTheDocument();
    expect(screen.queryByText("Quadratic Equation Worksheet")).not.toBeInTheDocument();

    // Result count reflects filtered result
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1–1 of 1 activity");

    // Clear search
    const clearBtn = screen.getByRole("button", { name: /Clear search/i });
    await user.click(clearBtn);

    expect(screen.getByText("Quarterly Periodical Exam")).toBeInTheDocument();
  });

  it("filters activities by type (Assignments, Quizzes, Exams)", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    const typeSelect = screen.getByRole("combobox", { name: /Filter by activity type/i });

    // Filter by quizzes
    await user.selectOptions(typeSelect, "quizzes");
    expect(screen.getByText("Algebra Fundamentals Quiz")).toBeInTheDocument();
    expect(screen.queryByText("Quarterly Periodical Exam")).not.toBeInTheDocument();
    expect(screen.queryByText("Quadratic Equation Worksheet")).not.toBeInTheDocument();

    // Clear Filters button should be visible
    const clearFiltersBtn = screen.getByRole("button", { name: "Clear Filters" });
    await user.click(clearFiltersBtn);

    // All should be visible again
    expect(screen.getByText("Quarterly Periodical Exam")).toBeInTheDocument();
  });

  it("displays no-match empty state when search criteria finds no activities", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search activities by name/i);
    await user.type(searchInput, "Nonexistent Activity 999");

    expect(screen.getByText("No matching activities found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByText("Algebra Fundamentals Quiz")).toBeInTheDocument();
  });

  it("sorts activities when clicking column headers", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    // Click Points header to sort by score
    const pointsHeader = screen.getByRole("columnheader", { name: /Points/i });
    await user.click(pointsHeader); // First click: asc (15, 20, 25, 100)

    const rowsAsc = screen.getAllByRole("row").slice(1);
    expect(within(rowsAsc[0]).getByText("Quadratic Equation Worksheet")).toBeInTheDocument(); // 15 pts

    await user.click(pointsHeader); // Second click: desc (100, 25, 20, 15)
    const rowsDesc = screen.getAllByRole("row").slice(1);
    expect(within(rowsDesc[0]).getByText("Quarterly Periodical Exam")).toBeInTheDocument(); // 100 pts
  });

  it("opens assessment preview modal when clicking the activity title link", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    const titleLink = screen.getByRole("button", { name: "Algebra Fundamentals Quiz" });
    await user.click(titleLink);

    // Modal dialog is shown
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Algebra Fundamentals Quiz")).toBeInTheDocument();
    expect(within(dialog).getAllByText("25 pts").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("Prof. Dennis Dela Cruz")).toBeInTheDocument();
    expect(within(dialog).getByText(/Solve for x: 2x \+ 4 = 12/)).toBeInTheDocument();

    // Click "Assign to Classroom" inside preview
    const assignBtn = within(dialog).getByRole("button", { name: "Assign to Classroom" });
    await user.click(assignBtn);
    expect(defaultProps.onAssignTemplate).toHaveBeenCalledWith(mockTemplates[0]);

    // Dialog should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("provides row actions dropdown with Preview, Assign to Classroom, Edit, and Delete", async () => {
    const user = userEvent.setup();
    render(<AssessmentLibraryTable {...defaultProps} />);

    const triggerBtn = screen.getByRole("button", {
      name: "Actions for Algebra Fundamentals Quiz",
    });
    await user.click(triggerBtn);

    // Menu items
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /Preview/i })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /Assign to Classroom/i })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /Edit/i })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /Delete/i })).toBeInTheDocument();

    // Click Edit
    await user.click(within(menu).getByRole("menuitem", { name: /Edit/i }));
    expect(defaultProps.onEditTemplate).toHaveBeenCalledWith(mockTemplates[0]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders empty state when no templates exist", () => {
    render(<AssessmentLibraryTable {...defaultProps} templates={[]} />);

    expect(screen.getByText("No Activity Templates Yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Create reusable assignments, quizzes, and exams/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create your first template" })).toBeInTheDocument();
  });

  it("renders skeleton rows when loading is true", () => {
    const { container } = render(<AssessmentLibraryTable {...defaultProps} loading={true} />);

    const skeletonRows = container.querySelectorAll(".assessment-skeleton-row");
    expect(skeletonRows.length).toBeGreaterThan(0);
  });
});
