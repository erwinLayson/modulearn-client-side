import React from "react";
import { BookOpenIcon } from "./MaterialIcons";
import { slugify } from "./utils";

export interface LessonContentRendererProps {
  content: string | null;
  fontSize?: "sm" | "md" | "lg" | "xl";
}

/* ------------------------------------------------------------
   Inline Markdown Parser (Bold, Italic, Code, Link, Images)
   ------------------------------------------------------------ */

function parseInline(text: string): React.ReactNode[] {
  // Regex matches: images, links, inline code, bold, italic
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

    // Markdown Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const href = linkMatch[2];
      const isSafe = /^https?:\/\//i.test(href);
      return (
        <a
          key={index}
          href={isSafe ? href : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="reader-link"
        >
          {linkText}
        </a>
      );
    }

    // Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="reader-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **bold**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="reader-bold">
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
        <em key={index} className="reader-italic">
          {part.slice(1, -1)}
        </em>
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
  // Second line must be table delimiter e.g. |---|---|
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
              <th key={i}>{parseInline(th)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((td, cIdx) => (
                <td key={cIdx}>{parseInline(td)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------
   Main Structured Content Renderer
   ------------------------------------------------------------ */

export default function LessonContentRenderer({
  content,
  fontSize = "md",
}: LessonContentRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div className="reader-empty-content">
        <div className="reader-empty-icon" aria-hidden="true">
          <BookOpenIcon size="2.5rem" />
        </div>
        <h3 className="reader-empty-title">No Written Content</h3>
        <p className="reader-empty-desc">
          This lesson has no written content yet. Teachers can write detailed educational content, lecture notes, tables, and instructions.
        </p>
      </div>
    );
  }

  const rawLines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  const idCounts = new Map<string, number>();

  let nodeKey = 0;
  let currentParagraphLines: string[] = [];
  let currentListItems: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let currentQuoteLines: string[] = [];
  let currentTableLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const getHeadingId = (text: string) => {
    const clean = text.replace(/[*_`]/g, "").trim();
    let baseId = slugify(clean) || `heading-${nodeKey + 1}`;
    const count = idCounts.get(baseId) || 0;
    idCounts.set(baseId, count + 1);
    return count > 0 ? `${baseId}-${count}` : baseId;
  };

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join("\n");
      nodes.push(
        <p key={`p-${nodeKey++}`} className="reader-paragraph">
          {text.split("\n").map((line, lIdx, arr) => (
            <React.Fragment key={lIdx}>
              {parseInline(line)}
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
          <ul key={`ul-${nodeKey++}`} className="reader-ul">
            {currentListItems.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        nodes.push(
          <ol key={`ol-${nodeKey++}`} className="reader-ol">
            {currentListItems.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
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
        <blockquote key={`quote-${nodeKey++}`} className="reader-blockquote">
          {currentQuoteLines.map((line, qIdx, arr) => (
            <p key={qIdx} className="reader-quote-line">
              {parseInline(line)}
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
        nodes.push(<React.Fragment key={`table-${nodeKey++}`}>{tableNode}</React.Fragment>);
      } else {
        // Fallback to regular lines if not valid table
        currentParagraphLines.push(...currentTableLines);
        flushParagraph();
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code block ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        nodes.push(
          <pre key={`code-${nodeKey++}`} className="reader-codeblock">
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

    // Table line detector
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      flushList();
      flushQuote();
      currentTableLines.push(trimmed);
      continue;
    } else if (currentTableLines.length > 0) {
      flushTable();
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      nodes.push(<hr key={`hr-${nodeKey++}`} className="reader-hr" />);
      continue;
    }

    // Headings (with IDs for TOC jumping)
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushQuote();
      const title = trimmed.slice(4).trim();
      const id = getHeadingId(title);
      nodes.push(
        <h3 key={`h3-${nodeKey++}`} id={id} className="reader-h3 reader-heading-anchor">
          {parseInline(title)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushQuote();
      const title = trimmed.slice(3).trim();
      const id = getHeadingId(title);
      nodes.push(
        <h2 key={`h2-${nodeKey++}`} id={id} className="reader-h2 reader-heading-anchor">
          {parseInline(title)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      flushQuote();
      const title = trimmed.slice(2).trim();
      const id = getHeadingId(title);
      nodes.push(
        <h1 key={`h1-${nodeKey++}`} id={id} className="reader-h1 reader-heading-anchor">
          {parseInline(title)}
        </h1>
      );
      continue;
    }

    // Standalone image line: ![alt](src)
    const imgLineMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgLineMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const alt = imgLineMatch[1];
      const src = imgLineMatch[2];
      nodes.push(
        <figure key={`img-${nodeKey++}`} className="reader-image-figure">
          <img src={src} alt={alt || "Lesson visual"} className="reader-image" loading="lazy" />
          {alt && <figcaption className="reader-image-caption">{alt}</figcaption>}
        </figure>
      );
      continue;
    }

    // Callout box detector: e.g. > [!NOTE], > [!TIP], [NOTE]:, [IMPORTANT]:
    const calloutMatch =
      trimmed.match(/^>\s*\[!(NOTE|IMPORTANT|TIP|WARNING)\]\s*(.*)$/i) ||
      trimmed.match(/^\[(NOTE|IMPORTANT|TIP|WARNING)\]:\s*(.*)$/i);
    if (calloutMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const calloutType = calloutMatch[1].toUpperCase();
      const calloutText = calloutMatch[2];
      nodes.push(
        <div key={`callout-${nodeKey++}`} className={`reader-callout reader-callout--${calloutType.toLowerCase()}`}>
          <div className="reader-callout-badge">{calloutType}</div>
          <div className="reader-callout-body">{parseInline(calloutText)}</div>
        </div>
      );
      continue;
    }

    // Blockquote
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

    // Numbered list: 1.
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (currentListType && currentListType !== "ol") flushList();
      currentListType = "ol";
      currentListItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (currentListType) {
      flushList();
    }

    // Normal paragraph
    currentParagraphLines.push(line);
  }

  // Flush any remainder
  if (inCodeBlock && codeBlockLines.length > 0) {
    nodes.push(
      <pre key={`code-${nodeKey++}`} className="reader-codeblock">
        <code>{codeBlockLines.join("\n")}</code>
      </pre>
    );
  }
  flushParagraph();
  flushList();
  flushQuote();
  flushTable();

  return (
    <article className={`reader-content-body reader-content-body--${fontSize}`}>
      {nodes}
    </article>
  );
}
