"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "ICU", total: 50, available: 10 },
  { name: "General", total: 200, available: 45 },
  { name: "Pediatric", total: 30, available: 8 },
  { name: "Maternity", total: 40, available: 15 },
];

export default function BedAvailability() {
  return (
    <div className="border rounded-lg shadow-lg p-6 bg-white">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Bed Availability</h2>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" name="Total Beds" />
            <Bar dataKey="available" fill="#82ca9d" name="Available Beds" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
