import CredentialsSection from "../components/CredentialsSection";

export default function SettingsPage() {
  return (
    <div className="mgmt-page">
      <div className="mgmt-header">
        <div>
          <h1 className="mgmt-title">Settings</h1>
          <p className="mgmt-subtitle">Manage your account credentials</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "480px" }}>
        <CredentialsSection />
      </div>
    </div>
  );
}
