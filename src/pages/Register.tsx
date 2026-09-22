import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BackHome from "../components/BackHome";
import Toast from "../components/Toast";
import { registerSchool } from "../api/schools";

interface SchoolForm {
  school_name: string;
  school_id: string;
  school_level: string;
  school_email: string;
  address: string;
  region: string;
  province: string;
  city: string;
  contact_number: string;
  school_logo: string;
  school_admin: string;
  academic_system: string;
  period_count: string;
}

const initialForm: SchoolForm = {
  school_name: "",
  school_id: "",
  school_level: "",
  school_email: "",
  address: "",
  region: "",
  province: "",
  city: "",
  contact_number: "",
  school_logo: "",
  school_admin: "",
  academic_system: "quarter",
  period_count: "4",
};

const schoolLevels = [
  { value: "1", label: "Elementary School" },
  { value: "2", label: "Junior High School" },
  { value: "3", label: "Senior High School" },
  { value: "4", label: "College & University" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SchoolForm>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const updateField = (field: keyof SchoolForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        school_name: form.school_name,
        school_id: Number(form.school_id),
        school_level: Number(form.school_level),
        school_email: form.school_email,
        address: form.address,
        region: form.region,
        province: form.province,
        city: form.city,
        contact_number: form.contact_number,
        school_logo: form.school_logo,
        school_admin: form.school_admin,
        academic_system: form.academic_system,
        period_count: Number(form.period_count),
      };
      const { data } = await registerSchool(payload);
      if (data.isOk) {
        setToast({ message: "School registered successfully! Redirecting to login...", type: "success" });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Registration failed. Please try again."
          : "Registration failed. Please try again.";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {/* 30 % navy brand panel */}
      <aside className="reg-brand animate-fade-in">
        <div>
          <div className="mb-8">
            <BackHome variant="dark" />
          </div>
          <div className="reg-brand-head">
            <div className="reg-brand-mark">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h2 className="reg-brand-title">ModuLearn</h2>
              <p className="reg-brand-sub">School Registration</p>
            </div>
          </div>
          <p className="reg-brand-desc">
            Register your institution to start building structured learning modules
            for your students and faculty.
          </p>
        </div>
      </aside>

      {/* 60 % white form area */}
      <main className="reg-form-wrap">
        <div className="reg-form">
          <header className="mb-8 animate-fade-slide-up">
            <h1 className="reg-heading">
              Register your <span className="reg-heading-accent">school</span>
            </h1>
            <p className="reg-sub">Fill in the details below to create your school account.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}
            {/* school information */}
            <section className="reg-section animate-fade-slide-up">
              <h2 className="reg-section-title">School Information</h2>
              <div className="form-grid form-grid--2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-school-name">
                    School Name
                  </label>
                  <input
                    id="reg-school-name"
                    type="text"
                    placeholder="e.g. Modena National High School"
                    value={form.school_name}
                    onChange={updateField("school_name")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-school-id">
                    School ID
                  </label>
                  <input
                    id="reg-school-id"
                    type="number"
                    placeholder="e.g. 12313213"
                    value={form.school_id}
                    onChange={updateField("school_id")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-school-level">
                    School Level
                  </label>
                  <select
                    id="reg-school-level"
                    value={form.school_level}
                    onChange={updateField("school_level")}
                    className="auth-select"
                    required
                  >
                    <option value="" disabled>
                      Select level
                    </option>
                    {schoolLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-school-email">
                    School Email
                  </label>
                  <input
                    id="reg-school-email"
                    type="email"
                    placeholder="school@example.com"
                    value={form.school_email}
                    onChange={updateField("school_email")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>
              </div>
            </section>

            {/* address */}
            <section className="reg-section animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
              <h2 className="reg-section-title">Address</h2>
              <div className="form-grid">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-address">
                    Street Address
                  </label>
                  <input
                    id="reg-address"
                    type="text"
                    placeholder="e.g. 123 P. Del Rosario St."
                    value={form.address}
                    onChange={updateField("address")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>
                <div className="form-grid form-grid--3">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-region">
                      Region
                    </label>
                    <input
                      id="reg-region"
                      type="text"
                      placeholder="Region"
                      value={form.region}
                      onChange={updateField("region")}
                      className="auth-input auth-input--plain"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-province">
                      Province
                    </label>
                    <input
                      id="reg-province"
                      type="text"
                      placeholder="Province"
                      value={form.province}
                      onChange={updateField("province")}
                      className="auth-input auth-input--plain"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-city">
                      City
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      placeholder="City"
                      value={form.city}
                      onChange={updateField("city")}
                      className="auth-input auth-input--plain"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* contact & admin */}
            <section className="reg-section animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="reg-section-title">Contact & Admin</h2>
              <div className="form-grid form-grid--2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-contact">
                    Contact Number
                  </label>
                  <input
                    id="reg-contact"
                    type="text"
                    placeholder="e.g. 09171234567"
                    value={form.contact_number}
                    onChange={updateField("contact_number")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-logo">
                    School Logo (URL)
                  </label>
                  <input
                    id="reg-logo"
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={form.school_logo}
                    onChange={updateField("school_logo")}
                    className="auth-input auth-input--plain"
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-admin">
                    School Admin
                  </label>
                  <input
                    id="reg-admin"
                    type="text"
                    placeholder="Full name of the school admin"
                    value={form.school_admin}
                    onChange={updateField("school_admin")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>
              </div>
            </section>

            {/* academic configuration */}
            <section className="reg-section animate-fade-slide-up" style={{ animationDelay: "0.25s" }}>
              <h2 className="reg-section-title">Academic Configuration</h2>
              <div className="form-grid form-grid--2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-academic-system">
                    Academic System
                  </label>
                  <select
                    id="reg-academic-system"
                    value={form.academic_system}
                    onChange={(e) => {
                      const system = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        academic_system: system,
                        period_count: system === "quarter" ? "4" : "2",
                      }));
                    }}
                    className="auth-select"
                    required
                  >
                    <option value="quarter">Quarter System</option>
                    <option value="semester">Semester System</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-period-count">
                    Number of {form.academic_system === "quarter" ? "Quarters" : "Semesters"}
                  </label>
                  <input
                    id="reg-period-count"
                    type="number"
                    min="1"
                    max="6"
                    value={form.period_count}
                    onChange={updateField("period_count")}
                    className="auth-input auth-input--plain"
                    required
                  />
                </div>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--ml-text-muted)", marginTop: "0.5rem" }}>
                Your school will have {form.period_count} {form.academic_system === "quarter" ? "quarter(s)" : "semester(s)"} per school year. You can customize period names and dates after registration.
              </p>
            </section>

            {/* submit */}
            <button
              type="submit"
              className="auth-btn auth-btn--primary animate-fade-slide-up"
              style={{ animationDelay: "0.3s" }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register School"}
            </button>

            {/* mobile toggle */}
            <p className="auth-toggle-text animate-fade-in" style={{ animationDelay: "0.4s" }}>
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="auth-link">
                Sign In
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}