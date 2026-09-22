import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { academicPeriodApi, type AcademicPeriod } from "../../api/academicPeriods";
import apiClient from "../../api/client";
import Toast from "../../components/Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function SchoolSettings() {
  const { user } = useAuth();
  const [toast, setToast] = useState<ToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const [academicSystem, setAcademicSystem] = useState("quarter");
  const [periodCount, setPeriodCount] = useState(4);
  const [configCompleted, setConfigCompleted] = useState(false);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [currentSchoolYearId, setCurrentSchoolYearId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [editingPeriod, setEditingPeriod] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editWarning, setEditWarning] = useState("");

  const fetchData = useCallback(async () => {
    if (!user?.school_id) return;
    try {
      const [configRes, syRes] = await Promise.all([
        apiClient.get<{ data: { academic_system: string; period_count: number; academic_config_completed: number } }>(`/schools/${user.school_id}/config`),
        apiClient.get<{ data: { id: number; is_current: number }[] }>(`/school-years/school/${user.school_id}`),
      ]);

      const config = configRes.data.data;
      setAcademicSystem(config.academic_system);
      setPeriodCount(config.period_count);
      setConfigCompleted(config.academic_config_completed === 1);

      const currentSy = (syRes.data.data || []).find((sy: { is_current: number }) => sy.is_current === 1);
      if (currentSy) {
        setCurrentSchoolYearId(currentSy.id);
        const periodsRes = await academicPeriodApi.getBySchoolAndYear(user.school_id, currentSy.id);
        setPeriods(periodsRes.data.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    if (!user?.school_id) return;
    setSaving(true);
    try {
      await apiClient.put(`/schools/${user.school_id}/config`, {
        academic_system: academicSystem,
        period_count: periodCount,
      });
      setConfigCompleted(true);
      setToast({ message: "Academic configuration saved successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to save configuration", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePeriods = async () => {
    if (!currentSchoolYearId) return;
    setGenerating(true);
    try {
      const { data } = await academicPeriodApi.generate(currentSchoolYearId);
      setToast({ message: data.data.generated > 0 ? `Generated ${data.data.generated} period(s)` : "All periods already exist", type: "success" });
      // Refresh periods
      if (user?.school_id) {
        const periodsRes = await academicPeriodApi.getBySchoolAndYear(user.school_id, currentSchoolYearId);
        setPeriods(periodsRes.data.data || []);
      }
    } catch {
      setToast({ message: "Failed to generate periods", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSetCurrent = async (periodId: number) => {
    try {
      await academicPeriodApi.setCurrent(periodId);
      setPeriods(prev => prev.map(p => ({ ...p, is_current: p.id === periodId ? 1 : 0 })));
      setToast({ message: "Current period updated", type: "success" });
    } catch {
      setToast({ message: "Failed to set current period", type: "error" });
    }
  };

  const startEditPeriod = (period: AcademicPeriod) => {
    setEditingPeriod(period.id);
    setEditName(period.name);
    setEditStartDate(period.start_date);
    setEditEndDate(period.end_date);
    setEditWarning("");
  };

  const handleSavePeriod = async () => {
    if (!editingPeriod) return;
    try {
      const { data } = await academicPeriodApi.update(editingPeriod, {
        name: editName,
        start_date: editStartDate,
        end_date: editEndDate,
      });
      setPeriods(prev => prev.map(p => p.id === editingPeriod ? { ...data.data } : p));
      setEditingPeriod(null);
      setToast({ message: "Period updated successfully", type: "success" });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update period"
        : "Failed to update period";
      setEditWarning(msg);
    }
  };

  const handleDeletePeriod = async (periodId: number) => {
    if (!confirm("Are you sure you want to delete this period?")) return;
    try {
      await academicPeriodApi.delete(periodId);
      setPeriods(prev => prev.filter(p => p.id !== periodId));
      setToast({ message: "Period deleted", type: "success" });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete period"
        : "Failed to delete period";
      setToast({ message: msg, type: "error" });
    }
  };

  if (!user) return null;

  return (
    <div className="mgmt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Academic Configuration</h1>
          <p className="mgmt-subtitle">
            {loading ? "Loading..." : configCompleted ? "Configuration complete" : "Complete your academic configuration"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mgmt-loading">Loading configuration...</div>
      ) : (
        <>
          {/* Config Form */}
          <div style={{ background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Academic System</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>System</label>
                <select
                  className="mgmt-input"
                  value={academicSystem}
                  onChange={(e) => {
                    setAcademicSystem(e.target.value);
                    setPeriodCount(e.target.value === "quarter" ? 4 : 2);
                  }}
                  style={{ fontSize: "0.8rem" }}
                >
                  <option value="quarter">Quarter System</option>
                  <option value="semester">Semester System</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "120px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Periods per Year</label>
                <input
                  type="number"
                  className="mgmt-input"
                  min="1"
                  max="6"
                  value={periodCount}
                  onChange={(e) => setPeriodCount(Number(e.target.value))}
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
              <button
                className="mgmt-btn mgmt-btn--primary"
                onClick={handleSaveConfig}
                disabled={saving}
                style={{ fontSize: "0.8rem" }}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Periods Table */}
          {currentSchoolYearId && (
            <div style={{ background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>Academic Periods</h3>
                <button
                  className="mgmt-btn mgmt-btn--ghost"
                  onClick={handleGeneratePeriods}
                  disabled={generating}
                  style={{ fontSize: "0.8rem" }}
                >
                  {generating ? "Generating..." : "Generate Missing Periods"}
                </button>
              </div>

              {periods.length === 0 ? (
                <div className="mgmt-empty" style={{ padding: "2rem" }}>No periods configured for this school year.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ml-border)" }}>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>#</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Name</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Start Date</th>
                        <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>End Date</th>
                        <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Current</th>
                        <th style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, color: "var(--ml-text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--ml-border)" }}>
                          <td style={{ padding: "0.75rem" }}>{p.period_number}</td>
                          <td style={{ padding: "0.75rem" }}>
                            {editingPeriod === p.id ? (
                              <input
                                type="text"
                                className="mgmt-input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{ fontSize: "0.8rem", maxWidth: "200px" }}
                              />
                            ) : (
                              p.name
                            )}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            {editingPeriod === p.id ? (
                              <input
                                type="date"
                                className="mgmt-input"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                                style={{ fontSize: "0.8rem" }}
                              />
                            ) : (
                              new Date(p.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            )}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            {editingPeriod === p.id ? (
                              <input
                                type="date"
                                className="mgmt-input"
                                value={editEndDate}
                                onChange={(e) => setEditEndDate(e.target.value)}
                                style={{ fontSize: "0.8rem" }}
                              />
                            ) : (
                              new Date(p.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            )}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            {p.is_current ? (
                              <span style={{ color: "var(--ml-accent)", fontWeight: 600 }}>Yes</span>
                            ) : (
                              <button
                                className="mgmt-btn mgmt-btn--ghost"
                                onClick={() => handleSetCurrent(p.id)}
                                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                              >
                                Set Current
                              </button>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right" }}>
                            {editingPeriod === p.id ? (
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button className="mgmt-btn mgmt-btn--ghost" onClick={() => setEditingPeriod(null)} style={{ fontSize: "0.75rem" }}>Cancel</button>
                                <button className="mgmt-btn mgmt-btn--primary" onClick={handleSavePeriod} style={{ fontSize: "0.75rem" }}>Save</button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button className="mgmt-btn mgmt-btn--ghost" onClick={() => startEditPeriod(p)} style={{ fontSize: "0.75rem" }}>Edit</button>
                                <button className="mgmt-btn mgmt-btn--ghost" onClick={() => handleDeletePeriod(p.id)} style={{ fontSize: "0.75rem", color: "var(--ml-error)" }}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {editWarning && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "var(--ml-warning)" }}>
                  {editWarning}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
