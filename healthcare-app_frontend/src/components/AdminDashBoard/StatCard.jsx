// components/dashboard/StatCard.js (Reusable Stat Card)
import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon, color = 'blue', description }) => {
  const colors = {
    blue: 'border-blue-500 bg-blue-50 text-blue-600',
    teal: 'border-teal-500 bg-teal-50 text-teal-600',
    green: 'border-green-500 bg-green-50 text-green-600',
    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-600',
    red: 'border-red-500 bg-red-50 text-red-600',
  };
  const selectedColor = colors[color] || colors.blue;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white p-5 rounded-xl shadow-md border-l-4 ${selectedColor.split(' ')[0]}`} // Use border color from map
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-full ${selectedColor.split(' ')[1]}`}> {/* Use bg color */}
           {React.cloneElement(icon, { className: `h-5 w-5 ${selectedColor.split(' ')[2]}` })} {/* Use text color */}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </motion.div>
  );
};
