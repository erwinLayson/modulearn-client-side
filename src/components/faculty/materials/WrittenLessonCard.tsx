import { BookOpenIcon, ClockIcon, EditIcon, AssignIcon, TrashIcon } from "./MaterialIcons";
import MaterialActionsMenu from "./MaterialActionsMenu";
import { calculateReadingStats } from "./utils";
import type { ModuleLessonItem } from "../../../api/modules";

export interface WrittenLessonCardProps {
  lesson: ModuleLessonItem;
  moduleId: string;
  onRead: (lesson: ModuleLessonItem) => void;
  onAssign: (lesson: ModuleLessonItem) => void;
  onEdit: (lesson: ModuleLessonItem) => void;
  onDelete: (lesson: ModuleLessonItem) => void;
}

export default function WrittenLessonCard({
  lesson,
  moduleId: _moduleId,
  onRead,
  onAssign,
  onEdit,
  onDelete,
}: WrittenLessonCardProps) {
  const stats = calculateReadingStats(lesson.content);
  const snippet = lesson.content ? lesson.content.trim().slice(0, 160) : "No written content provided yet.";
  const createdDate = lesson.created_at
    ? new Date(lesson.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="material-card material-card--written" aria-labelledby={`lesson-title-${lesson.id}`}>
      {/* Top Banner Row */}
      <div className="material-card-topbar">
        <div className="material-card-badge-group">
          <span className="materials-type-badge materials-type-badge--written">
            <BookOpenIcon size="0.875rem" />
            <span>Written Lesson</span>
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
        />
      </div>

      {/* Main Content Info */}
      <div className="material-card-body">
        <h4 id={`lesson-title-${lesson.id}`} className="material-card-title" title={lesson.title}>
          {lesson.title}
        </h4>

        <p className="material-card-snippet" title={lesson.content || ""}>
          {snippet}
        </p>

        {/* Metadata Footer Ribbon */}
        <div className="material-card-meta-row">
          <div className="material-card-meta-item" title="Estimated reading time">
            <ClockIcon size="0.8125rem" />
            <span>{stats.readTimeText}</span>
          </div>

          <span className="material-card-meta-dot" aria-hidden="true">·</span>

          <span className="material-card-meta-item">
            {stats.wordCount} {stats.wordCount === 1 ? "word" : "words"}
          </span>

          {createdDate && (
            <>
              <span className="material-card-meta-dot" aria-hidden="true">·</span>
              <span className="material-card-meta-item">{createdDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Card Action Controls Footer */}
      <div className="material-card-footer">
        <button
          type="button"
          className="mgmt-btn mgmt-btn--primary material-card-primary-cta"
          onClick={() => onRead(lesson)}
        >
          <BookOpenIcon size="1rem" />
          <span>Read Lesson</span>
        </button>

        <div className="material-card-quick-actions">
          <button
            type="button"
            className="material-card-quick-btn"
            onClick={() => onAssign(lesson)}
            title="Assign lesson to classes"
            aria-label={`Assign ${lesson.title} to classes`}
          >
            <AssignIcon size="0.9375rem" />
            <span className="material-card-quick-label">Assign</span>
          </button>
          <button
            type="button"
            className="material-card-quick-btn"
            onClick={() => onEdit(lesson)}
            title="Edit lesson"
            aria-label={`Edit ${lesson.title}`}
          >
            <EditIcon size="0.9375rem" />
            <span className="material-card-quick-label">Edit</span>
          </button>
          <button
            type="button"
            className="material-card-quick-btn material-card-quick-btn--danger"
            onClick={() => onDelete(lesson)}
            title="Delete lesson"
            aria-label={`Delete ${lesson.title}`}
          >
            <TrashIcon size="0.9375rem" />
          </button>
        </div>
      </div>
    </article>
  );
}
