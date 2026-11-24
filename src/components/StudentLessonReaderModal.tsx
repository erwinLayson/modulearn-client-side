import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { StudentLessonItem } from "../api/modules";
import Tooltip from "./Tooltip";
import {
  loadReaderPreferences,
  saveReaderPreferences,
  getReadingProgress,
  recordReadingProgress,
  isMeaningfulEngagement,
  type ReaderPreferences,
  type ReaderTheme,
  type ReaderLineSpacing,
} from "../service/readingProgressService";

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

function ListBulletIcon() {
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function AdjustmentsIcon() {
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
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
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

function ArrowLeftIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "inline-block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

/* ------------------------------------------------------------
   Helper Functions
   ------------------------------------------------------------ */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTeacherInitials(name: string | null): string {
  if (!name) return "T";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function calculateReadingStats(content: string | null) {
  if (!content || !content.trim()) {
    return { wordCount: 0, readTimeText: "Quick note" };
  }
  const clean = content.trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  const readTimeText = words <= 30 ? "< 1 min read" : `${minutes} min read`;
  return { wordCount: words, readTimeText };
}

export function formatAssignedDate(dateStr?: string | null): string | null {
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

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export function extractTableOfContents(content: string | null): TocHeading[] {
  if (!content) return [];
  const lines = content.split("\n");
  const headings: TocHeading[] = [];
  const idCounts = new Map<string, number>();

  let inCodeBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let level: 1 | 2 | 3 | null = null;
    let headingText = "";

    if (trimmed.startsWith("### ")) {
      level = 3;
      headingText = trimmed.slice(4).trim();
    } else if (trimmed.startsWith("## ")) {
      level = 2;
      headingText = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("# ")) {
      level = 1;
      headingText = trimmed.slice(2).trim();
    }

    if (level && headingText) {
      const clean = headingText.replace(/[*_`]/g, "").trim();
      let baseId = slugify(clean) || `heading-${headings.length + 1}`;
      const count = idCounts.get(baseId) || 0;
      idCounts.set(baseId, count + 1);
      const id = count > 0 ? `${baseId}-${count}` : baseId;

      headings.push({ id, text: clean, level });
    }
  }

  return headings;
}

/* ------------------------------------------------------------
   Safe Inline Markdown Parser
   ------------------------------------------------------------ */

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex tokens: images, links, inline code, bold, italic
  const tokenRegex = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Image: ![alt](url)
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      return (
        <figure key={index} className="reader-image-figure">
          <img src={src} alt={alt || "Lesson visual"} className="reader-image" loading="lazy" />
          {alt && <figcaption className="reader-image-caption">{alt}</figcaption>}
        </figure>
      );
    }

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
   Table Parser: checks if lines form a Markdown Table
   ------------------------------------------------------------ */

function tryParseTable(lines: string[]): React.ReactNode | null {
  if (lines.length < 2) return null;
  const delimiterRegex = /^\|?(\s*:?-+:?\s*\|)+\s*(:?-+:?)?\s*\|?$/;
  if (!delimiterRegex.test(lines[1].trim())) return null;

  const parseRow = (rowStr: string) => {
    return rowStr
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  };

  const headers = parseRow(lines[0]);
  const dataRows = lines.slice(2).map(parseRow);

  return (
    <div className="reader-table-wrap">
      <table className="reader-table">
        <thead>
          <tr>
            {headers.map((th, i) => (
              <th key={i}>{parseInlineFormatting(th)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((td, cIdx) => (
                <td key={cIdx}>{parseInlineFormatting(td)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------
   Structured Lesson Content Renderer
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
  const idCounts = new Map<string, number>();
  let index = 0;

  const getHeadingId = (text: string) => {
    const clean = text.replace(/[*_`]/g, "").trim();
    let baseId = slugify(clean) || `heading-${index + 1}`;
    const count = idCounts.get(baseId) || 0;
    idCounts.set(baseId, count + 1);
    return count > 0 ? `${baseId}-${count}` : baseId;
  };

  let currentParagraphLines: string[] = [];
  let currentListItems: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let currentQuoteLines: string[] = [];
  let currentTableLines: string[] = [];
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

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableNode = tryParseTable(currentTableLines);
      if (tableNode) {
        nodes.push(<React.Fragment key={`table-${index++}`}>{tableNode}</React.Fragment>);
      } else {
        currentParagraphLines.push(...currentTableLines);
        flushParagraph();
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check code fence ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
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
        flushTable();
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
      flushTable();
      continue;
    }

    // Markdown Table lines
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      flushList();
      flushQuote();
      currentTableLines.push(trimmed);
      continue;
    } else if (currentTableLines.length > 0) {
      flushTable();
    }

    // Callout box detector: e.g. > [!NOTE], [IMPORTANT]:, > [!TIP], > [!OBJECTIVE], > [!EXAMPLE]
    const calloutMatch =
      trimmed.match(/^>\s*\[!(NOTE|IMPORTANT|TIP|WARNING|CAUTION|OBJECTIVE|EXAMPLE)\]\s*(.*)$/i) ||
      trimmed.match(/^\[(NOTE|IMPORTANT|TIP|WARNING|CAUTION|OBJECTIVE|EXAMPLE)\]:\s*(.*)$/i);
    if (calloutMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const calloutType = calloutMatch[1].toUpperCase();
      const calloutText = calloutMatch[2];
      nodes.push(
        <div
          key={`callout-${index++}`}
          className={`reader-callout reader-callout--${calloutType.toLowerCase()}`}
        >
          <div className="reader-callout-header">
            <span className="reader-callout-badge">{calloutType}</span>
          </div>
          {calloutText && (
            <div className="reader-callout-body">{parseInlineFormatting(calloutText)}</div>
          )}
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      nodes.push(<hr key={`hr-${index++}`} className="student-reader-hr" />);
      continue;
    }

    // Standalone image line: ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const alt = imgMatch[1];
      const src = imgMatch[2];
      nodes.push(
        <figure key={`img-${index++}`} className="reader-image-figure">
          <img src={src} alt={alt || "Lesson visual"} className="reader-image" loading="lazy" />
          {alt && <figcaption className="reader-image-caption">{alt}</figcaption>}
        </figure>
      );
      continue;
    }

    // Headings (with IDs for TOC jumping and scroll-spy)
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const text = trimmed.slice(4).trim();
      const id = getHeadingId(text);
      nodes.push(
        <h4 key={`h3-${index++}`} id={id} className="student-reader-h3 reader-heading-anchor">
          {parseInlineFormatting(text)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const text = trimmed.slice(3).trim();
      const id = getHeadingId(text);
      nodes.push(
        <h3 key={`h2-${index++}`} id={id} className="student-reader-h2 reader-heading-anchor">
          {parseInlineFormatting(text)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const text = trimmed.slice(2).trim();
      const id = getHeadingId(text);
      nodes.push(
        <h2 key={`h1-${index++}`} id={id} className="student-reader-h1 reader-heading-anchor">
          {parseInlineFormatting(text)}
        </h2>
      );
      continue;
    }

    // Blockquote: > ...
    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      flushTable();
      currentQuoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    } else if (currentQuoteLines.length > 0) {
      flushQuote();
    }

    // Bullet list: - or *
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushTable();
      if (currentListType && currentListType !== "ul") flushList();
      currentListType = "ul";
      currentListItems.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    // Numbered list: 1. ...
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushTable();
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
  flushTable();

  return <div className="student-reader-content">{nodes}</div>;
}

/* ------------------------------------------------------------
   Main Component: StudentLessonReaderModal
   ------------------------------------------------------------ */

function getFallbackStudentId(explicitId?: string): string {
  if (explicitId) return explicitId;
  try {
    const raw = localStorage.getItem("modulearn_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    }
  } catch {
    // ignore
  }
  return "guest";
}

export interface StudentLessonReaderModalProps {
  lesson: StudentLessonItem;
  onClose: () => void;
  studentId?: string;
}

export default function StudentLessonReaderModal({
  lesson,
  onClose,
  studentId: explicitStudentId,
}: StudentLessonReaderModalProps) {
  const studentId = getFallbackStudentId(explicitStudentId);

  // Reading Preferences
  const [preferences, setPreferences] = useState<ReaderPreferences>(() => loadReaderPreferences());
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active section scroll spy
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(undefined);

  // Reading progress and position restoration
  const [progressPercent, setProgressPercent] = useState(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumePositionPercent, setResumePositionPercent] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const openTimeRef = useRef<number>(Date.now());
  const prefsMenuRef = useRef<HTMLDivElement | null>(null);

  // Extract TOC headings
  const tocHeadings = useMemo(() => {
    return extractTableOfContents(lesson.content);
  }, [lesson.content]);

  // Handle Close with keyboard Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPrefsOpen) {
          setIsPrefsOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isPrefsOpen, onClose]);

  // Click outside preferences popover to close it
  useEffect(() => {
    if (!isPrefsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (prefsMenuRef.current && !prefsMenuRef.current.contains(e.target as Node)) {
        setIsPrefsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPrefsOpen]);

  // Preference change handler
  const handlePreferenceChange = useCallback(
    (updates: Partial<ReaderPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates };
        saveReaderPreferences(next);
        return next;
      });
    },
    []
  );

  // Restore reading progress on mount
  useEffect(() => {
    const saved = getReadingProgress(studentId, lesson.assignment_id, lesson.lesson_id);
    if (saved && saved.progressPercent > 5 && saved.progressPercent < 98) {
      setResumePositionPercent(saved.progressPercent);
      setShowResumeBanner(true);

      // Restore scroll position after canvas render
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const targetScroll =
            saved.scrollRatio *
            (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight);
          scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [studentId, lesson.assignment_id, lesson.lesson_id]);

  // Active section scroll spy via IntersectionObserver
  useEffect(() => {
    if (tocHeadings.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
            break;
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    );

    const headingElements = document.querySelectorAll(".reader-heading-anchor");
    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [tocHeadings, lesson.content]);

  // Scroll tracking and progress recording
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const pct = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    setProgressPercent(pct);

    const dwellTime = Date.now() - openTimeRef.current;
    if (isMeaningfulEngagement(dwellTime, ratio)) {
      recordReadingProgress({
        studentId,
        assignmentId: lesson.assignment_id,
        lessonId: lesson.lesson_id,
        progressPercent: Math.round(pct),
        scrollRatio: ratio,
        lastHeadingId: activeHeadingId,
        updatedAt: new Date().toISOString(),
        completed: pct >= 95,
      });
    }
  }, [studentId, lesson.assignment_id, lesson.lesson_id, activeHeadingId]);

  // Jump to TOC section
  const handleScrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
      // Close TOC on mobile automatically
      if (window.innerWidth <= 900) {
        setIsTocOpen(false);
      }
    }
  }, []);

  // Jump to Top
  const handleJumpToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setShowResumeBanner(false);
  }, []);

  // Copy Content Handler
  const handleCopy = useCallback(async () => {
    if (!lesson.content) return;
    try {
      await navigator.clipboard.writeText(lesson.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lesson.content]);

  // Print Handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const stats = calculateReadingStats(lesson.content);
  const teacherInitials = getTeacherInitials(lesson.teacher_name);
  const assignedDateFormatted = formatAssignedDate(lesson.assigned_at);

  return (
    <div
      className={`mgmt-modal-overlay student-reader-overlay student-reader-theme--${preferences.theme}`}
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
          <div className="student-reader-topbar__left">
            {/* Back Button */}
            <button
              type="button"
              className="student-reader-back-btn"
              onClick={onClose}
              aria-label="Back to learning materials"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>

            {/* Table of Contents Toggle */}
            <button
              type="button"
              className={`student-reader-toc-toggle-btn ${
                isTocOpen ? "student-reader-toc-toggle-btn--active" : ""
              }`}
              onClick={() => setIsTocOpen((prev) => !prev)}
              aria-label={isTocOpen ? "Close table of contents" : "Open table of contents"}
              title="Table of Contents"
            >
              <ListBulletIcon />
              <span className="student-reader-tool-label">Contents</span>
              {tocHeadings.length > 0 && (
                <span className="student-reader-toc-badge">{tocHeadings.length}</span>
              )}
            </button>

            {/* Context Pills */}
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

              <span
                className="student-reader-pill student-reader-pill--module"
                title={lesson.module_title}
              >
                Module: {lesson.module_title}
              </span>
            </div>
          </div>

          <div className="student-reader-topbar__right">
            {/* Reading Progress Indicator */}
            <div className="student-reader-progress-chip" title="Current reading position">
              <span>{Math.round(progressPercent)}% read</span>
            </div>

            {/* Font Size Adjuster (A- / A / A+) */}
            <div
              className="student-reader-font-group"
              role="group"
              aria-label="Adjust font size"
            >
              <Tooltip label="Small text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    preferences.fontSize === "sm" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => handlePreferenceChange({ fontSize: "sm" })}
                  aria-label="Small font size"
                  aria-pressed={preferences.fontSize === "sm"}
                >
                  A-
                </button>
              </Tooltip>
              <Tooltip label="Default text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    preferences.fontSize === "md" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => handlePreferenceChange({ fontSize: "md" })}
                  aria-label="Medium font size"
                  aria-pressed={preferences.fontSize === "md"}
                >
                  A
                </button>
              </Tooltip>
              <Tooltip label="Large text">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    preferences.fontSize === "lg" ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => handlePreferenceChange({ fontSize: "lg" })}
                  aria-label="Large font size"
                  aria-pressed={preferences.fontSize === "lg"}
                >
                  A+
                </button>
              </Tooltip>
            </div>

            {/* Reading Preferences Popover Toggle */}
            <div className="student-reader-prefs-wrap" ref={prefsMenuRef}>
              <Tooltip label="Reading Preferences">
                <button
                  type="button"
                  className={`student-reader-tool-btn ${
                    isPrefsOpen ? "student-reader-tool-btn--active" : ""
                  }`}
                  onClick={() => setIsPrefsOpen((prev) => !prev)}
                  aria-label="Reading preferences"
                  aria-expanded={isPrefsOpen}
                >
                  <AdjustmentsIcon />
                  <span className="student-reader-tool-label">Theme</span>
                </button>
              </Tooltip>

              {isPrefsOpen && (
                <div className="student-reader-prefs-popover" role="dialog" aria-label="Reading preferences">
                  {/* Theme Select */}
                  <div className="student-reader-prefs-row">
                    <span className="student-reader-prefs-label">Color Theme</span>
                    <div className="student-reader-theme-swatches">
                      {(["light", "sepia", "dark"] as ReaderTheme[]).map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          className={`student-reader-theme-btn student-reader-theme-btn--${theme} ${
                            preferences.theme === theme ? "student-reader-theme-btn--active" : ""
                          }`}
                          onClick={() => handlePreferenceChange({ theme })}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div className="student-reader-prefs-row">
                    <span className="student-reader-prefs-label">Line Spacing</span>
                    <div className="student-reader-spacing-group">
                      {(["compact", "normal", "relaxed"] as ReaderLineSpacing[]).map((spacing) => (
                        <button
                          key={spacing}
                          type="button"
                          className={`student-reader-spacing-btn ${
                            preferences.lineSpacing === spacing
                              ? "student-reader-spacing-btn--active"
                              : ""
                          }`}
                          onClick={() => handlePreferenceChange({ lineSpacing: spacing })}
                        >
                          {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
                  {copied ? "Copied!" : "Copy Notes"}
                </span>
              </button>
            </Tooltip>

            {/* Print */}
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

        {/* Reading Progress Track (Sticky thin line under toolbar) */}
        <div
          className="student-reader-progress-track"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="student-reader-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Digital Textbook Workspace */}
        <div className="student-reader-workspace">
          {/* Table of Contents Sidebar / Drawer */}
          {isTocOpen && (
            <>
              <div
                className="student-reader-toc-backdrop"
                onClick={() => setIsTocOpen(false)}
                aria-hidden="true"
              />
              <aside className="student-reader-toc-sidebar" aria-label="Table of contents">
                <div className="student-reader-toc-header">
                  <div className="student-reader-toc-title-group">
                    <span className="student-reader-toc-title">Table of Contents</span>
                    <span className="student-reader-toc-badge">{tocHeadings.length}</span>
                  </div>
                  <button
                    type="button"
                    className="student-reader-toc-close-btn"
                    onClick={() => setIsTocOpen(false)}
                    aria-label="Close table of contents"
                  >
                    ×
                  </button>
                </div>

                {tocHeadings.length === 0 ? (
                  <div className="student-reader-toc-empty">
                    <p>No section headings found in this lesson.</p>
                  </div>
                ) : (
                  <ul className="student-reader-toc-list">
                    {tocHeadings.map((heading) => (
                      <li
                        key={heading.id}
                        className={`student-reader-toc-item student-reader-toc-item--level-${heading.level}`}
                      >
                        <button
                          type="button"
                          className={`student-reader-toc-link ${
                            activeHeadingId === heading.id ? "student-reader-toc-link--active" : ""
                          }`}
                          onClick={() => handleScrollToSection(heading.id)}
                        >
                          {heading.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </>
          )}

          {/* Scrollable Reading Canvas */}
          <main
            ref={scrollContainerRef}
            className="student-reader-scroll-canvas"
            tabIndex={0}
            role="region"
            aria-label="Lesson content reader"
            onScroll={handleScroll}
          >
            {/* Position Restoration Notice */}
            {showResumeBanner && (
              <div className="student-reader-resume-banner" role="status">
                <span>Resumed reading at {Math.round(resumePositionPercent)}%</span>
                <button
                  type="button"
                  className="student-reader-resume-jump-btn"
                  onClick={handleJumpToTop}
                >
                  Jump to top
                </button>
                <button
                  type="button"
                  className="student-reader-resume-dismiss-btn"
                  onClick={() => setShowResumeBanner(false)}
                  aria-label="Dismiss resume notice"
                >
                  ×
                </button>
              </div>
            )}

            {/* Digital Textbook Paper Sheet */}
            <article
              className={`student-reader-paper student-reader-paper--${preferences.fontSize} student-reader-spacing--${preferences.lineSpacing}`}
            >
              {/* Lesson Information Header */}
              <div className="student-reader-header-section">
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
                    <span className="student-reader-meta-dot" aria-hidden="true">
                      ·
                    </span>
                    <span>
                      {stats.wordCount} {stats.wordCount === 1 ? "word" : "words"}
                    </span>
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

              {/* Formatted Content */}
              <LessonFormattedContent content={lesson.content} />
            </article>
          </main>
        </div>

        {/* Modal Footer (Accessible actions) */}
        <footer className="student-reader-footer">
          <div className="student-reader-footer-hint">
            <span>Tip: Press <strong>Esc</strong> to close or return to materials.</span>
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
            <div>
              <strong>Subject:</strong> {lesson.subject_name || "General"}
            </div>
            <div>
              <strong>Module:</strong> {lesson.module_title}
            </div>
            <div>
              <strong>Class:</strong> {lesson.class_name} ({lesson.school_year_name})
            </div>
            {lesson.teacher_name && (
              <div>
                <strong>Instructor:</strong> {lesson.teacher_name}
              </div>
            )}
            {assignedDateFormatted && (
              <div>
                <strong>Assigned:</strong> {assignedDateFormatted}
              </div>
            )}
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
