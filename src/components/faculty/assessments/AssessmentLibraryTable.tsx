import { useState, useMemo } from "react";
import type { ModuleActivityTemplate } from "../../../service/faculty/myModulesService";
import type { AssessmentLibraryTableProps, AssessmentSortField, SortDirection } from "./types";
import {
  getCategoryMeta,
  calculateActivityItems,
  formatActivityPoints,
  formatActivityDate,
} from "./assessmentUtils";
import {
  QuizIcon,
  ExamIcon,
  ActivityIcon,
  SearchIcon,
  FilterIcon,
  SortNeutralIcon,
  SortUpIcon,
  SortDownIcon,
} from "./AssessmentIcons";
import AssessmentRowActionsMenu from "./AssessmentRowActionsMenu";
import AssessmentPreviewModal from "./AssessmentPreviewModal";

export default function AssessmentLibraryTable({
  templates,
  creatorName,
  moduleTitle,
  moduleSubject,
  hasAssignments = true,
  isArchived = false,
  loading = false,
  error = null,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onAssignTemplate,
}: AssessmentLibraryTableProps) {
  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<AssessmentSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<ModuleActivityTemplate | null>(null);

  // Sorting handler
  const handleSort = (field: AssessmentSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const isFiltersActive = searchQuery.trim() !== "" || selectedCategory !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  };

  // Filter & Sort
  const filteredAndSortedTemplates = useMemo(() => {
    let result = [...templates];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.instructions && t.instructions.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "max_score":
          comparison = Number(a.max_score) - Number(b.max_score);
          break;
        case "created_at":
        default: {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = timeA - timeB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [templates, selectedCategory, searchQuery, sortField, sortDirection]);

  // Pagination slice
  const totalItems = filteredAndSortedTemplates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTemplates = filteredAndSortedTemplates.slice(startIndex, endIndex);

  // Render sort icon helper
  const renderSortIndicator = (field: AssessmentSortField) => {
    if (sortField !== field) {
      return <SortNeutralIcon className="assessment-sort-icon assessment-sort-icon--neutral" />;
    }
    return sortDirection === "asc" ? (
      <SortUpIcon className="assessment-sort-icon assessment-sort-icon--active" />
    ) : (
      <SortDownIcon className="assessment-sort-icon assessment-sort-icon--active" />
    );
  };

  const renderTypeIcon = (category: string) => {
    switch (category) {
      case "quizzes":
        return <QuizIcon size="1rem" />;
      case "exams":
        return <ExamIcon size="1rem" />;
      case "activities":
      default:
        return <ActivityIcon size="1rem" />;
    }
  };

  return (
    <div className="assessment-library-container">
      {/* Section Header */}
      <div className="assessment-library-header">
        <div className="assessment-library-title-group">
          <h3 className="assessment-library-title">
            Activity Templates ({templates.length})
          </h3>
          <p className="assessment-library-subtitle">
            Assessment library of reusable templates that can be assigned as graded activities in your classes.
          </p>
        </div>

        <button
          type="button"
          className="mgmt-btn mgmt-btn--primary mgmt-btn--sm assessment-create-btn"
          onClick={onCreateTemplate}
          disabled={isArchived}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>+ Add Template</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="assessment-error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Management Toolbar */}
      <div className="assessment-toolbar">
        <div className="assessment-toolbar-left">
          {/* Search Input */}
          <div className="assessment-search-wrap">
            <SearchIcon className="assessment-search-icon" size="0.95rem" />
            <input
              type="text"
              className="assessment-search-input"
              placeholder="Search activities by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search activities by name"
            />
            {searchQuery && (
              <button
                type="button"
                className="assessment-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="assessment-filter-wrap">
            <FilterIcon className="assessment-filter-icon" size="0.9rem" />
            <select
              className="assessment-filter-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by activity type"
            >
              <option value="all">All Types</option>
              <option value="activities">Assignments</option>
              <option value="quizzes">Quizzes</option>
              <option value="exams">Exams</option>
            </select>
          </div>

          {/* Clear Filters CTA */}
          {isFiltersActive && filteredAndSortedTemplates.length > 0 && (
            <button
              type="button"
              className="assessment-clear-filters-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="assessment-toolbar-right">
          {/* Page Size Selector */}
          <div className="assessment-page-size-wrap">
            <label htmlFor="assessment-page-size" className="assessment-page-size-label">
              Rows:
            </label>
            <select
              id="assessment-page-size"
              className="assessment-page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        /* Loading Skeleton */
        <div className="assessment-table-card">
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Activity Name</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Points</th>
                  <th>Creator</th>
                  <th>Date Created</th>
                  <th className="assessment-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="assessment-skeleton-row">
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--title" /></td>
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--badge" /></td>
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--sm" /></td>
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--sm" /></td>
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--md" /></td>
                    <td><div className="assessment-skeleton-bar assessment-skeleton-bar--md" /></td>
                    <td className="assessment-col-actions"><div className="assessment-skeleton-bar assessment-skeleton-bar--btn" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : templates.length === 0 ? (
        /* Overall Empty State (No Templates Created Yet) */
        <div className="assessment-empty-card">
          <div className="assessment-empty-icon-wrap" aria-hidden="true">
            <ActivityIcon size="2rem" />
          </div>
          <h4 className="assessment-empty-title">No Activity Templates Yet</h4>
          <p className="assessment-empty-text">
            Create reusable assignments, quizzes, and exams in this module that you can assign across all your classes.
          </p>
          <button
            type="button"
            className="mgmt-btn mgmt-btn--primary mgmt-btn--sm"
            onClick={onCreateTemplate}
            disabled={isArchived}
          >
            Create your first template
          </button>
        </div>
      ) : filteredAndSortedTemplates.length === 0 ? (
        /* Filter No-Match State */
        <div className="assessment-empty-card assessment-empty-card--no-match">
          <div className="assessment-empty-icon-wrap" aria-hidden="true">
            <SearchIcon size="1.75rem" />
          </div>
          <h4 className="assessment-empty-title">No matching activities found</h4>
          <p className="assessment-empty-text">
            No activities matched your current search &ldquo;{searchQuery}&rdquo; and type filters.
          </p>
          <button
            type="button"
            className="mgmt-btn mgmt-btn--secondary mgmt-btn--sm"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Assessment Library Table */
        <div className="assessment-table-card">
          <div className="assessment-table-wrap">
            <table className="assessment-table" aria-label="Assessment Library Table">
              <thead>
                <tr>
                  {/* Activity Name (Sortable) */}
                  <th
                    className="assessment-col-sortable assessment-col-title"
                    onClick={() => handleSort("title")}
                    aria-sort={sortField === "title" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort("title");
                      }
                    }}
                  >
                    <div className="assessment-th-content">
                      <span>Activity Name</span>
                      {renderSortIndicator("title")}
                    </div>
                  </th>

                  {/* Type (Sortable) */}
                  <th
                    className="assessment-col-sortable assessment-col-type"
                    onClick={() => handleSort("category")}
                    aria-sort={sortField === "category" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort("category");
                      }
                    }}
                  >
                    <div className="assessment-th-content">
                      <span>Type</span>
                      {renderSortIndicator("category")}
                    </div>
                  </th>

                  {/* Items */}
                  <th className="assessment-col-items">
                    <span>Items</span>
                  </th>

                  {/* Points (Sortable) */}
                  <th
                    className="assessment-col-sortable assessment-col-points"
                    onClick={() => handleSort("max_score")}
                    aria-sort={sortField === "max_score" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort("max_score");
                      }
                    }}
                  >
                    <div className="assessment-th-content">
                      <span>Points</span>
                      {renderSortIndicator("max_score")}
                    </div>
                  </th>

                  {/* Creator */}
                  <th className="assessment-col-creator">
                    <span>Creator</span>
                  </th>

                  {/* Date Created (Sortable) */}
                  <th
                    className="assessment-col-sortable assessment-col-date"
                    onClick={() => handleSort("created_at")}
                    aria-sort={sortField === "created_at" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    role="columnheader"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort("created_at");
                      }
                    }}
                  >
                    <div className="assessment-th-content">
                      <span>Date Created</span>
                      {renderSortIndicator("created_at")}
                    </div>
                  </th>

                  {/* Actions Column */}
                  <th className="assessment-col-actions" aria-label="Row Actions">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTemplates.map((template) => {
                  const categoryMeta = getCategoryMeta(template.category);
                  const itemsMeta = calculateActivityItems(template.instructions);
                  const formattedPoints = formatActivityPoints(template.max_score);
                  const formattedDate = formatActivityDate(template.created_at);

                  return (
                    <tr key={template.id} className="assessment-table-row">
                      {/* Column 1: Activity Name (Clickable link to preview) */}
                      <td className="assessment-cell-title">
                        <div className="assessment-title-flex">
                          <span
                            className={`assessment-row-type-icon assessment-row-type-icon--${categoryMeta.value}`}
                            aria-hidden="true"
                          >
                            {renderTypeIcon(template.category)}
                          </span>
                          <button
                            type="button"
                            className="assessment-title-link"
                            onClick={() => setPreviewTemplate(template)}
                            title={`Preview ${template.title}`}
                          >
                            {template.title}
                          </button>
                        </div>
                      </td>

                      {/* Column 2: Type Badge */}
                      <td className="assessment-cell-type">
                        <span className={`assessment-badge ${categoryMeta.badgeClass}`}>
                          {categoryMeta.label}
                        </span>
                      </td>

                      {/* Column 3: Items */}
                      <td className="assessment-cell-items">
                        <span className="assessment-items-text">{itemsMeta.label}</span>
                      </td>

                      {/* Column 4: Points */}
                      <td className="assessment-cell-points">
                        <span className="assessment-points-badge">{formattedPoints}</span>
                      </td>

                      {/* Column 5: Creator */}
                      <td className="assessment-cell-creator">
                        <span className="assessment-creator-text" title={creatorName || "Faculty Teacher"}>
                          {creatorName || "Faculty Teacher"}
                        </span>
                      </td>

                      {/* Column 6: Date Created */}
                      <td className="assessment-cell-date">
                        <span className="assessment-date-text">{formattedDate}</span>
                      </td>

                      {/* Column 7: Actions Dropdown Menu */}
                      <td className="assessment-cell-actions">
                        <AssessmentRowActionsMenu
                          template={template}
                          hasAssignments={hasAssignments}
                          isArchived={isArchived}
                          onPreview={() => setPreviewTemplate(template)}
                          onAssign={onAssignTemplate}
                          onEdit={onEditTemplate}
                          onDelete={onDeleteTemplate}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination & Result Count */}
          <div className="assessment-table-footer">
            <div className="assessment-result-count">
              Showing{" "}
              <strong>
                {totalItems === 0 ? 0 : startIndex + 1}&ndash;{endIndex}
              </strong>{" "}
              of <strong>{totalItems}</strong> {totalItems === 1 ? "activity" : "activities"}
            </div>

            {totalPages > 1 && (
              <div className="assessment-pagination">
                <button
                  type="button"
                  className="assessment-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>

                <span className="assessment-page-indicator">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="assessment-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Preview Modal */}
      <AssessmentPreviewModal
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        creatorName={creatorName}
        moduleTitle={moduleTitle}
        moduleSubject={moduleSubject}
        hasAssignments={hasAssignments}
        isArchived={isArchived}
        onClose={() => setPreviewTemplate(null)}
        onEdit={(template) => {
          setPreviewTemplate(null);
          onEditTemplate(template);
        }}
        onAssign={(template) => {
          setPreviewTemplate(null);
          onAssignTemplate(template);
        }}
      />
    </div>
  );
}
