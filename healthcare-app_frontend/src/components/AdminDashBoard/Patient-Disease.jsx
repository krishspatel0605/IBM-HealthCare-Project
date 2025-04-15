import React from "react";
import { Card, CardContent, CardHeader, Typography  } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";



const data = [
  { name: "Cardiovascular", value: 400 },
  { name: "Respiratory", value: 300 },
  { name: "Infectious", value: 300 },
  { name: "Neurological", value: 200 },
  { name: "Other", value: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function PatientsByDisease() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <Typography variant="h5">Patients By Disease</Typography>  
      </CardHeader>
      <CardContent>
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
