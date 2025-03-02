import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

function fetchRecentAdmissions() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, patient: "John Doe", disease: "Pneumonia", admissionDate: "2023-06-15" },
        { id: 2, patient: "Jane Smith", disease: "Fracture", admissionDate: "2023-06-14" },
        { id: 3, patient: "Bob Johnson", disease: "Appendicitis", admissionDate: "2023-06-13" },
        { id: 4, patient: "Alice Brown", disease: "Diabetes", admissionDate: "2023-06-12" },
        { id: 5, patient: "Charlie Davis", disease: "Hypertension", admissionDate: "2023-06-11" },
      ]);
    }, 1000); // Simulating API delay
  });
}

export default function RecentAdmissions() {
  const [admissions, setAdmissions] = useState([]);

  useEffect(() => {
    fetchRecentAdmissions().then(setAdmissions);
  }, []);

  return (
    <Card className="shadow-lg rounded-xl hover: transition-transform">
      <CardHeader className="bg-blue-600 text-white rounded-t-xl p-4">
        <Typography variant="h5">Recent Admissions</Typography>
      </CardHeader>
      <CardContent>
        <Table className="min-w-full">
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className="font-semibold text-gray-700">Patient</TableCell>
              <TableCell className="font-semibold text-gray-700">Disease</TableCell>
              <TableCell className="font-semibold text-gray-700">Admission Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissions.map((admission) => (
              <TableRow
                key={admission.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>{admission.patient}</TableCell>
                <TableCell>{admission.disease}</TableCell>
                <TableCell>{admission.admissionDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
