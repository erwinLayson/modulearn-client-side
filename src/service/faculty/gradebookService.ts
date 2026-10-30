import { classApi, type FacultyClassAssignment } from "../../api/classes";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";

export type { FacultyClassAssignment, SchoolYear };

export interface GradebookPageData {
  assignments: FacultyClassAssignment[];
  currentSchoolYear: SchoolYear | null;
}

export async function fetchGradebookPageData(userId: string, schoolId?: number): Promise<GradebookPageData> {
  const [classesRes, syRes] = await Promise.all([
    classApi.getAssignedClasses(userId),
    schoolId ? schoolYearApi.getCurrent(schoolId) : Promise.resolve({ data: { data: null } }),
  ]);

  const currentSy = syRes.data.data || null;
  const assignments = (classesRes.data.data || []).filter((a: FacultyClassAssignment) =>
    currentSy ? a.school_year_id === currentSy.id : true
  );

  return { assignments, currentSchoolYear: currentSy };
}
