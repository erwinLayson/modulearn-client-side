import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teachingModuleApi, type TeacherModuleDetail, type ModuleLessonItem } from "../../api/modules";
import LessonReaderHeader from "../../components/faculty/materials/LessonReaderHeader";
import LessonTableOfContents from "../../components/faculty/materials/LessonTableOfContents";
import LessonContentRenderer from "../../components/faculty/materials/LessonContentRenderer";
import ReadingProgressIndicator from "../../components/faculty/materials/ReadingProgressIndicator";
import { calculateReadingStats, extractTableOfContents } from "../../components/faculty/materials/utils";
import type { ReaderFontSize, ReaderContentWidth } from "../../components/faculty/materials/types";

export default function LessonReaderPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<TeacherModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader Preferences
  const [fontSize, setFontSize] = useState<ReaderFontSize>("md");
  const [contentWidth, setContentWidth] = useState<ReaderContentWidth>("normal");
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(undefined);

  // Fetch Module Details
  useEffect(() => {
    if (!moduleId) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    teachingModuleApi
      .getMine(moduleId)
      .then((res) => {
        if (!isCancelled) {
          setDetail(res.data.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Failed to load module details for reader:", err);
          setError("Failed to load lesson. The module may not exist or you might not have permission to view it.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [moduleId]);

  // Current Lesson
  const currentLesson: ModuleLessonItem | null = useMemo(() => {
    if (!detail || !lessonId) return null;
    return detail.lessons.find((l) => l.id === lessonId) || null;
  }, [detail, lessonId]);

  // Table of Contents
  const tocHeadings = useMemo(() => {
    if (!currentLesson?.content) return [];
    return extractTableOfContents(currentLesson.content);
  }, [currentLesson?.content]);

  // Sequential Navigation: Previous and Next material in module
  const { prevMaterial, nextMaterial } = useMemo(() => {
    if (!detail?.lessons || !lessonId) return { prevMaterial: null, nextMaterial: null };
    const sorted = [...detail.lessons].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((l) => l.id === lessonId);
    return {
      prevMaterial: index > 0 ? sorted[index - 1] : null,
      nextMaterial: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
    };
  }, [detail?.lessons, lessonId]);

  // Active Section Scroll Spy via IntersectionObserver
  useEffect(() => {
    if (tocHeadings.length === 0) return;

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
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    const headingElements = document.querySelectorAll(".reader-heading-anchor");
    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [tocHeadings, currentLesson]);

  // Navigation Handlers
  const handleBackToModule = useCallback(() => {
    navigate(`/dashboard/modules?moduleId=${moduleId}`);
  }, [navigate, moduleId]);

  const handleNavigateToMaterial = (material: ModuleLessonItem) => {
    if (material.lesson_type === "file") {
      navigate(`/dashboard/modules/${moduleId}/lessons/${material.id}/preview`);
    } else {
      navigate(`/dashboard/modules/${moduleId}/lessons/${material.id}/read`);
    }
  };

  const handleCopyContent = useCallback(() => {
    if (!currentLesson?.content) return;
    navigator.clipboard?.writeText(currentLesson.content);
  }, [currentLesson?.content]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="reader-page-loading">
        <div className="reader-page-spinner" aria-hidden="true" />
        <h2>Opening Lesson Reader...</h2>
        <p>Loading lesson content and generating table of contents.</p>
      </div>
    );
  }

  if (error || !currentLesson) {
    return (
      <div className="reader-page-error">
        <div className="reader-page-error-card">
          <h2>Lesson Not Found</h2>
          <p>{error || "We could not find the requested lesson in this module."}</p>
          <button
            type="button"
            className="mgmt-btn mgmt-btn--primary"
            onClick={handleBackToModule}
          >
            Return to Learning Materials
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateReadingStats(currentLesson.content);
  const createdDate = currentLesson.created_at
    ? new Date(currentLesson.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`reader-page ${isDistractionFree ? "reader-page--distraction-free" : ""}`}
    >
      {/* Sticky Scroll Progress Bar */}
      <ReadingProgressIndicator />

      {/* Reader Navigation Header */}
      <LessonReaderHeader
        title={currentLesson.title}
        moduleTitle={detail?.module?.title || "Module"}
        subjectName={detail?.module?.subject}
        readTimeText={stats.readTimeText}
        wordCount={stats.wordCount}
        createdDate={createdDate}
        onBack={handleBackToModule}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        contentWidth={contentWidth}
        onChangeContentWidth={setContentWidth}
        isDistractionFree={isDistractionFree}
        onToggleDistractionFree={() => setIsDistractionFree((prev) => !prev)}
        onPrint={handlePrint}
        onCopyContent={handleCopyContent}
        onEdit={() => navigate(`/dashboard/modules?moduleId=${moduleId}&editLesson=${currentLesson.id}`)}
      />

      {/* Main Reader 2-Column or 3-Part Shell */}
      <div className={`reader-layout-container reader-layout-container--${contentWidth}`}>
        {/* Table of Contents Sidebar */}
        {!isDistractionFree && (
          <LessonTableOfContents
            headings={tocHeadings}
            activeHeadingId={activeHeadingId}
            onSelectHeading={(id) => setActiveHeadingId(id)}
            isCollapsed={isTocCollapsed}
            onToggleCollapse={() => setIsTocCollapsed((prev) => !prev)}
          />
        )}

        {/* Long-form Article Reading Area */}
        <main
          className="reader-main-canvas"
          tabIndex={0}
          role="region"
          aria-label="Lesson content reader"
        >
          <div className="reader-paper">
            <LessonContentRenderer content={currentLesson.content} fontSize={fontSize} />

            {/* End of Lesson Sequential Navigation */}
            <nav className="reader-sequence-nav" aria-label="Module lessons sequence">
              <div className="reader-sequence-col">
                {prevMaterial ? (
                  <button
                    type="button"
                    className="reader-sequence-card reader-sequence-card--prev"
                    onClick={() => handleNavigateToMaterial(prevMaterial)}
                  >
                    <span className="reader-sequence-sub">← Previous Material</span>
                    <strong className="reader-sequence-title">{prevMaterial.title}</strong>
                    <span className="reader-sequence-type">
                      {prevMaterial.lesson_type === "file" ? "Document File" : "Written Lesson"}
                    </span>
                  </button>
                ) : (
                  <div className="reader-sequence-empty">Start of module</div>
                )}
              </div>

              <div className="reader-sequence-col">
                {nextMaterial ? (
                  <button
                    type="button"
                    className="reader-sequence-card reader-sequence-card--next"
                    onClick={() => handleNavigateToMaterial(nextMaterial)}
                  >
                    <span className="reader-sequence-sub">Next Material →</span>
                    <strong className="reader-sequence-title">{nextMaterial.title}</strong>
                    <span className="reader-sequence-type">
                      {nextMaterial.lesson_type === "file" ? "Document File" : "Written Lesson"}
                    </span>
                  </button>
                ) : (
                  <div className="reader-sequence-empty">End of module</div>
                )}
              </div>
            </nav>
          </div>
        </main>
      </div>

      {/* Clean Single-Page Print Document */}
      <div className="reader-print-document" aria-hidden="true">
        <h1>{currentLesson.title}</h1>
        <p>
          <strong>Module:</strong> {detail?.module?.title} | <strong>Subject:</strong> {detail?.module?.subject || "General"}
        </p>
        <hr />
        <LessonContentRenderer content={currentLesson.content} />
        <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "0.5rem", fontSize: "0.8rem" }}>
          ModuLearn LMS · Teacher Reading Portal
        </div>
      </div>
    </div>
  );
}
