import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; 
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserHome from './components/user/UserHome';
import VerifyOTP from './components/verifyOtp';
import ProtectedRoute from "./components/ProtectedRoute"; // ✅ Import ProtectedRoute
import VerifyLoginOTP from './components/VerifyLoginOTP';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import DoctorDashboardPage from './components/AdminDashBoard/DoctorDashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify-login-otp" element={<VerifyLoginOTP />} />
        <Route path="/activate" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* ✅ Protected Routes - Only accessible when authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/userhome" element={<UserHome />} />
          <Route path="/dashboard" element={<DoctorDashboardPage />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
