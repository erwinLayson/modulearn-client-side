import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateCredentials } from "../api/auth";
import Toast from "./Toast";

type ToastState = { message: string; type: "success" | "error" } | null;

export default function CredentialsSection() {
  const { user, login } = useAuth();
  const [toast, setToast] = useState<ToastState>(null);

  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast({ message: "Current password is required", type: "error" });
      return;
    }
    if (email === user.email) {
      setToast({ message: "No changes to save", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateCredentials({ current_password: currentPassword, email });
      login({ ...user, email });
      setCurrentPassword("");
      setToast({ message: "Email updated successfully", type: "success" });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update email"
        : "Failed to update email";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast({ message: "Current password is required", type: "error" });
      return;
    }
    if (!newPassword) {
      setToast({ message: "New password is required", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: "New passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: "New password must be at least 6 characters", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateCredentials({ current_password: currentPassword, password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast({ message: "Password updated successfully", type: "success" });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update password"
        : "Failed to update password";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Email Section */}
      <div style={{ background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Change Email</h3>
        <form onSubmit={handleUpdateEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>New Email</label>
            <input
              type="email"
              className="mgmt-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: "0.8rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Current Password</label>
            <input
              type="password"
              className="mgmt-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required to confirm changes"
              style={{ fontSize: "0.8rem" }}
            />
          </div>
          <button
            type="submit"
            className="mgmt-btn mgmt-btn--primary"
            disabled={saving}
            style={{ fontSize: "0.8rem", alignSelf: "flex-start" }}
          >
            {saving ? "Saving..." : "Update Email"}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div style={{ background: "var(--ml-surface)", border: "1px solid var(--ml-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>Change Password</h3>
        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Current Password</label>
            <input
              type="password"
              className="mgmt-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ fontSize: "0.8rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>New Password</label>
            <input
              type="password"
              className="mgmt-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ fontSize: "0.8rem" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ml-text-muted)" }}>Confirm New Password</label>
            <input
              type="password"
              className="mgmt-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={{ fontSize: "0.8rem" }}
            />
          </div>
          <button
            type="submit"
            className="mgmt-btn mgmt-btn--primary"
            disabled={saving}
            style={{ fontSize: "0.8rem", alignSelf: "flex-start" }}
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </>
  );
}
