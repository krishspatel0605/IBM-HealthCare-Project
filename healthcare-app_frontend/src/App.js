import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home'; 
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserHome from './components/user/UserHome';
import DashboardPage from './components/AdminDashboard';
import Login from './components/AdminDashBoard/admin-login';
import DoctorFinder from './components/DoctorFinder';
import ProtectedRoute from './components/ProtectedRoute';
import HospitalDetails from './components/HospitalDetails';
import About from './components/About';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/hospitaldetail" element={<HospitalDetails />} />
        <Route path="/find-doctors" element={<DoctorFinder />} />
        <Route path="/about" element={<About />} />
        {/* Protected Routes */}
        <Route path="/userhome" element={<ProtectedRoute Component={UserHome} />} />
        <Route path="/dashboard" element={<ProtectedRoute Component={DashboardPage} />} />
        <Route path="/admin-login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
