/**
 * Client mirror of server/src/constant/features.ts.
 * Keys must stay in sync; labels are only used for the "not available" copy
 * and the super admin toggles fall back to the server-provided labels.
 */
export const FEATURE_KEYS = [
  "attendance",
  "attendance_reports",
  "gradebook",
  "academic_record",
  "enrollments",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  attendance: "Attendance",
  attendance_reports: "Classroom attendance reports",
  gradebook: "Gradebook",
  academic_record: "Student academic record",
  enrollments: "Enrollments",
};
