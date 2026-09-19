import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { classApi, type ClassListItem } from "../../api/classes";
import { enrollmentApi, type EnrollmentListItem } from "../../api/enrollments";
import { studentApi, type StudentListItem } from "../../api/students";
import { schoolYearApi, type SchoolYear } from "../../api/school-years";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

interface ClassSubject {
  id: string;
  name: string;
  teacher_name: string | null;
}

const STATUS_LABELS: Record<EnrollmentListItem["status"], string> = {
  active: "Active",
  dropped: "Dropped",
  completed: "Completed",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

const AVATAR_VARIANTS = ["enroll-avatar--1", "enroll-avatar--2", "enroll-avatar--3", "enroll-avatar--4", "enroll-avatar--5", "enroll-avatar--6"];
function avatarClass(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_VARIANTS[sum % AVATAR_VARIANTS.length];
}

export default function ManageEnrollments() {
  const { user } = useAuth();
  const schoolId = user?.school_id ?? 0;
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSYId, setSelectedSYId] = useState<number>(0);

  const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const debouncedSearch = useDebounce(studentSearch, 300);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  const [allClasses, setAllClasses] = useState<ClassListItem[]>([]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Search dropdown state
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  // Determine active step
  const step1Done = selectedSYId > 0;
  const step2Done = !!selectedStudent;
  const step3Done = selectedGradeLevel !== null;
  const step4Done = !!selectedClass;
  const step5Done = classSubjects.length > 0 && selectedSubjectIds.length > 0;
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : !step5Done ? 5 : 5;

  // Load school years + auto-generate
  const loadSchoolYears = useCallback(async () => {
    if (!schoolId) return;
    try {
      await schoolYearApi.autoGenerate(schoolId);
      const res = await schoolYearApi.getBySchoolId(schoolId);
      const syList = res.data.data || [];
      setSchoolYears(syList);
      const current = syList.find((s: SchoolYear) => s.is_current === 1);
      if (current) setSelectedSYId(current.id);
    } catch {
      setToast({ message: "Failed to load school years", type: "error" });
    }
  }, [schoolId]);

  const loadBaseData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [studentsRes, classesRes] = await Promise.all([
        studentApi.getAll(schoolId),
        classApi.getBySchoolId(schoolId),
      ]);
      setAllStudents(studentsRes.data.data || []);
      setAllClasses(classesRes.data.data || []);
    } catch {
      setToast({ message: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { loadSchoolYears(); loadBaseData(); }, [loadSchoolYears, loadBaseData]);

  // Load enrollments when school year or class changes
  useEffect(() => {
    if (!selectedClass || !selectedSYId) { setEnrollments([]); return; }
    enrollmentApi.getByClassAndSchoolYear(selectedClass.id, selectedSYId)
      .then(res => setEnrollments(res.data.data || []))
      .catch(() => setToast({ message: "Failed to load enrollments", type: "error" }));
  }, [selectedClass, selectedSYId]);

  // Load subjects when class changes
  useEffect(() => {
    if (!selectedClass) { setClassSubjects([]); return; }
    classApi.getFaculties(selectedClass.id)
      .then(res => {
        const subs = (res.data.data || [])
          .filter((f: any) => f.subject_id && f.subject_name)
          .map((f: any) => ({ id: f.subject_id, name: f.subject_name, teacher_name: `${f.first_name} ${f.last_name}` }));
        setClassSubjects(subs);
        setSelectedSubjectIds(subs.map((s: ClassSubject) => s.id));
      })
      .catch(() => setClassSubjects([]));
  }, [selectedClass]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setStudentSearch("");
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Filter students by debounced search
  const isSearching = studentSearch.trim() !== debouncedSearch.trim();
  const searchResults = debouncedSearch.trim()
    ? allStudents.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(debouncedSearch.toLowerCase())
      ).slice(0, 8)
    : [];
  const dropdownOpen = studentSearch.trim().length > 0 && !selectedStudent;

  const eligibleClasses = selectedGradeLevel !== null
    ? allClasses.filter(c => c.grade_level === null || c.grade_level === String(selectedGradeLevel))
    : [];

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectStudent = (s: StudentListItem) => {
    clearStudent();
    setSelectedStudent(s);
    setStudentSearch("");
    setHighlightedIdx(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIdx >= 0 && highlightedIdx < searchResults.length) {
        selectStudent(searchResults[highlightedIdx]);
      }
    } else if (e.key === "Escape") {
      setStudentSearch("");
      setHighlightedIdx(-1);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !selectedClass || !selectedSYId || selectedGradeLevel === null) return;
    setSubmitting(true);
    try {
      await enrollmentApi.create({
        student_id: selectedStudent.id,
        class_id: selectedClass.id,
        school_year_id: selectedSYId,
        grade_level: selectedGradeLevel,
        subject_ids: selectedSubjectIds,
      });
      setToast({ message: `${selectedStudent.first_name} enrolled in ${selectedClass.class_name}`, type: "success" });
      setSelectedStudent(null);
      setStudentSearch("");
      setSelectedGradeLevel(null);
      setSelectedClass(null);
      setSelectedSubjectIds([]);
      const res = await enrollmentApi.getByClassAndSchoolYear(selectedClass.id, selectedSYId);
      setEnrollments(res.data.data || []);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to enroll student"
        : "Failed to enroll student";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshEnrollments = useCallback(async () => {
    if (!selectedClass || !selectedSYId) return;
    try {
      const res = await enrollmentApi.getByClassAndSchoolYear(selectedClass.id, selectedSYId);
      setEnrollments(res.data.data || []);
    } catch {
      /* keep current list on failure */
    }
  }, [selectedClass, selectedSYId]);

  const handleStatusChange = async (enrollmentId: string, status: EnrollmentListItem["status"]) => {
    try {
      await enrollmentApi.updateStatus(enrollmentId, { status });
      setToast({ message: "Status updated", type: "success" });
      refreshEnrollments();
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm("Remove this enrollment?")) return;
    try {
      await enrollmentApi.delete(enrollmentId);
      setToast({ message: "Enrollment removed", type: "success" });
      refreshEnrollments();
    } catch {
      setToast({ message: "Failed to remove enrollment", type: "error" });
    }
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setSelectedGradeLevel(null);
    setSelectedClass(null);
    setClassSubjects([]);
    setSelectedSubjectIds([]);
  };

  const scrollToSection = (n: number) => {
    document.getElementById(`enroll-section-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!user) return null;

  const activeCount = enrollments.filter(e => e.status === "active").length;
  const isAtCapacity = !!selectedClass?.capacity && activeCount >= selectedClass.capacity;
  const canEnroll = step1Done && !!selectedStudent && selectedGradeLevel !== null && !!selectedClass && !isAtCapacity && selectedSubjectIds.length > 0;
  const selectedSY = schoolYears.find(s => s.id === selectedSYId);
  const capPercent = selectedClass?.capacity ? Math.min(100, Math.round((activeCount / selectedClass.capacity) * 100)) : 0;

  // Hints for the summary sidebar
  const hints: string[] = [];
  if (!step1Done) hints.push("Select a school year to begin.");
  else if (!selectedStudent) hints.push("Search and select a student.");
  else if (selectedGradeLevel === null) hints.push("Select a grade level for this enrollment.");
  else if (!selectedClass) hints.push(`Pick a class for Grade ${selectedGradeLevel}.`);
  else if (classSubjects.length === 0) hints.push("This class has no subjects assigned yet.");
  else if (selectedSubjectIds.length === 0) hints.push("Select at least one subject.");
  if (isAtCapacity) hints.push("This class is full.");

  const steps = [
    { n: 1, label: "School Year", done: step1Done },
    { n: 2, label: "Student", done: step2Done },
    { n: 3, label: "Grade Level", done: step3Done },
    { n: 4, label: "Class", done: step4Done },
    { n: 5, label: "Subjects", done: step5Done },
  ];

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Enrollments</h1>
          <p className="mgmt-subtitle">Enroll students into classes for a school year.</p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading...</div>
      ) : (
        <>
          {/* Stepper */}
          <div className="enroll-stepper">
            {steps.map((step, i) => {
              const reached = step.n <= activeStep || step.done;
              return (
                <div key={step.n} style={{ display: "contents" }}>
                  <button
                    type="button"
                    className={`enroll-step ${activeStep === step.n ? "enroll-step--active" : ""} ${step.done ? "enroll-step--done" : ""} ${reached ? "enroll-step--clickable" : "enroll-step--locked"}`}
                    onClick={() => reached && scrollToSection(step.n)}
                    title={reached ? `Go to step ${step.n}` : "Complete the previous steps first"}
                  >
                    <div className="enroll-step-num">
                      {step.done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : step.n}
                    </div>
                    <span className="enroll-step-label">{step.label}</span>
                  </button>
                  {i < steps.length - 1 && <div className={`enroll-step-line ${step.done ? "enroll-step-line--done" : ""}`} />}
                </div>
              );
            })}
          </div>

          <div className="enroll-layout">
            {/* ============ MAIN COLUMN ============ */}
            <div className="enroll-main">
              {/* Step 1: School Year */}
              <section id="enroll-section-1" className="enroll-panel">
                <div className="enroll-panel-head">
                  <span className="enroll-panel-num">1</span>
                  <div>
                    <h2 className="enroll-panel-title">School Year</h2>
                    <p className="enroll-panel-sub">Which school year is this enrollment for?</p>
                  </div>
                </div>
                <div className="enroll-panel-body">
                  <select className="mgmt-input mgmt-select" value={selectedSYId} onChange={(e) => setSelectedSYId(Number(e.target.value))}>
                    <option value={0}>Select school year…</option>
                    {schoolYears.map(sy => (
                      <option key={sy.id} value={sy.id}>{sy.name}{sy.is_current ? " — Current" : ""}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Step 2: Student */}
              <section id="enroll-section-2" className={`enroll-panel enroll-panel--student ${!step1Done ? "enroll-panel--locked" : ""}`}>
                <div className="enroll-panel-head">
                  <span className="enroll-panel-num">2</span>
                  <div>
                    <h2 className="enroll-panel-title">Student</h2>
                    <p className="enroll-panel-sub">Search by name or email, then pick from the results.</p>
                  </div>
                </div>
                <div className="enroll-panel-body">
                  {!step1Done ? (
                    <div className="enroll-panel-locked-msg">Select a school year first.</div>
                  ) : (
                    <>
                      <div className="enroll-search-wrap" ref={searchWrapRef}>
                        <svg className="enroll-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          className="mgmt-input enroll-search-input"
                          placeholder={selectedStudent ? undefined : "Search by name or email…"}
                          value={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : studentSearch}
                          onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); setHighlightedIdx(0); }}
                          onKeyDown={handleSearchKeyDown}
                        />
                        {dropdownOpen && (
                          <div className="enroll-search-dropdown">
                            {isSearching ? (
                              <div className="enroll-search-loading">Searching…</div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((s, idx) => (
                                <div
                                  key={s.id}
                                  className={`enroll-search-item ${idx === highlightedIdx ? "enroll-search-item--hl" : ""}`}
                                  onClick={() => selectStudent(s)}
                                  onMouseEnter={() => setHighlightedIdx(idx)}
                                >
                                  <span className={`enroll-avatar enroll-avatar--sm ${avatarClass(s.first_name + s.last_name)}`}>{initials(`${s.first_name} ${s.last_name}`)}</span>
                                  <div>
                                    <div className="enroll-search-item-name">{s.first_name} {s.last_name}</div>
                                    <div className="enroll-search-item-meta">{s.email}</div>
                                  </div>
                                  <span className="dash-badge dash-badge--warning" style={{ marginLeft: "auto" }}>{s.email}</span>
                                </div>
                              ))
                            ) : (
                              <div className="enroll-search-empty">No students found for “{studentSearch.trim()}”</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedStudent && (
                        <div className="enroll-chip">
                          <span className={`enroll-avatar enroll-avatar--sm ${avatarClass(selectedStudent.first_name + selectedStudent.last_name)}`}>
                            {initials(`${selectedStudent.first_name} ${selectedStudent.last_name}`)}
                          </span>
                          <span className="enroll-chip-name">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                          <span className="enroll-chip-meta">{selectedStudent.email}</span>
                          <button className="enroll-chip-remove" onClick={clearStudent} aria-label="Remove student">✕</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Step 3: Grade Level */}
              <section id="enroll-section-3" className={`enroll-panel ${!step2Done ? "enroll-panel--locked" : ""}`}>
                <div className="enroll-panel-head">
                  <span className="enroll-panel-num">3</span>
                  <div>
                    <h2 className="enroll-panel-title">Grade Level</h2>
                    <p className="enroll-panel-sub">Select the grade level for this enrollment.</p>
                  </div>
                </div>
                <div className="enroll-panel-body">
                  {!step2Done ? (
                    <div className="enroll-panel-locked-msg">Select a student first.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                        <button
                          key={g}
                          type="button"
                          className={`enroll-grade-btn ${selectedGradeLevel === g ? "enroll-grade-btn--selected" : ""}`}
                          onClick={() => { setSelectedGradeLevel(g); setSelectedClass(null); setSelectedSubjectIds([]); }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Step 4: Class */}
              <section id="enroll-section-4" className={`enroll-panel ${!step3Done ? "enroll-panel--locked" : ""}`}>
                <div className="enroll-panel-head">
                  <span className="enroll-panel-num">4</span>
                  <div>
                    <h2 className="enroll-panel-title">Class</h2>
                    <p className="enroll-panel-sub">Classes matching the selected grade level.</p>
                  </div>
                </div>
                <div className="enroll-panel-body">
                  {!step3Done ? (
                    <div className="enroll-panel-locked-msg">Select a grade level first.</div>
                  ) : eligibleClasses.length === 0 ? (
                    <div className="mgmt-empty">No classes available for Grade {selectedGradeLevel} yet.</div>
                  ) : (
                    <div className="enroll-class-grid">
                      {eligibleClasses.map(c => (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          className={`enroll-class-card ${selectedClass?.id === c.id ? "enroll-class-card--selected" : ""}`}
                          onClick={() => { setSelectedClass(c); setSelectedSubjectIds([]); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedClass(c); setSelectedSubjectIds([]); } }}
                        >
                          {selectedClass?.id === c.id && (
                            <span className="enroll-class-check">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          <div className="enroll-class-name">{c.class_name}</div>
                          <div className="enroll-class-meta">
                            {c.section && <span className="dash-badge dash-badge--active">{c.section}</span>}
                            {c.grade_level && <span className="dash-badge dash-badge--warning">{c.grade_level}</span>}
                          </div>
                          <div className="enroll-class-info">
                            {c.faculty_name || "No adviser"}
                          </div>
                          <div className="enroll-class-cap">
                            {c.capacity ? <>Capacity {c.capacity}</> : <>Unlimited capacity</>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Step 5: Subjects */}
              <section id="enroll-section-5" className={`enroll-panel ${!step4Done ? "enroll-panel--locked" : ""}`}>
                <div className="enroll-panel-head">
                  <span className="enroll-panel-num">5</span>
                  <div>
                    <h2 className="enroll-panel-title">Subjects</h2>
                    <p className="enroll-panel-sub">Subjects assigned to this class — choose which to enroll.</p>
                  </div>
                </div>
                <div className="enroll-panel-body">
                  {!step4Done ? (
                    <div className="enroll-panel-locked-msg">Select a class first.</div>
                  ) : classSubjects.length === 0 ? (
                    <div className="mgmt-empty">No subjects assigned to this class yet.</div>
                  ) : (
                    <>
                      <div className="enroll-mini-actions">
                        <span className="enroll-subject-count">{selectedSubjectIds.length} of {classSubjects.length} selected</span>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button type="button" className="enroll-mini-btn" onClick={() => setSelectedSubjectIds(classSubjects.map(s => s.id))}>Select all</button>
                          <button type="button" className="enroll-mini-btn" onClick={() => setSelectedSubjectIds([])}>Clear</button>
                        </div>
                      </div>
                      <div className="enroll-subjects-grid">
                        {classSubjects.map(s => {
                          const checked = selectedSubjectIds.includes(s.id);
                          return (
                            <label key={s.id} className={`enroll-subject-card ${checked ? "enroll-subject-card--selected" : ""}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleSubject(s.id)} />
                              <span className="enroll-subject-check">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              <span className="enroll-subject-name">{s.name}</span>
                              {s.teacher_name && <span className="enroll-subject-teacher">{s.teacher_name}</span>}
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Roster */}
              {selectedClass && selectedSYId > 0 && (
                <section className="enroll-panel">
                  <div className="enroll-panel-head">
                    <span className="enroll-panel-num enroll-panel-num--plain">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </span>
                    <div>
                      <h2 className="enroll-panel-title">Enrolled — {selectedClass.class_name}</h2>
                      <p className="enroll-panel-sub">{selectedSY?.name} · {activeCount} active / {enrollments.length} total</p>
                    </div>
                  </div>
                  <div className="enroll-panel-body">
                    {enrollments.length === 0 ? (
                      <div className="mgmt-empty">No enrollments for this class in this school year yet.</div>
                    ) : (
                      <div className="mgmt-table-wrap">
                        <table className="mgmt-table mgmt-table--compact">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th className="enroll-col-subjects">Subjects</th>
                              <th>Status</th>
                              <th>Enrolled</th>
                              <th className="mgmt-table-actions">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map(e => (
                              <tr key={e.id}>
                                <td>
                                  <div className="enroll-roster-student">
                                    <span className={`enroll-avatar enroll-avatar--sm ${avatarClass(e.student_name)}`}>{initials(e.student_name)}</span>
                                    <div>
                                      <div className="mgmt-table-bold">{e.student_name}</div>
                                      <div className="enroll-roster-email">{e.student_email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="enroll-col-subjects">
                                  {Array.isArray(e.subjects) && e.subjects.length > 0 ? (
                                    <>
                                      {e.subjects.slice(0, 2).map(s => (
                                        <span key={s.id} className="dash-badge dash-badge--active" style={{ marginRight: "0.25rem" }}>{s.name}</span>
                                      ))}
                                      {e.subjects.length > 2 && (
                                        <span className="enroll-more" title={e.subjects.map(s => s.name).join(", ")}>
                                          +{e.subjects.length - 2} more
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="enroll-roster-email">—</span>
                                  )}
                                </td>
                                <td>
                                  <select
                                    className={`mgmt-input mgmt-select enroll-status-select enroll-status-select--${e.status}`}
                                    value={e.status}
                                    onChange={(ev) => handleStatusChange(e.id, ev.target.value as EnrollmentListItem["status"])}
                                  >
                                    {(["active", "dropped", "completed"] as const).map(st => (
                                      <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>{new Date(e.enrolled_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td>
                                <td className="mgmt-table-actions">
                                  <button className="mgmt-action mgmt-action--delete" onClick={() => handleRemove(e.id)}>Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* ============ SUMMARY SIDEBAR ============ */}
            <aside className="enroll-aside">
              <div className="enroll-aside-card">
                <h3 className="enroll-aside-title">Enrollment summary</h3>

                {/* School year */}
                <div className="enroll-aside-row">
                  <span className="enroll-aside-label">School year</span>
                  <span className="enroll-aside-value">{selectedSY?.name ?? "—"}</span>
                </div>

                {/* Student */}
                <div className="enroll-aside-row">
                  <span className="enroll-aside-label">Student</span>
                  {selectedStudent ? (
                    <div className="enroll-aside-student">
                      <span className={`enroll-avatar ${avatarClass(selectedStudent.first_name + selectedStudent.last_name)}`}>
                        {initials(`${selectedStudent.first_name} ${selectedStudent.last_name}`)}
                      </span>
                      <div>
                        <div className="enroll-aside-value">{selectedStudent.first_name} {selectedStudent.last_name}</div>
                        <div className="enroll-aside-hint">{selectedStudent.email}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="enroll-aside-value enroll-aside-value--empty">Not selected</span>
                  )}
                </div>

                {/* Grade Level */}
                <div className="enroll-aside-row">
                  <span className="enroll-aside-label">Grade Level</span>
                  {selectedGradeLevel !== null ? (
                    <span className="enroll-aside-value">Grade {selectedGradeLevel}</span>
                  ) : (
                    <span className="enroll-aside-value enroll-aside-value--empty">Not selected</span>
                  )}
                </div>

                {/* Class + capacity */}
                <div className="enroll-aside-row">
                  <span className="enroll-aside-label">Class</span>
                  {selectedClass ? (
                    <div className="enroll-aside-class">
                      <span className="enroll-aside-value">{selectedClass.class_name}{selectedClass.section ? ` · ${selectedClass.section}` : ""}</span>
                      {selectedClass.capacity ? (
                        <div className="enroll-cap">
                          <div className="enroll-cap-bar">
                            <div
                              className={`enroll-cap-fill ${isAtCapacity ? "enroll-cap-fill--full" : capPercent > 85 ? "enroll-cap-fill--warn" : ""}`}
                              style={{ width: `${capPercent}%` }}
                            />
                          </div>
                          <span className="enroll-cap-text">{activeCount} / {selectedClass.capacity}{isAtCapacity ? " · Full" : ""}</span>
                        </div>
                      ) : (
                        <span className="enroll-aside-hint">{activeCount} enrolled · unlimited</span>
                      )}
                    </div>
                  ) : (
                    <span className="enroll-aside-value enroll-aside-value--empty">Not selected</span>
                  )}
                </div>

                {/* Subjects */}
                <div className="enroll-aside-row">
                  <span className="enroll-aside-label">Subjects</span>
                  {classSubjects.length > 0 ? (
                    <span className="enroll-aside-value">
                      {selectedSubjectIds.length} of {classSubjects.length} selected
                    </span>
                  ) : (
                    <span className="enroll-aside-value enroll-aside-value--empty">
                      {selectedClass ? "None assigned" : "Not available"}
                    </span>
                  )}
                </div>

                {/* Hints */}
                {hints.length > 0 && (
                  <ul className="enroll-hints">
                    {hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}

                <button
                  className="mgmt-btn mgmt-btn--primary enroll-btn-full"
                  disabled={!canEnroll || submitting}
                  onClick={handleEnroll}
                >
                  {submitting ? "Enrolling…" : "Enroll student"}
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
