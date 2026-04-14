export type PlanType = "essentials" | "full";

/**
 * Maps each feature key (route path) to the minimum plan required.
 * Features not listed here are not gated by plan.
 */
export const FEATURE_PLAN_MAP: Record<string, PlanType> = {
  "/dashboard": "essentials",
  "/risk-level": "essentials",
  "/incidentes": "essentials",
  "/threat-map": "essentials",
  "/soc-analytics": "essentials",
  "/monitoria-ngsoc": "essentials",
  "/relatorios": "essentials",
  "/vulnerabilities-detections": "full",
  "/archives-integrity": "full",
  "/monitoria-csc": "full",
};
