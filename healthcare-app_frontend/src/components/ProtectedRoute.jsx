import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      setIsAuthenticated(!!token);

    };

    checkAuth();

    const interval = setInterval(checkAuth, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
