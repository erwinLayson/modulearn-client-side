import { useState } from "react";
import type { TocHeading } from "./types";

export interface LessonTableOfContentsProps {
  headings: TocHeading[];
  activeHeadingId?: string;
  onSelectHeading?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function LessonTableOfContents({
  headings,
  activeHeadingId,
  onSelectHeading,
  isCollapsed = false,
  onToggleCollapse,
}: LessonTableOfContentsProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Smooth scroll handler
  const handleItemClick = (id: string) => {
    onSelectHeading?.(id);
    setMobileDrawerOpen(false);

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) {
    return (
      <aside className="reader-toc-sidebar reader-toc-sidebar--empty" aria-label="Table of contents">
        <div className="reader-toc-header">
          <span className="reader-toc-title">Table of Contents</span>
        </div>
        <p className="reader-toc-empty-hint">
          This lesson does not contain formatted headings (#, ##, ###).
        </p>
      </aside>
    );
  }

  const tocContent = (
    <nav className="reader-toc-nav" aria-label="Table of contents navigation">
      <ul className="reader-toc-list">
        {headings.map((item) => {
          const isActive = activeHeadingId === item.id;
          return (
            <li
              key={item.id}
              className={`reader-toc-item reader-toc-item--level-${item.level} ${
                isActive ? "reader-toc-item--active" : ""
              }`}
            >
              <button
                type="button"
                className="reader-toc-link"
                onClick={() => handleItemClick(item.id)}
                aria-current={isActive ? "location" : undefined}
                title={item.text}
              >
                <span className="reader-toc-bullet" aria-hidden="true" />
                <span className="reader-toc-text">{item.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile Floating Drawer Trigger */}
      <div className="reader-toc-mobile-bar">
        <button
          type="button"
          className="reader-toc-mobile-trigger"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Table of Contents"
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span>Contents ({headings.length})</span>
        </button>
      </div>

      {/* Mobile Modal Drawer */}
      {mobileDrawerOpen && (
        <div className="reader-toc-mobile-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div
            className="reader-toc-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Table of contents"
          >
            <div className="reader-toc-header">
              <span className="reader-toc-title">Table of Contents</span>
              <button
                type="button"
                className="reader-toc-close-btn"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close table of contents"
              >
                ×
              </button>
            </div>
            {tocContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`reader-toc-sidebar ${isCollapsed ? "reader-toc-sidebar--collapsed" : ""}`}
        aria-label="Table of contents"
      >
        <div className="reader-toc-header">
          <span className="reader-toc-title">Table of Contents</span>
          {onToggleCollapse && (
            <button
              type="button"
              className="reader-toc-collapse-btn"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand table of contents" : "Collapse table of contents"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{
                  transform: isCollapsed ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {!isCollapsed && tocContent}
      </aside>
    </>
  );
}
