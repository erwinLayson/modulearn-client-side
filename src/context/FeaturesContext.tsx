import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { featureApi } from "../api/features";
import type { FeatureKey } from "../constant/features";

interface FeaturesContextType {
  /** True while the switches for the active school are still being loaded. */
  loading: boolean;
  /** True when the switches could not be loaded (UI then fails open; the API still blocks). */
  error: boolean;
  /** Whether a feature is on for the active school. Unknown keys default to enabled. */
  isEnabled: (key: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

const FeaturesContext = createContext<FeaturesContextType | null>(null);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const schoolId = user?.school_id;
  const shouldLoad = !!user && user.role !== "super_admin" && !!schoolId;

  const [disabled, setDisabled] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(shouldLoad);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!shouldLoad || !schoolId) {
      setDisabled(new Set());
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    try {
      const res = await featureApi.get(schoolId);
      const off = res.data.data.features
        .filter((feature) => !feature.is_enabled)
        .map((feature) => feature.key);
      setDisabled(new Set(off));
      setError(false);
    } catch {
      // Fail open in the UI: the server still refuses the disabled endpoints.
      setDisabled(new Set());
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [shouldLoad, schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isEnabled = useCallback(
    (key: FeatureKey) => !disabled.has(key),
    [disabled]
  );

  const value = useMemo<FeaturesContextType>(
    () => ({ loading, error, isEnabled, refresh: load }),
    [loading, error, isEnabled, load]
  );

  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error("useFeatures must be used within a FeaturesProvider");
  }
  return context;
}
