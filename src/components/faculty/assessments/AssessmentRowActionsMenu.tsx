import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { AssessmentRowActionsMenuProps } from "./types";
import { EllipsisIcon, EyeIcon, AssignIcon, PencilIcon, TrashIcon } from "./AssessmentIcons";

export default function AssessmentRowActionsMenu({
  template,
  hasAssignments = true,
  isArchived = false,
  onPreview,
  onAssign,
  onEdit,
  onDelete,
}: AssessmentRowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "bottom" | "top";
  } | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuHeight = menuEl ? menuEl.offsetHeight : 175;
    const menuWidth = menuEl ? menuEl.offsetWidth : 195;

    // Check if there is enough space below in viewport
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const placeAbove = spaceBelow < menuHeight + 12 && spaceAbove > menuHeight;

    let top: number;
    if (placeAbove) {
      top = triggerRect.top - menuHeight - 6;
    } else {
      top = triggerRect.bottom + 6;
    }

    // Align right edge of menu with right edge of trigger
    let left = triggerRect.right - menuWidth;
    // Keep inside horizontal viewport boundaries
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    setCoords({
      top: Math.max(8, Math.round(top)),
      left: Math.max(8, Math.round(left)),
      placement: placeAbove ? "top" : "bottom",
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className="assessment-row-actions">
      <button
        ref={triggerRef}
        type="button"
        className="assessment-action-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Actions for ${template.title}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <EllipsisIcon size="1.125rem" />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className={`assessment-floating-menu assessment-dropdown-menu assessment-floating-menu--${
              coords?.placement || "bottom"
            }`}
            role="menu"
            style={{
              position: "fixed",
              top: coords ? `${coords.top}px` : "0px",
              left: coords ? `${coords.left}px` : "0px",
              visibility: coords ? "visible" : "hidden",
            }}
          >
            <button
              type="button"
              className="assessment-dropdown-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onPreview(template);
              }}
            >
              <EyeIcon size="0.95rem" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              className="assessment-dropdown-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onAssign(template);
              }}
              disabled={!hasAssignments || isArchived}
              title={
                !hasAssignments
                  ? "Assign module to a class first"
                  : isArchived
                  ? "Module is archived"
                  : "Create class activity from this template"
              }
            >
              <AssignIcon size="0.95rem" />
              <span>Assign to Classroom</span>
            </button>

            <button
              type="button"
              className="assessment-dropdown-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onEdit(template);
              }}
              disabled={isArchived}
            >
              <PencilIcon size="0.95rem" />
              <span>Edit</span>
            </button>

            <div className="assessment-dropdown-divider" role="separator" />

            <button
              type="button"
              className="assessment-dropdown-item assessment-dropdown-item--danger"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onDelete(template);
              }}
              disabled={isArchived}
            >
              <TrashIcon size="0.95rem" />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
