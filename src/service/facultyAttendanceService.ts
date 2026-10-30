import {
  classApi,
  attendanceApi,
  type FacultyClassAssignment,
  type AttendanceStatus,
  type AttendanceHistoryItem,
} from "../api/classes";
import { enrollmentApi, type EnrollmentListItem } from "../api/enrollments";
import { schoolYearApi, type SchoolYear } from "../api/school-years";
import { COLORS } from "../constant/colors";

export type {
  FacultyClassAssignment,
  AttendanceStatus,
  AttendanceHistoryItem,
  EnrollmentListItem,
  SchoolYear,
};

export interface ClassCardData {
  assignment: FacultyClassAssignment;
  sessionCount: number;
  todayRecorded: number;
  todayPending: number;
}

export interface SpreadSession {
  date: string;
  subject_id: string;
  subject_name: string;
  statuses: Record<string, AttendanceStatus>;
}

export interface SpreadStudent {
  student_id: string;
  student_name: string;
  lrn: string | null;
}

export interface AttendanceSpreadsheet {
  sessions: SpreadSession[];
  students: SpreadStudent[];
}

export interface AttendanceCounts {
  present: number;
  absent: number;
  total: number;
  rate: number;
}

export interface LoadClassCardsResult {
  currentSchoolYear: SchoolYear | null;
  cards: ClassCardData[];
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getRate(present: number, total: number): number {
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

export function rateColor(rate: number): string {
  return rate >= 75 ? COLORS.present : rate >= 50 ? COLORS.warning : COLORS.error;
}

export function formatSessionDate(date: string): string {
  return new Date(date.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatClassSubtitle(assignment: FacultyClassAssignment): string {
  return (
    [
      assignment.grade_level || null,
      assignment.section ? `Section ${assignment.section}` : null,
    ]
      .filter(Boolean)
      .join(" \u00b7 ") || "Class details"
  );
}

export function formatCreateSessionClassLabel(assignment: FacultyClassAssignment): string {
  return `${assignment.class_name}${assignment.section ? ` ${assignment.section}` : ""}${
    assignment.grade_level ? ` \u00b7 ${assignment.grade_level}` : ""
  }`;
}

export async function loadClassCards(
  facultyId: string,
  schoolId: number | null,
  selectedPeriod: string,
  today: string
): Promise<LoadClassCardsResult> {
  const [res, syRes] = await Promise.all([
    classApi.getAssignedClasses(facultyId),
    schoolId
      ? schoolYearApi.getCurrent(schoolId)
      : Promise.resolve({ data: { data: null } }),
  ]);
  const currentSy = syRes.data.data || null;
  const assignments = (res.data.data || []).filter((a: FacultyClassAssignment) =>
    currentSy ? a.school_year_id === currentSy.id : true
  );

  const periodParam = selectedPeriod ? Number(selectedPeriod) : undefined;
  const todayRes = await attendanceApi.getHistory({
    date_from: today,
    date_to: today,
    limit: 200,
    ...(periodParam ? { period_id: periodParam } : {}),
  });
  const todayHistory: AttendanceHistoryItem[] = todayRes.data.data?.data || [];
  const todayMap = new Map<string, AttendanceHistoryItem>();
  for (const h of todayHistory) todayMap.set(`${h.class_id}::${h.subject_id}`, h);

  const allHistoryRes = await attendanceApi.getHistory({
    limit: 500,
    ...(periodParam ? { period_id: periodParam } : {}),
  });
  const allHistory: AttendanceHistoryItem[] = allHistoryRes.data.data?.data || [];
  const sessionCountMap = new Map<string, Set<string>>();
  for (const h of allHistory) {
    const key = h.class_id;
    if (!sessionCountMap.has(key)) sessionCountMap.set(key, new Set());
    sessionCountMap.get(key)!.add(`${h.subject_id}::${h.attendance_date}`);
  }

  const cards: ClassCardData[] = assignments.map((a) => {
    const recorded = (a.subjects || []).filter((s) => todayMap.has(`${a.id}::${s.id}`)).length;
    const pending = (a.subjects || []).length - recorded;
    return {
      assignment: a,
      sessionCount: sessionCountMap.get(a.id)?.size || 0,
      todayRecorded: recorded,
      todayPending: pending,
    };
  });

  return { currentSchoolYear: currentSy, cards };
}

export async function loadClassEnrollments(
  schoolId: number,
  classId: string
): Promise<EnrollmentListItem[]> {
  const syRes = await schoolYearApi.getCurrent(schoolId);
  const sy = syRes.data.data;
  if (!sy) return [];
  const enrRes = await enrollmentApi.getByClassAndSchoolYear(classId, sy.id);
  return (enrRes.data.data || []).filter((e) => e.status === "active");
}

interface RawSession {
  date: string;
  subject_id: string;
  subject_name: string;
}

function sortSessions(sessionMap: Map<string, RawSession>): RawSession[] {
  return [...sessionMap.values()].sort((a, b) => {
    const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    return dateCmp !== 0 ? dateCmp : a.subject_name.localeCompare(b.subject_name);
  });
}

async function loadSessionStatuses(
  classId: string,
  sessions: RawSession[]
): Promise<SpreadSession[]> {
  const sessionStatuses: SpreadSession[] = [];
  for (const sess of sessions) {
    try {
      const attRes = await classApi.getAttendance(classId, sess.date, sess.subject_id);
      const statuses: Record<string, AttendanceStatus> = {};
      for (const r of attRes.data.data || []) statuses[r.student_id] = r.status;
      sessionStatuses.push({ ...sess, statuses });
    } catch {
      sessionStatuses.push({ ...sess, statuses: {} });
    }
  }
  return sessionStatuses;
}

function buildStudents(enrollments: EnrollmentListItem[]): SpreadStudent[] {
  return enrollments.map((e) => ({
    student_id: e.student_id,
    student_name: e.student_name,
    lrn: e.lrn ?? null,
  }));
}

export async function loadAttendanceSpreadsheet(
  assignment: FacultyClassAssignment,
  enrollments: EnrollmentListItem[],
  selectedPeriod: string
): Promise<AttendanceSpreadsheet> {
  const periodParam = selectedPeriod || undefined;
  const [sessRes, histRes] = await Promise.all([
    classApi.getClassSessions(assignment.id, periodParam),
    attendanceApi.getHistory({
      class_id: assignment.id,
      limit: 200,
      ...(selectedPeriod ? { period_id: Number(selectedPeriod) } : {}),
    }),
  ]);
  const apiSessions = sessRes.data.data || [];
  const history: AttendanceHistoryItem[] = histRes.data.data?.data || [];

  const sessionMap = new Map<string, RawSession>();
  for (const s of apiSessions) {
    const dateOnly = s.attendance_date.slice(0, 10);
    const key = `${dateOnly}::${s.subject_id}`;
    if (!sessionMap.has(key)) {
      const subjectName =
        (assignment.subjects || []).find((x) => x.id === s.subject_id)?.name || "Subject";
      sessionMap.set(key, { date: dateOnly, subject_id: s.subject_id, subject_name: subjectName });
    }
  }
  for (const h of history) {
    const dateOnly = h.attendance_date.slice(0, 10);
    const key = `${dateOnly}::${h.subject_id}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: dateOnly,
        subject_id: h.subject_id,
        subject_name: h.subject_name,
      });
    }
  }

  const sessions = await loadSessionStatuses(assignment.id, sortSessions(sessionMap));
  return { sessions, students: buildStudents(enrollments) };
}

export interface HistoryFilters {
  subjectId: string;
  dateFrom: string;
  dateTo: string;
}

export async function loadHistorySpreadsheet(
  assignment: FacultyClassAssignment,
  filters: HistoryFilters,
  enrollments: EnrollmentListItem[],
  selectedPeriod: string
): Promise<AttendanceSpreadsheet> {
  const subjectFilter = filters.subjectId || undefined;
  const res = await attendanceApi.getHistory({
    class_id: assignment.id,
    subject_id: subjectFilter,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    limit: 200,
    ...(selectedPeriod ? { period_id: Number(selectedPeriod) } : {}),
  });
  const history: AttendanceHistoryItem[] = res.data.data?.data || [];

  const sessionMap = new Map<string, RawSession>();
  for (const s of history) {
    const dateOnly = s.attendance_date.slice(0, 10);
    const key = `${dateOnly}::${s.subject_id}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: dateOnly,
        subject_id: s.subject_id,
        subject_name: s.subject_name,
      });
    }
  }

  const sortedSessions = sortSessions(sessionMap).map((sess) => ({
    ...sess,
    date: sess.date.slice(0, 10),
  }));
  const sessions = await loadSessionStatuses(assignment.id, sortedSessions);
  return { sessions, students: buildStudents(enrollments) };
}

export function getAttendanceEditKey(
  studentId: string,
  date: string,
  subjectId: string
): string {
  return `${studentId}::${date}::${subjectId}`;
}

export function isValidAttendanceCellValue(value: string): boolean {
  return value === "0" || value === "1" || value === "";
}

export function applyAttendanceCellEdit(
  prev: Map<string, AttendanceStatus>,
  studentId: string,
  date: string,
  subjectId: string,
  value: string
): Map<string, AttendanceStatus> {
  const next = new Map(prev);
  const key = getAttendanceEditKey(studentId, date, subjectId);
  if (value === "") {
    next.delete(key);
  } else {
    next.set(key, value === "1" ? "present" : "absent");
  }
  return next;
}

export function getEffectiveAttendanceStatus(
  pendingEdits: Map<string, AttendanceStatus>,
  studentId: string,
  date: string,
  subjectId: string,
  originalStatus: AttendanceStatus | undefined
): AttendanceStatus | undefined {
  const key = getAttendanceEditKey(studentId, date, subjectId);
  if (pendingEdits.has(key)) return pendingEdits.get(key);
  return originalStatus;
}

export function getAttendanceCellDisplayValue(
  pendingEdits: Map<string, AttendanceStatus>,
  studentId: string,
  date: string,
  subjectId: string,
  originalStatus: AttendanceStatus | undefined
): string {
  const key = getAttendanceEditKey(studentId, date, subjectId);
  if (pendingEdits.has(key)) {
    const v = pendingEdits.get(key);
    return v === "present" ? "1" : v === "absent" ? "0" : "";
  }
  if (originalStatus === "present") return "1";
  if (originalStatus === "absent") return "0";
  return "";
}

export function filterAttendanceSessions(
  sessions: SpreadSession[],
  subjectFilter: string
): SpreadSession[] {
  return subjectFilter ? sessions.filter((s) => s.subject_id === subjectFilter) : sessions;
}

export function getStudentAttendanceCounts(
  sessions: SpreadSession[],
  studentId: string,
  pendingEdits: Map<string, AttendanceStatus> = new Map()
): AttendanceCounts {
  let present = 0;
  let absent = 0;
  for (const s of sessions) {
    const effective = getEffectiveAttendanceStatus(
      pendingEdits,
      studentId,
      s.date,
      s.subject_id,
      s.statuses[studentId]
    );
    if (effective === "present") present++;
    else if (effective === "absent") absent++;
  }
  const total = present + absent;
  return { present, absent, total, rate: getRate(present, total) };
}

export function getAttendanceSessionCounts(
  session: SpreadSession,
  students: SpreadStudent[],
  pendingEdits: Map<string, AttendanceStatus> = new Map()
): AttendanceCounts {
  let present = 0;
  let absent = 0;
  for (const st of students) {
    const effective = getEffectiveAttendanceStatus(
      pendingEdits,
      st.student_id,
      session.date,
      session.subject_id,
      session.statuses[st.student_id]
    );
    if (effective === "present") present++;
    else if (effective === "absent") absent++;
  }
  const total = present + absent;
  return { present, absent, total, rate: getRate(present, total) };
}

export function getHistorySessionCounts(session: SpreadSession): AttendanceCounts {
  const present = Object.values(session.statuses).filter((v) => v === "present").length;
  const absent = Object.values(session.statuses).filter((v) => v === "absent").length;
  const total = present + absent;
  return { present, absent, total, rate: getRate(present, total) };
}

export function getAttendanceOverallCounts(
  sessions: SpreadSession[],
  students: SpreadStudent[],
  pendingEdits: Map<string, AttendanceStatus> = new Map()
): AttendanceCounts {
  let present = 0;
  let absent = 0;
  for (const st of students) {
    for (const sess of sessions) {
      const effective = getEffectiveAttendanceStatus(
        pendingEdits,
        st.student_id,
        sess.date,
        sess.subject_id,
        sess.statuses[st.student_id]
      );
      if (effective === "present") present++;
      else if (effective === "absent") absent++;
    }
  }
  const total = present + absent;
  return { present, absent, total, rate: getRate(present, total) };
}

export function getHistoryOverallCounts(
  sessions: SpreadSession[],
  students: SpreadStudent[]
): AttendanceCounts {
  let present = 0;
  let absent = 0;
  for (const st of students) {
    for (const sess of sessions) {
      const status = sess.statuses[st.student_id];
      if (status === "present") present++;
      else if (status === "absent") absent++;
    }
  }
  const total = present + absent;
  return { present, absent, total, rate: getRate(present, total) };
}

export interface CreateSessionValidationParams {
  selectedClass: FacultyClassAssignment | null;
  subjectId: string;
  enrollmentCount: number;
  date: string;
  periodId: string;
  sessions: SpreadSession[];
}

export function getCreateSessionValidationError(
  params: CreateSessionValidationParams
): string | null {
  if (!params.selectedClass || !params.subjectId) return "Select a subject";
  if (params.enrollmentCount === 0) return "No students enrolled";
  if (!params.date) return "Select a date";
  if (!params.periodId) return "Academic period is required";

  const duplicate = params.sessions.some(
    (s) => s.date === params.date && s.subject_id === params.subjectId
  );
  if (duplicate) {
    return `Attendance for this subject on ${params.date} already exists. Edit the existing session instead.`;
  }
  return null;
}

export async function createAttendanceSession(params: {
  classId: string;
  subjectId: string;
  date: string;
  periodId: string;
}): Promise<void> {
  await classApi.createAttendanceSession({
    class_id: params.classId,
    subject_id: params.subjectId,
    date: params.date,
    period_id: Number(params.periodId),
  });
}

export async function saveAttendanceEdits(
  classId: string,
  pendingEdits: Map<string, AttendanceStatus>
): Promise<number> {
  const recordsToSave: { student_id: string; status: AttendanceStatus }[] = [];
  const affectedSessions = new Map<string, string>();

  for (const [key, status] of pendingEdits) {
    const [studentId, date, subjectId] = key.split("::");
    recordsToSave.push({ student_id: studentId, status });
    affectedSessions.set(`${date}::${subjectId}`, date);
  }

  if (recordsToSave.length === 0) return 0;

  for (const [sessionKey, date] of affectedSessions) {
    const [, subjectId] = sessionKey.split("::");
    const sessionRecords = recordsToSave.filter((r) => {
      const k = getAttendanceEditKey(r.student_id, date, subjectId);
      return pendingEdits.has(k);
    });
    if (sessionRecords.length > 0) {
      await classApi.editAttendance(classId, {
        records: sessionRecords,
        date,
        subject_id: subjectId,
      });
    }
  }

  return recordsToSave.length;
}

export { getApiErrorMessage } from "../api/client";


