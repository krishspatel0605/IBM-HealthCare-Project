import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';
import { LogOut, User as UserIcon, Settings, Bell, LayoutDashboard, Calendar, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axiosInstance';

// Import Dashboard Components
import { StatCard } from './StatCard';
import { UpcomingAppointments } from './UpcomingAppointments';
import { AppointmentChart } from './AppointmentChart';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    upcomingAppointments: 0
  });

  // Replace with actual logged-in doctor data
  const doctor = { name: "Dr. Evelyn Reed", avatarUrl: null };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/doctor-appointments/');
      if (response.data) {
        setAppointments(response.data);
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = response.data.filter(
          app => app.appointment_date.startsWith(today)
        ).length;
        
        const upcomingAppointments = response.data.filter(
          app => new Date(app.appointment_date) > new Date()
        ).length;

        setStats({
          todayAppointments,
          totalAppointments: response.data.length,
          upcomingAppointments
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login', { replace: true });
  };

  const quickStats = [
    { 
      title: "Today's Appointments", 
      value: stats.todayAppointments, 
      icon: <Calendar />, 
      color: "blue", 
      description: `${stats.upcomingAppointments} Upcoming` 
    },
    { 
      title: "Total Appointments", 
      value: stats.totalAppointments, 
      icon: <Users />, 
      color: "green", 
      description: "All Time" 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button onClick={handleLogout} className="flex items-center text-gray-700 hover:text-gray-900">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
          {loading ? (
            <p>Loading appointments...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : appointments.length === 0 ? (
            <p>No appointments scheduled</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.user_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {appointment.reason || 'No reason provided'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}