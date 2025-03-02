import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const HospitalDetails = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   axios.get(`http://127.0.0.1:8000/api/hospital_details/${id}/`)
  //     .then(response => {
  //       setHospital(response.data);
  //       setLoading(false);
  //     })
  //     .catch(error => {
  //       console.error('Error fetching hospital details:', error);
  //       setLoading(false);
  //     });
  // }, [id]);

  // if (loading) {
  //   return <div className="text-center text-lg font-bold">Loading...</div>;
  // }

  // if (!hospital) {
  //   return <div className="text-center text-lg font-bold">Hospital not found!</div>;
  // }

  useEffect(() => {
    // Dummy Data to simulate backend response
    const dummyData = {
      name: "City Care Hospital",
      location: "Ahmedabad, Gujarat",
      available_beds: 12,
      contact: "+91 9876543210",
      specialization: "Multi-Speciality Hospital",
      facilities: ["ICU", "Pharmacy", "Ambulance", "Laboratory"],
      doctors: [
        { name: "Dr. A. Sharma", specialization: "Cardiologist", experience: 10, availability: "10 AM - 4 PM", fee: 800 },
        { name: "Dr. B. Patel", specialization: "Neurologist", experience: 8, availability: "11 AM - 5 PM", fee: 1000 },
        { name: "Dr. C. Mehta", specialization: "Orthopedic", experience: 12, availability: "9 AM - 2 PM", fee: 700 }
      ]
    };
    setHospital(dummyData);
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="text-center text-lg font-bold">Loading...</div>;
  }

  if (!hospital) {
    return <div className="text-center text-lg font-bold">Hospital not found!</div>;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-8 min-h-screen bg-gray-100">
        <Card className="shadow-lg rounded-xl p-6 bg-white">
          <CardHeader className="text-center border-b pb-4">
            <h2 className="text-3xl font-extrabold text-blue-700 mb-2">{hospital.name}</h2>
            <p className="text-lg text-gray-600">{hospital.location}</p>
            <p className="text-green-700 text-lg font-semibold">Available Beds: {hospital.available_beds}</p>
            <p className="text-blue-500">Contact: {hospital.contact}</p>
            <p className="text-blue-500">Specialization: {hospital.specialization}</p>
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Facilities:</h4>
              <ul className="list-disc list-inside text-gray-700">
                {hospital.facilities.map((facility, index) => (
                  <li key={index}>{facility}</li>
                ))}
              </ul>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-semibold text-center mb-6 text-blue-600">Doctors List</h3>
            {hospital.doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospital.doctors.map((doctor, index) => (
                  <div key={index} className="p-6 border rounded-lg shadow-md hover:shadow-xl transition duration-300 bg-white">
                    <h4 className="text-xl font-bold text-blue-800 mb-2">{doctor.name}</h4>
                    <p className="text-gray-700">Specialization: {doctor.specialization}</p>
                    <p className="text-gray-700">Experience: {doctor.experience} years</p>
                    <p className="text-gray-700">Availability: {doctor.availability}</p>
                    <p className="text-green-700 font-semibold">Fee: ₹{doctor.fee}</p>
                    <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow-md">
                      Book Appointment
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-red-500">No doctors available</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default HospitalDetails;
