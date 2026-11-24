import {
  DocumentIcon,
  PdfIcon,
  WordIcon,
  PptIcon,
  ExcelIcon,
  EyeIcon,
  DownloadIcon,
  AssignIcon,
  EditIcon,
  TrashIcon,
} from "./MaterialIcons";
import MaterialActionsMenu from "./MaterialActionsMenu";
import { getFileMeta } from "./utils";
import type { ModuleLessonItem } from "../../../api/modules";

export interface DocumentMaterialCardProps {
  lesson: ModuleLessonItem;
  moduleId: string;
  downloadUrl?: string | null;
  onPreview: (lesson: ModuleLessonItem) => void;
  onAssign: (lesson: ModuleLessonItem) => void;
  onEdit: (lesson: ModuleLessonItem) => void;
  onDelete: (lesson: ModuleLessonItem) => void;
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "pdf":
      return <PdfIcon size="1.25rem" />;
    case "word":
      return <WordIcon size="1.25rem" />;
    case "powerpoint":
      return <PptIcon size="1.25rem" />;
    case "excel":
      return <ExcelIcon size="1.25rem" />;
    default:
      return <DocumentIcon size="1.25rem" />;
  }
}

export default function DocumentMaterialCard({
  lesson,
  moduleId: _moduleId,
  downloadUrl,
  onPreview,
  onAssign,
  onEdit,
  onDelete,
}: DocumentMaterialCardProps) {
  const meta = getFileMeta(lesson.file_name, lesson.file_type, lesson.file_size);
  const resolvedDownloadUrl = downloadUrl || lesson.file_path || undefined;
  const createdDate = lesson.created_at
    ? new Date(lesson.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article
      className={`material-card material-card--document material-card--${meta.category}`}
      aria-labelledby={`doc-title-${lesson.id}`}
    >
      {/* Top Banner Row */}
      <div className="material-card-topbar">
        <div className="material-card-badge-group">
          <span className={`materials-type-badge ${meta.badgeClass}`}>
            <CategoryIcon category={meta.category} />
            <span>{meta.badgeLabel}</span>
          </span>
          <span className="material-card-order-badge" title={`Order index: ${lesson.sort_order}`}>
            #{lesson.sort_order}
          </span>
        </div>

        <MaterialActionsMenu
          lesson={lesson}
          onAssign={() => onAssign(lesson)}
          onEdit={() => onEdit(lesson)}
          onDelete={() => onDelete(lesson)}
          downloadUrl={resolvedDownloadUrl}
        />
      </div>

      {/* Main Content & File Box */}
      <div className="material-card-body">
        <h4 id={`doc-title-${lesson.id}`} className="material-card-title" title={lesson.title}>
          {lesson.title}
        </h4>

        {/* File Details Ribbon */}
        <div className="material-card-file-strip">
          <div className={`material-card-file-icon-wrap material-card-file-icon--${meta.category}`} aria-hidden="true">
            <CategoryIcon category={meta.category} />
          </div>
          <div className="material-card-file-details">
            <span className="material-card-file-name" title={meta.cleanName}>
              {meta.cleanName}
            </span>
            <span className="material-card-file-meta">
              {meta.extension} · {meta.formattedSize}
              {createdDate ? ` · Uploaded ${createdDate}` : ""}
            </span>
          </div>
        </div>

        {/* Teacher Instructions/Notes if present */}
        {lesson.content ? (
          <p className="material-card-doc-notes" title={lesson.content}>
            <strong>Note:</strong> {lesson.content}
          </p>
        ) : (
          <p className="material-card-doc-empty-notes">No special instructions provided.</p>
        )}
      </div>

      {/* Card Action Controls Footer */}
      <div className="material-card-footer">
        {meta.isPdf ? (
          <button
            type="button"
            className="mgmt-btn mgmt-btn--primary material-card-primary-cta"
            onClick={() => onPreview(lesson)}
          >
            <EyeIcon size="1rem" />
            <span>Preview Document</span>
          </button>
        ) : resolvedDownloadUrl ? (
          <a
            href={resolvedDownloadUrl}
            download={lesson.file_name || undefined}
            className="mgmt-btn mgmt-btn--primary material-card-primary-cta"
            style={{ textDecoration: "none" }}
          >
            <DownloadIcon size="1rem" />
            <span>Download ({meta.formattedSize})</span>
          </a>
        ) : (
          <button
            type="button"
            className="mgmt-btn mgmt-btn--ghost material-card-primary-cta"
            onClick={() => onPreview(lesson)}
          >
            <EyeIcon size="1rem" />
            <span>View Info</span>
          </button>
        )}

        <div className="material-card-quick-actions">
          {resolvedDownloadUrl && meta.isPdf && (
            <a
              href={resolvedDownloadUrl}
              download={lesson.file_name || undefined}
              className="material-card-quick-btn"
              title={`Download ${meta.cleanName}`}
              aria-label={`Download ${meta.cleanName}`}
            >
              <DownloadIcon size="0.9375rem" />
            </a>
          )}
          <button
            type="button"
            className="material-card-quick-btn"
            onClick={() => onAssign(lesson)}
            title="Assign document to classes"
            aria-label={`Assign ${lesson.title} to classes`}
          >
            <AssignIcon size="0.9375rem" />
            <span className="material-card-quick-label">Assign</span>
          </button>
          <button
            type="button"
            className="material-card-quick-btn"
            onClick={() => onEdit(lesson)}
            title="Edit document notes"
            aria-label={`Edit ${lesson.title}`}
          >
            <EditIcon size="0.9375rem" />
            <span className="material-card-quick-label">Edit</span>
          </button>
          <button
            type="button"
            className="material-card-quick-btn material-card-quick-btn--danger"
            onClick={() => onDelete(lesson)}
            title="Delete document"
            aria-label={`Delete ${lesson.title}`}
          >
            <TrashIcon size="0.9375rem" />
          </button>
        </div>
      </div>
    </article>
  );
}
