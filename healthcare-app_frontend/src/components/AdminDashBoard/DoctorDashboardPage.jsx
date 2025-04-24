import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';
import { LogOut, User as UserIcon, Settings, Bell, LayoutDashboard, Calendar, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [navigate]);

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
      if (err.response && err.response.status === 404) {
        setError('No appointments found for the logged-in doctor.');
        toast.error('No appointments found for the logged-in doctor.');
      } else {
        setError('Failed to fetch appointments. Please try again later.');
        toast.error('Failed to load appointments');
      }
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
      description: "Scheduled for today" 
    },
    { 
      title: "Upcoming Appointments", 
      value: stats.upcomingAppointments, 
      icon: <MessageSquare />, 
      color: "yellow", 
      description: "Next 7 days" 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          new Date(appointment.appointment_date) > new Date()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {new Date(appointment.appointment_date) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
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