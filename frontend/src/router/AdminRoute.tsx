import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  if (user?.user_role?.slug !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}