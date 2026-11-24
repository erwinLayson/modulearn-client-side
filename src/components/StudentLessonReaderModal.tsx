import React, { useState, useEffect, useCallback } from "react";
import type { StudentLessonItem } from "../api/modules";
import Tooltip from "./Tooltip";

/* ------------------------------------------------------------
   Semantic SVG Icons for Reader Controls & Metadata
   ------------------------------------------------------------ */

function BookOpenIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.75A1.125 1.125 0 0 0 16.125 2.625h-8.25A1.125 1.125 0 0 0 6.75 3.75v3.284"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block", color: "#16a34a" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.875rem", height: "0.875rem", display: "inline-block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.875rem", height: "0.875rem", display: "inline-block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function AcademicCapIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.875rem", height: "0.875rem", display: "inline-block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557c0 1.096.32 2.118.87 2.977"
      />
    </svg>
  );
}

/* ------------------------------------------------------------
   Helper Functions
   ------------------------------------------------------------ */

function getTeacherInitials(name: string | null): string {
  if (!name) return "T";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function calculateReadingStats(content: string | null) {
  if (!content || !content.trim()) {
    return { wordCount: 0, readTimeText: "Quick note" };
  }
  const clean = content.trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  const readTimeText = words <= 30 ? "< 1 min read" : `${minutes} min read`;
  return { wordCount: words, readTimeText };
}

function formatAssignedDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------
   Safe Inline Markdown Parser
   Parses **bold**, *italic*, `code`, and [links](url) safely
   ------------------------------------------------------------ */

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex tokens: code, bold, italic, markdown link
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="student-reader-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **bold**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="student-reader-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *italic* or _italic_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      return (
        <em key={index} className="student-reader-italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isSafe = /^https?:\/\//i.test(href);
      return (
        <a
          key={index}
          href={isSafe ? href : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="student-reader-link"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

/* ------------------------------------------------------------
   Structured Lesson Content Renderer
   Transforms markdown / text into beautiful, structured elements
   ------------------------------------------------------------ */

export function LessonFormattedContent({ content }: { content: string | null }) {
  if (!content || !content.trim()) {
    return (
      <div className="student-reader-empty">
        <div className="student-reader-empty-icon" aria-hidden="true">
          <BookOpenIcon />
        </div>
        <h3 className="student-reader-empty-title">No Written Content</h3>
        <p className="student-reader-empty-desc">
          No written notes or instructions have been attached to this lesson yet. Check back
          later or consult with your teacher.
        </p>
      </div>
    );
  }

  const rawLines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;

  let currentParagraphLines: string[] = [];
  let currentListItems: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let currentQuoteLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join("\n");
      nodes.push(
        <p key={`p-${index++}`} className="student-reader-paragraph">
          {text.split("\n").map((line, lIdx, arr) => (
            <React.Fragment key={lIdx}>
              {parseInlineFormatting(line)}
              {lIdx < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0 && currentListType) {
      if (currentListType === "ul") {
        nodes.push(
          <ul key={`ul-${index++}`} className="student-reader-ul">
            {currentListItems.map((item, itemIdx) => (
              <li key={itemIdx}>{parseInlineFormatting(item)}</li>
            ))}
          </ul>
        );
      } else {
        nodes.push(
          <ol key={`ol-${index++}`} className="student-reader-ol">
            {currentListItems.map((item, itemIdx) => (
              <li key={itemIdx}>{parseInlineFormatting(item)}</li>
            ))}
          </ol>
        );
      }
      currentListItems = [];
      currentListType = null;
    }
  };

  const flushQuote = () => {
    if (currentQuoteLines.length > 0) {
      nodes.push(
        <blockquote key={`quote-${index++}`} className="student-reader-blockquote">
          {currentQuoteLines.map((line, qIdx, arr) => (
            <p key={qIdx} className="student-reader-quote-line">
              {parseInlineFormatting(line)}
              {qIdx < arr.length - 1 && <br />}
            </p>
          ))}
        </blockquote>
      );
      currentQuoteLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check code fence ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        nodes.push(
          <pre key={`code-${index++}`} className="student-reader-codeblock">
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        flushQuote();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(<hr key={`hr-${index++}`} className="student-reader-hr" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(
        <h4 key={`h3-${index++}`} className="student-reader-h3">
          {parseInlineFormatting(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(
        <h3 key={`h2-${index++}`} className="student-reader-h2">
          {parseInlineFormatting(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(
        <h2 key={`h1-${index++}`} className="student-reader-h1">
          {parseInlineFormatting(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote: > ...
    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      currentQuoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    } else if (currentQuoteLines.length > 0) {
      flushQuote();
    }

    // Bullet list: - or *
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      if (currentListType && currentListType !== "ul") flushList();
      currentListType = "ul";
      currentListItems.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    // Numbered list: 1. ...
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (currentListType && currentListType !== "ol") flushList();
      currentListType = "ol";
      currentListItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    // If we were inside a list but this line is neither bullet nor numbered
    if (currentListType) {
      flushList();
    }

    // Standard paragraph line
    currentParagraphLines.push(line);
  }

  // Flush any remainder
  if (inCodeBlock && codeBlockLines.length > 0) {
    nodes.push(
      <pre key={`code-${index++}`} className="student-reader-codeblock">
        <code>{codeBlockLines.join("\n")}</code>
      </pre>
    );
  }
  flushParagraph();
  flushList();
  flushQuote();

  return <div className="student-reader-content">{nodes}</div>;
}

/* ------------------------------------------------------------
   Main Component: StudentLessonReaderModal
   ------------------------------------------------------------ */

export interface StudentLessonReaderModalProps {
  lesson: StudentLessonItem;
  onClose: () => void;
}

export default function StudentLessonReaderModal({
  lesson,
  onClose,
}: StudentLessonReaderModalProps) {
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape or exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onClose]);

  const handleCopy = useCallback(async () => {
    if (!lesson.content) return;
    try {
      await navigator.clipboard.writeText(lesson.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lesson.content]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const stats = calculateReadingStats(lesson.content);
  const teacherInitials = getTeacherInitials(lesson.teacher_name);
  const assignedDateFormatted = formatAssignedDate(lesson.assigned_at);

  return (
    <div
      className="mgmt-modal-overlay student-reader-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`student-reader-modal ${
          isFullscreen ? "student-reader-modal--fullscreen" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-modal-title"
      >
        {/* Top Header & Reading Controls Toolbar */}
        <header className="student-reader-topbar">
          <div className="student-reader-context-pills">
            <span className="materials-type-badge materials-type-badge--written">
              <BookOpenIcon />
              <span>Written Lesson</span>
            </span>

            {lesson.subject_name && (
              <span className="student-reader-pill student-reader-pill--subject">
                {lesson.subject_name}
              </span>
            )}

            <span className="student-reader-pill student-reader-pill--module" title={lesson.module_title}>
              Module: {lesson.module_title}
            </span>
          </div>

          <div className="student-reader-tools">
            {/* Font Size Adjuster */}
            <div
              className="student-reader-font-group"
              role="group"
              aria-label="Adjust font size"
            >
              <Tooltip label="Small text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    fontSize === "sm" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => setFontSize("sm")}
                  aria-label="Small font size"
                  aria-pressed={fontSize === "sm"}
                >
                  A-
                </button>
              </Tooltip>
              <Tooltip label="Default text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    fontSize === "md" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => setFontSize("md")}
                  aria-label="Medium font size"
                  aria-pressed={fontSize === "md"}
                >
                  A
                </button>
              </Tooltip>
              <Tooltip label="Large text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    fontSize === "lg" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => setFontSize("lg")}
                  aria-label="Large font size"
                  aria-pressed={fontSize === "lg"}
                >
                  A+
                </button>
              </Tooltip>
            </div>

            {/* Copy Content */}
            <Tooltip label={copied ? "Copied!" : "Copy lesson notes"}>
              <button
                type="button"
                className={`student-reader-tool-btn ${
                  copied ? "student-reader-tool-btn--success" : ""
                }`}
                onClick={handleCopy}
                disabled={!lesson.content}
                aria-label="Copy lesson content"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span className="student-reader-tool-label">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </Tooltip>

            {/* Print / PDF */}
            <Tooltip label="Print or save as PDF">
              <button
                type="button"
                className="student-reader-tool-btn"
                onClick={handlePrint}
                aria-label="Print lesson"
              >
                <PrinterIcon />
                <span className="student-reader-tool-label">Print</span>
              </button>
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Tooltip label={isFullscreen ? "Exit full screen" : "Full screen reading"}>
              <button
                type="button"
                className="student-reader-tool-btn"
                onClick={() => setIsFullscreen((prev) => !prev)}
                aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
              </button>
            </Tooltip>

            {/* Close Button in Header */}
            <button
              type="button"
              className="student-reader-close-btn"
              onClick={onClose}
              aria-label="Close reader modal"
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </header>

        {/* Lesson Hero Banner & Metadata */}
        <div className="student-reader-hero">
          <h2 id="reader-modal-title" className="student-reader-title">
            {lesson.title}
          </h2>

          <div className="student-reader-meta-bar">
            {/* Teacher Card */}
            {lesson.teacher_name && (
              <div className="student-reader-meta-card student-reader-meta-card--teacher">
                <div className="student-reader-avatar" aria-hidden="true">
                  {teacherInitials}
                </div>
                <div className="student-reader-meta-text">
                  <span className="student-reader-meta-primary">{lesson.teacher_name}</span>
                  <span className="student-reader-meta-secondary">Instructor</span>
                </div>
              </div>
            )}

            {/* Classroom & Academic Year */}
            <div className="student-reader-meta-card">
              <div className="student-reader-meta-icon" aria-hidden="true">
                <AcademicCapIcon />
              </div>
              <div className="student-reader-meta-text">
                <span className="student-reader-meta-primary">{lesson.class_name}</span>
                <span className="student-reader-meta-secondary">
                  {lesson.school_year_name || "Academic Year"}
                </span>
              </div>
            </div>

            {/* Reading Stats Chip */}
            <div className="student-reader-meta-chip">
              <ClockIcon />
              <span>{stats.readTimeText}</span>
              <span className="student-reader-meta-dot" aria-hidden="true">·</span>
              <span>{stats.wordCount} {stats.wordCount === 1 ? "word" : "words"}</span>
            </div>

            {/* Assigned Date Chip */}
            {assignedDateFormatted && (
              <div className="student-reader-meta-chip">
                <CalendarIcon />
                <span>Assigned {assignedDateFormatted}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Reading Canvas */}
        <main
          className="student-reader-scroll-canvas"
          tabIndex={0}
          role="region"
          aria-label="Lesson content reader"
        >
          <article
            className={`student-reader-paper student-reader-paper--${fontSize}`}
          >
            <div className="student-reader-paper-header">
              <span className="student-reader-paper-tag">Lesson Notes & Instructions</span>
            </div>

            <LessonFormattedContent content={lesson.content} />
          </article>
        </main>

        {/* Modal Footer */}
        <footer className="student-reader-footer">
          <div className="student-reader-footer-hint">
            <span>Tip: Press <strong>Esc</strong> to close or click outside.</span>
          </div>

          <div className="student-reader-footer-actions">
            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost"
              onClick={handleCopy}
              disabled={!lesson.content}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? "Copied" : "Copy Notes"}</span>
            </button>

            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost"
              onClick={handlePrint}
            >
              <PrinterIcon />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="mgmt-btn mgmt-btn--primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </div>

      {/* Hidden Print Container for Clean Single-Page Printing */}
      <div className="student-reader-print-document" aria-hidden="true">
        <div className="student-reader-print-header">
          <h1 className="student-reader-print-title">{lesson.title}</h1>
          <div className="student-reader-print-meta">
            <div><strong>Subject:</strong> {lesson.subject_name || "General"}</div>
            <div><strong>Module:</strong> {lesson.module_title}</div>
            <div><strong>Class:</strong> {lesson.class_name} ({lesson.school_year_name})</div>
            {lesson.teacher_name && <div><strong>Instructor:</strong> {lesson.teacher_name}</div>}
            {assignedDateFormatted && <div><strong>Assigned:</strong> {assignedDateFormatted}</div>}
          </div>
        </div>
        <hr />
        <div className="student-reader-print-body">
          <LessonFormattedContent content={lesson.content} />
        </div>
        <div className="student-reader-print-footer">
          Printed from ModuLearn Learning Management System
        </div>
      </div>
    </div>
  );
}
