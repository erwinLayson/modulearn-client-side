import { useEffect, useState, useCallback } from "react";
import { academicPeriodApi, type AcademicPeriod } from "../api/academicPeriods";

interface PeriodSelectorProps {
  schoolId: number;
  schoolYearId: number;
  value: string;
  onChange: (periodId: string) => void;
  showAllOption?: boolean;
}

export default function PeriodSelector({
  schoolId,
  schoolYearId,
  value,
  onChange,
  showAllOption = true,
}: PeriodSelectorProps) {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeriods = useCallback(async () => {
    try {
      const { data } = await academicPeriodApi.getBySchoolAndYear(schoolId, schoolYearId);
      setPeriods(data.data || []);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, schoolYearId]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Period</label>
        <select className="mgmt-input" disabled style={{ fontSize: "0.8rem" }}>
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Period</label>
      <select
        className="mgmt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: "0.8rem" }}
      >
        {showAllOption && <option value="">All Periods</option>}
        {periods.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name} — {new Date(String(p.start_date)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}–{new Date(String(p.end_date)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </option>
        ))}
      </select>
    </div>
  );
}
