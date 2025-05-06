import React, { useEffect, useState } from 'react';
import { Loader2, Users, UserCheck, CalendarCheck } from 'lucide-react';
import { FaUserMd } from 'react-icons/fa';
import api from '../../utils/api';
import UserTable from '../AdminDashBoard/usertable';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No auth token found. Please login again.');
      setLoading(false);
      return;
    }

    api.get(`/admin/overview/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load dashboard stats.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaUserMd className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">
              Admin<span className="text-teal-600">Dashboard</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Welcome, Admin!</h2>
          <p className="text-gray-600">Monitor key stats and manage the system effectively.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center text-blue-600 text-xl">
            <Loader2 className="animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <p className="text-center text-red-500 text-lg">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <StatCard
                label="Total Users"
                value={stats?.total_users || 0}
                icon={<Users className="w-8 h-8 text-blue-600" />}
                color="from-blue-100 to-blue-200"
              />
              <StatCard
                label="Total Doctors"
                value={stats?.total_doctors || 0}
                icon={<UserCheck className="w-8 h-8 text-teal-600" />}
                color="from-teal-100 to-teal-200"
              />
              <StatCard
                label="Appointments"
                value={stats?.total_appointments || 0}
                icon={<CalendarCheck className="w-8 h-8 text-purple-600" />}
                color="from-purple-100 to-purple-200"
              />
            </div>

            {/* User Table Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">User Management</h3>
              <UserTable />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl shadow-md flex items-center gap-4`}>
    <div className="bg-white p-3 rounded-full shadow-sm">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-medium text-gray-700">{label}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default AdminDashboardPage;
