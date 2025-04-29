import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';

const DoctorHome = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/doctor-appointments/');
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load appointments. Please try again later.');
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Your Appointments</h1>
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr>
                <th className="py-3 px-6 bg-blue-600 text-white text-left">Patient</th>
                <th className="py-3 px-6 bg-blue-600 text-white text-left">Date & Time</th>
                <th className="py-3 px-6 bg-blue-600 text-white text-left">Reason</th>
                <th className="py-3 px-6 bg-blue-600 text-white text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6">{appt.user_name || appt.user_email || 'Unknown'}</td>
                  <td className="py-3 px-6">{new Date(appt.appointment_date).toLocaleString()}</td>
                  <td className="py-3 px-6">{appt.reason || 'N/A'}</td>
                  <td className="py-3 px-6">{appt.status || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorHome;
