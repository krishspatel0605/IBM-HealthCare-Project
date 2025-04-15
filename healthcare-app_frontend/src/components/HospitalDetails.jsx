import React, { useEffect, useState } from 'react';
import { useParams,  } from 'react-router-dom';
import { Card,   } from "../components/ui/card";
import { Button } from "../components/ui/button";
// import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { 
  FaHospital, 
  FaPhone, 
  FaBed, 
  FaStethoscope, 
  FaUserMd, 
  FaClock,
  FaMoneyBillWave,
  FaClinicMedical,
  FaAmbulance,
  FaFlask,
  FaPlusSquare
} from 'react-icons/fa';
import { GiMedicinePills } from 'react-icons/gi'; 

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
      <div className="container mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl p-6 mb-8 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-4">
            <FaHospital className="text-3xl" />
            {hospital.name}
          </h1>
          <p className="mt-2 text-lg opacity-90">{hospital.location}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Hospital Info Card */}
          <Card className="rounded-2xl shadow-lg p-6 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <FaBed className="text-2xl" />
                <span className="text-xl font-semibold">Available Beds: {hospital.available_beds}</span>
              </div>
              
              <div className="flex items-center gap-3 text-blue-600">
                <FaPhone className="text-xl" />
                <span className="text-lg">{hospital.contact}</span>
              </div>

              <div className="flex items-center gap-3 text-blue-600">
                <FaClinicMedical className="text-xl" />
                <span className="text-lg">{hospital.specialization}</span>
              </div>
            </div>
          </Card>

          {/* Facilities Card */}
          <Card className="rounded-2xl shadow-lg p-6 bg-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
              <FaPlusSquare className="text-2xl" />
              Key Facilities
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {hospital.facilities.map((facility, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  {facility === 'ICU' && <FaStethoscope className="text-blue-600" />}
                  {facility === 'Pharmacy' && <GiMedicinePills className="text-blue-600" />}
                  {facility === 'Ambulance' && <FaAmbulance className="text-blue-600" />}
                  {facility === 'Laboratory' && <FaFlask className="text-blue-600" />}
                  <span className="text-gray-700">{facility}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Doctors Section */}
        <Card className="rounded-2xl shadow-lg p-6 bg-white">
          <h3 className="text-2xl font-bold mb-6 text-center text-blue-600 flex items-center justify-center gap-3">
            <FaUserMd className="text-3xl" />
            Our Specialist Doctors
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospital.doctors.map((doctor, index) => (
              <div key={index} className="group p-6 border border-blue-100 rounded-xl transition-all hover:border-blue-200 hover:shadow-lg">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-blue-600">DR</span>
                  </div>
                  <h4 className="text-xl font-bold text-center text-blue-800">{doctor.name}</h4>
                  <p className="text-sm text-gray-600 text-center">{doctor.specialization}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaClock className="text-blue-600" />
                    <span>{doctor.availability}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaStethoscope className="text-blue-600" />
                    <span>{doctor.experience} Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <FaMoneyBillWave className="text-lg" />
                    <span>₹{doctor.fee} Consultation Fee</span>
                  </div>
                </div>

                <Button 
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Book Appointment
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default HospitalDetails;