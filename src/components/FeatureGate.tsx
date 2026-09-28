import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatures } from "../context/FeaturesContext";
import { FEATURE_LABELS, type FeatureKey } from "../constant/features";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
}

/**
 * Wraps a page (or nav destination) so it is replaced by a "not available"
 * screen when the super admin has switched the feature off for the school.
 */
export default function FeatureGate({ feature, children }: FeatureGateProps) {
  const { loading, isEnabled } = useFeatures();
  const navigate = useNavigate();

  // Wait for the switches so a gated page never fires its API calls first.
  if (loading) {
    return (
      <div className="feature-locked">
        <div className="feature-locked-card">
          <span className="feature-locked-text">Checking availability…</span>
        </div>
      </div>
    );
  }

  if (!isEnabled(feature)) {
    return (
      <div className="feature-locked" role="alert">
        <div className="feature-locked-card">
          <div className="feature-locked-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h2 className="feature-locked-title">Feature not available</h2>
          <p className="feature-locked-text">
            <strong>{FEATURE_LABELS[feature]}</strong> has been disabled for your school by
            the system administrator.
          </p>
          <button
            type="button"
            className="feature-locked-btn"
            onClick={() => navigate("/dashboard")}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
