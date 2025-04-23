import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home'; 
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserHome from './components/user/UserHome';
import VerifyOTP from './components/verifyOtp';
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyLoginOTP from './components/VerifyLoginOTP';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import DoctorDashboardPage from './components/AdminDashBoard/DoctorDashboardPage';
import About from './components/About';
import DoctorFinder from './components/DoctorFinder';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        
        {/* Auth Routes - Redirect if already authenticated */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          } 
        />
        <Route path="/verify-login-otp" element={<VerifyLoginOTP />} />
        <Route path="/activate" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Doctor Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/dashboard" element={<DoctorDashboardPage />} />
        </Route>

        {/* User Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/userhome" element={<UserHome />} />
        </Route>

        {/* Common Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["user", "doctor"]} />}>
          <Route path="/doctorfinder" element={<DoctorFinder />} />
          <Route path="/find-doctors" element={<DoctorFinder />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Component to handle public routes (login, register) and redirect if authenticated
function PublicRoute({ children }) {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  const role = localStorage.getItem("user_role");

  React.useEffect(() => {
    // If there's a token but it's invalid, clear it
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_token");
          localStorage.removeItem("user_role");
        }
      } catch (error) {
        // Invalid token format, clear it
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
      }
    }
  }, [token]);

  // Only redirect if there's both a valid token and role
  if (token && role) {
    return <Navigate to={role === "doctor" ? "/dashboard" : "/userhome"} replace />;
  }

  return children;
}

export default App;
