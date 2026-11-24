import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LessonContentRenderer from "../../components/faculty/materials/LessonContentRenderer";

describe("LessonContentRenderer", () => {
  it("renders headings with anchor IDs and correct tags", () => {
    const markdown = `# Introduction to ModuLearn
## Architecture Overview
### Sub-components`;

    const { container } = render(<LessonContentRenderer content={markdown} />);

    const h1 = container.querySelector("h1");
    const h2 = container.querySelector("h2");
    const h3 = container.querySelector("h3");

    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("Introduction to ModuLearn");
    expect(h1?.id).toBe("introduction-to-modulearn");

    expect(h2).toBeInTheDocument();
    expect(h2).toHaveTextContent("Architecture Overview");
    expect(h2?.id).toBe("architecture-overview");

    expect(h3).toBeInTheDocument();
    expect(h3).toHaveTextContent("Sub-components");
    expect(h3?.id).toBe("sub-components");
  });

  it("renders blockquotes and callout alerts correctly", () => {
    const markdown = `> Standard blockquote text

> [!NOTE] This is an important note for teachers.

> [!TIP] Pro tip for organizing modules.`;

    const { container } = render(<LessonContentRenderer content={markdown} />);

    expect(screen.getByText("Standard blockquote text")).toBeInTheDocument();

    const callouts = container.querySelectorAll(".reader-callout");
    expect(callouts.length).toBe(2);
    expect(container.querySelector(".reader-callout--note")).toBeInTheDocument();
    expect(container.querySelector(".reader-callout--tip")).toBeInTheDocument();
    expect(screen.getByText("This is an important note for teachers.")).toBeInTheDocument();
  });

  it("renders markdown tables with headers and rows", () => {
    const markdown = `| Topic | Duration | Difficulty |
| --- | --- | --- |
| React Basics | 45 min | Beginner |
| State Management | 90 min | Intermediate |`;

    const { container } = render(<LessonContentRenderer content={markdown} />);

    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent("Topic");
    expect(headers[1]).toHaveTextContent("Duration");
    expect(headers[2]).toHaveTextContent("Difficulty");

    expect(screen.getByText("React Basics")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
  });

  it("renders unordered and ordered lists", () => {
    const markdown = `- Item One
- Item Two
- Item Three

1. Step 1
2. Step 2`;

    const { container } = render(<LessonContentRenderer content={markdown} />);

    const ul = container.querySelector("ul");
    const ol = container.querySelector("ol");

    expect(ul).toBeInTheDocument();
    expect(ol).toBeInTheDocument();
    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("renders fenced code blocks and inline code", () => {
    const markdown = `Use the \`useNavigate\` hook:

\`\`\`typescript
const navigate = useNavigate();
navigate("/dashboard");
\`\`\``;

    const { container } = render(<LessonContentRenderer content={markdown} />);

    const inlineCode = container.querySelector("code:not(pre code)");
    expect(inlineCode).toHaveTextContent("useNavigate");

    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('navigate("/dashboard");');
  });

  it("renders images with alt text", () => {
    const markdown = `![Class Diagram](/images/diagram.png)`;

    render(<LessonContentRenderer content={markdown} />);

    const img = screen.getByRole("img", { name: "Class Diagram" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/diagram.png");
  });
});
