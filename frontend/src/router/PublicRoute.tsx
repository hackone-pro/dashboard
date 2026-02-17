import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: Props) {
  const { token } = useAuth();

  if (token) {
    const storedUser = localStorage.getItem("user");
  
    if (storedUser) {
      const user = JSON.parse(storedUser);
  
      if (user?.user_role?.slug === "admin") {
        return <Navigate to="/multitenant-manager" replace />;
      }
    }
  
    return <Navigate to="/dashboard" replace />;
  }  

  return <>{children}</>;
}