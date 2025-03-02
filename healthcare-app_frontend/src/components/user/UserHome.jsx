import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Autocomplete, TextField } from '@mui/material';
import { FaStethoscope, FaUserMd, FaHospital, FaRegCalendarCheck } from 'react-icons/fa';
import { Calendar, Clock, Bell, Search, User } from 'lucide-react';

const diseaseOptions   = [
    "Heart Attack", "Arrhythmia", "Hypertension", "Heart Failure",
    "Stroke", "Epilepsy", "Parkinson's Disease", "Migraine",
    "Osteoarthritis", "Fractures", "Spinal Disorders", "Sports Injuries",
    "Coronary Artery Disease", "Atrial Fibrillation", "High Cholesterol", "Congenital Heart Defects",
    "Multiple Sclerosis", "Brain Tumors", "Dementia", "Peripheral Neuropathy",
    "Joint Pain", "Hip Replacement", "Knee Injuries", "Rheumatoid Arthritis",
    "Pregnancy Care", "PCOS", "Endometriosis", "Uterine Fibroids",
    "Cardiomyopathy", "Heart Valve Disease", "Angina", "Bradycardia",
    "Alzheimer's Disease", "Meningitis", "Vertigo", "Sleep Disorders",
    "Menstrual Disorders", "Infertility", "Ovarian Cysts", "Cervical Cancer"
]



export default function UserScreen() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [upcomingAppointments,  ] = useState([
    {
      id: 1,
      doctor: "Dr. Sarah Wilson",
      specialty: "Cardiologist",
      date: "Feb 10, 2025",
      time: "10:30 AM",
      status: "confirmed"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Dermatologist",
      date: "Feb 15, 2025",
      time: "2:00 PM",
      status: "pending"
    }
  ]);

  const fetchHospitals = async (query) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/hospitals/?disease=${query} `);
      setHospitals(response.data);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const handleSearch = (event, value) => {
    setSearchValue(value);
    if (value) {
      fetchHospitals(value);
    } else {
      fetchHospitals("");
    }
  };

  const handleLogOut = () => navigate('/login');

  useEffect(() => { fetchHospitals(""); }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <FaHospital className="text-3xl text-blue-600" />
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Health<span className="text-teal-600">Care</span>
            </Link>
          </Link>

          <div className="flex-1 max-w-xl w-full my-4 md:my-0">
            <Autocomplete
              options={diseaseOptions}
              value={searchValue}
              onChange={handleSearch}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search hospitals by specialization..."
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    className: "bg-white rounded-lg shadow-sm",
                    startAdornment: (
                      <FaStethoscope className="text-blue-600 ml-2 mr-1" />
                    ),
                  }}
                  onKeyPress={(e) => e.key === "Enter" && fetchHospitals(searchValue)}
                />
              )}
            />
          </div>

          <nav className="flex items-center gap-4">
            <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                            About
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                                          About
              </Link>

            <button
              onClick={handleLogOut}
              className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <FaUserMd className="text-lg" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <div className='bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50'>
        <section className="py-10   ">
  <div className="container mx-auto px-4">
    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
      
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
          Find Specialized Care & Book Appointments Effortlessly
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with trusted healthcare providers and specialists in your area.
          Real-time availability, verified reviews, and instant booking.
        </p>
        {/* <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg">
          <FaRegCalendarCheck className="text-xl" />
          <span>Book Appointment Now</span>
        </button> */}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-center">
          <Calendar size={24} className="mb-2 mx-auto" />
          <h4 className="font-semibold">Book Appointment</h4>
        </div>
        <div className="p-6 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors text-center">
          <Clock size={24} className="mb-2 mx-auto" />
          <h4 className="font-semibold">View Appointments </h4>
        </div>
        {/* <div className="p-6 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-colors text-center">
          <User size={24} className="mb-2 mx-auto" />
          <h4 className="font-semibold">Find Specialists</h4>
        </div> */}
      </div>
    </div>
  </div>
</section>



      {/* Hospital List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-600 mb-12 text-center">
            {searchValue ? `Hospitals Specializing in ${searchValue}` : 'Featured Hospitals'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <FaHospital className="text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-600">{hospital.name}</h3>
                </div>
                <div className="space-y-2 text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Specialization:</span>
                    {hospital.specialization}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Location:</span>
                    {hospital.location}
                  </p>
                  <p className={`flex items-center gap-2 ${hospital.available_beds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-medium">Beds:</span>
                    {hospital.available_beds} Available
                  </p>
                </div>

                {/* Book Appointment Button and View Details Link */}
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/book-appointment/${hospital.id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <FaRegCalendarCheck className="text-lg" />
                    <span>Book Appointment</span>
                  </button>

                  <Link
                    to={`/hospital-details/${hospital.id}`}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Appointments */}
      <section className="bg-white  rounded-lg   shadow-sm p-6 mb-5">
        <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
        <div className="space-y-4">
          {upcomingAppointments.map(appointment => (
            <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-800">{appointment.doctor}</h3>
                <p className="text-gray-600">{appointment.specialty}</p>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>{appointment.date}</span>
                  <Clock size={16} />
                  <span>{appointment.time}</span>
                </div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 text-blue-600 hover:text-blue-700 font-semibold">
          View all appointments
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaHospital className="text-2xl" />
                HealthCare
              </h3>
              <p className="text-gray-400">
                Committed to providing accessible, high-quality healthcare solutions for everyone.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/services" className="text-gray-400 hover:text-white">Services</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: info@healthcare.com</li>
                <li className="text-gray-400">Phone: +123 456 789</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Link to="/" className="text-gray-400 hover:text-white">Facebook</Link>
                <Link to="/" className="text-gray-400 hover:text-white">Twitter</Link>
                <Link to="/" className="text-gray-400 hover:text-white">Instagram</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
  );
}
