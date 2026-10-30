import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast";
import {
  formatLessonFileSize,
  getStudentLessonFileUrl,
  loadStudentLessons,
  truncateLessonText,
  getApiErrorMessage,
  type StudentLessonItem,
} from "../../service/studentLessonsService";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function StudentLessonsPage() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<StudentLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [readingLesson, setReadingLesson] = useState<StudentLessonItem | null>(null);
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
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Learning Materials</h1>
          <p className="mgmt-subtitle">
            Lessons and files your teachers shared with your enrolled classes.
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
        <div className="mgmt-detail-panel">
          <div className="mgmt-detail-header">
            <h2 className="mgmt-detail-title" style={{ fontSize: "1rem" }}>
              Shared Materials ({lessons.length})
            </h2>
          </div>
          <div className="mgmt-table-wrap">
            <table className="mgmt-table mgmt-table--compact">
              <thead>
                <tr>
                  <th>Class / School Year</th>
                  <th>Module</th>
                  <th>Lesson / Material</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.assignment_id}>
                    <td>
                      <span className="mgmt-table-bold">{lesson.class_name}</span>
                      <span className="module-muted" style={{ display: "block", marginTop: "2px" }}>
                        {lesson.school_year_name}
                      </span>
                    </td>
                    <td>
                      <span className="mgmt-table-bold">{lesson.module_title}</span>
                      <span className="module-muted" style={{ display: "block", marginTop: "2px" }}>
                        {[lesson.subject_name, lesson.teacher_name].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </td>
                    <td className="mgmt-table-bold">{lesson.title}</td>
                    <td>
                      <span
                        className={`module-lesson-type-badge ${
                          lesson.lesson_type === "file"
                            ? "module-lesson-type-badge--file"
                            : "module-lesson-type-badge--text"
                        }`}
                      >
                        {lesson.lesson_type === "file" ? "Document File" : "Written Lesson"}
                      </span>
                    </td>
                    <td style={{ maxWidth: "320px", whiteSpace: "normal" }}>
                      {lesson.lesson_type === "file" ? (
                        <>
                          <span className="module-lesson-file-name" title={lesson.file_name || "Document"}>
                            {lesson.file_name || "Document"}
                          </span>
                          <span className="module-lesson-file-meta">
                            {formatLessonFileSize(lesson.file_size)}
                          </span>
                          {lesson.content && (
                            <span className="module-muted" style={{ display: "block", marginTop: "2px" }}>
                              Note: {truncateLessonText(lesson.content, 120)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="module-muted">{truncateLessonText(lesson.content)}</span>
                      )}
                    </td>
                    <td>
                      {lesson.lesson_type === "file" && lesson.has_file ? (
                        <a
                          href={getStudentLessonFileUrl(lesson.lesson_id)}
                          className="mgmt-action mgmt-action--edit"
                          download={lesson.file_name || undefined}
                        >
                          Download
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="mgmt-action mgmt-action--edit"
                          onClick={() => setReadingLesson(lesson)}
                        >
                          Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {readingLesson && (
        <div className="mgmt-modal-overlay" onClick={() => setReadingLesson(null)}>
          <div className="mgmt-modal mgmt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <div>
                <span className="module-lesson-type-badge module-lesson-type-badge--text" style={{ marginBottom: "0.25rem" }}>
                  Written Lesson
                </span>
                <h2 className="mgmt-modal-title">{readingLesson.title}</h2>
              </div>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setReadingLesson(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mgmt-form">
              <div className="module-lesson-reader">
                {readingLesson.content || "No content."}
              </div>
              <div className="mgmt-modal-actions">
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
    </div>
  );
}
