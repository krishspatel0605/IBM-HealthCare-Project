import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; 
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserHome from './components/user/UserHome';
import DashboardPage from './components/AdminDashboard';
import Login from './components/AdminDashBoard/admin-login';
// import ProtectedRoute from './components/ProtectedRoute';
import HospitalDetails from './components/HospitalDetails';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/hospitaldetail" element={<HospitalDetails />} />
        {/* ✅ Use ProtectedRoute properly */}
        <Route path="/userhome" element={<UserHome />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin-login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
