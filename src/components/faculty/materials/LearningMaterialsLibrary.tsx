import { useState, useMemo } from "react";
import WrittenLessonCard from "./WrittenLessonCard";
import DocumentMaterialCard from "./DocumentMaterialCard";
import { BookOpenIcon, DocumentIcon } from "./MaterialIcons";
import type { ModuleLessonItem } from "../../../api/modules";
import type { MaterialFilterType, MaterialSortOption } from "./types";

export interface LearningMaterialsLibraryProps {
  moduleId: string;
  moduleTitle: string;
  lessons: ModuleLessonItem[];
  onReadLesson: (lesson: ModuleLessonItem) => void;
  onPreviewDocument: (lesson: ModuleLessonItem) => void;
  onAssignLesson: (lesson: ModuleLessonItem) => void;
  onEditLesson: (lesson: ModuleLessonItem) => void;
  onDeleteLesson: (lesson: ModuleLessonItem) => void;
  onOpenCreateTextLesson: () => void;
  onOpenUploadFileLesson: () => void;
  getFileDownloadUrl?: (lessonId: string) => string;
}

export default function LearningMaterialsLibrary({
  moduleId,
  moduleTitle,
  lessons,
  onReadLesson,
  onPreviewDocument,
  onAssignLesson,
  onEditLesson,
  onDeleteLesson,
  onOpenCreateTextLesson,
  onOpenUploadFileLesson,
  getFileDownloadUrl,
}: LearningMaterialsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<MaterialFilterType>("all");
  const [sortOption, setSortOption] = useState<MaterialSortOption>("order");

  // Summary counts
  const writtenCount = useMemo(
    () => lessons.filter((l) => l.lesson_type === "text").length,
    [lessons]
  );
  const documentCount = useMemo(
    () => lessons.filter((l) => l.lesson_type === "file").length,
    [lessons]
  );

  // Filtered & sorted materials
  const filteredMaterials = useMemo(() => {
    let result = [...lessons];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.content && item.content.toLowerCase().includes(q)) ||
          (item.file_name && item.file_name.toLowerCase().includes(q))
      );
    }

    // Material type filter
    if (filterType === "written") {
      result = result.filter((item) => item.lesson_type === "text");
    } else if (filterType === "file") {
      result = result.filter((item) => item.lesson_type === "file");
    } else if (filterType === "pdf") {
      result = result.filter(
        (item) =>
          item.lesson_type === "file" &&
          ((item.file_name && item.file_name.toLowerCase().endsWith(".pdf")) ||
            (item.file_type && item.file_type.includes("pdf")))
      );
    } else if (filterType === "office") {
      result = result.filter((item) => {
        if (item.lesson_type !== "file") return false;
        const fn = (item.file_name || "").toLowerCase();
        return (
          fn.endsWith(".doc") ||
          fn.endsWith(".docx") ||
          fn.endsWith(".ppt") ||
          fn.endsWith(".pptx") ||
          fn.endsWith(".xls") ||
          fn.endsWith(".xlsx")
        );
      });
    }

    // Sort
    if (sortOption === "order") {
      result.sort((a, b) => a.sort_order - b.sort_order);
    } else if (sortOption === "newest") {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOption === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [lessons, searchQuery, filterType, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSortOption("order");
  };

  return (
    <section className="materials-library-section" aria-labelledby="materials-library-heading">
      {/* Library Header */}
      <div className="materials-library-header">
        <div className="materials-library-header-main">
          <div className="materials-library-title-row">
            <h3 id="materials-library-heading" className="materials-library-title">
              Learning Materials
            </h3>
            <span className="materials-library-count-pill">{lessons.length}</span>
          </div>
          <p className="materials-library-subtitle">
            Curate written lectures, long-form reading lessons, and document study materials (PDF, Word, PowerPoint) for {moduleTitle}.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="materials-library-cta-group">
          <button
            type="button"
            className="mgmt-btn mgmt-btn--ghost materials-library-btn"
            onClick={onOpenCreateTextLesson}
          >
            <BookOpenIcon size="1rem" />
            <span>Write Lesson</span>
          </button>
          <button
            type="button"
            className="mgmt-btn mgmt-btn--primary materials-library-btn"
            onClick={onOpenUploadFileLesson}
          >
            <DocumentIcon size="1rem" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      {lessons.length > 0 && (
        <div className="materials-library-toolbar">
          {/* Search Box */}
          <div className="materials-library-search-wrap">
            <svg
              className="materials-library-search-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="search"
              className="materials-library-search-input"
              placeholder="Search materials by title, note, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search materials in this module"
            />
            {searchQuery && (
              <button
                type="button"
                className="materials-library-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Type Filters Tabs */}
          <div className="materials-library-tabs" role="tablist" aria-label="Filter by material type">
            <button
              type="button"
              className={`materials-library-tab ${filterType === "all" ? "materials-library-tab--active" : ""}`}
              onClick={() => setFilterType("all")}
              role="tab"
              aria-selected={filterType === "all"}
            >
              All ({lessons.length})
            </button>
            <button
              type="button"
              className={`materials-library-tab ${filterType === "written" ? "materials-library-tab--active" : ""}`}
              onClick={() => setFilterType("written")}
              role="tab"
              aria-selected={filterType === "written"}
            >
              Written Lessons ({writtenCount})
            </button>
            <button
              type="button"
              className={`materials-library-tab ${filterType === "file" ? "materials-library-tab--active" : ""}`}
              onClick={() => setFilterType("file")}
              role="tab"
              aria-selected={filterType === "file"}
            >
              Documents ({documentCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="materials-library-sort-wrap">
            <label htmlFor="material-sort-select" className="materials-library-sort-label">
              Sort:
            </label>
            <select
              id="material-sort-select"
              className="materials-library-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as MaterialSortOption)}
              aria-label="Sort learning materials"
            >
              <option value="order">Order Index</option>
              <option value="newest">Newest Added</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Materials Grid or Empty States */}
      {lessons.length === 0 ? (
        <div className="materials-library-empty-box">
          <div className="materials-library-empty-icon" aria-hidden="true">
            <BookOpenIcon size="2rem" />
          </div>
          <h4 className="materials-library-empty-title">No Learning Materials Added</h4>
          <p className="materials-library-empty-desc">
            Build this module's learning curriculum by writing interactive long-form lessons or uploading documents like lecture notes, slides, and reading PDFs.
          </p>
          <div className="materials-library-empty-actions">
            <button
              type="button"
              className="mgmt-btn mgmt-btn--ghost"
              onClick={onOpenCreateTextLesson}
            >
              <BookOpenIcon size="1rem" />
              <span>Write First Lesson</span>
            </button>
            <button
              type="button"
              className="mgmt-btn mgmt-btn--primary"
              onClick={onOpenUploadFileLesson}
            >
              <DocumentIcon size="1rem" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="materials-library-empty-box">
          <h4 className="materials-library-empty-title">No Materials Match Your Filters</h4>
          <p className="materials-library-empty-desc">
            We couldn't find any materials matching "{searchQuery}". Try adjusting your keywords or clearing the filter.
          </p>
          <button
            type="button"
            className="mgmt-btn mgmt-btn--ghost"
            onClick={handleResetFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="materials-library-grid">
          {filteredMaterials.map((item) =>
            item.lesson_type === "file" ? (
              <DocumentMaterialCard
                key={item.id}
                lesson={item}
                moduleId={moduleId}
                downloadUrl={getFileDownloadUrl ? getFileDownloadUrl(item.id) : item.file_path}
                onPreview={onPreviewDocument}
                onAssign={onAssignLesson}
                onEdit={onEditLesson}
                onDelete={onDeleteLesson}
              />
            ) : (
              <WrittenLessonCard
                key={item.id}
                lesson={item}
                moduleId={moduleId}
                onRead={onReadLesson}
                onAssign={onAssignLesson}
                onEdit={onEditLesson}
                onDelete={onDeleteLesson}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
