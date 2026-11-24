import { useState, useEffect, useCallback, useRef } from "react";
import { renderAsync } from "docx-preview";
import {
  cleanFileName,
  formatLessonFileSize,
  getStudentLessonFileUrl,
  type StudentLessonItem,
} from "../service/studentLessonsService";
import Tooltip from "./Tooltip";

export interface StudentDocxReaderModalProps {
  lesson: StudentLessonItem;
  onClose: () => void;
}

/* ------------------------------------------------------------
   Semantic Icons for Toolbar & Controls
   ------------------------------------------------------------ */

function ArrowLeftIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "inline-block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function WordDocIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "0.875rem", height: "0.875rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "0.875rem", height: "0.875rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
      />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM7.5 10.5h6"
      />
    </svg>
  );
}

function FitWidthIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m12 0h-4.5m4.5 0v4.5M3.75 20.25v-4.5m0 4.5h4.5m12 0h-4.5m4.5 0v-4.5"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
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
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
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
      style={{ width: "0.9375rem", height: "0.9375rem", display: "block" }}
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

/* ------------------------------------------------------------
   Main Component: StudentDocxReaderModal
   ------------------------------------------------------------ */

export default function StudentDocxReaderModal({
  lesson,
  onClose,
}: StudentDocxReaderModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const docBodyRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanName = cleanFileName(lesson.file_name);
  const formattedSize = formatLessonFileSize(lesson.file_size);
  const downloadUrl = getStudentLessonFileUrl(lesson.lesson_id);

  // Close on Escape or exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showInfoDrawer) {
          setShowInfoDrawer(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInfoDrawer, isFullscreen, onClose]);

  // Load and render DOCX file
  const loadDocx = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cancel prior request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const response = await fetch(`${downloadUrl}?inline=true`, {
        credentials: "include",
        signal: abortCtrl.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load document (${response.status})`);
      }

      const buffer = await response.arrayBuffer();
      if (abortCtrl.signal.aborted) return;

      if (!docBodyRef.current) return;
      docBodyRef.current.innerHTML = "";

      // Render DOCX into DOM using docx-preview
      await renderAsync(buffer, docBodyRef.current, undefined, {
        inWrapper: true,
        breakPages: true,
        ignoreWidth: false,
        ignoreHeight: false,
        className: "student-docx-page",
      });

      if (abortCtrl.signal.aborted) return;

      // Detect total pages generated by docx-preview
      const pages = docBodyRef.current.querySelectorAll(
        "section.docx, .docx-wrapper > section, .student-docx-page"
      );
      setTotalPages(Math.max(1, pages.length));
      setLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("DOCX rendering error:", err);
      setError(err?.message || "Failed to render Word document preview");
      setLoading(false);
    }
  }, [downloadUrl]);

  useEffect(() => {
    loadDocx();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadDocx]);

  // IntersectionObserver to sync active page number as user scrolls
  useEffect(() => {
    if (loading || error || !docBodyRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const pages = docBodyRef.current.querySelectorAll(
      "section.docx, .docx-wrapper > section, .student-docx-page"
    );
    if (pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageIndex = Array.from(pages).indexOf(entry.target as HTMLElement);
            if (pageIndex >= 0) {
              setCurrentPage(pageIndex + 1);
            }
            break;
          }
        }
      },
      {
        root: containerRef.current,
        threshold: 0.25,
      }
    );

    pages.forEach((page) => observer.observe(page));

    return () => {
      pages.forEach((page) => observer.unobserve(page));
      observer.disconnect();
    };
  }, [loading, error, totalPages]);

  // Smooth scroll to specific page
  const scrollToPage = useCallback((pageNum: number) => {
    if (!docBodyRef.current) return;
    const pages = docBodyRef.current.querySelectorAll(
      "section.docx, .docx-wrapper > section, .student-docx-page"
    );
    const target = pages[pageNum - 1];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
  const handleFitWidth = () => setZoom(1.0);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div
      className="student-docx-reader-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`DOCX Document Reader: ${lesson.title}`}
      data-testid="student-docx-reader-modal"
    >
      {/* 1. Dedicated Top Document Toolbar */}
      <header className="student-docx-toolbar">
        {/* Left: Back Button, Type Badge, Document Title */}
        <div className="student-docx-toolbar__left">
          <button
            type="button"
            className="student-docx-back-btn"
            onClick={onClose}
            aria-label="Back to learning materials"
          >
            <ArrowLeftIcon />
            <span>Back</span>
          </button>

          <div className="student-docx-doc-info">
            <span className="student-docx-type-badge">
              <WordDocIcon />
              <span>Word DOCX</span>
            </span>

            <div className="student-docx-title-block">
              <h1 className="student-docx-title" title={lesson.title}>
                {lesson.title}
              </h1>
              <span className="student-docx-subtitle" title={cleanName}>
                {cleanName} · {formattedSize}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Page Navigation & Zoom Controls */}
        <div className="student-docx-toolbar__center">
          {/* Page Jump & Navigation */}
          <div className="student-docx-btn-group" role="group" aria-label="Page navigation">
            <Tooltip label="Previous page">
              <button
                type="button"
                className="student-docx-tool-btn"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                aria-label="Previous page"
              >
                <ChevronUpIcon />
              </button>
            </Tooltip>

            <div className="student-docx-page-indicator">
              <span>Page</span>
              <input
                type="number"
                className="student-docx-page-input"
                value={currentPage}
                min={1}
                max={totalPages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= totalPages) {
                    scrollToPage(val);
                  }
                }}
                aria-label="Current page number"
              />
              <span>of {totalPages}</span>
            </div>

            <Tooltip label="Next page">
              <button
                type="button"
                className="student-docx-tool-btn"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                aria-label="Next page"
              >
                <ChevronDownIcon />
              </button>
            </Tooltip>
          </div>

          {/* Zoom Controls */}
          <div className="student-docx-btn-group" role="group" aria-label="Zoom controls">
            <Tooltip label="Zoom out">
              <button
                type="button"
                className="student-docx-tool-btn"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5 || loading}
                aria-label="Zoom out"
              >
                <ZoomOutIcon />
              </button>
            </Tooltip>

            <span className="student-docx-zoom-indicator">
              {Math.round(zoom * 100)}%
            </span>

            <Tooltip label="Zoom in">
              <button
                type="button"
                className="student-docx-tool-btn"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5 || loading}
                aria-label="Zoom in"
              >
                <ZoomInIcon />
              </button>
            </Tooltip>
          </div>

          <Tooltip label="Fit to width">
            <button
              type="button"
              className="student-docx-tool-btn"
              onClick={handleFitWidth}
              disabled={loading}
              aria-label="Fit to width"
            >
              <FitWidthIcon />
            </button>
          </Tooltip>
        </div>

        {/* Right: Download, Info, Fullscreen, Close */}
        <div className="student-docx-toolbar__right">
          <Tooltip label="Download original DOCX">
            <a
              href={downloadUrl}
              download={lesson.file_name || "document.docx"}
              className="student-docx-tool-btn"
              aria-label="Download original document"
            >
              <DownloadIcon />
              <span>Download</span>
            </a>
          </Tooltip>

          <Tooltip label="Document information">
            <button
              type="button"
              className={`student-docx-tool-btn ${showInfoDrawer ? "student-docx-tool-btn--active" : ""
                }`}
              onClick={() => setShowInfoDrawer((prev) => !prev)}
              aria-label="Toggle document details"
              aria-pressed={showInfoDrawer}
            >
              <InfoIcon />
            </button>
          </Tooltip>

          <Tooltip label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
            <button
              type="button"
              className="student-docx-tool-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
          </Tooltip>

          <button
            type="button"
            className="student-docx-tool-btn"
            onClick={onClose}
            aria-label="Close reader"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* 2. Main Centered Document Canvas */}
      <main
        ref={containerRef}
        className="student-docx-canvas-container"
        tabIndex={0}
        role="region"
        aria-label="Word document reading canvas"
      >
        {loading && (
          <div className="student-docx-loading-state" role="status">
            <div className="student-docx-spinner" aria-hidden="true" />
            <h2 className="student-docx-loading-text">Loading Word Document...</h2>
            <p className="student-docx-loading-subtext">
              Rendering pages, tables, and images from original document.
            </p>
          </div>
        )}

        {error && (
          <div className="student-docx-error-state" role="alert">
            <div className="student-docx-error-icon">⚠️</div>
            <h2 className="student-docx-error-title">Unable to Preview Document</h2>
            <p className="student-docx-error-desc">{error}</p>
            <div className="student-docx-error-actions">
              <button
                type="button"
                className="mgmt-btn mgmt-btn--secondary"
                onClick={loadDocx}
              >
                Retry
              </button>
              <a
                href={downloadUrl}
                download={lesson.file_name || "document.docx"}
                className="mgmt-btn mgmt-btn--primary"
              >
                Download Original File
              </a>
            </div>
          </div>
        )}

        {/* Scaled DOCX Page Output Container */}
        <div
          ref={docBodyRef}
          className="student-docx-document-wrapper"
          style={{
            transform: `scale(${zoom})`,
            display: loading || error ? "none" : "flex",
          }}
          data-testid="student-docx-viewer"
        />
      </main>

      {/* 3. Collapsible Metadata Information Drawer */}
      {showInfoDrawer && (
        <aside className="student-docx-info-drawer" aria-label="Document details">
          <div className="student-docx-info-header">
            <h2 className="student-docx-info-title">Document Details</h2>
            <button
              type="button"
              className="student-docx-info-close-btn"
              onClick={() => setShowInfoDrawer(false)}
              aria-label="Close document details"
            >
              ✕
            </button>
          </div>

          <div className="student-docx-info-body">
            <div className="student-docx-info-section">
              <span className="student-docx-info-label">Title</span>
              <span className="student-docx-info-value">{lesson.title}</span>
            </div>

            <div className="student-docx-info-section">
              <span className="student-docx-info-label">Original Filename</span>
              <div className="student-docx-info-card">
                <span className="student-docx-info-value">{cleanName}</span>
                <span className="student-docx-subtitle">{formattedSize}</span>
              </div>
            </div>

            <div className="student-docx-info-section">
              <span className="student-docx-info-label">Module & Subject</span>
              <span className="student-docx-info-value">
                {lesson.module_title}
                {lesson.subject_name ? ` · ${lesson.subject_name}` : ""}
              </span>
            </div>

            <div className="student-docx-info-section">
              <span className="student-docx-info-label">Classroom</span>
              <span className="student-docx-info-value">
                {lesson.class_name} ({lesson.school_year_name || "Academic Year"})
              </span>
            </div>

            {lesson.teacher_name && (
              <div className="student-docx-info-section">
                <span className="student-docx-info-label">Instructor</span>
                <span className="student-docx-info-value">{lesson.teacher_name}</span>
              </div>
            )}

            {lesson.content && (
              <div className="student-docx-info-section">
                <span className="student-docx-info-label">Teacher's Notes</span>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {lesson.content}
                </p>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

