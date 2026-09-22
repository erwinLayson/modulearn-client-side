import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackHome from "../components/BackHome";
import Toast from "../components/Toast";
import { login as apiLogin } from "../api/auth";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../constant/users";

interface SchoolOption {
  school_id: number;
  school_name: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "">("");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<{ data: SchoolOption[] }>("/schools/list");
        if (!cancelled) setSchools(data.data || []);
      } catch {
        // silently fail — school selector will be empty
      } finally {
        if (!cancelled) setSchoolsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: { email: string; password: string; school_id?: number } = { email, password };
      if (selectedSchoolId) payload.school_id = Number(selectedSchoolId);
      const { data } = await apiLogin(payload);
      if (data.isOk && data.data?.user) {
        const backendUser = data.data.user;
        const firstName = backendUser.first_name ?? "";
        const lastName = backendUser.last_name ?? "";
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName =
          backendUser.name || fullName || backendUser.school_admin || backendUser.email || "";

        authLogin({
          id: backendUser.id,
          name: displayName,
          email: backendUser.email,
          role: backendUser.role as UserRole,
          school_id: backendUser.school_id,
          school_name: backendUser.school_name as string | undefined,
          academic_config_completed: backendUser.academic_config_completed as boolean | undefined,
        });
        setToast({ message: "Login successful! Redirecting...", type: "success" });
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Login failed. Please try again."
          : "Login failed. Please try again.";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
        <BackHome />
      </div>

      <div className="auth-card animate-fade-slide-up">
        <div className="auth-header animate-fade-in">
          <div className="auth-avatar mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue learning</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <div className="auth-field animate-fade-slide-up" style={{ animationDelay: "0.02s" }}>
              <label className="auth-label" htmlFor="login-school">
                School
              </label>
              <div className="relative">
                <span className="auth-input-icon">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </span>
                <select
                  id="login-school"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value ? Number(e.target.value) : "")}
                  className="auth-input"
                  disabled={schoolsLoading}
                  style={{ appearance: "auto" }}
                >
                  <option value="">
                    {schoolsLoading ? "Loading schools..." : "Select your school (skip for Super Admin)"}
                  </option>
                  {schools.map((s) => (
                    <option key={s.school_id} value={s.school_id}>
                      {s.school_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-field animate-fade-slide-up" style={{ animationDelay: "0.05s" }}>
              <label className="auth-label" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <span className="auth-input-icon">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
              <label className="auth-label" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <span className="auth-input-icon">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end text-sm animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <a href="#" className="auth-link">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="auth-btn auth-btn--primary animate-fade-slide-up"
              style={{ animationDelay: "0.25s" }}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="auth-toggle-text animate-fade-in" style={{ animationDelay: "0.35s" }}>
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="auth-link">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
