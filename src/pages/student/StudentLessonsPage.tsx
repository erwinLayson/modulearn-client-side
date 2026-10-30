import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import Tooltip from "../../components/Tooltip";
import type { ToastState } from "../../types";
import {
  getFileMeta,
  getStudentLessonFileUrl,
  loadStudentLessons,
  truncateLessonText,
  getApiErrorMessage,
  type StudentLessonItem,
  type FileCategory,
} from "../../service/studentLessonsService";

/* ------------------------------------------------------------
   Semantic Icons for File Categories & Actions
   ------------------------------------------------------------ */

function FileCategoryIcon({ category }: { category: FileCategory | "text" }) {
  const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { width: "1.25rem", height: "1.25rem", display: "block" },
    "aria-hidden": true,
  };

  switch (category) {
    case "pdf":
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="9" y2="17" />
          <path d="M9 13h2a1.5 1.5 0 0 1 0 3H9" />
          <line x1="14" y1="13" x2="14" y2="17" />
        </svg>
      );
    case "word":
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case "excel":
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h8M8 17h8M12 11v8" />
        </svg>
      );
    case "powerpoint":
      return (
        <svg {...iconProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <path d="M7 8h4a2 2 0 1 1 0 4H7z" />
        </svg>
      );
    case "image":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case "archive":
      return (
        <svg {...iconProps}>
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      );
    case "text":
    default:
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
  }
}

function EyeIcon() {
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
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

function BookOpenIcon() {
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
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

export default function StudentLessonsPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<StudentLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [readingLesson, setReadingLesson] = useState<StudentLessonItem | null>(null);
  const [inspectingMaterial, setInspectingMaterial] = useState<StudentLessonItem | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await loadStudentLessons();
        if (!cancelled) setLessons(items);
      } catch (err) {
        if (!cancelled) {
          setToast({
            message: getApiErrorMessage(err, "Failed to load learning materials"),
            type: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Learning Materials</h1>
          <p className="mgmt-subtitle">
            Lessons, lecture notes, and study files shared with your enrolled classes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading learning materials...</div>
      ) : lessons.length === 0 ? (
        <div className="mgmt-empty">
          <p style={{ margin: 0 }}>No learning materials have been shared with your classes yet.</p>
        </div>
      ) : (
        <div className="student-materials-panel">
          <div className="student-materials-header">
            <div className="student-materials-header-title">
              <h2 className="mgmt-detail-title" style={{ fontSize: "1rem", margin: 0 }}>
                Shared Materials
              </h2>
              <span className="student-materials-badge-count">{lessons.length}</span>
            </div>
          </div>

          <div
            className="student-materials-wrap"
            tabIndex={0}
            role="region"
            aria-label="Shared learning materials table"
          >
            <table className="student-materials-table">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Class / School Year</th>
                  <th>Module</th>
                  <th>Lesson / Material</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th className="materials-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const isFile = lesson.lesson_type === "file";
                  const fileMeta = isFile
                    ? getFileMeta(lesson.file_name, lesson.file_type, lesson.file_size)
                    : null;

                  return (
                    <tr key={lesson.assignment_id}>
                      {/* Column 1: Class & School Year */}
                      <td>
                        <div className="materials-cell-primary" title={lesson.class_name}>
                          {lesson.class_name}
                        </div>
                        <div
                          className="materials-cell-secondary"
                          title={lesson.school_year_name}
                        >
                          {lesson.school_year_name}
                        </div>
                      </td>

                      {/* Column 2: Module Information */}
                      <td>
                        <div className="materials-cell-primary" title={lesson.module_title}>
                          {lesson.module_title}
                        </div>
                        <div
                          className="materials-cell-secondary"
                          title={[lesson.subject_name, lesson.teacher_name]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          {[lesson.subject_name, lesson.teacher_name]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </div>
                      </td>

                      {/* Column 3: Lesson / Material Title */}
                      <td>
                        <div className="materials-cell-primary" title={lesson.title}>
                          {lesson.title}
                        </div>
                        {isFile && lesson.content && (
                          <div
                            className="materials-cell-secondary"
                            title={`Note: ${lesson.content}`}
                          >
                            {truncateLessonText(lesson.content, 48)}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Semantic Type Badge */}
                      <td>
                        {isFile && fileMeta ? (
                          <span className={`materials-type-badge ${fileMeta.badgeClass}`}>
                            {fileMeta.badgeLabel}
                          </span>
                        ) : (
                          <span className="materials-type-badge materials-type-badge--written">
                            Written
                          </span>
                        )}
                      </td>

                      {/* Column 5: File Details Presentation */}
                      <td>
                        {isFile && fileMeta ? (
                          <div className="materials-file-cell">
                            <div
                              className={`materials-file-icon-wrap materials-file-icon--${fileMeta.category}`}
                              aria-hidden="true"
                            >
                              <FileCategoryIcon category={fileMeta.category} />
                            </div>
                            <div className="materials-file-info">
                              <button
                                type="button"
                                className="materials-file-name-btn"
                                onClick={() => setInspectingMaterial(lesson)}
                                title={lesson.file_name || "Document"}
                              >
                                {fileMeta.cleanName}
                              </button>
                              <span className="materials-file-subtext">
                                {fileMeta.typeDescription} · {fileMeta.formattedSize}
                              </span>
                              {lesson.content && (
                                <span className="materials-file-notes" title={lesson.content}>
                                  Note: {truncateLessonText(lesson.content, 60)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="materials-file-cell">
                            <div
                              className="materials-file-icon-wrap materials-file-icon--written"
                              aria-hidden="true"
                            >
                              <FileCategoryIcon category="text" />
                            </div>
                            <div className="materials-file-info">
                              <button
                                type="button"
                                className="materials-file-name-btn"
                                onClick={() => setReadingLesson(lesson)}
                                title={lesson.title}
                              >
                                {lesson.content
                                  ? truncateLessonText(lesson.content, 45)
                                  : "Written lesson content"}
                              </button>
                              <span className="materials-file-subtext">
                                Written note · In-app reader
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="materials-col-actions">
                        <div className="materials-actions-group">
                          {isFile ? (
                            <>
                              <Tooltip label="Preview details">
                                <button
                                  type="button"
                                  className="materials-btn materials-btn--icon-only"
                                  onClick={() => setInspectingMaterial(lesson)}
                                  aria-label={`Preview details for ${lesson.title}`}
                                >
                                  <EyeIcon />
                                </button>
                              </Tooltip>
                              {lesson.has_file && (
                                <Tooltip
                                  label={`Download ${lesson.file_name ? `(${lesson.file_name})` : "file"}`}
                                >
                                  <a
                                    href={getStudentLessonFileUrl(lesson.lesson_id)}
                                    className="materials-btn materials-btn--icon-only materials-btn--download"
                                    download={lesson.file_name || undefined}
                                    aria-label={`Download ${lesson.file_name || lesson.title}`}
                                  >
                                    <DownloadIcon />
                                  </a>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <Tooltip label="Read written lesson">
                              <button
                                type="button"
                                className="materials-btn materials-btn--read"
                                onClick={() => setReadingLesson(lesson)}
                                aria-label={`Read ${lesson.title}`}
                              >
                                <BookOpenIcon />
                                <span>Read</span>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Written Lesson Reader Modal */}
      {readingLesson && (
        <div className="mgmt-modal-overlay" onClick={() => setReadingLesson(null)}>
          <div
            className="mgmt-modal mgmt-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-modal-title"
          >
            <div className="mgmt-modal-header">
              <div>
                <span
                  className="materials-type-badge materials-type-badge--written"
                  style={{ marginBottom: "0.35rem" }}
                >
                  Written Lesson
                </span>
                <h2 id="reader-modal-title" className="mgmt-modal-title">{readingLesson.title}</h2>
              </div>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setReadingLesson(null)}
                aria-label="Close reader modal"
              >
                ×
              </button>
            </div>
            <div className="mgmt-form">
              <div className="material-preview-context-grid">
                <div className="material-preview-context-item">
                  <span className="material-preview-context-label">Class</span>
                  <span className="material-preview-context-val">
                    {readingLesson.class_name} ({readingLesson.school_year_name})
                  </span>
                </div>
                <div className="material-preview-context-item">
                  <span className="material-preview-context-label">Module & Subject</span>
                  <span className="material-preview-context-val">
                    {readingLesson.module_title} · {readingLesson.subject_name || "General"}
                  </span>
                </div>
                {readingLesson.teacher_name && (
                  <div className="material-preview-context-item">
                    <span className="material-preview-context-label">Teacher</span>
                    <span className="material-preview-context-val">
                      {readingLesson.teacher_name}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="module-lesson-reader"
                style={{ marginTop: "1.25rem", whiteSpace: "pre-wrap" }}
              >
                {readingLesson.content || "No content provided."}
              </div>

              <div className="mgmt-modal-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={() => setReadingLesson(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Material Details & Preview Modal */}
      {inspectingMaterial && (
        <div className="mgmt-modal-overlay" onClick={() => setInspectingMaterial(null)}>
          <div
            className="mgmt-modal mgmt-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-preview-modal-title"
          >
            {(() => {
              const meta = getFileMeta(
                inspectingMaterial.file_name,
                inspectingMaterial.file_type,
                inspectingMaterial.file_size
              );
              const fileUrl = getStudentLessonFileUrl(inspectingMaterial.lesson_id);
              const isImage = meta.category === "image";

              return (
                <>
                  <div className="mgmt-modal-header">
                    <div>
                      <span
                        className={`materials-type-badge ${meta.badgeClass}`}
                        style={{ marginBottom: "0.35rem" }}
                      >
                        {meta.badgeLabel}
                      </span>
                      <h2 id="material-preview-modal-title" className="mgmt-modal-title">{inspectingMaterial.title}</h2>
                    </div>
                    <button
                      type="button"
                      className="mgmt-modal-close"
                      onClick={() => setInspectingMaterial(null)}
                      aria-label="Close preview modal"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mgmt-form">
                    {/* File Overview Card */}
                    <div className="material-preview-card">
                      <div
                        className={`materials-file-icon-wrap materials-file-icon--${meta.category}`}
                        style={{ width: "3rem", height: "3rem" }}
                      >
                        <FileCategoryIcon category={meta.category} />
                      </div>
                      <div className="material-preview-info">
                        <div className="material-preview-name">{meta.cleanName}</div>
                        <div className="material-preview-meta">
                          {meta.typeDescription} · {meta.formattedSize}
                        </div>
                      </div>
                    </div>

                    {/* Image Preview if applicable */}
                    {isImage && inspectingMaterial.has_file && (
                      <div className="material-preview-image-box">
                        <img
                          src={fileUrl}
                          alt={meta.cleanName}
                          className="material-preview-image"
                        />
                      </div>
                    )}

                    {/* Context Information */}
                    <div className="material-preview-context-grid">
                      <div className="material-preview-context-item">
                        <span className="material-preview-context-label">Class</span>
                        <span className="material-preview-context-val">
                          {inspectingMaterial.class_name} ({inspectingMaterial.school_year_name})
                        </span>
                      </div>
                      <div className="material-preview-context-item">
                        <span className="material-preview-context-label">Module</span>
                        <span className="material-preview-context-val">
                          {inspectingMaterial.module_title}
                        </span>
                      </div>
                      <div className="material-preview-context-item">
                        <span className="material-preview-context-label">Subject & Teacher</span>
                        <span className="material-preview-context-val">
                          {[inspectingMaterial.subject_name, inspectingMaterial.teacher_name]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Teacher's Notes/Instructions */}
                    {inspectingMaterial.content && (
                      <div className="material-preview-section" style={{ marginTop: "1.25rem" }}>
                        <div className="material-preview-section-title">
                          Teacher's Instructions & Notes
                        </div>
                        <div
                          className="module-lesson-content-snippet"
                          style={{
                            WebkitLineClamp: "unset",
                            display: "block",
                            background: "#f8fafc",
                          }}
                        >
                          {inspectingMaterial.content}
                        </div>
                      </div>
                    )}

                    {/* Modal Actions */}
                    <div className="mgmt-modal-actions" style={{ marginTop: "1.5rem" }}>
                      <button
                        type="button"
                        className="mgmt-btn mgmt-btn--ghost"
                        onClick={() => setInspectingMaterial(null)}
                      >
                        Close
                      </button>
                      {inspectingMaterial.has_file && (
                        <a
                          href={fileUrl}
                          download={inspectingMaterial.file_name || undefined}
                          className="mgmt-btn mgmt-btn--primary"
                          style={{ textDecoration: "none", display: "inline-flex", gap: "0.5rem" }}
                        >
                          <DownloadIcon />
                          <span>Download Original File</span>
                        </a>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
