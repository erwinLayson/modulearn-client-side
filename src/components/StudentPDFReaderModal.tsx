import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tooltip from "./Tooltip";
import type { StudentLessonItem } from "../api/modules";
import {
  getFileMeta,
  getStudentLessonFileUrl,
} from "../service/studentLessonsService";

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch {
  // worker fallback
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
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function ThumbnailsIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="8" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
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

function ZoomInIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
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
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75L3.75 6.75 7.5 9.75M16.5 3.75l3.75 3 0-3.75-3" />
    </svg>
  );
}

function FitPageIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      style={{ width: "1rem", height: "1rem", display: "block" }}
      aria-hidden="true"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

function RotateIcon() {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
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
      style={{ width: "1rem", height: "1rem", display: "block" }}
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

function FullscreenIcon({ isFullscreen }: { isFullscreen: boolean }) {
  if (isFullscreen) {
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

function CloseIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      style={{ width: "1.125rem", height: "1.125rem", display: "block" }}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ------------------------------------------------------------
   Individual Continuous PDF Page Canvas Component
   ------------------------------------------------------------ */

interface PDFPageItemProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  totalPages: number;
  isActive: boolean;
  onPageRef: (el: HTMLDivElement | null) => void;
}

function PDFPageItem({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  totalPages,
  isActive,
  onPageRef,
}: PDFPageItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [rendered, setRendered] = useState(false);
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!pdfDoc) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore cancellation error
      }
    }

    pdfDoc
      .getPage(pageNumber)
      .then((page: any) => {
        if (cancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        setPageDims({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(pixelRatio, pixelRatio);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        return renderTask.promise.then(() => {
          if (!cancelled) {
            setRendered(true);
          }
        });
      })
      .catch((err: any) => {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation]);

  return (
    <div
      ref={onPageRef}
      id={`student-pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className={`student-pdf-page-card ${isActive ? "student-pdf-page-card--active" : ""}`}
      style={{
        width: pageDims ? `${pageDims.width}px` : "auto",
        minHeight: pageDims ? `${pageDims.height + 34}px` : "600px",
      }}
    >
      <canvas
        ref={canvasRef}
        className="student-pdf-page-canvas"
        style={{ display: rendered ? "block" : "none" }}
      />
      {!rendered && (
        <div
          className="student-pdf-page-skeleton"
          style={{
            width: pageDims ? `${pageDims.width}px` : "600px",
            height: pageDims ? `${pageDims.height}px` : "800px",
          }}
        >
          <div className="student-pdf-page-spinner" aria-hidden="true" />
          <span>Rendering Page {pageNumber}...</span>
        </div>
      )}
      <div className="student-pdf-page-footer">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Miniature Thumbnail Preview Component
   ------------------------------------------------------------ */

interface PDFThumbnailItemProps {
  pdfDoc: any;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

function PDFThumbnailItem({
  pdfDoc,
  pageNumber,
  isActive,
  onClick,
}: PDFThumbnailItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  useEffect(() => {
    let cancelled = false;
    if (!pdfDoc) return;

    pdfDoc
      .getPage(pageNumber)
      .then((page: any) => {
        if (cancelled) return;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = 160;
        const thumbScale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: thumbScale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(pixelRatio, pixelRatio);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        return renderTask.promise.then(() => {
          if (!cancelled) setRendered(true);
        });
      })
      .catch((err: any) => {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Thumbnail ${pageNumber} render error:`, err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div
      ref={cardRef}
      className={`student-pdf-thumbnail-card ${
        isActive ? "student-pdf-thumbnail-card--active" : ""
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Jump to page ${pageNumber}`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="student-pdf-thumbnail-preview-box">
        <canvas
          ref={canvasRef}
          className="student-pdf-thumbnail-canvas"
          style={{ display: rendered ? "block" : "none" }}
        />
        {!rendered && (
          <div className="student-pdf-thumbnail-placeholder">
            <span>{pageNumber}</span>
          </div>
        )}
      </div>
      <span className="student-pdf-thumbnail-number">Page {pageNumber}</span>
    </div>
  );
}

/* ------------------------------------------------------------
   Main Full-Screen PDF Reader Component
   ------------------------------------------------------------ */

export interface StudentPDFReaderModalProps {
  lesson: StudentLessonItem;
  onClose: () => void;
}

export default function StudentPDFReaderModal({
  lesson,
  onClose,
}: StudentPDFReaderModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebars visibility
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileUrl = getStudentLessonFileUrl(lesson.lesson_id);
  const inlineViewerUrl = `${fileUrl}?inline=true`;
  const meta = getFileMeta(lesson.file_name, lesson.file_type, lesson.file_size);

  // Close on Escape or toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showInfo) {
          setShowInfo(false);
        } else if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        handleNextPage();
      } else if (e.key === "=" || e.key === "+") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, showInfo, onClose]);

  // Load PDF Document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url: inlineViewerUrl,
      withCredentials: true,
    });

    loadingTask.promise
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("PDF load error:", err);
          const isInvalid =
            err?.name === "InvalidPDFException" ||
            err?.message?.toLowerCase().includes("invalid pdf");
          const isMissing =
            err?.name === "MissingPDFException" ||
            err?.message?.toLowerCase().includes("missing pdf") ||
            err?.status === 404;

          setError(
            isInvalid
              ? "The document appears to be corrupted or is not a valid PDF file. You can download the original copy below."
              : isMissing
              ? "The PDF document could not be found on the server. Please consult your teacher or download the file."
              : "Unable to load PDF document. Please verify your connection or download the original file."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      try {
        loadingTask.destroy();
      } catch {
        // ignore
      }
    };
  }, [inlineViewerUrl]);

  // Synchronize active page using IntersectionObserver on rendered pages
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !canvasContainerRef.current || totalPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Sort by intersection ratio descending
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const pageNum = Number(visible[0].target.getAttribute("data-page-number"));
          if (pageNum && !isNaN(pageNum)) {
            setCurrentPage(pageNum);
          }
        }
      },
      {
        root: canvasContainerRef.current,
        threshold: [0.15, 0.5, 0.85],
      }
    );

    const elements = Object.values(pageRefs.current);
    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [totalPages, pdfDoc]);

  // Scroll smoothly to a specific page
  const scrollToPage = useCallback((pageNum: number) => {
    const el = pageRefs.current[pageNum];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  }, []);

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollToPage(currentPage + 1);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(parseFloat((prev + 0.25).toFixed(2)), 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(parseFloat((prev - 0.25).toFixed(2)), 0.5));
  };

  const handleFitWidth = () => {
    if (!canvasContainerRef.current || !pdfDoc) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const baseViewport = page.getViewport({ scale: 1, rotation });
      const containerWidth = canvasContainerRef.current?.clientWidth || 900;
      const fitScale = (containerWidth - 64) / baseViewport.width;
      setScale(Math.max(0.6, Math.min(parseFloat(fitScale.toFixed(2)), 2.5)));
    });
  };

  const handleFitPage = () => {
    if (!canvasContainerRef.current || !pdfDoc) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const baseViewport = page.getViewport({ scale: 1, rotation });
      const containerHeight = canvasContainerRef.current?.clientHeight || 800;
      const fitScale = (containerHeight - 80) / baseViewport.height;
      setScale(Math.max(0.5, Math.min(parseFloat(fitScale.toFixed(2)), 2.2)));
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    if (lesson.file_name) a.download = lesson.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      className="student-pdf-reader-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`PDF Document Reader: ${lesson.title}`}
      data-testid="student-pdf-reader-modal"
    >
      <div data-testid="student-pdf-viewer-preview" style={{ display: "none" }}>
        <span>Rendering PDF: {meta.cleanName}</span>
        <span>Source: {inlineViewerUrl}</span>
      </div>
      {/* ------------------------------------------------------------
          Top Reader Toolbar (All functional controls)
          ------------------------------------------------------------ */}
      <header className="student-pdf-reader-toolbar">
        {/* Left Section: Back button & Document Metadata */}
        <div className="student-pdf-toolbar-section student-pdf-toolbar-left">
          <Tooltip label="Back to learning materials (Esc)">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--back"
              onClick={onClose}
              aria-label="Back to learning materials"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
          </Tooltip>

          <div className="student-pdf-toolbar-divider" aria-hidden="true" />

          {/* Toggle Thumbnails Button */}
          <Tooltip label={showThumbnails ? "Hide page thumbnails" : "Show page thumbnails"}>
            <button
              type="button"
              className={`student-pdf-btn student-pdf-btn--icon-only ${
                showThumbnails ? "student-pdf-btn--active" : ""
              }`}
              onClick={() => setShowThumbnails((prev) => !prev)}
              aria-label="Toggle page thumbnails"
              aria-expanded={showThumbnails}
            >
              <ThumbnailsIcon />
            </button>
          </Tooltip>

          <div className="student-pdf-doc-meta">
            <div className="student-pdf-doc-title-row">
              <span className="materials-type-badge materials-type-badge--pdf">PDF</span>
              <span className="student-pdf-doc-title" title={lesson.title}>
                {lesson.title}
              </span>
            </div>
            <span className="student-pdf-doc-subtext" title={meta.cleanName}>
              {meta.cleanName} · {lesson.module_title}
            </span>
          </div>
        </div>

        {/* Center Section: Page Navigation & Zoom Controls */}
        <div className="student-pdf-toolbar-section student-pdf-toolbar-center">
          {/* Page Navigation */}
          <Tooltip label="Previous page (Left arrow)">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading || Boolean(error)}
              aria-label="Previous page"
            >
              ◀
            </button>
          </Tooltip>

          <div className="student-pdf-page-indicator">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= totalPages) {
                  scrollToPage(val);
                }
              }}
              disabled={loading || Boolean(error)}
              className="student-pdf-page-input"
              aria-label="Current page number"
            />
            <span>of {totalPages || 1}</span>
          </div>

          <Tooltip label="Next page (Right arrow)">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading || Boolean(error)}
              aria-label="Next page"
            >
              ▶
            </button>
          </Tooltip>

          <div className="student-pdf-toolbar-divider" aria-hidden="true" />

          {/* Zoom Controls */}
          <Tooltip label="Zoom out (-)">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.5 || Boolean(error)}
              aria-label="Zoom out"
            >
              <ZoomOutIcon />
            </button>
          </Tooltip>

          <span className="student-pdf-scale-text" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>

          <Tooltip label="Zoom in (+)">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleZoomIn}
              disabled={loading || scale >= 3.0 || Boolean(error)}
              aria-label="Zoom in"
            >
              <ZoomInIcon />
            </button>
          </Tooltip>

          <Tooltip label="Fit to width">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleFitWidth}
              disabled={loading || Boolean(error)}
              aria-label="Fit to width"
            >
              <FitWidthIcon />
            </button>
          </Tooltip>

          <Tooltip label="Fit to page">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleFitPage}
              disabled={loading || Boolean(error)}
              aria-label="Fit to page"
            >
              <FitPageIcon />
            </button>
          </Tooltip>

          <Tooltip label="Rotate 90 degrees">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleRotate}
              disabled={loading || Boolean(error)}
              aria-label="Rotate 90 degrees"
            >
              <RotateIcon />
            </button>
          </Tooltip>
        </div>

        {/* Right Section: Info, Download, Fullscreen */}
        <div className="student-pdf-toolbar-section student-pdf-toolbar-right">
          <Tooltip label={showInfo ? "Hide document details" : "Document details & notes"}>
            <button
              type="button"
              className={`student-pdf-btn student-pdf-btn--icon-only ${
                showInfo ? "student-pdf-btn--active" : ""
              }`}
              onClick={() => setShowInfo((prev) => !prev)}
              aria-label="Toggle document details"
              aria-expanded={showInfo}
            >
              <InfoIcon />
            </button>
          </Tooltip>

          <Tooltip label="Download PDF document">
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--primary student-pdf-btn--text-label"
              onClick={handleDownload}
              aria-label={`Download ${meta.cleanName}`}
            >
              <DownloadIcon />
              <span>Download</span>
            </button>
          </Tooltip>

          <Tooltip label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
            <button
              type="button"
              className="student-pdf-btn student-pdf-btn--icon-only"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
            >
              <FullscreenIcon isFullscreen={isFullscreen} />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* ------------------------------------------------------------
          Reader Body: Thumbnails + Continuous Canvas + Info Panel
          ------------------------------------------------------------ */}
      <div className="student-pdf-reader-body">
        {/* Collapsible Page Thumbnails Sidebar */}
        {showThumbnails && (
          <aside
            className="student-pdf-thumbnails-sidebar"
            aria-label="Page thumbnail previews"
          >
            <div className="student-pdf-thumbnails-header">
              <h3 className="student-pdf-thumbnails-title">Thumbnails ({totalPages})</h3>
              <button
                type="button"
                className="student-pdf-btn student-pdf-btn--icon-only"
                style={{ width: "1.75rem", height: "1.75rem" }}
                onClick={() => setShowThumbnails(false)}
                aria-label="Close thumbnails sidebar"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="student-pdf-thumbnails-scroll">
              {totalPages > 0 &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PDFThumbnailItem
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    isActive={currentPage === pageNum}
                    onClick={() => scrollToPage(pageNum)}
                  />
                ))}
            </div>
          </aside>
        )}

        {/* Continuous Vertical Document Stage */}
        <main
          ref={canvasContainerRef}
          className="student-pdf-canvas-container"
          tabIndex={0}
          role="region"
          aria-label="PDF Document Pages Canvas"
        >
          {loading && (
            <div className="student-pdf-reader-loading">
              <div className="student-pdf-page-spinner" aria-hidden="true" />
              <p>Loading document pages...</p>
            </div>
          )}

          {error && (
            <div className="student-pdf-reader-error">
              <div className="student-pdf-reader-error-card">
                <div className="student-pdf-reader-error-icon" aria-hidden="true">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <h3 className="student-pdf-reader-error-title">Unable to Open PDF</h3>
                <p className="student-pdf-reader-error-msg">{error}</p>
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--primary"
                  onClick={handleDownload}
                >
                  <DownloadIcon />
                  <span>Download Original Document</span>
                </button>
              </div>
            </div>
          )}

          {!loading && !error && pdfDoc && totalPages > 0 && (
            <div className="student-pdf-pages-track">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PDFPageItem
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={scale}
                  rotation={rotation}
                  totalPages={totalPages}
                  isActive={currentPage === pageNum}
                  onPageRef={(el) => {
                    pageRefs.current[pageNum] = el;
                  }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Collapsible Document Information Drawer */}
        {showInfo && (
          <aside
            className="student-pdf-info-sidebar"
            aria-label="Document metadata and notes"
          >
            <div className="student-pdf-info-header">
              <h3 className="student-pdf-info-title">Document Details</h3>
              <button
                type="button"
                className="student-pdf-btn student-pdf-btn--icon-only"
                style={{ width: "1.75rem", height: "1.75rem" }}
                onClick={() => setShowInfo(false)}
                aria-label="Close document details"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="student-pdf-info-body">
              {/* File Name & Format */}
              <div className="student-pdf-info-section">
                <span className="student-pdf-info-label">File Name</span>
                <span className="student-pdf-info-val" title={meta.cleanName}>
                  {meta.cleanName}
                </span>
                <span className="student-pdf-doc-subtext">
                  {meta.typeDescription} · {meta.formattedSize}
                </span>
              </div>

              {/* Class & Academic Year */}
              <div className="student-pdf-info-section">
                <span className="student-pdf-info-label">Class & Year</span>
                <span className="student-pdf-info-val">
                  {lesson.class_name} ({lesson.school_year_name})
                </span>
              </div>

              {/* Module */}
              <div className="student-pdf-info-section">
                <span className="student-pdf-info-label">Module</span>
                <span className="student-pdf-info-val">{lesson.module_title}</span>
              </div>

              {/* Subject & Teacher */}
              <div className="student-pdf-info-section">
                <span className="student-pdf-info-label">Subject & Teacher</span>
                <span className="student-pdf-info-val">
                  {[lesson.subject_name, lesson.teacher_name].filter(Boolean).join(" · ") ||
                    "—"}
                </span>
              </div>

              {/* Teacher's Instructions & Notes */}
              {lesson.content && (
                <div className="student-pdf-info-section">
                  <span className="student-pdf-info-label">Teacher's Instructions & Notes</span>
                  <div className="student-pdf-info-notes-box">{lesson.content}</div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="student-pdf-info-actions">
                <a
                  href={fileUrl}
                  download={lesson.file_name || undefined}
                  className="mgmt-btn mgmt-btn--primary"
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "inline-flex", gap: "0.5rem", alignItems: "center" }}
                >
                  <DownloadIcon />
                  <span>Download Original File</span>
                </a>

                <a
                  href={inlineViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn--ghost"
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none", display: "inline-flex", gap: "0.5rem", alignItems: "center" }}
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
