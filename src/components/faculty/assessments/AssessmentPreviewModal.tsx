import { useEffect, useState } from "react";
import type { AssessmentPreviewModalProps } from "./types";
import {
  getCategoryMeta,
  calculateActivityItems,
  formatActivityPoints,
  formatActivityDate,
} from "./assessmentUtils";
import {
  QuizIcon,
  ExamIcon,
  ActivityIcon,
  AssignIcon,
  PencilIcon,
  CalendarIcon,
  UserIcon,
  TrophyIcon,
  ListCheckIcon,
  CopyIcon,
  CheckIcon,
} from "./AssessmentIcons";

export default function AssessmentPreviewModal({
  template,
  isOpen,
  creatorName,
  moduleTitle,
  moduleSubject,
  hasAssignments = true,
  isArchived = false,
  onClose,
  onEdit,
  onAssign,
}: AssessmentPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const categoryMeta = getCategoryMeta(template.category);
  const itemsMeta = calculateActivityItems(template.instructions);
  const formattedPoints = formatActivityPoints(template.max_score);
  const formattedDate = formatActivityDate(template.created_at);

  const handleCopy = () => {
    if (!template.instructions) return;
    try {
      navigator.clipboard?.writeText(template.instructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const renderCategoryIcon = (size = "1.25rem") => {
    switch (template.category) {
      case "quizzes":
        return <QuizIcon size={size} />;
      case "exams":
        return <ExamIcon size={size} />;
      case "activities":
      default:
        return <ActivityIcon size={size} />;
    }
  };

  const renderInstructionsContent = () => {
    if (!template.instructions || !template.instructions.trim()) {
      return (
        <div className="assessment-preview-instructions-empty">
          <p>No specific instructions or questions have been detailed for this template yet.</p>
        </div>
      );
    }

    const trimmed = template.instructions.trim();
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);

    // Numbered list items
    const isNumbered = lines.length > 1 && lines.every((l) => /^\d+[\.\)]\s+/.test(l));
    if (isNumbered) {
      return (
        <ol className="assessment-preview-instructions-list">
          {lines.map((line, idx) => {
            const content = line.replace(/^\d+[\.\)]\s+/, "");
            return (
              <li key={idx} className="assessment-preview-instruction-item">
                <span className="assessment-instruction-num">{idx + 1}</span>
                <span className="assessment-instruction-text">{content}</span>
              </li>
            );
          })}
        </ol>
      );
    }

    // Bullet points
    const isBullet = lines.length > 1 && lines.every((l) => /^[-*•]\s+/.test(l));
    if (isBullet) {
      return (
        <ul className="assessment-preview-instructions-bullets">
          {lines.map((line, idx) => {
            const content = line.replace(/^[-*•]\s+/, "");
            return (
              <li key={idx} className="assessment-preview-bullet-item">
                <span className="assessment-bullet-dot" />
                <span className="assessment-instruction-text">{content}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    // Plain formatted prose
    return (
      <div className="assessment-preview-instructions-prose">
        <pre className="assessment-preview-instructions-text">{template.instructions}</pre>
      </div>
    );
  };

  return (
    <div
      className="mgmt-modal-overlay assessment-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mgmt-modal assessment-preview-modal">
        {/* Top Header Banner */}
        <div className="assessment-preview-hero">
          <div className="assessment-preview-hero-main">
            <div
              className={`assessment-preview-avatar assessment-preview-avatar--${categoryMeta.value}`}
              aria-hidden="true"
            >
              {renderCategoryIcon("1.5rem")}
            </div>

            <div className="assessment-preview-hero-content">
              <div className="assessment-preview-badges-row">
                <span className={`assessment-badge ${categoryMeta.badgeClass}`}>
                  {categoryMeta.label}
                </span>
                <span className="assessment-preview-points-badge">
                  <TrophyIcon size="0.85rem" />
                  <span>{formattedPoints}</span>
                </span>
              </div>

              <h2 id="assessment-preview-title" className="assessment-preview-title">
                {template.title}
              </h2>

              <div className="assessment-preview-context-line">
                <span className="assessment-preview-module-name">
                  {moduleTitle || "Current Module"}
                </span>
                {moduleSubject && (
                  <>
                    <span className="assessment-preview-context-dot">·</span>
                    <span className="assessment-preview-subject-name">{moduleSubject}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="assessment-preview-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Refined Stats Summary Bar */}
        <div className="assessment-preview-stats-bar">
          <div className="assessment-preview-stat-col">
            <div className="assessment-stat-icon-wrap assessment-stat-icon-wrap--points">
              <TrophyIcon size="1rem" />
            </div>
            <div className="assessment-stat-info">
              <span className="assessment-stat-label">Max Score</span>
              <span className="assessment-stat-value">{formattedPoints}</span>
            </div>
          </div>

          <div className="assessment-preview-stat-col">
            <div className="assessment-stat-icon-wrap assessment-stat-icon-wrap--items">
              <ListCheckIcon size="1rem" />
            </div>
            <div className="assessment-stat-info">
              <span className="assessment-stat-label">Estimated Items</span>
              <span className="assessment-stat-value">{itemsMeta.label}</span>
            </div>
          </div>

          <div className="assessment-preview-stat-col">
            <div className="assessment-stat-icon-wrap assessment-stat-icon-wrap--creator">
              <UserIcon size="1rem" />
            </div>
            <div className="assessment-stat-info">
              <span className="assessment-stat-label">Created By</span>
              <span className="assessment-stat-value" title={creatorName || "Faculty Teacher"}>
                {creatorName || "Faculty Teacher"}
              </span>
            </div>
          </div>

          <div className="assessment-preview-stat-col">
            <div className="assessment-stat-icon-wrap assessment-stat-icon-wrap--date">
              <CalendarIcon size="1rem" />
            </div>
            <div className="assessment-stat-info">
              <span className="assessment-stat-label">Date Created</span>
              <span className="assessment-stat-value">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Instructions Body */}
        <div className="assessment-preview-body">
          <div className="assessment-preview-section-head">
            <div className="assessment-preview-section-title-wrap">
              <span className="assessment-section-title-icon">
                <PencilIcon size="0.95rem" />
              </span>
              <h3 className="assessment-preview-section-title">
                Activity Instructions & Tasks
              </h3>
            </div>

            {template.instructions && template.instructions.trim() && (
              <button
                type="button"
                className={`assessment-copy-btn ${copied ? "assessment-copy-btn--copied" : ""}`}
                onClick={handleCopy}
                aria-label="Copy activity instructions to clipboard"
              >
                {copied ? <CheckIcon size="0.85rem" /> : <CopyIcon size="0.85rem" />}
                <span>{copied ? "Copied!" : "Copy Tasks"}</span>
              </button>
            )}
          </div>

          <div className="assessment-preview-instructions-card">
            {renderInstructionsContent()}
          </div>
        </div>

        {/* Polished Balanced Footer */}
        <div className="assessment-preview-footer">
          <div className="assessment-preview-footer-left">
            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost assessment-preview-btn-edit"
              onClick={() => {
                onClose();
                onEdit(template);
              }}
              disabled={isArchived}
            >
              <PencilIcon size="0.95rem" />
              <span>Edit Template</span>
            </button>
          </div>

          <div className="assessment-preview-footer-right">
            <button
              type="button"
              className="mgmt-btn mgmt-btn--secondary assessment-preview-btn-close"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="mgmt-btn mgmt-btn--primary assessment-preview-btn-assign"
              onClick={() => {
                onClose();
                onAssign(template);
              }}
              disabled={!hasAssignments || isArchived}
              title={
                !hasAssignments
                  ? "Assign module to a class first"
                  : isArchived
                  ? "Module is archived"
                  : "Assign this template to a class"
              }
            >
              <AssignIcon size="0.95rem" />
              <span>Assign to Classroom</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
