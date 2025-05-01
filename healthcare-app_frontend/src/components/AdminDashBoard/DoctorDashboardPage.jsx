import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserMd, FaSearch, FaEllipsisV } from 'react-icons/fa';
import { FiClock, FiCalendar, FiUser, FiSettings } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);


export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'doctor') {
      navigate('/');
      return;
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchAppointments();
  }, [navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/doctor-appointments/');
      console.log('Doctor appointments response:', response.data); // Add logging

      if (Array.isArray(response.data)) {
        const now = new Date();
        const sortedAppointments = response.data.sort((a, b) => 
          new Date(b.appointment_date) - new Date(a.appointment_date)
        );
        
        // Add status based on date and completion
        const appointmentsWithStatus = sortedAppointments.map(app => ({
          ...app,
          status: app.status || (new Date(app.appointment_date) > now ? 'Scheduled' : 'Past')
        }));

        setAppointments(appointmentsWithStatus);

        const today = now.toISOString().split('T')[0];
        const todayAppointments = appointmentsWithStatus.filter(
          (app) => new Date(app.appointment_date).toISOString().startsWith(today)
        ).length;

        const upcomingAppointments = appointmentsWithStatus.filter(
          (app) => new Date(app.appointment_date) > now
        ).length;

        setStats({
          todayAppointments,
          totalAppointments: appointmentsWithStatus.length,
          upcomingAppointments,
        });
      } else {
        console.error('Invalid appointments data format:', response.data);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load appointments';
      setError(errorMessage);
      toast.error(errorMessage);
      setAppointments([]); // Clear appointments on error
      setStats({
        todayAppointments: 0,
        totalAppointments: 0,
        upcomingAppointments: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = (action, appointmentId) => {
    switch (action) {
      case 'edit':
        navigate(`/edit-appointment/${appointmentId}`);
        break;
      case 'cancel':
        axiosInstance
          .delete(`/appointments/${appointmentId}/`)
          .then(() => {
            toast.success('Appointment cancelled successfully!');
            fetchAppointments();
          })
          .catch((err) => {
            const errorMessage =
              err.response?.data?.error || 'Failed to cancel appointment';
            setError(errorMessage);
            toast.error(errorMessage);
          });
        break;
      case 'complete':
        axiosInstance
          .post(`/appointments/${appointmentId}/complete/`)
          .then(() => {
            toast.success('Appointment marked as complete!');
            fetchAppointments();
          })
          .catch((err) => {
            const errorMessage =
              err.response?.data?.error || 'Failed to mark appointment as complete';
            setError(errorMessage);
            toast.error(errorMessage);
          });
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <FaUserMd className="text-3xl text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                Health<span className="text-teal-600">Care</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <button
                onClick={handleLogout}
                className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiSettings className="text-lg" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-md sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex space-x-4">
              {['dashboard', 'appointments', 'patients'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'dashboard' && <FiClock className="text-lg" />}
                  {tab === 'appointments' && <FiCalendar className="text-lg" />}
                  {tab === 'patients' && <FiUser className="text-lg" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Date: {selectedDate.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition duration-300">
                <p className="text-sm text-gray-500 mb-1">Today's Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition duration-300">
                <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalAppointments}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition duration-300">
                <p className="text-sm text-gray-500 mb-1">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Appointments Management</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search appointments..."
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Mobile</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Reason</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments
                    .filter(appointment => {
                      const searchLower = searchQuery.toLowerCase();
                      return (
                        appointment.user_name?.toLowerCase().includes(searchLower) ||
                        appointment.user_email?.toLowerCase().includes(searchLower) ||
                        appointment.user_mobile?.includes(searchQuery) ||
                        appointment.reason?.toLowerCase().includes(searchLower)
                      );
                    })
                    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
                    .map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">{appointment.user_name}</td>
                        <td className="px-6 py-4">{appointment.user_email}</td>
                        <td className="px-6 py-4">{appointment.user_mobile}</td>
                        <td className="px-6 py-4">
                          <span className={
                            new Date(appointment.appointment_date) > new Date()
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }>
                            {new Date(appointment.appointment_date).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">{appointment.reason || 'Not specified'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.status || 'Scheduled'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button className="p-2 hover:bg-gray-100 rounded-lg group">
                              <FaEllipsisV className="text-gray-600" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 hidden group-hover:block z-10">
                              <button
                                onClick={() => handleAppointmentAction('complete', appointment.id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                disabled={appointment.status === 'completed'}
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={() => handleAppointmentAction('cancel', appointment.id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                disabled={appointment.status === 'cancelled'}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Patients Management</h2>
            {/* Add patients management content here */}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaUserMd className="text-2xl" />
                HealthCare
              </h3>
              <p className="text-gray-400">
                Connecting patients with trusted medical professionals
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Find Doctors</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Support: +1 (555)...</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
