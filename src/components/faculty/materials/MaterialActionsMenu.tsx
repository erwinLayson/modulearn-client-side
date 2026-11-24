import { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon, AssignIcon, EditIcon, TrashIcon, DownloadIcon } from "./MaterialIcons";
import type { ModuleLessonItem } from "../../../api/modules";

export interface MaterialActionsMenuProps {
  lesson: ModuleLessonItem;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
  downloadUrl?: string | null;
}

export default function MaterialActionsMenu({
  lesson,
  onAssign,
  onEdit,
  onDelete,
  downloadUrl,
}: MaterialActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="material-actions-dropdown" ref={menuRef}>
      <button
        type="button"
        className="material-actions-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`More options for ${lesson.title}`}
        title="More actions"
      >
        <EllipsisVerticalIcon size="1.125rem" />
      </button>

      {isOpen && (
        <div className="material-actions-popover" role="menu">
          <button
            type="button"
            className="material-actions-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onAssign();
            }}
          >
            <AssignIcon size="1rem" />
            <span>Assign to Classrooms</span>
          </button>

          <button
            type="button"
            className="material-actions-item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
          >
            <EditIcon size="1rem" />
            <span>Edit {lesson.lesson_type === "file" ? "Document" : "Lesson"}</span>
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={lesson.file_name || undefined}
              className="material-actions-item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <DownloadIcon size="1rem" />
              <span>Download Original File</span>
            </a>
          )}

          <hr className="material-actions-divider" />

          <button
            type="button"
            className="material-actions-item material-actions-item--danger"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            <TrashIcon size="1rem" />
            <span>Delete {lesson.lesson_type === "file" ? "Document" : "Lesson"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
