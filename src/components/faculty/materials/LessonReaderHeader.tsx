import { useState } from "react";
import { BookOpenIcon, ClockIcon } from "./MaterialIcons";
import Tooltip from "../../Tooltip";
import type { ReaderFontSize, ReaderContentWidth } from "./types";

export interface LessonReaderHeaderProps {
  title: string;
  moduleTitle: string;
  subjectName?: string | null;
  readTimeText: string;
  wordCount: number;
  createdDate?: string | null;
  onBack: () => void;
  fontSize: ReaderFontSize;
  onChangeFontSize: (size: ReaderFontSize) => void;
  contentWidth: ReaderContentWidth;
  onChangeContentWidth: (width: ReaderContentWidth) => void;
  isDistractionFree: boolean;
  onToggleDistractionFree: () => void;
  onPrint: () => void;
  onCopyContent: () => void;
  onEdit?: () => void;
}

export default function LessonReaderHeader({
  title,
  moduleTitle,
  subjectName,
  readTimeText,
  wordCount,
  createdDate,
  onBack,
  fontSize,
  onChangeFontSize,
  contentWidth,
  onChangeContentWidth,
  isDistractionFree,
  onToggleDistractionFree,
  onPrint,
  onCopyContent,
  onEdit,
}: LessonReaderHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyContent();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className={`reader-header ${isDistractionFree ? "reader-header--distraction-free" : ""}`}>
      {/* Top Navigation Row */}
      <div className="reader-header-nav-row">
        <div className="reader-header-left">
          <button
            type="button"
            className="reader-back-btn"
            onClick={onBack}
            aria-label="Back to Learning Materials"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Module</span>
          </button>

          <div className="reader-header-breadcrumbs" aria-label="Breadcrumb navigation">
            <span className="reader-breadcrumb-item">{moduleTitle}</span>
            {subjectName && (
              <>
                <span className="reader-breadcrumb-sep">/</span>
                <span className="reader-breadcrumb-item reader-breadcrumb-item--subject">
                  {subjectName}
                </span>
              </>
            )}
            <span className="reader-breadcrumb-sep">/</span>
            <span className="reader-breadcrumb-item reader-breadcrumb-item--current">
              {title}
            </span>
          </div>
        </div>

        {/* Reader Tools Toolbar */}
        <div className="reader-toolbar">
          {/* Font Size Selector */}
          <div className="reader-toolbar-group" role="group" aria-label="Adjust font size">
            <Tooltip label="Small text (15px)">
              <button
                type="button"
                className={`reader-tool-btn ${fontSize === "sm" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeFontSize("sm")}
                aria-label="Small font size"
              >
                A-
              </button>
            </Tooltip>
            <Tooltip label="Default text (17px)">
              <button
                type="button"
                className={`reader-tool-btn ${fontSize === "md" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeFontSize("md")}
                aria-label="Medium font size"
              >
                A
              </button>
            </Tooltip>
            <Tooltip label="Large text (19px)">
              <button
                type="button"
                className={`reader-tool-btn ${fontSize === "lg" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeFontSize("lg")}
                aria-label="Large font size"
              >
                A+
              </button>
            </Tooltip>
            <Tooltip label="Extra Large (21px)">
              <button
                type="button"
                className={`reader-tool-btn ${fontSize === "xl" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeFontSize("xl")}
                aria-label="Extra large font size"
              >
                A++
              </button>
            </Tooltip>
          </div>

          {/* Reading Width Selector */}
          <div className="reader-toolbar-group" role="group" aria-label="Reading canvas width">
            <Tooltip label="Comfortable line width (760px)">
              <button
                type="button"
                className={`reader-tool-btn ${contentWidth === "normal" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeContentWidth("normal")}
                aria-label="Normal reading width"
              >
                Standard
              </button>
            </Tooltip>
            <Tooltip label="Wide line width (960px)">
              <button
                type="button"
                className={`reader-tool-btn ${contentWidth === "wide" ? "reader-tool-btn--active" : ""}`}
                onClick={() => onChangeContentWidth("wide")}
                aria-label="Wide reading width"
              >
                Wide
              </button>
            </Tooltip>
          </div>

          {/* Distraction Free Toggle */}
          <Tooltip label={isDistractionFree ? "Exit distraction-free mode" : "Distraction-free reading"}>
            <button
              type="button"
              className={`reader-tool-btn ${isDistractionFree ? "reader-tool-btn--active" : ""}`}
              onClick={onToggleDistractionFree}
              aria-label="Toggle distraction-free mode"
              aria-pressed={isDistractionFree}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>
          </Tooltip>

          {/* Print */}
          <Tooltip label="Print or save as PDF">
            <button
              type="button"
              className="reader-tool-btn"
              onClick={onPrint}
              aria-label="Print lesson"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.75A1.125 1.125 0 0016.125 2.625h-8.25A1.125 1.125 0 006.75 3.75v3.284" />
              </svg>
            </button>
          </Tooltip>

          {/* Copy */}
          <Tooltip label={copied ? "Copied to clipboard!" : "Copy lesson notes"}>
            <button
              type="button"
              className={`reader-tool-btn ${copied ? "reader-tool-btn--success" : ""}`}
              onClick={handleCopy}
              aria-label="Copy lesson content"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </Tooltip>

          {/* Edit Lesson Shortcut */}
          {onEdit && (
            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost mgmt-btn--sm"
              onClick={onEdit}
            >
              Edit Lesson
            </button>
          )}
        </div>
      </div>

      {/* Lesson Hero Banner */}
      {!isDistractionFree && (
        <div className="reader-hero">
          <div className="reader-hero-badges">
            <span className="materials-type-badge materials-type-badge--written">
              <BookOpenIcon size="0.875rem" />
              <span>Written Lesson</span>
            </span>
            {subjectName && (
              <span className="reader-hero-subject-pill">{subjectName}</span>
            )}
          </div>

          <h1 className="reader-hero-title">{title}</h1>

          <div className="reader-hero-meta-row">
            <span className="reader-hero-meta-item">
              <ClockIcon size="0.875rem" />
              <span>{readTimeText}</span>
            </span>
            <span className="reader-hero-meta-dot" aria-hidden="true">·</span>
            <span className="reader-hero-meta-item">{wordCount} words</span>
            {createdDate && (
              <>
                <span className="reader-hero-meta-dot" aria-hidden="true">·</span>
                <span className="reader-hero-meta-item">Created on {createdDate}</span>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
