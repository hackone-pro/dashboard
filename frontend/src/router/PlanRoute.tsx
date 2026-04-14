import { Navigate } from "react-router-dom";
import { usePlanFeatures } from "../hooks/usePlanFeatures";

interface Props {
  featureKey: string;
  children: React.ReactNode;
}

export default function PlanRoute({ featureKey, children }: Props) {
  const { canAccess, loading } = usePlanFeatures();

  if (loading) return null;

  if (!canAccess(featureKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
