import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BackHome from "../components/BackHome";
import Toast from "../components/Toast";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../constant/users";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiLogin({ email, password });
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
