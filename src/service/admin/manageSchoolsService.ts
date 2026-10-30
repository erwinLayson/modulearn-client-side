import { schoolApi, type SchoolListItem } from "../../api/schools";
import { featureApi, type SchoolFeature } from "../../api/features";
import { getApiErrorMessage } from "../../api/client";
import type { FeatureKey } from "../../constant/features";

export type { SchoolListItem, SchoolFeature };

export async function fetchSchools(): Promise<SchoolListItem[]> {
  const { data } = await schoolApi.getAll();
  return data.data || [];
}

export async function fetchFeatures(schoolId: number): Promise<SchoolFeature[]> {
  const { data } = await featureApi.get(schoolId);
  return data.data.features || [];
}

export async function saveFeatures(
  schoolId: number,
  features: SchoolFeature[]
): Promise<SchoolFeature[]> {
  const { data } = await featureApi.update(
    schoolId,
    features.map((f) => ({ key: f.key as FeatureKey, is_enabled: f.is_enabled }))
  );
  return data.data.features || [];
}

export { getApiErrorMessage };
