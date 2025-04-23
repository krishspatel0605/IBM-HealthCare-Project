import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ allowedRoles }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for auth token and role
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const role = localStorage.getItem("user_role");
    
    setIsAuthenticated(!!token);
    setUserRole(role);
    setIsLoading(false);

    // Listen for storage changes
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const newRole = localStorage.getItem("user_role");
      setIsAuthenticated(!!newToken);
      setUserRole(newRole);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    // Save the attempted URL
    const currentPath = window.location.pathname;
    sessionStorage.setItem('redirectUrl', currentPath);
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but doesn't have the required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their appropriate dashboard based on their role
    return <Navigate to={userRole === "doctor" ? "/dashboard" : "/userhome"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
