// components/dashboard/UpcomingAppointments.js
import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming you'll link somewhere

export const UpcomingAppointments = ({ appointments = [] }) => {
  // --- Replace with actual data ---
  const displayAppointments = appointments.slice(0, 3); // Show max 3

  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Appointments</h3>
      {displayAppointments.length > 0 ? (
        <ul className="space-y-4 flex-grow">
          {displayAppointments.map((appt, index) => (
            <li key={index} className="flex items-center gap-3 pb-2 border-b border-gray-100 last:border-b-0">
              <div className="bg-blue-100 p-2 rounded-full">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">{appt.patientName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} /> {appt.time} - {appt.type}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 flex-grow flex items-center justify-center">No upcoming appointments today.</p>
      )}
      <Link
        to="/appointments" // Link to the full appointments page
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 justify-end"
      >
        View All <ArrowRight size={16} />
      </Link>
    </div>
  );
};