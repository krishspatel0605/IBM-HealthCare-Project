import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';
import { FaUserMd, FaStethoscope, FaRegCalendarCheck, FaPhoneAlt, FaFirstAid, FaClinicMedical, FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaBriefcase, FaClock, FaMoneyBillWave, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { MdLocalHospital } from 'react-icons/md';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import _ from 'lodash';

// Set the base API URL with fallback options
const getApiBaseUrl = () => {
  const possibleUrls = [
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api',
    window.location.origin + '/api',
  ];
  
  const storedUrl = localStorage.getItem('api_base_url');
  if (storedUrl) {
    return storedUrl;
  }

  return possibleUrls[0];
};

const API_BASE_URL = getApiBaseUrl();

// Add retry logic with exponential backoff
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    config.retryCount = config.retryCount || 0;
    
    if (error.code === 'ECONNABORTED' && config.retryCount < 2) {
      config.retryCount += 1;
      // Exponential backoff: wait 1s, then 2s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount));
      console.log(`Request timed out, retrying (${config.retryCount}/2)...`);
      return axiosInstance(config);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('The request took too long to respond after multiple retries. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Star rating component
const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
  }

  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
  }

  return (
    <div className="flex items-center">
      <div className="flex mr-1">{stars}</div>
      <span className="text-gray-600 text-sm">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function UserHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(4);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAppointments = async () => {
    try {
      const response = await axiosInstance.get('/user-appointments/');
      if (response.data) {
        // Filter to keep only upcoming appointments
        const now = new Date();
        const upcomingAppts = response.data.filter(appt => 
          new Date(appt.appointment_date) > now
        );
        setUpcomingAppointments(upcomingAppts);
      } else {
        setUpcomingAppointments([]);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setUpcomingAppointments([]);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!authToken) {
      navigate('/login');
    }
  }, [navigate]);

  const performSearch = async (query) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchPerformed(true);

    try {
      const response = await axiosInstance.get(
        `/recommend-doctors/?query=${encodeURIComponent(query)}&limit=100`
      );
      
      if (response.data && response.data.recommended_doctors) {
        const recommendedDoctors = response.data.recommended_doctors;
        
        const processedDoctors = recommendedDoctors.map(doctor => {
          const processedDoctor = { ...doctor };
          
          // Ensure conditions_treated is always an array and normalize case for comparison
          if (doctor.conditions_treated) {
            const conditions = Array.isArray(doctor.conditions_treated) 
              ? doctor.conditions_treated 
              : doctor.conditions_treated.split(',').map(c => c.trim());
            
            // Check if either specialization or conditions match the search query
            const matchFound = 
              doctor.specialization.toLowerCase().includes(query.toLowerCase()) ||
              conditions.some(condition => condition.toLowerCase().includes(query.toLowerCase()));
            
            processedDoctor.treats_searched_condition = matchFound;
            processedDoctor.conditions_treated = conditions;
          }
          
          return processedDoctor;
        });

        setFilteredDoctors(processedDoctors);
        if (processedDoctors.length === 0) {
          setError(`No doctors found for "${query}"`);
        } else {
          setError('');
        }
      } else {
        setError(`No doctors found for "${query}"`);
        setFilteredDoctors([]);
      }
    } catch (error) {
      console.error("Error searching doctors:", error);
      setError(`Search failed. Please try again later.`);
      setFilteredDoctors([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const memoizedFetchDoctors = useMemo(() => {
    return _.debounce(async () => {
      try {
        const response = await axiosInstance.get(`/list-all-doctors/?limit=10`);
        if (response.data && response.data.doctors) {
          const doctorsData = response.data.doctors;
          setDoctors(doctorsData);
          setFilteredDoctors(doctorsData);
          localStorage.setItem('cached_doctors', JSON.stringify({ data: doctorsData, timestamp: Date.now() }));
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Could not load doctors. Please try again later.");
      }
      setLoading(false);
    }, 1000); // 1 second debounce
  }, []);

  const memoizedFetchAppointments = useMemo(() => {
    return _.debounce(async () => {
      try {
        const response = await axiosInstance.get('/user-appointments/');
        if (response.data) {
          setUpcomingAppointments(response.data);
          localStorage.setItem('cached_appointments', JSON.stringify({ data: response.data, timestamp: Date.now() }));
        } else {
          setUpcomingAppointments([]);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setUpcomingAppointments([]);
      }
    }, 1000); // 1 second debounce
  }, []);

  useEffect(() => {
    // Try to load from cache first
    const cachedDoctors = localStorage.getItem('cached_doctors');
    const cachedAppointments = localStorage.getItem('cached_appointments');
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load doctors
        if (cachedDoctors) {
          const { data, timestamp } = JSON.parse(cachedDoctors);
          // Use cache if less than 2 minutes old
          if (Date.now() - timestamp < 2 * 60 * 1000) {
            setDoctors(data);
            setFilteredDoctors(data);
          } else {
            const response = await axiosInstance.get('/list-all-doctors/?limit=10');
            if (response.data?.doctors) {
              setDoctors(response.data.doctors);
              setFilteredDoctors(response.data.doctors);
              localStorage.setItem('cached_doctors', JSON.stringify({
                data: response.data.doctors,
                timestamp: Date.now()
              }));
            }
          }
        } else {
          const response = await axiosInstance.get('/list-all-doctors/?limit=10');
          if (response.data?.doctors) {
            setDoctors(response.data.doctors);
            setFilteredDoctors(response.data.doctors);
            localStorage.setItem('cached_doctors', JSON.stringify({
              data: response.data.doctors,
              timestamp: Date.now()
            }));
          }
        }

        // Load appointments
        if (cachedAppointments) {
          const { data, timestamp } = JSON.parse(cachedAppointments);
          // Use cache if less than 1 minute old
          if (Date.now() - timestamp < 60 * 1000) {
            setUpcomingAppointments(data);
          } else {
            const response = await axiosInstance.get('/user-appointments/');
            if (response.data) {
              setUpcomingAppointments(response.data);
              localStorage.setItem('cached_appointments', JSON.stringify({
                data: response.data,
                timestamp: Date.now()
              }));
            }
          }
        } else {
          const response = await axiosInstance.get('/user-appointments/');
          if (response.data) {
            setUpcomingAppointments(response.data);
            localStorage.setItem('cached_appointments', JSON.stringify({
              data: response.data,
              timestamp: Date.now()
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Could not load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Update total pages whenever filtered doctors changes
    setTotalPages(Math.ceil(filteredDoctors.length / doctorsPerPage));
  }, [filteredDoctors, doctorsPerPage]);

  const handleSearch = (e) => {
    if (searchQuery.trim()) {
      // Update URL without page navigation using history.replaceState
      const url = new URL(window.location);
      url.searchParams.set('query', searchQuery);
      window.history.replaceState({}, '', url);
      
      // Redirect to DoctorFinder with the search query
      navigate(`/find-doctor?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(e);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleLogOut = () => {
    // Only remove the tokens we're actually using
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    
    // Navigate to home using SPA routing
    navigate('/', { replace: true });
  };

  // Update the Health Tips section with real content
  const healthTips = [
    "Regular exercise improves both physical and mental health",
    "Annual check-ups can detect potential health issues early",
    "Maintain a balanced diet rich in fruits and vegetables for optimal health",
    "Stay hydrated by drinking at least 8 glasses of water daily",
    "Get 7-9 hours of quality sleep every night for better overall health"
  ];

  const handleBookAppointment = async (doctorId) => {
    if (!localStorage.getItem('auth_token')) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      toast.error('Please select an appointment date');
      return;
    }

    try {
      setIsBooking(true);
      const response = await axiosInstance.post('/book-appointment/', {
        doctor_id: selectedDoctor.id,
        appointment_date: new Date(bookingDate).toISOString(),
        reason: bookingReason || ''
      });

      if (response.data) {
        toast.success('Great! Your appointment has been successfully booked. A confirmation email will be sent shortly.');
        setShowBookingModal(false);
        setSelectedDoctor(null);
        setBookingDate('');
        setBookingReason('');
        fetchAppointments(); // Refresh the appointments list
        
        // Show appointment details in a more visible notification
        toast.success(`Appointment Details:
        Doctor: ${selectedDoctor.name}
        Date: ${new Date(bookingDate).toLocaleString()}
        ${bookingReason ? `Reason: ${bookingReason}` : ''}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your healthcare dashboard...</p>
      </div>
    );
  }

  if (error && !searchPerformed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header (always shown) */}
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

      {/* Search Section (always shown) */}
      <section className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 text-center">
              Find Your Medical Specialist
            </h1>
            
            <form onSubmit={handleSearchSubmit} className="relative mb-6">
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors by name, specialty, or condition..."
                InputProps={{
                  className: "bg-white rounded-full shadow-lg",
                  startAdornment: (
                    <FaStethoscope className="text-blue-600 ml-4 mr-2" />
                  ),
                  endAdornment: (
                    <button 
                      type="submit"
                      className="bg-blue-600 text-white p-2 rounded-full mr-2"
                    >
                      <FaSearch />
                    </button>
                  ),
                  style: {
                    borderRadius: '2rem',
                    padding: '0.5rem 1rem'
                  }
                }}
              />
            </form>

            {/* Common Health Conditions */}
            <div className="mb-8">
              <h3 className="text-gray-700 font-medium mb-3">Common health conditions:</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Asthma",
                  "Diabetes",
                  "Hypertension",
                  "Arthritis",
                  "Depression",
                  "Anxiety",
                  "Cancer"
                ].map((condition, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(condition);
                      performSearch(condition);
                    }}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1"
                  >
                    <FaPlus size={12} className="text-blue-600" />
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {/* Show stats only when not in search mode */}
            {!searchPerformed && (
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
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* When in search mode, show a simplified layout */}
        {searchPerformed ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaUserMd className="text-blue-600" />
                {`Search Results for "${searchQuery}" (${filteredDoctors.length} doctors found)`}
              </h2>
            </div>

            {/* Search loading indicator */}
            {searchLoading && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Searching for specialists treating "{searchQuery}"...</p>
              </div>
            )}

            {/* Search error message */}
            {searchPerformed && error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Display the filtered doctors - full width in search mode */}
            {!searchLoading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${doctor.treats_searched_condition ? 'border-l-4 border-green-500' : ''}`}>
                    <div className="bg-blue-600 text-white p-4">
                      <div className="flex items-start gap-2">
                        <FaUserMd className="mt-1" />
                        <div>
                          <h3 className="text-xl font-bold">{doctor.name}</h3>
                          <p>{doctor.specialization}</p>
                          {doctor.hospital && typeof doctor.hospital === 'object' ? (
                            <div>
                              <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                                <MdLocalHospital className="text-blue-200" size={14} />
                                {doctor.hospital.name || ''}
                              </p>
                              <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                                <FaMapMarkerAlt className="text-blue-200" size={14} />
                                {doctor.hospital.address || ''}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Experience */}
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 p-2 rounded-md">
                            <FaBriefcase className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="font-medium">{doctor.experience_years}</p>
                          </div>
                        </div>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          <div className="bg-yellow-50 p-2 rounded-md">
                            <FaStar className="text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Rating</p>
                            {doctor.rating ? <StarRating rating={doctor.rating} /> : <p>No ratings</p>}
                          </div>
                        </div>
                        
                        {/* Availability */}
                        <div className="flex items-center gap-2">
                          <div className="bg-green-50 p-2 rounded-md">
                            <FaClock className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Availability</p>
                            <p className="font-medium">
                              {doctor.availability || (doctor.available ? 'Available' : 'Unavailable')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Fee */}
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-50 p-2 rounded-md">
                            <FaMoneyBillWave className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Fee</p>
                            <p className="font-medium">₹{doctor.fee || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Specializes in treating */}
                      {doctor.conditions_treated && (
                        <div className="mt-5">
                          <p className="text-sm flex items-center gap-1 font-medium text-green-700">
                            <FaStethoscope size={12} /> Specializes in treating:
                          </p>
                          <div className="mt-1">
                            {Array.isArray(doctor.conditions_treated) 
                              ? doctor.conditions_treated.map((condition, index) => (
                                <span 
                                  key={index} 
                                  className={`inline-block mr-2 mb-2 px-3 py-1 rounded-full text-xs
                                    ${searchQuery && condition.toLowerCase().includes(searchQuery.toLowerCase()) 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-blue-50 text-blue-700"}`}
                                >
                                  {condition}
                                  {searchQuery && condition.toLowerCase().includes(searchQuery.toLowerCase()) && (
                                    <span className="ml-1 text-green-500">✓</span>
                                  )}
                                </span>
                              ))
                              : (
                                <span 
                                  className="inline-block mr-2 mb-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                                >
                                  {doctor.conditions_treated.toString()}
                                </span>
                              )
                            }
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleBookAppointment(doctor.id)}
                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredDoctors.length === 0 && !searchLoading && searchPerformed && !error && (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-400 text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-medium text-gray-700">No doctors found treating "{searchQuery}"</h3>
                    <p className="text-gray-500 mt-2">Try a different condition or specialty</p>
                    <button 
                      onClick={() => {setSearchPerformed(false); setSearchQuery('');}}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Back to Home
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Clear search button */}
            {searchPerformed && filteredDoctors.length > 0 && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => {setSearchPerformed(false); setSearchQuery('');}}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Search & Return Home
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Original layout when not searching */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Appointments Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 sticky top-24">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Upcoming Appointments
                </h2>
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    (showAllAppointments ? upcomingAppointments : upcomingAppointments.slice(0, 5)).map(appointment => (
                      <motion.div 
                        key={appointment.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-blue-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{appointment.doctor_name}</h3>
                            <p className="text-sm text-gray-600">{appointment.specialization}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            new Date(appointment.appointment_date) > new Date()
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {new Date(appointment.appointment_date) > new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-2" />
                          {new Date(appointment.appointment_date).toLocaleString()}
                        </div>
                        {appointment.reason && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No upcoming appointments</p>
                      <button
                        onClick={() => navigate('/find-doctor')}
                        className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Book your first appointment
                      </button>
                    </div>
                  )}
                </div>
                {upcomingAppointments.length > 5 && (
                  <button 
                    onClick={() => setShowAllAppointments(!showAllAppointments)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showAllAppointments ? 'Show Less' : 'View All Appointments'}
                  </button>
                )}
              </div>
            </div>

            {/* Doctors List */}
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaUserMd className="text-blue-600" />
                  Featured Doctors
                </h2>
              </div>

              {/* Display the filtered doctors */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredDoctors
                  .slice((currentPage - 1) * doctorsPerPage, currentPage * doctorsPerPage)
                  .map((doctor) => (
                    <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
                      <div className="bg-blue-600 text-white p-4">
                        <div className="flex items-start gap-2">
                          <FaUserMd className="mt-1" />
                          <div>
                            <h3 className="text-xl font-bold">{doctor.name}</h3>
                            <p className="text-lg">{doctor.specialization}</p>
                            {doctor.hospital && typeof doctor.hospital === 'object' ? (
                              <div>
                                <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                                  <MdLocalHospital className="text-blue-200" size={14} />
                                  {doctor.hospital.name || ''}
                                </p>
                                <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                                  <FaMapMarkerAlt className="text-blue-200" size={14} />
                                  {doctor.hospital.address || ''}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Experience */}
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-md">
                              <FaBriefcase className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Experience</p>
                              <p className="font-medium text-gray-900">{doctor.experience_years}</p>
                            </div>
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="bg-yellow-50 p-2 rounded-md">
                              <FaStar className="text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rating</p>
                              {doctor.rating ? (
                                <div className="flex items-center gap-1">
                                  <StarRating rating={doctor.rating} />
                                </div>
                              ) : (
                                <p>No ratings</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Availability */}
                          <div className="flex items-center gap-2">
                            <div className="bg-green-50 p-2 rounded-md">
                              <FaClock className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Availability</p>
                              <p className="font-medium text-gray-900">
                                {doctor.availability || (doctor.available ? 'Available' : 'Unavailable')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Fee */}
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-50 p-2 rounded-md">
                              <FaMoneyBillWave className="text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Consultation Fee</p>
                              <p className="font-medium text-gray-900">₹{doctor.consultation_fee_inr || doctor.fee || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Conditions treated */}
                        {doctor.conditions_treated && (
                          <div className="mt-5">
                            <p className="text-sm flex items-center gap-1 font-medium text-green-700">
                              <FaStethoscope size={12} /> Specializes in treating:
                            </p>
                            <div className="mt-1">
                              {Array.isArray(doctor.conditions_treated) 
                                ? doctor.conditions_treated.map((condition, index) => (
                                  <span 
                                    key={index} 
                                    className="inline-block mr-2 mb-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                                  >
                                    {condition}
                                  </span>
                                ))
                                : (
                                  <span 
                                    className="inline-block mr-2 mb-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                                  >
                                    {doctor.conditions_treated.toString()}
                                  </span>
                                )
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* Book Appointment button */}
                        <button
                          onClick={() => handleBookAppointment(doctor.id)}
                          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FaPhoneAlt size={14} />
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination Controls */}
              {filteredDoctors.length > doctorsPerPage && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Book Appointment with {selectedDoctor.name}</h2>
            <form onSubmit={submitAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Appointment Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for Visit (Optional)
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Describe your symptoms or reason for visit"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isBooking ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Tips Carousel - only show when not in search mode */}
      {!searchPerformed && (
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
              {healthTips.map((tip, index) => (
                <SwiperSlide key={index}>
                  <div className="text-lg font-medium">{tip}</div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Footer - always show */}
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
                <li>Email: support@healhcare.com</li>
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