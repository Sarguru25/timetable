import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  redirectTo = "/login",
}) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect based on user role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "hod":
        return <Navigate to="/hod/dashboard" replace />;
      case "assistant_professor":
      case "associate_professor":
      case "professor":
        return <Navigate to="/faculty/dashboard" replace />;
      case "student":
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
