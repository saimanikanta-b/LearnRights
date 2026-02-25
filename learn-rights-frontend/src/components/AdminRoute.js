import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

const AdminRoute = ({ children }) => {
  const user = getCurrentUser();

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
