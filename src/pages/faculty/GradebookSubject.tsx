import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { gradebookApi, type GradeItem, type GradesForSubjectResponse, type GradingCategory, type GradeItemCategory } from "../../api/gradebook";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

const CATEGORY_LABELS: Record<string, string> = {
  activities: "Activities",
  quizzes: "Quizzes",
  exams: "Exams",
  attendance: "Attendance",
};

const CATEGORY_SHORT: Record<string, string> = {
  activities: "ACT",
  quizzes: "QUIZ",
  exams: "EXAM",
  attendance: "ATT",
};

const CATEGORY_ORDER: GradingCategory[] = ["activities", "quizzes", "exams", "attendance"];

const PASS_THRESHOLD = 75;

interface EnrichedStudent {
  student_id: string;
  student_name: string;
  lrn: string | null;
  attendance_rate: number;
  final_grade: number | null;
  categories: {
    [key: string]: { earned: number; possible: number };
  };
}

export default function GradebookSubject() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [weights, setWeights] = useState<{ category: GradingCategory; weight: number }[]>([]);
  const [editWeights, setEditWeights] = useState<Record<string, number>>({});
  const [weightsSaving, setWeightsSaving] = useState(false);
  const [weightsChanged, setWeightsChanged] = useState(false);

  const [items, setItems] = useState<GradeItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeItem | null>(null);
  const [itemForm, setItemForm] = useState({ title: "", category: "activities" as GradeItemCategory, max_score: 100, due_date: "" });
  const [itemSaving, setItemSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [gradeData, setGradeData] = useState<GradesForSubjectResponse | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [scoresSaving, setScoresSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeCell, setActiveCell] = useState<{ studentId: string; itemId: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId || !subjectId) return;
    setLoading(true);
    try {
      const [weightsRes, itemsRes, gradesRes] = await Promise.all([
        gradebookApi.getWeights(classId, subjectId),
        gradebookApi.getItems(classId, subjectId),
        gradebookApi.getGrades(classId, subjectId),
      ]);
      const w = weightsRes.data.data || [];
      setWeights(w);
      const wMap: Record<string, number> = {};
      for (const cat of CATEGORY_ORDER) {
        const found = w.find(x => x.category === cat);
        wMap[cat] = found ? found.weight : 0;
      }
      setEditWeights(wMap);
      setItems(itemsRes.data.data || []);
      setGradeData(gradesRes.data.data);
      const initialScores: Record<string, string> = {};
      for (const s of gradesRes.data.data.students) {
        for (const gi of s.items) {
          const key = `${s.student_id}:${gi.id}`;
          initialScores[key] = gi.score !== null && gi.score !== undefined ? String(gi.score) : "";
        }
      }
      setScores(initialScores);
    } catch {
      setToast({ message: "Failed to load gradebook data", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupedItems = useMemo(() => {
    if (!gradeData) return {} as Record<GradeItemCategory, GradeItem[]>;
    const groups: Record<string, GradeItem[]> = { activities: [], quizzes: [], exams: [] };
    for (const item of gradeData.items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [gradeData]);

  const enrichedStudents: EnrichedStudent[] = useMemo(() => {
    if (!gradeData) return [];
    return gradeData.students.map(s => {
      const categories: Record<string, { earned: number; possible: number }> = {};
      for (const cat of CATEGORY_ORDER) {
        categories[cat] = { earned: 0, possible: 0 };
      }
      for (const gi of s.items) {
        categories[gi.category].possible += Number(gi.max_score);
        if (gi.score !== null && gi.score !== undefined) {
          categories[gi.category].earned += Number(gi.score);
        }
      }
      return {
        student_id: s.student_id,
        student_name: s.student_name,
        lrn: s.lrn ?? null,
        attendance_rate: s.attendance_rate,
        final_grade: s.final_grade,
        categories,
      };
    });
  }, [gradeData]);

  const handleSaveWeights = async () => {
    if (!classId || !subjectId) return;
    const total = Object.values(editWeights).reduce((a, b) => a + b, 0);
    if (Math.round(total * 100) / 100 !== 100) {
      setToast({ message: `Weights must total 100%. Current: ${total}%`, type: "error" });
      return;
    }
    setWeightsSaving(true);
    try {
      const weightArray = Object.entries(editWeights).map(([category, weight]) => ({ category, weight }));
      await gradebookApi.updateWeights(classId, subjectId, weightArray);
      setWeights(weightArray.map(w => ({ category: w.category as GradingCategory, weight: w.weight })));
      setWeightsChanged(false);
      setToast({ message: "Grading weights saved", type: "success" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save weights";
      setToast({ message: msg, type: "error" });
    } finally {
      setWeightsSaving(false);
    }
  };

  const handleCreateItem = async () => {
    if (!classId || !subjectId) return;
    if (!itemForm.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    if (itemForm.max_score <= 0) {
      setToast({ message: "Max score must be greater than 0", type: "error" });
      return;
    }
    setItemSaving(true);
    try {
      await gradebookApi.createItem(classId, subjectId, {
        category: itemForm.category,
        title: itemForm.title.trim(),
        max_score: itemForm.max_score,
        due_date: itemForm.due_date || null,
      });
      setToast({ message: "Grade item created", type: "success" });
      closeItemModal();
      const itemsRes = await gradebookApi.getItems(classId, subjectId);
      setItems(itemsRes.data.data || []);
      const gradesRes = await gradebookApi.getGrades(classId, subjectId);
      setGradeData(gradesRes.data.data);
      const initialScores: Record<string, string> = {};
      for (const s of gradesRes.data.data.students) {
        for (const gi of s.items) {
          const key = `${s.student_id}:${gi.id}`;
          initialScores[key] = gi.score !== null && gi.score !== undefined ? String(gi.score) : "";
        }
      }
      setScores(initialScores);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create grade item";
      setToast({ message: msg, type: "error" });
    } finally {
      setItemSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !classId) return;
    if (!itemForm.title.trim()) {
      setToast({ message: "Title is required", type: "error" });
      return;
    }
    setItemSaving(true);
    try {
      await gradebookApi.updateItem(editingItem.id, {
        title: itemForm.title.trim(),
        category: itemForm.category,
        max_score: itemForm.max_score,
        due_date: itemForm.due_date || null,
      });
      setToast({ message: "Grade item updated", type: "success" });
      closeItemModal();
      const itemsRes = await gradebookApi.getItems(classId, subjectId!);
      setItems(itemsRes.data.data || []);
      const gradesRes = await gradebookApi.getGrades(classId, subjectId!);
      setGradeData(gradesRes.data.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update grade item";
      setToast({ message: msg, type: "error" });
    } finally {
      setItemSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeleteConfirmId(null);
    try {
      await gradebookApi.deleteItem(itemId);
      setToast({ message: "Grade item deleted", type: "success" });
      const itemsRes = await gradebookApi.getItems(classId!, subjectId!);
      setItems(itemsRes.data.data || []);
      const gradesRes = await gradebookApi.getGrades(classId!, subjectId!);
      setGradeData(gradesRes.data.data);
      const initialScores: Record<string, string> = {};
      for (const s of gradesRes.data.data.students) {
        for (const gi of s.items) {
          const key = `${s.student_id}:${gi.id}`;
          initialScores[key] = gi.score !== null && gi.score !== undefined ? String(gi.score) : "";
        }
      }
      setScores(initialScores);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete grade item";
      setToast({ message: msg, type: "error" });
    }
  };

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ title: "", category: "activities", max_score: 100, due_date: "" });
    setShowItemModal(true);
  };

  const openEditItem = (item: GradeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setItemForm({
      title: item.title,
      category: item.category,
      max_score: item.max_score,
      due_date: item.due_date || "",
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ title: "", category: "activities", max_score: 100, due_date: "" });
  };

  const handleScoreChange = (studentId: string, itemId: string, value: string) => {
    if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) return;
    setScores(prev => ({ ...prev, [`${studentId}:${itemId}`]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveGrades = async () => {
    if (!gradeData) return;
    const changedGrades: { itemId: string; grades: { student_id: string; score: number }[] }[] = [];
    for (const item of gradeData.items) {
      const itemGrades: { student_id: string; score: number }[] = [];
      for (const student of gradeData.students) {
        const key = `${student.student_id}:${item.id}`;
        const val = scores[key];
        if (val !== undefined && val !== "") {
          const num = Number(val);
          if (isNaN(num) || num < 0) {
            setToast({ message: `Invalid score for ${student.student_name} in ${item.title}`, type: "error" });
            return;
          }
          if (num > item.max_score) {
            setToast({ message: `Score exceeds max (${item.max_score}) for ${student.student_name} in ${item.title}`, type: "error" });
            return;
          }
          const origScore = student.items.find(i => i.id === item.id)?.score;
          if (origScore !== num) {
            itemGrades.push({ student_id: student.student_id, score: num });
          }
        }
      }
      if (itemGrades.length > 0) {
        changedGrades.push({ itemId: item.id, grades: itemGrades });
      }
    }
    if (changedGrades.length === 0) {
      setToast({ message: "No changes to save", type: "error" });
      return;
    }
    setScoresSaving(true);
    try {
      for (const { itemId, grades } of changedGrades) {
        await gradebookApi.upsertGrades(itemId, grades);
      }
      setToast({ message: "Grades saved successfully", type: "success" });
      setHasUnsavedChanges(false);
      const gradesRes = await gradebookApi.getGrades(classId!, subjectId!);
      setGradeData(gradesRes.data.data);
      const initialScores: Record<string, string> = {};
      for (const s of gradesRes.data.data.students) {
        for (const gi of s.items) {
          const key = `${s.student_id}:${gi.id}`;
          initialScores[key] = gi.score !== null && gi.score !== undefined ? String(gi.score) : "";
        }
      }
      setScores(initialScores);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save grades";
      setToast({ message: msg, type: "error" });
    } finally {
      setScoresSaving(false);
    }
  };

  const unsavedCount = useMemo(() => {
    if (!gradeData) return 0;
    let count = 0;
    for (const student of gradeData.students) {
      for (const item of gradeData.items) {
        const key = `${student.student_id}:${item.id}`;
        const val = scores[key];
        const origScore = student.items.find(i => i.id === item.id)?.score;
        if (val !== undefined && val !== "") {
          if (origScore !== Number(val)) count++;
        }
      }
    }
    return count;
  }, [scores, gradeData]);

  const weightTotal = Object.values(editWeights).reduce((a, b) => a + b, 0);
  const weightsValid = Math.round(weightTotal * 100) / 100 === 100;

  if (loading) {
    return (
      <div className="mgmt-page">
        <div className="mgmt-loading">Loading gradebook...</div>
      </div>
    );
  }

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {/* Header */}
      <div className="mgmt-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="mgmt-btn mgmt-btn--ghost"
            onClick={() => navigate("/dashboard/gradebook")}
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="mgmt-title">Gradebook</h1>
            <p className="mgmt-subtitle">Manage grades, weights, and items for this subject.</p>
          </div>
        </div>
      </div>

      {/* Grading Weights */}
      <div className="mgmt-detail-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="mgmt-detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="mgmt-detail-title" style={{ fontSize: "1rem" }}>Grading Weights</h2>
          {weightsChanged && (
            <span className="gb-unsaved-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Unsaved
            </span>
          )}
        </div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <div className="gb-weight-bar" style={{ marginBottom: "1rem" }}>
            {CATEGORY_ORDER.map(cat => {
              const val = editWeights[cat] ?? 0;
              return val > 0 ? (
                <div
                  key={cat}
                  className={`gb-weight-bar__segment gb-weight-bar__segment--${cat}`}
                  style={{ width: `${val}%` }}
                  title={`${CATEGORY_LABELS[cat]}: ${val}%`}
                />
              ) : null;
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            {CATEGORY_ORDER.map(cat => (
              <div key={cat} className="gb-weight-input">
                <span className={`gb-weight-input__dot gb-weight-input__dot--${cat}`} />
                <span className="gb-weight-input__label">{CATEGORY_LABELS[cat]}</span>
                <input
                  type="number"
                  value={editWeights[cat] ?? 0}
                  onChange={(e) => {
                    setEditWeights(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }));
                    setWeightsChanged(true);
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
                <span className="gb-weight-input__unit">%</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: weightsValid ? "#16a34a" : "#dc2626" }}>
              Total: {weightTotal}%
            </span>
            {!weightsValid && (
              <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Must equal 100%</span>
            )}
            <button
              className="mgmt-btn mgmt-btn--primary"
              onClick={handleSaveWeights}
              disabled={weightsSaving || !weightsValid || !weightsChanged}
              style={{ marginLeft: "auto" }}
            >
              {weightsSaving ? "Saving..." : "Save Weights"}
            </button>
          </div>
        </div>
      </div>

      {/* Grade Spreadsheet */}
      {gradeData && gradeData.students.length > 0 && (
        <div className="mgmt-detail-panel">
          <div className="mgmt-detail-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div>
                <h2 className="mgmt-detail-title" style={{ fontSize: "1rem", margin: 0 }}>
                  Grade Sheet
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)", margin: "0.25rem 0 0" }}>
                  {gradeData.students.length} student{gradeData.students.length !== 1 ? "s" : ""} · {gradeData.items.length} item{gradeData.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {hasUnsavedChanges && (
                  <span className="gb-unsaved-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {unsavedCount} unsaved change{unsavedCount !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={openCreateItem}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Add Item
                </button>
                <button
                  className="mgmt-btn mgmt-btn--primary"
                  onClick={handleSaveGrades}
                  disabled={scoresSaving || !hasUnsavedChanges}
                >
                  {scoresSaving ? "Saving..." : "Save All"}
                </button>
              </div>
            </div>
          </div>

          <div className="gb-spreadsheet">
            <table className="gb-spreadsheet__table">
              {/* Category group header row */}
              <thead>
                <tr>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--sticky">
                    <div className="gb-spreadsheet__student-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Student
                    </div>
                  </th>
                  {CATEGORY_ORDER.filter(cat => cat !== "attendance" && groupedItems[cat as GradeItemCategory]?.length).map(cat => {
                    const catItems = groupedItems[cat as GradeItemCategory] || [];
                    return (
                      <th
                        key={cat}
                        colSpan={catItems.length + 1}
                        className={`gb-spreadsheet__th gb-spreadsheet__th--category gb-spreadsheet__th--category-${cat}`}
                      >
                        <span className="gb-spreadsheet__cat-label">
                          <span className={`gb-spreadsheet__cat-dot gb-spreadsheet__cat-dot--${cat}`} />
                          {CATEGORY_LABELS[cat]} ({editWeights[cat] ?? 0}%)
                        </span>
                      </th>
                    );
                  })}
                  {gradeData.items.length > 0 && (
                    <th className="gb-spreadsheet__th gb-spreadsheet__th--total-header">
                      TOTAL
                    </th>
                  )}
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--attendance-header">
                    ATTENDANCE
                  </th>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--final-header">
                    FINAL GRADE
                  </th>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--remarks-header">
                    REMARKS
                  </th>
                </tr>
                <tr>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--sub gb-spreadsheet__th--sticky" />
                  {CATEGORY_ORDER.filter(cat => cat !== "attendance" && groupedItems[cat as GradeItemCategory]?.length).map(cat =>
                    (groupedItems[cat as GradeItemCategory] || []).map(item => (
                      <th key={item.id} className={`gb-spreadsheet__th gb-spreadsheet__th--item gb-spreadsheet__th--item-${cat}`}>
                        <div className="gb-spreadsheet__item-header">
                          <span className="gb-spreadsheet__item-title">{item.title}</span>
                          <div className="gb-spreadsheet__item-meta">
                            <span className="gb-spreadsheet__item-max">/{item.max_score}</span>
                            <div className="gb-spreadsheet__item-actions">
                              <button className="gb-spreadsheet__item-action gb-spreadsheet__item-action--edit" title="Edit item" onClick={(e) => openEditItem(item, e)}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <button className="gb-spreadsheet__item-action gb-spreadsheet__item-action--delete" title="Delete item" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    )).concat(
                      <th key={`${cat}-total`} className={`gb-spreadsheet__th gb-spreadsheet__th--subtotal gb-spreadsheet__th--subtotal-${cat}`}>
                        Sum
                      </th>
                    )
                  )}
                  {gradeData.items.length > 0 && (
                    <th className="gb-spreadsheet__th gb-spreadsheet__th--sub gb-spreadsheet__th--total-header">
                      Earned/Possible
                    </th>
                  )}
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--sub gb-spreadsheet__th--attendance-header">
                    Subject Rate
                  </th>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--sub gb-spreadsheet__th--final-header">
                    Score
                  </th>
                  <th className="gb-spreadsheet__th gb-spreadsheet__th--sub gb-spreadsheet__th--remarks-header">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {gradeData.students.map(s => {
                  const enriched = enrichedStudents.find(e => e.student_id === s.student_id);
                  const totalEarned = enriched ? Object.values(enriched.categories).reduce((sum, c) => sum + Number(c.earned), 0) : 0;
                  const totalPossible = enriched ? Object.values(enriched.categories).reduce((sum, c) => sum + Number(c.possible), 0) : 0;
                  const finalGrade = enriched?.final_grade;
                  const attendanceRate = enriched?.attendance_rate ?? 0;
                  const remarks = finalGrade !== null && finalGrade !== undefined ? (finalGrade >= PASS_THRESHOLD ? "Passed" : "Failed") : "—";

                  return (
                    <tr key={s.student_id} className="gb-spreadsheet__row">
                      <td className="gb-spreadsheet__td gb-spreadsheet__td--sticky">
                        <div className="gb-spreadsheet__student-cell">
                          <span className="gb-spreadsheet__student-name">{s.student_name}</span>
                          {s.lrn && <span className="gb-spreadsheet__student-lrn">{s.lrn}</span>}
                        </div>
                      </td>

                      {CATEGORY_ORDER.filter(cat => cat !== "attendance" && groupedItems[cat as GradeItemCategory]?.length).map(cat => {
                        const catItems = groupedItems[cat as GradeItemCategory] || [];
                        const catEarned = enriched?.categories[cat]?.earned ?? 0;
                        const catPossible = enriched?.categories[cat]?.possible ?? 0;
                        return (
                          <React.Fragment key={cat}>
                            {catItems.map(item => {
                              const key = `${s.student_id}:${item.id}`;
                              const val = scores[key] ?? "";
                              return (
                                <td key={item.id} className={`gb-spreadsheet__td gb-spreadsheet__td--item gb-spreadsheet__td--item-${cat}`}>
                                  <input
                                    type="number"
                                    className={`gb-spreadsheet__score-input${activeCell?.studentId === s.student_id && activeCell?.itemId === item.id ? " gb-spreadsheet__score-input--active" : ""}`}
                                    value={val}
                                    onChange={(e) => handleScoreChange(s.student_id, item.id, e.target.value)}
                                    onFocus={() => setActiveCell({ studentId: s.student_id, itemId: item.id })}
                                    onBlur={() => setActiveCell(null)}
                                    min={0}
                                    max={item.max_score}
                                    step="0.5"
                                    placeholder="—"
                                  />
                                </td>
                              );
                            })}
                            <td className={`gb-spreadsheet__td gb-spreadsheet__td--subtotal gb-spreadsheet__td--subtotal-${cat}`}>
                              <span className="gb-spreadsheet__subtotal-text">
                                {catPossible > 0 ? `${Number(catEarned).toFixed(2)} / ${Number(catPossible).toFixed(2)}` : "—"}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {gradeData.items.length > 0 && (
                        <td className="gb-spreadsheet__td gb-spreadsheet__td--total">
                          <span className="gb-spreadsheet__total-text">
                            {totalPossible > 0 ? `${Number(totalEarned).toFixed(2)} / ${Number(totalPossible).toFixed(2)}` : "—"}
                          </span>
                        </td>
                      )}

                      <td className="gb-spreadsheet__td gb-spreadsheet__td--attendance">
                        <div className="gb-spreadsheet__attendance-cell">
                          <span className="gb-spreadsheet__attendance-text">{attendanceRate}%</span>
                          <div className="gb-spreadsheet__attendance-bar">
                            <div
                              className="gb-spreadsheet__attendance-fill"
                              style={{
                                width: `${attendanceRate}%`,
                                background: attendanceRate >= 75 ? "#16a34a" : attendanceRate >= 60 ? "#f59e0b" : "#dc2626",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="gb-spreadsheet__td gb-spreadsheet__td--final">
                        <span
                          className={`gb-spreadsheet__final-text ${
                            finalGrade !== null && finalGrade !== undefined
                              ? finalGrade >= PASS_THRESHOLD
                                ? "gb-spreadsheet__final-text--pass"
                                : "gb-spreadsheet__final-text--fail"
                              : ""
                          }`}
                        >
                          {finalGrade !== null && finalGrade !== undefined ? finalGrade.toFixed(2) : "—"}
                        </span>
                      </td>

                      <td className="gb-spreadsheet__td gb-spreadsheet__td--remarks">
                        <span
                          className={`gb-spreadsheet__remarks-badge ${
                            remarks === "Passed"
                              ? "gb-spreadsheet__remarks-badge--pass"
                              : remarks === "Failed"
                              ? "gb-spreadsheet__remarks-badge--fail"
                              : ""
                          }`}
                        >
                          {remarks}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Item Modal */}
      {showItemModal && (
        <div className="mgmt-modal-overlay" onClick={closeItemModal}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">{editingItem ? "Edit Grade Item" : "Add Grade Item"}</h3>
              <button className="mgmt-modal-close" onClick={closeItemModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div className="mgmt-form">
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Title</label>
                  <input
                    className="mgmt-input"
                    value={itemForm.title}
                    onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Quiz 1, Midterm Exam"
                  />
                </div>
                <div className="mgmt-form-grid">
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Category</label>
                    <select
                      className="mgmt-input"
                      value={itemForm.category}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value as GradeItemCategory }))}
                    >
                      <option value="activities">Activities</option>
                      <option value="quizzes">Quizzes</option>
                      <option value="exams">Exams</option>
                    </select>
                  </div>
                  <div className="mgmt-form-row">
                    <label className="mgmt-label">Max Score</label>
                    <input
                      type="number"
                      className="mgmt-input"
                      value={itemForm.max_score}
                      onChange={(e) => setItemForm(prev => ({ ...prev, max_score: parseFloat(e.target.value) || 0 }))}
                      min={1}
                    />
                  </div>
                </div>
                <div className="mgmt-form-row">
                  <label className="mgmt-label">Due Date <span style={{ fontWeight: 400, color: "var(--ml-text-muted)" }}>(optional)</span></label>
                  <input
                    type="date"
                    className="mgmt-input"
                    value={itemForm.due_date}
                    onChange={(e) => setItemForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="mgmt-modal-actions" style={{ padding: "1rem 1.5rem" }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={closeItemModal}>Cancel</button>
              <button
                className="mgmt-btn mgmt-btn--primary"
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                disabled={itemSaving}
              >
                {itemSaving ? "Saving..." : editingItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="mgmt-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "24rem" }}>
            <div className="mgmt-modal-header">
              <h3 className="mgmt-modal-title">Delete Grade Item</h3>
              <button className="mgmt-modal-close" onClick={() => setDeleteConfirmId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ml-text)", lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{items.find(i => i.id === deleteConfirmId)?.title}</strong>?
              </p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--ml-text-muted)" }}>
                This will also delete all associated student grades. This action cannot be undone.
              </p>
            </div>
            <div className="mgmt-modal-actions" style={{ padding: "1rem 1.5rem" }}>
              <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button
                className="mgmt-btn mgmt-btn--primary"
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
                onClick={() => handleDeleteItem(deleteConfirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
