import { useTenant } from "../context/TenantContext";
import { FEATURE_PLAN_MAP, PlanType } from "../config/featureFlags";

export function usePlanFeatures() {
  const { tenantAtivo, loading } = useTenant();

  const plan: PlanType | undefined = tenantAtivo?.plan;

  const canAccess = (featureKey: string): boolean => {
    if (!plan) return false;
    if (plan === "full") return true;

    const requiredPlan = FEATURE_PLAN_MAP[featureKey];
    if (!requiredPlan) return true; // features not in the map are unrestricted
    return requiredPlan === "essentials";
  };

  return { plan, canAccess, loading };
}
