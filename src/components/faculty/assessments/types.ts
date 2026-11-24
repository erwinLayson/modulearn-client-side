import type { ModuleActivityTemplate } from "../../../service/faculty/myModulesService";

export type AssessmentSortField = "title" | "category" | "max_score" | "created_at";
export type SortDirection = "asc" | "desc";

export interface AssessmentLibraryTableProps {
  templates: ModuleActivityTemplate[];
  creatorName?: string | null;
  moduleTitle?: string;
  moduleSubject?: string;
  hasAssignments?: boolean;
  isArchived?: boolean;
  loading?: boolean;
  error?: string | null;
  onCreateTemplate: () => void;
  onEditTemplate: (template: ModuleActivityTemplate) => void;
  onDeleteTemplate: (template: ModuleActivityTemplate) => void;
  onAssignTemplate: (template: ModuleActivityTemplate) => void;
}

export interface AssessmentPreviewModalProps {
  template: ModuleActivityTemplate | null;
  isOpen: boolean;
  creatorName?: string | null;
  moduleTitle?: string;
  moduleSubject?: string;
  hasAssignments?: boolean;
  isArchived?: boolean;
  onClose: () => void;
  onEdit: (template: ModuleActivityTemplate) => void;
  onAssign: (template: ModuleActivityTemplate) => void;
}

export interface AssessmentRowActionsMenuProps {
  template: ModuleActivityTemplate;
  hasAssignments?: boolean;
  isArchived?: boolean;
  onPreview: (template: ModuleActivityTemplate) => void;
  onAssign: (template: ModuleActivityTemplate) => void;
  onEdit: (template: ModuleActivityTemplate) => void;
  onDelete: (template: ModuleActivityTemplate) => void;
}
