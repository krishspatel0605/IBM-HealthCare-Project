import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';
import { LogOut, User as UserIcon, Settings, Bell, LayoutDashboard, Calendar, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

// Import Dashboard Components
import { StatCard } from './StatCard';
import { UpcomingAppointments } from './UpcomingAppointments';
import { AppointmentChart } from './AppointmentChart';

// --- Chart.js setup (needs to be done once, can be here or in chart component) ---
import { Chart as ChartJS } from 'chart.js';
// (Ensure necessary components are registered if not done in AppointmentChart.js)

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  // --- Replace with actual logged-in doctor data ---
  const doctor = { name: "Dr. Evelyn Reed", avatarUrl: null }; // Use avatarUrl if available

  const handleLogout = () => {
    console.log("Logging out doctor...");
    // Add real logout logic
    navigate('/login'); // Or your login route
  };

  // --- Placeholder Data (Replace with API calls) ---
  const quickStats = [
    { title: "Appointments Today", value: "8", icon: <Calendar />, color: "blue", description: "2 Pending" },
    { title: "Unread Messages", value: "3", icon: <MessageSquare />, color: "yellow", description: "From Patients" },
    { title: "Active Patients", value: "124", icon: <Users />, color: "teal", description: "This month" },
    { title: "Pending Tasks", value: "5", icon: <Bell />, color: "red", description: "Requires action" },
  ];

  const upcomingAppointmentsData = [
    { patientName: "John Doe", time: "10:00 AM", type: "Check-up" },
    { patientName: "Jane Smith", time: "11:30 AM", type: "Follow-up" },
    { patientName: "Robert Johnson", time: "02:00 PM", type: "New Patient" },
  ];

  const appointmentChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Appointments',
        data: [5, 8, 6, 9, 7, 4, 8],
        borderColor: '#3b82f6', // blue-600
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Lighter blue fill
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6',
        fill: true, // Enable fill
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex flex-col">

      {/* Dashboard Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <FaUserMd className="text-3xl text-blue-600" />
              <span className="text-xl font-bold text-blue-600">
                Health<span className="text-teal-600">Care</span> <span className="text-gray-500 font-normal text-lg hidden sm:inline">| Doctor Portal</span>
              </span>
            </Link>

            {/* Right Side: Notifications, Profile Dropdown */}
            <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-blue-600 relative">
                <Bell size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  5 {/* Notification count */}
                </span>
              </button>

              {/* Profile Dropdown (Simplified Example) */}
              <div className="relative">
                 <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                    {doctor.avatarUrl ? (
                        <img src={doctor.avatarUrl} alt="Doctor Avatar" className="w-8 h-8 rounded-full border-2 border-blue-200" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                            <UserIcon size={16} className="text-blue-600" />
                        </div>
                    )}
                    <span className="hidden md:inline text-sm font-medium">{doctor.name}</span>
                    {/* Add dropdown icon if needed */}
                 </button>
                 {/* Basic Dropdown Content (Needs state management for visibility) */}
                 {/* <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden">
                     <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Profile</Link>
                     <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Settings</Link>
                     <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                 </div> */}
              </div>

               <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors text-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {doctor.name}!</h1>
          <p className="text-gray-600">Here's your overview for today.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {quickStats.map((stat, index) => (
             // Add animation delay
             <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment Chart (Larger) */}
          <div className="lg:col-span-2">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <AppointmentChart data={appointmentChartData} />
            </motion.div>
          </div>

          {/* Upcoming Appointments List */}
          <div>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
                <UpcomingAppointments appointments={upcomingAppointmentsData} />
            </motion.div>
          </div>
        </div>

        {/* Add more sections/widgets as needed */}
        {/* Example: Patient Activity Feed, Quick Links, etc. */}
        {/* <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Patient Activity</h3>
            <p className="text-gray-500">Activity feed placeholder...</p>
        </div> */}

      </main>

      {/* Optional Footer within the dashboard */}
      {/* <footer className="container mx-auto px-4 py-4 text-center text-sm text-gray-500 border-t border-gray-200 mt-auto">
         © {new Date().getFullYear()} HealthCare | Doctor Portal
      </footer> */}
    </div>
  );
}