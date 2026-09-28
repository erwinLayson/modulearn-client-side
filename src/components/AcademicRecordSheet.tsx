import type { AcademicRecordResponse } from "../api/students";

export function formatGrade(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(2);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

interface AcademicRecordSheetProps {
  record: AcademicRecordResponse;
}

/**
 * One print-ready report card sheet. Rendered standalone on the student record
 * page and once per student on the adviser's batch print page.
 */
export default function AcademicRecordSheet({ record }: AcademicRecordSheetProps) {
  const studentName = `${record.student.first_name}${record.student.middle_name ? " " + record.student.middle_name : ""} ${record.student.last_name}${record.student.extension_name ? " " + record.student.extension_name : ""}`;

  return (
    <div className="ar-sheet">
      <header className="ar-header">
        {record.school.school_logo && (
          <img src={record.school.school_logo} alt="" className="ar-logo" />
        )}
        <div className="ar-header-text">
          <div className="ar-school-name">{record.school.school_name}</div>
          <div className="ar-school-meta">
            {[record.school.address, record.school.city, record.school.province, record.school.region]
              .filter(Boolean)
              .join(", ")}
          </div>
          {record.school.contact_number && (
            <div className="ar-school-meta">Contact: {record.school.contact_number}</div>
          )}
        </div>
      </header>

      <div className="ar-doc-title">STUDENT ACADEMIC RECORD</div>

      <section className="ar-student-block">
        <div className="ar-student-grid">
          <div>
            <span className="ar-label">Name:</span> <span className="ar-value">{studentName}</span>
          </div>
          <div>
            <span className="ar-label">LRN:</span> <span className="ar-value">{record.student.lrn || "—"}</span>
          </div>
          <div>
            <span className="ar-label">Sex:</span> <span className="ar-value">{record.student.sex || "—"}</span>
          </div>
          <div>
            <span className="ar-label">Date of Birth:</span>{" "}
            <span className="ar-value">{formatDate(record.student.date_of_birth)}</span>
          </div>
        </div>
      </section>

      {record.records.length === 0 && (
        <div className="mgmt-empty">No enrollment records for the selected scope.</div>
      )}

      {record.records.map((yearRecord) => (
        <section key={yearRecord.school_year.id} className="ar-year-section">
          <div className="ar-year-header">
            <div>
              <h2 className="ar-year-title">School Year {yearRecord.school_year.name}</h2>
              <div className="ar-year-meta">
                Grade Level: {yearRecord.enrollment.grade_level ?? "—"} · Section:{" "}
                {yearRecord.enrollment.section || "—"} · Class: {yearRecord.enrollment.class_name}
                {yearRecord.enrollment.adviser_name && <> · Adviser: {yearRecord.enrollment.adviser_name}</>}
                · Status: {yearRecord.enrollment.status}
              </div>
            </div>
          </div>

          {yearRecord.subjects.length === 0 ? (
            <div className="mgmt-empty">No subjects recorded for this school year.</div>
          ) : (
            <div className="mgmt-table-wrap ar-table-wrap">
              <table className="mgmt-table ar-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    {yearRecord.periods.map((p) => (
                      <th key={p.id}>{p.name}</th>
                    ))}
                    <th>Final Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {yearRecord.subjects.map((subj) => (
                    <tr key={subj.subject_id}>
                      <td className="mgmt-table-bold">{subj.subject_name}</td>
                      {yearRecord.periods.map((p) => {
                        const grade = subj.grades.find((g) => g.period_id === p.id);
                        return (
                          <td key={p.id}>{formatGrade(grade ? grade.final_grade : null)}</td>
                        );
                      })}
                      <td className="mgmt-table-bold">{formatGrade(subj.final_grade)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <footer className="ar-footer">
        <div>Generated on {new Date().toLocaleDateString()}</div>
        <div>Printed from ModuLearn — read-only historical record</div>
      </footer>
    </div>
  );
}
