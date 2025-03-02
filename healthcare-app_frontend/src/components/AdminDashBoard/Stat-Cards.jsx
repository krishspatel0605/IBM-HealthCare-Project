import React, { useEffect, useState } from "react";
import { Card, CardContent,  Typography } from '@mui/material';
// import { Users, Bed, Stethoscope, Activity } from "lucide-react";

function fetchStats() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalPatients: 1245,
        availableBeds: 52,
        activeDoctors: 87,
        averageStay: 4.2,
      });
    }, 1000); // Simulating API delay
  });
}

export default function StatCards() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  if (!stats) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Total Patients Card */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform">
        <CardContent>
          <Typography variant="h6" className="font-semibold text-blue-600">Total Patients</Typography>
          <div className="text-3xl font-bold text-gray-800">{stats.totalPatients}</div>
        </CardContent>
      </Card>

      {/* Available Beds Card */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform">
          {/* <Bed className="h-6 w-6 text-green-600" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
        </CardHeader> */}
        <CardContent>
          <Typography variant="h6" className="font-semibold text-green-600">Available Beds</Typography>
          <div className="text-3xl font-bold text-gray-800">{stats.availableBeds}</div>
        </CardContent>
      </Card>

      {/* Active Doctors Card */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform">
        {/* <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Stethoscope className="h-6 w-6 text-purple-600" />
        </CardHeader> */}
        <CardContent>
          <Typography variant="h6" className="font-semibold text-purple-600">Active Doctors</Typography>
          <div className="text-3xl font-bold text-gray-800">{stats.activeDoctors}</div>
        </CardContent>
      </Card>

      {/* Average Stay Card */}
      <Card className="shadow-lg rounded-xl hover:scale-105 transition-transform">
        {/* <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Activity className="h-6 w-6 text-orange-600" />
        </CardHeader> */}
        <CardContent>
          <Typography variant="h6" className="font-semibold text-orange-600">Avg. Stay (Days)</Typography>
          <div className="text-3xl font-bold text-gray-800">{stats.averageStay}</div>
        </CardContent>
      </Card>

    </div>
  );
}
