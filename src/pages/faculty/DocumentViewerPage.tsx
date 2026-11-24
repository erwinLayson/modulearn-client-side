import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { teachingModuleApi, type TeacherModuleDetail, type ModuleLessonItem } from "../../api/modules";
import PDFViewer from "../../components/faculty/materials/PDFViewer";
import { getFileMeta } from "../../components/faculty/materials/utils";
import {
  DocumentIcon,
  WordIcon,
  PptIcon,
  ExcelIcon,
  DownloadIcon,
} from "../../components/faculty/materials/MaterialIcons";

export default function DocumentViewerPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<TeacherModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          console.error("Failed to load module details for document viewer:", err);
          setError("Failed to load document details. Please check your network or permissions.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [moduleId]);

  // Current Material
  const currentLesson: ModuleLessonItem | null = useMemo(() => {
    if (!detail || !lessonId) return null;
    return detail.lessons.find((l) => l.id === lessonId) || null;
  }, [detail, lessonId]);

  // Previous & Next materials in module
  const { prevMaterial, nextMaterial } = useMemo(() => {
    if (!detail?.lessons || !lessonId) return { prevMaterial: null, nextMaterial: null };
    const sorted = [...detail.lessons].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((l) => l.id === lessonId);
    return {
      prevMaterial: index > 0 ? sorted[index - 1] : null,
      nextMaterial: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
    };
  }, [detail?.lessons, lessonId]);

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

  if (loading) {
    return (
      <div className="doc-viewer-page-loading">
        <div className="doc-viewer-spinner" aria-hidden="true" />
        <h2>Opening Document Viewer...</h2>
        <p>Preparing document preview and file resources.</p>
      </div>
    );
  }

  if (error || !currentLesson) {
    return (
      <div className="doc-viewer-page-error">
        <div className="doc-viewer-error-card">
          <h2>Document Not Found</h2>
          <p>{error || "The requested document could not be found in this module."}</p>
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

  if (currentLesson.lesson_type === "file" && !currentLesson.file_name && !currentLesson.file_path) {
    return (
      <div className="doc-viewer-page-error">
        <div className="doc-viewer-error-card">
          <h2>Broken File Attachment</h2>
          <p>This lesson was added as a file document, but the uploaded file appears to be missing or corrupted.</p>
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

  const meta = getFileMeta(currentLesson.file_name, currentLesson.file_type, currentLesson.file_size);
  const downloadUrl = `/api/modules/mine/${moduleId}/lessons/${currentLesson.id}/file`;
  const viewerUrl = `${downloadUrl}?inline=true`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    if (currentLesson.file_name) a.download = currentLesson.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="doc-viewer-page">
      {/* Viewer Header */}
      <header className="doc-viewer-header">
        <div className="doc-viewer-header-left">
          <button
            type="button"
            className="reader-back-btn"
            onClick={handleBackToModule}
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

          <div className="doc-viewer-header-info">
            <div className="doc-viewer-header-title-row">
              <span className={`materials-type-badge ${meta.badgeClass}`}>
                {meta.badgeLabel}
              </span>
              <h1 className="doc-viewer-header-title" title={currentLesson.title}>
                {currentLesson.title}
              </h1>
            </div>
            <span className="doc-viewer-header-meta">
              {meta.cleanName} · {meta.formattedSize} · Module: {detail?.module?.title || "Module"}
            </span>
          </div>
        </div>

        <div className="doc-viewer-header-actions">
          <button
            type="button"
            className="mgmt-btn mgmt-btn--primary"
            onClick={handleDownload}
          >
            <DownloadIcon size="1rem" />
            <span>Download File</span>
          </button>
        </div>
      </header>

      {/* Main Document Viewing Stage */}
      <main className="doc-viewer-stage-container">
        {meta.isPdf ? (
          <PDFViewer
            url={viewerUrl}
            fileName={meta.cleanName}
            onDownload={handleDownload}
          />
        ) : (
          /* Clean Fallback for Word / PowerPoint / Office / Other files */
          <div className="doc-viewer-fallback-card">
            <div className={`doc-viewer-fallback-icon-wrap doc-viewer-fallback-icon--${meta.category}`}>
              {meta.category === "word" ? (
                <WordIcon size="3.5rem" />
              ) : meta.category === "powerpoint" ? (
                <PptIcon size="3.5rem" />
              ) : meta.category === "excel" ? (
                <ExcelIcon size="3.5rem" />
              ) : (
                <DocumentIcon size="3.5rem" />
              )}
            </div>

            <h2 className="doc-viewer-fallback-title">{meta.cleanName}</h2>
            <p className="doc-viewer-fallback-meta">
              {meta.extension} Document · {meta.formattedSize}
            </p>

            <div className="doc-viewer-fallback-notice">
              <p>
                <strong>In-Browser Viewing Notice:</strong> {meta.badgeLabel} documents cannot be rendered directly inside the browser canvas without third-party converters. Download the original document to view it in Microsoft Office, Google Workspace, or your desktop reader.
              </p>
            </div>

            {currentLesson.content && (
              <div className="doc-viewer-fallback-notes">
                <span className="doc-viewer-fallback-notes-label">Teacher's Instructions & Notes:</span>
                <p className="doc-viewer-fallback-notes-body">{currentLesson.content}</p>
              </div>
            )}

            <div className="doc-viewer-fallback-actions">
              <button
                type="button"
                className="mgmt-btn mgmt-btn--primary mgmt-btn--lg"
                onClick={handleDownload}
              >
                <DownloadIcon size="1.125rem" />
                <span>Download {meta.cleanName} ({meta.formattedSize})</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sequential Navigation Footer */}
      <footer className="doc-viewer-footer-nav">
        <div className="doc-viewer-nav-col">
          {prevMaterial && (
            <button
              type="button"
              className="reader-sequence-card reader-sequence-card--prev"
              onClick={() => handleNavigateToMaterial(prevMaterial)}
            >
              <span className="reader-sequence-sub">← Previous Material</span>
              <strong className="reader-sequence-title">{prevMaterial.title}</strong>
            </button>
          )}
        </div>
        <div className="doc-viewer-nav-col">
          {nextMaterial && (
            <button
              type="button"
              className="reader-sequence-card reader-sequence-card--next"
              onClick={() => handleNavigateToMaterial(nextMaterial)}
            >
              <span className="reader-sequence-sub">Next Material →</span>
              <strong className="reader-sequence-title">{nextMaterial.title}</strong>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
