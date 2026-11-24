import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { renderAsync } from "docx-preview";
import Tooltip from "./Tooltip";
import type { StudentLessonItem } from "../api/modules";
import {
  getFileMeta,
  cleanFileName,
  formatLessonFileSize,
  getStudentLessonFileUrl,
} from "../service/studentLessonsService";
import {
  calculateReadingStats,
  formatAssignedDate,
  extractTableOfContents,
  LessonFormattedContent,
  type TocHeading,
} from "./StudentLessonReaderModal";
import {
  loadReaderPreferences,
  saveReaderPreferences,
  getReadingProgress,
  recordReadingProgress,
  type ReaderPreferences,
} from "../service/readingProgressService";

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch {
  // worker fallback
}

export interface StudentUnifiedReaderModalProps {
  lesson: StudentLessonItem;
  onClose: () => void;
  studentId?: string;
  defaultMode?: "auto" | "text" | "pdf" | "docx" | "inspect";
}

/* --------------------------------------------------------------------------
   Semantic SVG Icons for Single Source of Truth Toolbar
   -------------------------------------------------------------------------- */

function ArrowLeftIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function ListBulletIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function ThumbnailsIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="8" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1rem", height: "1rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}

function FitWidthIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1rem", height: "1rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75L3.75 6.75 7.5 9.75M16.5 3.75l3.75 3 0-3.75-3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.002-.47-2.08-.47-3.237 0-4.664 3.256-8.592 7.75-8.592s7.75 3.928 7.75 8.592c0 1.157-.23 2.235-.47 3.237m-14.56 0h14.56m-14.56 0a3.75 3.75 0 00-3.75 3.75V21h22.06v-3.421a3.75 3.75 0 00-3.75-3.75" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function AdjustmentsIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "1.125rem", height: "1.125rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: "0.875rem", height: "0.875rem", display: "block" }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function PdfFileIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: "0.875rem", height: "0.875rem", display: "block" }} aria-hidden="true">
      <path d="M7 2h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm6 1.5V7h3.5L13 3.5z" />
    </svg>
  );
}

function WordDocIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: "0.875rem", height: "0.875rem", display: "block" }} aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 17.5l1.2-6.5h1.6l1.2 6.5h-1.3l-.5-3.2-.5 3.2H8.5z" />
    </svg>
  );
}

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

function getTeacherInitials(name?: string | null): string {
  if (!name) return "TE";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* --------------------------------------------------------------------------
   Main Component: StudentUnifiedReaderModal (SSOT)
   -------------------------------------------------------------------------- */

export default function StudentUnifiedReaderModal({
  lesson,
  onClose,
  studentId: explicitStudentId,
  defaultMode = "auto",
}: StudentUnifiedReaderModalProps) {
  const studentId = getFallbackStudentId(explicitStudentId);

  // Material classification
  const isWritten = lesson.lesson_type === "text";
  const fileMeta =
    lesson.lesson_type === "file"
      ? getFileMeta(lesson.file_name, lesson.file_type, lesson.file_size)
      : null;

  const isPdf =
    defaultMode === "pdf" ||
    (defaultMode === "auto" && !isWritten && Boolean(fileMeta?.isPdf || fileMeta?.category === "pdf"));
  const isWord =
    defaultMode === "docx" ||
    (defaultMode === "auto" && !isWritten && Boolean(fileMeta?.isWord || fileMeta?.category === "word"));
  const isImage = !isWritten && Boolean(fileMeta?.category === "image");
  const isPaginated = isPdf || isWord;

  const cleanName = cleanFileName(lesson.file_name) || lesson.title;
  const formattedSize = formatLessonFileSize(lesson.file_size);
  const downloadUrl = getStudentLessonFileUrl(lesson.lesson_id);

  // Reader shell state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); // Left drawer (TOC or Thumbnails)
  const [isInfoOpen, setIsInfoOpen] = useState(false); // Right metadata drawer
  const [isPrefsOpen, setIsPrefsOpen] = useState(false); // Preferences popover
  const [preferences, setPreferences] = useState<ReaderPreferences>(() => loadReaderPreferences());

  // Zoom & Page tracking
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(isPaginated);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reading progress for written lessons
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(undefined);

  // DOM Refs
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const docxTargetRef = useRef<HTMLDivElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const prefsMenuRef = useRef<HTMLDivElement | null>(null);
  const openTimeRef = useRef<number>(Date.now());

  // PDF.js State
  const pdfDocRef = useRef<any>(null);
  const [pdfRenderedPages, setPdfRenderedPages] = useState<number[]>([]);

  // TOC extraction for written lessons
  const tocHeadings: TocHeading[] = useMemo(() => {
    if (!isWritten || !lesson.content) return [];
    return extractTableOfContents(lesson.content);
  }, [isWritten, lesson.content]);

  // Reading stats for written lessons
  const stats = useMemo(() => {
    if (!isWritten) return { wordCount: 0, readTimeText: "" };
    return calculateReadingStats(lesson.content);
  }, [isWritten, lesson.content]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Handle Close / Escape Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPrefsOpen) {
          setIsPrefsOpen(false);
        } else if (isInfoOpen) {
          setIsInfoOpen(false);
        } else if (isNavOpen) {
          setIsNavOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isInfoOpen, isNavOpen, isPrefsOpen, onClose]);

  // Click outside preferences popover
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

  // Preference updates
  const handlePreferenceChange = useCallback((updates: Partial<ReaderPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      saveReaderPreferences(next);
      return next;
    });
  }, []);

  // Restore reading progress for written lessons
  useEffect(() => {
    if (!isWritten) return;
    const saved = getReadingProgress(studentId, lesson.assignment_id, lesson.lesson_id);
    if (saved && saved.progressPercent > 5 && saved.progressPercent < 98) {
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          const targetScroll =
            saved.scrollRatio * (canvasRef.current.scrollHeight - canvasRef.current.clientHeight);
          canvasRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isWritten, studentId, lesson.assignment_id, lesson.lesson_id]);

  // Record reading progress on unmount for written lessons
  useEffect(() => {
    if (!isWritten) return;
    return () => {
      const timeSpentSec = Math.round((Date.now() - openTimeRef.current) / 1000);
      if (timeSpentSec < 3) return; // Prevent spurious recordings
      const container = canvasRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));

      recordReadingProgress({
        studentId,
        assignmentId: lesson.assignment_id,
        lessonId: lesson.lesson_id,
        progressPercent: pct,
        scrollRatio: ratio,
        lastHeadingId: activeHeadingId,
        updatedAt: new Date().toISOString(),
        completed: pct >= 95,
      });
    };
  }, [isWritten, studentId, lesson.assignment_id, lesson.lesson_id, activeHeadingId]);

  // Canvas scroll handler (tracks progress & active section)
  const handleCanvasScroll = useCallback(() => {
    const container = canvasRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    setProgressPercent(Math.min(100, Math.max(0, pct)));

    // Active heading scroll spy for written lessons
    if (isWritten && tocHeadings.length > 0) {
      const headingElements = tocHeadings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      let currentActiveId: string | undefined = undefined;
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          currentActiveId = el.id;
        } else {
          break;
        }
      }
      if (currentActiveId) setActiveHeadingId(currentActiveId);
    }

    // Active page observer for paginated docs (PDF/DOCX)
    if (isPaginated) {
      const pageElements = container.querySelectorAll(
        ".unified-reader-pdf-page-card, section.docx, .docx-wrapper > section, .student-docx-page"
      );
      pageElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2) {
          setCurrentPage(index + 1);
        }
      });
    }
  }, [isWritten, isPaginated, tocHeadings]);

  // --------------------------------------------------------------------------
  // PDF Rendering Pipeline (PDF.js)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isPdf) return;
    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const loadPdf = async () => {
      try {
        const url = `${getStudentLessonFileUrl(lesson.lesson_id)}?inline=true`;
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) {
          (doc as any).destroy?.();
          return;
        }

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);

        // Pre-allocate page indices
        const pageNumbers = Array.from({ length: doc.numPages }, (_, i) => i + 1);
        setPdfRenderedPages(pageNumbers);
        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF loading error:", err);
          setErrorMsg(err?.message || "Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (pdfDocRef.current) {
        try {
          (pdfDocRef.current as any).destroy?.();
        } catch {
          // ignore
        }
      }
    };
  }, [isPdf, lesson.lesson_id]);

  // Render individual PDF pages onto HTML5 canvas
  const renderPdfCanvasPage = useCallback(
    async (pageNumber: number, canvasEl: HTMLCanvasElement | null) => {
      if (!canvasEl || !pdfDocRef.current) return;
      try {
        const page = await pdfDocRef.current.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 * zoom });
        const context = canvasEl.getContext("2d");
        if (!context) return;

        canvasEl.width = viewport.width;
        canvasEl.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await page.render(renderContext).promise;
      } catch {
        // page render cancellation or error handled gracefully
      }
    },
    [zoom]
  );

  // --------------------------------------------------------------------------
  // DOCX Rendering Pipeline (docx-preview)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isWord) return;
    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const loadDocx = async () => {
      try {
        const res = await fetch(getStudentLessonFileUrl(lesson.lesson_id), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load document (${res.status})`);
        }

        const buffer = await res.arrayBuffer();
        if (isCancelled) return;

        if (docxTargetRef.current) {
          docxTargetRef.current.innerHTML = "";
          await renderAsync(buffer, docxTargetRef.current, undefined, {
            className: "docx student-docx-page",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
          });

          if (!isCancelled) {
            const pages = docxTargetRef.current.querySelectorAll(
              "section.docx, .docx-wrapper > section, .student-docx-page"
            );
            const count = Math.max(1, pages.length);
            setTotalPages(count);
            setCurrentPage(1);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("DOCX rendering error:", err);
          setErrorMsg(err?.message || "Failed to render Word document.");
          setLoading(false);
        }
      }
    };

    loadDocx();

    return () => {
      isCancelled = true;
    };
  }, [isWord, lesson.lesson_id]);

  // Page jump handlers
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    const container = canvasRef.current;
    if (!container) return;

    const targetPages = container.querySelectorAll(
      ".unified-reader-pdf-page-card, section.docx, .docx-wrapper > section, .student-docx-page"
    );
    const target = targetPages[pageNum - 1];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
  const handleFitWidth = () => setZoom(1.0);

  // Jump to TOC section
  const handleScrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
      if (window.innerWidth <= 900) {
        setIsNavOpen(false);
      }
    }
  }, []);

  const assignedDate = formatAssignedDate(lesson.assigned_at);

  return (
    <div
      className={`unified-reader-overlay unified-reader-theme--${preferences.theme} unified-reader-font--${preferences.fontSize} unified-reader-spacing--${preferences.lineSpacing}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Document Reader: ${lesson.title}`}
      data-testid="student-unified-reader-modal"
    >
      {/* --------------------------------------------------------------------
         1. Single Source of Truth Top Document Toolbar
         -------------------------------------------------------------------- */}
      <header className="unified-reader-toolbar">
        {/* Sticky Reading Progress Bar */}
        {isWritten && (
          <div
            className="unified-reader-progress-bar"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
        )}

        {/* Toolbar Left Zone: Back, Nav Drawer Toggle, Badge, Title */}
        <div className="unified-reader-toolbar__left">
          <button
            type="button"
            className="unified-reader-back-btn"
            onClick={onClose}
            aria-label="Back to learning materials"
          >
            <ArrowLeftIcon />
            <span>Back</span>
          </button>

          {/* Left Drawer Toggle (TOC for Written Lessons, Thumbnails for PDF) */}
          {(isWritten || isPdf) && (
            <Tooltip label={isWritten ? "Table of Contents" : "Page Thumbnails"}>
              <button
                type="button"
                className={`unified-reader-tool-btn ${isNavOpen ? "unified-reader-tool-btn--active" : ""}`}
                onClick={() => setIsNavOpen((prev) => !prev)}
                aria-label={isNavOpen ? "Close navigation sidebar" : "Open navigation sidebar"}
                aria-pressed={isNavOpen}
              >
                {isWritten ? <ListBulletIcon /> : <ThumbnailsIcon />}
                <span>{isWritten ? "Contents" : "Pages"}</span>
                {isWritten && tocHeadings.length > 0 && (
                  <span className="unified-reader-progress-chip" style={{ padding: "0.1rem 0.35rem", fontSize: "0.6875rem" }}>
                    {tocHeadings.length}
                  </span>
                )}
              </button>
            </Tooltip>
          )}

          {/* Document Type Badge */}
          <span
            className={`unified-reader-badge ${
              isPdf
                ? "unified-reader-badge--pdf"
                : isWord
                ? "unified-reader-badge--word"
                : isWritten
                ? "unified-reader-badge--written"
                : "unified-reader-badge--file"
            }`}
          >
            {isPdf ? (
              <>
                <PdfFileIcon />
                <span>PDF Document</span>
              </>
            ) : isWord ? (
              <>
                <WordDocIcon />
                <span>Word DOCX</span>
              </>
            ) : isWritten ? (
              <>
                <BookOpenIcon />
                <span>Written Lesson</span>
              </>
            ) : (
              <span>{fileMeta?.badgeLabel || "File"}</span>
            )}
          </span>

          {/* Document Title & Subtitle */}
          <div className="unified-reader-doc-info">
            <h1 className="unified-reader-doc-title" title={lesson.title}>
              {lesson.title}
            </h1>
            <span
              className="unified-reader-doc-subtitle"
              title={isWritten ? `${lesson.module_title} · ${lesson.subject_name || "General"}` : cleanName}
            >
              {isWritten
                ? `${lesson.module_title} · ${lesson.subject_name || "General"}`
                : `${cleanName} · ${formattedSize}`}
            </span>
          </div>
        </div>

        {/* Toolbar Center Zone: Controls Slot (Paginated vs Written) */}
        <div className="unified-reader-toolbar__center">
          {isPaginated ? (
            <>
              {/* Page Navigation */}
              <div className="unified-reader-btn-group" role="group" aria-label="Page navigation">
                <Tooltip label="Previous page">
                  <button
                    type="button"
                    className="unified-reader-tool-btn"
                    onClick={() => scrollToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    aria-label="Previous page"
                  >
                    <ChevronUpIcon />
                  </button>
                </Tooltip>

                <div className="unified-reader-page-indicator">
                  <span>Page</span>
                  <input
                    type="number"
                    className="unified-reader-page-input"
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
                    className="unified-reader-tool-btn"
                    onClick={() => scrollToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    aria-label="Next page"
                  >
                    <ChevronDownIcon />
                  </button>
                </Tooltip>
              </div>

              {/* Zoom Controls */}
              <div className="unified-reader-btn-group" role="group" aria-label="Zoom controls">
                <Tooltip label="Zoom out">
                  <button
                    type="button"
                    className="unified-reader-tool-btn"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5 || loading}
                    aria-label="Zoom out"
                  >
                    <ZoomOutIcon />
                  </button>
                </Tooltip>

                <span className="unified-reader-zoom-indicator">
                  {Math.round(zoom * 100)}%
                </span>

                <Tooltip label="Zoom in">
                  <button
                    type="button"
                    className="unified-reader-tool-btn"
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
                  className="unified-reader-tool-btn"
                  onClick={handleFitWidth}
                  disabled={loading}
                  aria-label="Fit to width"
                >
                  <FitWidthIcon />
                </button>
              </Tooltip>
            </>
          ) : isWritten ? (
            <>
              {/* Reading Progress Indicator */}
              <div className="unified-reader-progress-chip" title="Current reading position">
                <span>{Math.round(progressPercent)}% read</span>
              </div>

              {/* Font Size Adjusters */}
              <div className="unified-reader-btn-group" role="group" aria-label="Adjust font size">
                <Tooltip label="Small text">
                  <button
                    type="button"
                    className={`unified-reader-tool-btn ${preferences.fontSize === "sm" ? "unified-reader-tool-btn--active" : ""}`}
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
                    className={`unified-reader-tool-btn ${preferences.fontSize === "md" ? "unified-reader-tool-btn--active" : ""}`}
                    onClick={() => handlePreferenceChange({ fontSize: "md" })}
                    aria-label="Default font size"
                    aria-pressed={preferences.fontSize === "md"}
                  >
                    A
                  </button>
                </Tooltip>
                <Tooltip label="Large text">
                  <button
                    type="button"
                    className={`unified-reader-tool-btn ${preferences.fontSize === "lg" ? "unified-reader-tool-btn--active" : ""}`}
                    onClick={() => handlePreferenceChange({ fontSize: "lg" })}
                    aria-label="Large font size"
                    aria-pressed={preferences.fontSize === "lg"}
                  >
                    A+
                  </button>
                </Tooltip>
              </div>

              {/* Reading Preferences Popover Trigger */}
              <div className="unified-reader-popover-trigger-wrap" ref={prefsMenuRef}>
                <Tooltip label="Reading preferences">
                  <button
                    type="button"
                    className={`unified-reader-tool-btn ${isPrefsOpen ? "unified-reader-tool-btn--active" : ""}`}
                    onClick={() => setIsPrefsOpen((prev) => !prev)}
                    aria-label="Reading preferences"
                    aria-expanded={isPrefsOpen}
                  >
                    <AdjustmentsIcon />
                    <span>Display</span>
                  </button>
                </Tooltip>

                {isPrefsOpen && (
                  <div className="unified-reader-popover" role="dialog" aria-label="Reading display preferences">
                    <h2 className="unified-reader-popover-title">Reading Preferences</h2>

                    {/* Theme Selector */}
                    <div className="unified-reader-popover-section">
                      <span className="unified-reader-popover-label">Theme</span>
                      <div className="unified-reader-theme-grid">
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.theme === "light" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ theme: "light" })}
                        >
                          <span className="unified-reader-theme-preview unified-reader-theme-preview--light" />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.theme === "sepia" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ theme: "sepia" })}
                        >
                          <span className="unified-reader-theme-preview unified-reader-theme-preview--sepia" />
                          <span>Sepia</span>
                        </button>
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.theme === "dark" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ theme: "dark" })}
                        >
                          <span className="unified-reader-theme-preview unified-reader-theme-preview--dark" />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>

                    {/* Line Spacing */}
                    <div className="unified-reader-popover-section">
                      <span className="unified-reader-popover-label">Line Spacing</span>
                      <div className="unified-reader-theme-grid">
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.lineSpacing === "compact" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ lineSpacing: "compact" })}
                        >
                          <span>Compact</span>
                        </button>
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.lineSpacing === "normal" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ lineSpacing: "normal" })}
                        >
                          <span>Normal</span>
                        </button>
                        <button
                          type="button"
                          className={`unified-reader-theme-btn ${preferences.lineSpacing === "relaxed" ? "unified-reader-theme-btn--active" : ""}`}
                          onClick={() => handlePreferenceChange({ lineSpacing: "relaxed" })}
                        >
                          <span>Relaxed</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Toolbar Right Zone: Actions Slot */}
        <div className="unified-reader-toolbar__right">
          {/* Download Original File (for file materials) */}
          {lesson.has_file && (
            <Tooltip label={`Download original ${cleanName}`}>
              <a
                href={downloadUrl}
                download={lesson.file_name || "document"}
                className="unified-reader-tool-btn"
                aria-label={`Download original ${lesson.file_name || lesson.title}`}
              >
                <DownloadIcon />
                <span>Download</span>
              </a>
            </Tooltip>
          )}

          {/* Print (for written lessons) */}
          {isWritten && (
            <Tooltip label="Print lesson">
              <button
                type="button"
                className="unified-reader-tool-btn"
                onClick={() => window.print()}
                aria-label="Print lesson"
              >
                <PrinterIcon />
                <span>Print</span>
              </button>
            </Tooltip>
          )}

          {/* Universal Document Info Drawer Toggle */}
          <Tooltip label="Document information">
            <button
              type="button"
              className={`unified-reader-tool-btn ${isInfoOpen ? "unified-reader-tool-btn--active" : ""}`}
              onClick={() => setIsInfoOpen((prev) => !prev)}
              aria-label={isInfoOpen ? "Close document information" : "Open document information"}
              aria-pressed={isInfoOpen}
            >
              <InfoIcon />
              <span>Info</span>
            </button>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <button
              type="button"
              className="unified-reader-tool-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <FullscreenIcon />
            </button>
          </Tooltip>

          {/* Close Reader Button */}
          <Tooltip label="Close reader">
            <button
              type="button"
              className="unified-reader-tool-btn"
              onClick={onClose}
              aria-label="Close reader"
            >
              <CloseIcon />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* --------------------------------------------------------------------
         2. Unified Viewport: Nav Drawer + Document Canvas + Info Drawer
         -------------------------------------------------------------------- */}
      <div className="unified-reader-viewport">
        {/* Left Navigation Drawer (TOC or Thumbnails) */}
        {(isWritten || isPdf) && (
          <aside
            className={`unified-reader-nav-drawer ${!isNavOpen ? "unified-reader-nav-drawer--closed" : ""}`}
            aria-label={isWritten ? "Table of Contents" : "Document Page Thumbnails"}
          >
            <div className="unified-reader-drawer-header">
              <h2 className="unified-reader-drawer-title">
                {isWritten ? <ListBulletIcon /> : <ThumbnailsIcon />}
                <span>{isWritten ? "Table of Contents" : "Pages"}</span>
              </h2>
              <button
                type="button"
                className="unified-reader-drawer-close"
                onClick={() => setIsNavOpen(false)}
                aria-label="Close navigation sidebar"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="unified-reader-drawer-body">
              {isWritten ? (
                tocHeadings.length === 0 ? (
                  <p style={{ color: "var(--reader-text-muted)", fontSize: "0.8125rem", margin: 0 }}>
                    No section headings found in this lesson.
                  </p>
                ) : (
                  <ul className="unified-reader-toc-list">
                    {tocHeadings.map((heading) => (
                      <li key={heading.id} className="unified-reader-toc-item">
                        <button
                          type="button"
                          className={`unified-reader-toc-link unified-reader-toc-link--level-${heading.level} ${
                            activeHeadingId === heading.id ? "unified-reader-toc-link--active" : ""
                          }`}
                          onClick={() => handleScrollToSection(heading.id)}
                        >
                          {heading.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : isPdf ? (
                <div className="unified-reader-thumbnails-grid">
                  {pdfRenderedPages.map((num) => (
                    <div
                      key={`thumb-${num}`}
                      className={`unified-reader-thumbnail-card ${currentPage === num ? "unified-reader-thumbnail-card--active" : ""}`}
                      onClick={() => scrollToPage(num)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Jump to page ${num}`}
                    >
                      <div className="unified-reader-thumbnail-preview">
                        <span style={{ fontSize: "0.8125rem", color: "var(--reader-text-muted)" }}>
                          Page {num}
                        </span>
                      </div>
                      <span className="unified-reader-thumbnail-label">Page {num}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>
        )}

        {/* ------------------------------------------------------------------
           Central Document Canvas
           ------------------------------------------------------------------ */}
        <main
          ref={canvasRef}
          className="unified-reader-canvas"
          onScroll={handleCanvasScroll}
          tabIndex={0}
          role="region"
          aria-label="Document Reading Canvas"
        >
          {loading && (
            <div className="unified-reader-loading">
              <div className="unified-reader-spinner" />
              <span>Loading document preview...</span>
            </div>
          )}

          {errorMsg && (
            <div className="unified-reader-error-card">
              <h2 className="unified-reader-error-title">Unable to Render Document</h2>
              <p className="unified-reader-error-msg">{errorMsg}</p>
              {lesson.has_file && (
                <a
                  href={downloadUrl}
                  download={lesson.file_name || "document"}
                  className="unified-reader-tool-btn unified-reader-tool-btn--primary"
                >
                  <DownloadIcon />
                  <span>Download Original File</span>
                </a>
              )}
            </div>
          )}

          {/* Renderer 1: Written Lesson Digital Textbook */}
          {isWritten && !loading && !errorMsg && (
            <article className="unified-reader-textbook-container">
              <header className="unified-reader-textbook-header">
                <h1 className="unified-reader-textbook-title" id="reader-modal-title">
                  {lesson.title}
                </h1>
                <div className="unified-reader-textbook-meta">
                  <span>{lesson.teacher_name || "Teacher"}</span>
                  <span>·</span>
                  <span>{lesson.subject_name || "General"}</span>
                  <span>·</span>
                  <span>{lesson.module_title}</span>
                  {assignedDate && (
                    <>
                      <span>·</span>
                      <span>Assigned {assignedDate}</span>
                    </>
                  )}
                  {stats.readTimeText && (
                    <>
                      <span>·</span>
                      <span>{stats.readTimeText}</span>
                    </>
                  )}
                  {stats.wordCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{stats.wordCount} words</span>
                    </>
                  )}
                </div>
              </header>

              <div className="unified-reader-content">
                <LessonFormattedContent content={lesson.content} />
              </div>
            </article>
          )}

          {/* Renderer 2: PDF Document Pages */}
          {isPdf && !loading && !errorMsg && (
            <div
              ref={pdfContainerRef}
              className="unified-reader-pdf-pages-wrap"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              {pdfRenderedPages.map((num) => (
                <div
                  key={`pdf-page-${num}`}
                  className="unified-reader-pdf-page-card"
                  data-page-number={num}
                >
                  <canvas
                    ref={(canvas) => {
                      if (canvas) renderPdfCanvasPage(num, canvas);
                    }}
                  />
                  <span className="unified-reader-pdf-page-number">
                    {num} / {totalPages}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Renderer 3: Word DOCX Document Pages */}
          {isWord && (
            <div
              ref={docxTargetRef}
              className="unified-reader-docx-pages-wrap"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                display: loading || errorMsg ? "none" : "flex",
              }}
            />
          )}

          {/* Renderer 4: General File / Image Preview */}
          {!isWritten && !isPaginated && !loading && !errorMsg && (
            isImage ? (
              <div className="unified-reader-image-preview-wrap">
                <img
                  src={downloadUrl}
                  alt={cleanName}
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                />
              </div>
            ) : (
              <div className="unified-reader-file-preview-card">
                <div className="unified-reader-file-preview-icon">
                  <PdfFileIcon />
                </div>
                <h2 className="unified-reader-file-preview-title">{cleanName}</h2>
                <div className="unified-reader-file-preview-meta">
                  <span>{fileMeta?.typeDescription || "Document"}</span>
                  <span> · </span>
                  <span>{formattedSize}</span>
                </div>
                {lesson.content && (
                  <div className="unified-reader-notes-box" style={{ width: "100%", marginBottom: "1.5rem" }}>
                    <strong>Teacher's Instructions:</strong>
                    <p style={{ margin: "0.4rem 0 0 0" }}>{lesson.content}</p>
                  </div>
                )}
                {lesson.has_file && (
                  <a
                    href={downloadUrl}
                    download={lesson.file_name || "document"}
                    className="unified-reader-tool-btn unified-reader-tool-btn--primary"
                    style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
                  >
                    <DownloadIcon />
                    <span>Download Original File</span>
                  </a>
                )}
              </div>
            )
          )}
        </main>

        {/* ------------------------------------------------------------------
           3. Right Information Drawer (Universal Metadata SSOT)
           ------------------------------------------------------------------ */}
        <aside
          className={`unified-reader-info-drawer ${isInfoOpen ? "unified-reader-info-drawer--open" : ""}`}
          aria-label="Document and Lesson Details"
        >
          <div className="unified-reader-drawer-header">
            <h2 className="unified-reader-drawer-title">
              <InfoIcon />
              <span>Document Details</span>
            </h2>
            <button
              type="button"
              className="unified-reader-drawer-close"
              onClick={() => setIsInfoOpen(false)}
              aria-label="Close document information"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="unified-reader-drawer-body">
            {/* Section 1: Teacher Profile */}
            <div className="unified-reader-info-section">
              <div className="unified-reader-info-section-title">Instructor</div>
              <div className="unified-reader-teacher-row">
                <div className="unified-reader-teacher-avatar" aria-hidden="true">
                  {getTeacherInitials(lesson.teacher_name)}
                </div>
                <div className="unified-reader-teacher-info">
                  <span className="unified-reader-teacher-name">
                    {lesson.teacher_name || "Instructor"}
                  </span>
                  <span className="unified-reader-teacher-role">Course Instructor</span>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Context */}
            <div className="unified-reader-info-section">
              <div className="unified-reader-info-section-title">Academic Context</div>
              <div className="unified-reader-meta-item">
                <span className="unified-reader-meta-label">Class & Section</span>
                <span className="unified-reader-meta-value">{lesson.class_name || "—"}</span>
              </div>
              <div className="unified-reader-meta-item">
                <span className="unified-reader-meta-label">School Year</span>
                <span className="unified-reader-meta-value">{lesson.school_year_name || "—"}</span>
              </div>
              <div className="unified-reader-meta-item">
                <span className="unified-reader-meta-label">Module</span>
                <span className="unified-reader-meta-value">{lesson.module_title || "—"}</span>
              </div>
              <div className="unified-reader-meta-item">
                <span className="unified-reader-meta-label">Subject</span>
                <span className="unified-reader-meta-value">{lesson.subject_name || "—"}</span>
              </div>
            </div>

            {/* Section 3: Material Metrics */}
            <div className="unified-reader-info-section">
              <div className="unified-reader-info-section-title">Material Metrics</div>
              {isWritten ? (
                <>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">Estimated Reading Time</span>
                    <span className="unified-reader-meta-value">{stats.readTimeText}</span>
                  </div>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">Word Count</span>
                    <span className="unified-reader-meta-value">{stats.wordCount} words</span>
                  </div>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">Reading Progress</span>
                    <span className="unified-reader-meta-value">{Math.round(progressPercent)}% completed</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">Original Filename</span>
                    <span className="unified-reader-meta-value" style={{ fontFamily: "var(--reader-font-mono)", fontSize: "0.75rem" }}>
                      {lesson.file_name || "—"}
                    </span>
                  </div>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">File Type</span>
                    <span className="unified-reader-meta-value">
                      {fileMeta?.typeDescription || lesson.file_type || "—"}
                    </span>
                  </div>
                  <div className="unified-reader-meta-item">
                    <span className="unified-reader-meta-label">File Size</span>
                    <span className="unified-reader-meta-value">{formattedSize}</span>
                  </div>
                  {isPaginated && (
                    <div className="unified-reader-meta-item">
                      <span className="unified-reader-meta-label">Total Pages</span>
                      <span className="unified-reader-meta-value">{totalPages} pages</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Section 4: Teacher Notes & Instructions */}
            {lesson.content && (
              <div className="unified-reader-info-section">
                <div className="unified-reader-info-section-title">Teacher's Instructions</div>
                <div className="unified-reader-notes-box">
                  {lesson.content}
                </div>
              </div>
            )}

            {/* Section 5: Primary Action */}
            <div className="unified-reader-info-section" style={{ borderBottom: "none" }}>
              {lesson.has_file ? (
                <a
                  href={downloadUrl}
                  download={lesson.file_name || "document"}
                  className="unified-reader-tool-btn unified-reader-tool-btn--primary"
                  style={{ width: "100%", height: "2.5rem", borderRadius: "var(--reader-radius-md)" }}
                >
                  <DownloadIcon />
                  <span>Download Original Document</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="unified-reader-tool-btn unified-reader-tool-btn--primary"
                  style={{ width: "100%", height: "2.5rem", borderRadius: "var(--reader-radius-md)" }}
                  onClick={() => canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <span>Return to Top</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
