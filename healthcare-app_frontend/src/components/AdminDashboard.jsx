import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiMenu, 
  FiX, 
  FiLogOut, 
  FiUser, 
  FiHome, 
  FiUsers,
  FiActivity,
  FiCalendar,
  FiBarChart2,
  FiBriefcase
} from "react-icons/fi";
import { motion } from "framer-motion";
import BedAvailability from './AdminDashBoard/Bed-Availability';
import RecentAdmissions from './AdminDashBoard/Recent-Admission';
import DoctorAvailability from './AdminDashBoard/Doctor-Availability';
import StatCards from './AdminDashBoard/Stat-Cards';
import UsersList from './AdminDashBoard/userlist';
import PatientsByDisease from './AdminDashBoard/Patient-Disease';


const navItems = [
  { name: "Dashboard", component: <StatCards /> },
  { name: "Users", component: <UsersList /> },
  { name: "Bed Availability", component: <BedAvailability /> },
  { name: "Recent Admissions", component: <RecentAdmissions /> },
  { name: "Doctor Availability", component: <DoctorAvailability /> },
  { name: "Hospital Stats", component: <PatientsByDisease /> },
];

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState(navItems[0].component);
  const admin = { name: "Admin Name", username: "admin123" }; // Replace with real data
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavItemClick = (component) => {
    setActiveSection(component);
  };

  const handleLogout = () => {
    // localStorage.removeItem('access_token'); // Remove the token
    navigate('/admin-login'); // Redirect to the login page
  };

  // useEffect(() => {
  //   // Check if the token exists in localStorage and redirect if not authenticated
  //   // if (!localStorage.getItem('access_token')) {
  //     navigate('/admin-login'); // Redirect to login if no token
  //   // }
  // }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-blue-900 text-white ${isSidebarOpen ? "w-64" : "w-20"} transition-all duration-300 p-4 flex flex-col justify-between`}>
        <div>
          <button onClick={toggleSidebar} className="text-white text-2xl mb-4">
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="flex items-center mb-6 cursor-pointer hover:bg-blue-700 p-3 rounded">
            <FiUser className="text-xl" />
            {isSidebarOpen && (
              <div className="ml-3">
                <p className="font-bold">{admin.name}</p>
                <p className="text-sm text-gray-300">{admin.username}</p>
              </div>
            )}
          </div>
          <nav>
            {navItems.map((item) => (
              <Link
                key={item.name}
                onClick={() => handleNavItemClick(item.component)} 
                className={`block p-3 my-2 rounded transition-colors ${activeSection === item.component ? "bg-blue-500" : "hover:bg-blue-700"}`}
              >
                {isSidebarOpen ? item.name : item.name.charAt(0)}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-700 p-3">
          <FiLogOut className="mr-2" /> {isSidebarOpen && "Logout"}
        </button>
      </div>

      <div className="flex-1 p-6 bg-white shadow-lg rounded-lg overflow-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center bg-blue-900 text-white p-4 rounded mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Display the active section */}
        {activeSection}
      </div>
    </div>
  );
}
