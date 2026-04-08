import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoutes = ({ children, userRoles }) => {
  const { role } = useAuth();              // ✅ correct place
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRoles && !userRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoutes;
