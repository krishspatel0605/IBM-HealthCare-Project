import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TextField } from '@mui/material';
import { FaUserMd, FaStethoscope, FaRegCalendarCheck, FaPhoneAlt, FaFirstAid } from 'react-icons/fa';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

export default function DoctorSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  // Dummy data for doctors
  const dummyDoctors = [
    {
      id: 1,
      name: "Dr. Sarah Wilson",
      specialization: "Cardiologist",
      experience: 12,
      contact: "+1 (555) 123-4567",
      treatedConditions: ["Heart Disease", "Hypertension", "Arrhythmia"],
      available: true
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialization: "Dermatologist",
      experience: 8,
      contact: "+1 (555) 987-6543",
      treatedConditions: ["Psoriasis", "Acne", "Eczema"],
      available: false
    }
  ];

  // Dummy data for appointments
  const dummyAppointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Wilson",
      specialization: "Cardiologist",
      date: "Feb 10, 2025",
      time: "10:30 AM",
      status: "confirmed"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialization: "Dermatologist",
      date: "Feb 15, 2025",
      time: "2:00 PM",
      status: "pending"
    }
  ];

  // Fetch doctors data from the backend (or use dummy data if API is not ready)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get('https://your-backend-api.com/doctors');
        setDoctors(response.data);
        setFilteredDoctors(response.data);
      } catch (err) {
        console.error("Failed to fetch doctors. Using dummy data instead.", err);
        setDoctors(dummyDoctors); // Fallback to dummy data
        setFilteredDoctors(dummyDoctors);
      }
      setLoading(false);
    };

    const fetchAppointments = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get('https://your-backend-api.com/appointments');
        setUpcomingAppointments(response.data);
      } catch (err) {
        console.error("Failed to fetch appointments. Using dummy data instead.", err);
        setUpcomingAppointments(dummyAppointments); // Fallback to dummy data
      }
    };


    fetchDoctors();
    fetchAppointments();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    const filtered = doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.treatedConditions.some(condition => 
        condition.toLowerCase().includes(query)
      )
    );
    
    setFilteredDoctors(filtered);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    window.dispatchEvent(new Event('storage')); // Notify ProtectedRoute
    // Redirect to login page
    navigate('/login');
  }
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <FaUserMd className="text-3xl text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                Health<span className="text-teal-600">Care</span>
              </span>
            </Link>

            <button onClick={toggleMenu} className="md:hidden text-gray-600">
              {/* {isMenuOpen ? <X size={24} /> : <Menu size={24} />} */}
            </button>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
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
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 text-center">
              Find Your Medical Specialist
            </h1>
            
            <div className="relative mb-12">
              <TextField
                fullWidth
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search doctors by name, specialty, or condition..."
                InputProps={{
                  className: "bg-white rounded-full shadow-lg",
                  startAdornment: (
                    <FaStethoscope className="text-blue-600 ml-4 mr-2" />
                  ),
                  style: {
                    borderRadius: '2rem',
                    padding: '0.5rem 1rem'
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-12">
              {[
                { count: "150+", label: "Verified Doctors" },
                { count: "30+", label: "Specialties" },
                { count: "24/7", label: "Availability" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-4 rounded-xl shadow-sm text-center"
                >
                  <div className="text-blue-600 font-bold text-2xl">{stat.count}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Appointments Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 sticky top-24">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Upcoming Appointments
              </h2>
              <div className="space-y-4">
                {upcomingAppointments.map(appointment => (
                  <motion.div 
                    key={appointment.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-blue-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialization}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar size={14} className="mr-2" />
                      {appointment.date} • {appointment.time}
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View All Appointments
              </button>
            </div>
          </div>

          {/* Doctors List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaUserMd className="text-blue-600" />
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Doctors'}
            </h2>

            <div className="grid gap-6">
              {filteredDoctors.map((doctor, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FaUserMd className="text-2xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {doctor.name}
                        <span className="text-sm ml-2 text-green-600">
                          {doctor.available ? '• Available Now' : '• Not Available'}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaStethoscope className="mr-2 text-blue-600" />
                          {doctor.specialization}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 text-blue-600" />
                          {doctor.experience} years experience
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhoneAlt className="mr-2 text-blue-600" />
                          {doctor.contact}
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Treated Conditions:</h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.treatedConditions.map((condition, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => navigate(`/book-appointment/${doctor.id}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                          <FaRegCalendarCheck className="text-lg" />
                          Book Appointment
                        </button>
                        <Link
                          to={`/doctor-profile/${doctor.id}`}
                          className="px-4 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Health Tips Carousel */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FaFirstAid />
            Healthcare Tips
          </h3>
          <Swiper
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 5000 }}
          >
            {[
              "Regular exercise improves both physical and mental health",
              "Annual check-ups can detect potential health issues early",
              "Maintain a balanced diet for optimal health"
            ].map((tip, index) => (
              <SwiperSlide key={index}>
                <div className="text-lg font-medium">{tip}</div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FaUserMd className="text-2xl" />
                HealthCare
              </h3>
              <p className="text-gray-400">
                Connecting patients with trusted medical professionals
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Find Doctors</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Support: +1 (555) 123-4567</li>
                <li>Email: support@medconnect.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}