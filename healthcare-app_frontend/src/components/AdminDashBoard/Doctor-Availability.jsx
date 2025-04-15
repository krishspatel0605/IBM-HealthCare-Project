import React from "react";
import { Card, CardContent,  } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Sample data for the Pie chart
const data = [
  { name: "On Duty", value: 30 },
  { name: "Off Duty", value: 45 },
  { name: "On Call", value: 12 },
];

// Colors for different segments of the pie chart
const COLORS = ["#00C49F", "#FF8042", "#FFBB28"];

export default function DoctorAvailability() {
  return (
    <Card className="shadow-lg rounded-xl hover: transition-transform">
      <CardContent>
        {/* Card Title */}
        <div className="mb-4">
        <h2 className="text-xl font-bold">Doctor Availability</h2>
      </div>

        {/* Pie Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {/* Assigning colors to the pie slices */}
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
