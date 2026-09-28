import apiClient from "./client";
import type { FeatureKey } from "../constant/features";

export interface SchoolFeature {
  key: FeatureKey;
  label: string;
  description: string;
  is_enabled: boolean;
}

export interface SchoolFeaturesResponse {
  school_id: number;
  features: SchoolFeature[];
}

export const featureApi = {
  get: (schoolId: number) =>
    apiClient.get<{ data: SchoolFeaturesResponse }>(`/schools/${schoolId}/features`),

  update: (schoolId: number, features: { key: FeatureKey; is_enabled: boolean }[]) =>
    apiClient.put<{ data: SchoolFeaturesResponse }>(`/schools/${schoolId}/features`, { features }),
};
