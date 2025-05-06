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
import DoctorDashboardPage from './components/DoctorDashboardPage';
import About from './components/About';
import DoctorFinder from './components/DoctorFinder';
import Contact from './components/Contact';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import AdminDashboardPage from './components/AdminDashBoard/dashboard';

function App() {
  // Effect to handle initial auth check
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired, clear all auth data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('cached_doctors');
          localStorage.removeItem('cached_appointments');
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        // Invalid token format, clear auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('cached_doctors');
        localStorage.removeItem('cached_appointments');
        window.dispatchEvent(new Event('storage'));
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Auth Routes - Redirect if already authenticated */}
        <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
        <Route path="/verify-login-otp" element={<VerifyLoginOTP />} />
        <Route path="/activate" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/dashboard" element={<DoctorDashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/userhome" element={<UserHome />} />
        </Route>
        <Route path="/find-doctor" element={<DoctorFinder />} />
      </Routes>
    </Router>
  );
}

// Component to handle public routes (login, register) and redirect if authenticated


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

  // Redirect based on role
  if (token && role) {
    if (role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (role === "doctor") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/userhome" replace />;
    }
  }

  return children;
}

export default App;
