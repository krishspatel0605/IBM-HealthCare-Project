// components/dashboard/AppointmentChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const AppointmentChart = ({ data, options }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Appointments This Week', font: { size: 16, weight: '600' }, color: '#374151', padding: { bottom: 15 } },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } },
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
    },
    elements: {
      line: {
        tension: 0.4, // Smoother curve
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-full">
      <div className="h-64 md:h-80"> {/* Ensure container has height */}
        <Line data={data} options={mergedOptions} />
      </div>
    </div>
  );
};