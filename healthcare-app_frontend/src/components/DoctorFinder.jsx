import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaUser, 
  FaStar, 
  FaBriefcase, 
  FaClock, 
  FaMoneyBillWave, 
  FaPhoneAlt, 
  FaExclamationTriangle, 
  FaStethoscope, 
  FaDatabase, 
  FaInfoCircle, 
  FaHistory, 
  FaBookmark, 
  FaRegStar, 
  FaStarHalfAlt, 
  FaMapMarkerAlt, 
  FaArrowLeft 
} from 'react-icons/fa';
import { MdLocalHospital, MdAccountCircle } from 'react-icons/md';
import { toast } from 'react-toastify';
import _ from 'lodash';

// Base API URL and configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Configure axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    config.retryCount = config.retryCount || 0;
    
    if (error.code === 'ECONNABORTED' && config.retryCount < 2) {
      config.retryCount += 1;
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount));
      return axiosInstance(config);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout after multiple retries. Please try again later.');
    }

    if (response?.status === 401) {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Common data
const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Depression',
  'Anxiety', 'Back Pain', 'Heart Disease', 'Migraine', 'Thyroid'
];

const COMMON_SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics',
  'Psychiatry', 'Gynecology', 'Ophthalmology', 'ENT', 'Dentistry'
];

// Dummy data for fallback when API is not available
const DUMMY_DOCTORS = [
  {
    id: 1,
    name: "Dr. John Smith",
    specialization: "Cardiology",
    experience_years: 15,
    rating: 4.8,
    conditions_treated: ["heart disease", "hypertension", "arrhythmia"],
    hospital: {
      name: "Central Hospital",
      address: "123 Medical Center Blvd"
    }
  },
  {
    id: 2,
    name: "Dr. Sarah Johnson",
    specialization: "Pediatrics",
    experience_years: 10,
    rating: 4.9,
    conditions_treated: ["asthma", "allergies", "common cold"],
    hospital: {
      name: "Children's Medical Center",
      address: "456 Healthcare Ave"
    }
  },
  {
    id: 3,
    name: "Dr. Michael Chen",
    specialization: "Orthopedics",
    experience_years: 12,
    rating: 4.7,
    conditions_treated: ["back pain", "arthritis", "sports injuries"],
    hospital: {
      name: "Sports Medicine Institute",
      address: "789 Wellness Rd"
    }
  }
];

// Function to try different API URLs when the main one fails
const tryAlternativeApiUrls = async (endpoint) => {
  const baseUrls = [
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api',
    window.location.origin + '/api'
  ];

  for (let baseUrl of baseUrls) {
    try {
      const response = await axiosInstance.get(`${baseUrl}/${endpoint}`);
      if (response.data) {
        // Update the base URL if a working one is found
        localStorage.setItem('api_base_url', baseUrl);
        return response;
      }
    } catch (error) {
      continue;
    }
  }
  throw new Error('All API URLs failed');
};

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
      <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
};

// Main component
const DoctorFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [dbStatus, setDbStatus] = useState('');
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedDoctors, setPaginatedDoctors] = useState([]);

  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [recommendedConditions, setRecommendedConditions] = useState([]);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const navigate = useNavigate();
  
  const location = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      sessionStorage.setItem('redirectUrl', '/find-doctor' + location.search);
      navigate('/login');
      return;
    }
  }, [navigate, location]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        setIsLoggedIn(true);
        fetchUserData(token);
        fetchUserRecentSearches(token);
        fetchUserSavedDoctors(token);
        fetchRecommendedConditions(token);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, [location]);
  
  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get(`/user-profile/`);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const fetchUserRecentSearches = async () => {
    try {
      const response = await axiosInstance.get(`/user-searches/`);
      setRecentSearches(response.data.searches || []);
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      setRecentSearches(['Asthma', 'Diabetes', 'Heart Disease']);
    }
  };
  
  const fetchUserSavedDoctors = async () => {
    try {
      const response = await axiosInstance.get(`/saved-doctors/`);
      setSavedDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching saved doctors:', error);
      setSavedDoctors([]);
    }
  };
  
  const fetchRecommendedConditions = async () => {
    try {
      const response = await axiosInstance.get(`/recommended-conditions/`);
      setRecommendedConditions(response.data.conditions || []);
    } catch (error) {
      console.error('Error fetching recommended conditions:', error);
      setRecommendedConditions(['Asthma', 'Diabetes', 'Heart Disease']);
    }
  };
  
  const saveSearchToHistory = async (query) => {
    if (!isLoggedIn || !query.trim()) return;
    
    try {
      await axiosInstance.post(`/save-search/`, {
        query: query
      });
      
      setRecentSearches(prev => {
        const newSearches = [query, ...prev.filter(s => s !== query)].slice(0, 5);
        return newSearches;
      });
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };
  
  const saveDoctor = async (doctorId) => {
    if (!isLoggedIn) {
      alert('Please log in to save doctors to your favorites');
      return;
    }
    
    try {
      await axiosInstance.post(`/save-doctor/`, {
        doctor_id: doctorId
      });
      
      setSavedDoctors(prev => [...prev, doctors.find(d => d.id === doctorId)]);
      alert('Doctor saved to your favorites');
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Error saving doctor to favorites');
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryFromURL = queryParams.get('query');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
        },
        (error) => {
          setUserLatitude(null);
          setUserLongitude(null);
        }
      );
    } else {
      setUserLatitude(null);
      setUserLongitude(null);
    }
    
    loadAllDoctors();
    
    if (queryFromURL) {
      setSearchQuery(queryFromURL);
      performSearch(queryFromURL);
    }
  }, [location.search]);

  const loadAllDoctors = async () => {
    setDbStatus('Attempting to connect to database...');
    try {
      setUsingDummyData(false);
      
      let response;
      try {
        response = await axiosInstance.get(`/list-all-doctors/?limit=100`);
      } catch (initialError) {
        response = await tryAlternativeApiUrls('list-all-doctors/?limit=100');
      }
      
      if (response.data && response.data.doctors) {
        const normalizedDoctors = response.data.doctors.map(doctor => {
          let conditions = [];
          if (doctor.conditions_treated) {
            conditions = Array.isArray(doctor.conditions_treated) ? doctor.conditions_treated : 
              (typeof doctor.conditions_treated === 'string' ? [doctor.conditions_treated] : []);
          }
          
          return {
            ...doctor,
            conditions_treated: conditions
          };
        });
        
        setAllDoctors(normalizedDoctors);
        if (normalizedDoctors.length === 0) {
          setDbStatus('The database contains no doctors. Please contact the administrator.');
        } else {
          setDbStatus(`Database connected: ${normalizedDoctors.length} doctors available`);
        }
      }
    } catch (err) {
      console.error('Error loading all doctors:', err);
      
      let connectionErrorMsg = 'Database connection failed.';
      
      if (err.message && err.message.includes('Network Error')) {
        connectionErrorMsg = 'Network error: Unable to connect to the database server. Please check if the backend server is running.';
        setAllDoctors(DUMMY_DOCTORS);
        setUsingDummyData(true);
      } else if (err.response) {
        const status = err.response.status;
        if (status === 500) {
          connectionErrorMsg = 'Database server error (500). Please try again later.';
        } else if (status === 404) {
          connectionErrorMsg = 'Database API endpoint not found (404). Please check configuration.';
        } else {
          connectionErrorMsg = `Database error: ${status} - ${err.response.statusText}`;
        }
        setAllDoctors([]);
      } else if (err.request) {
        connectionErrorMsg = 'No response received from database server. Server may be down.';
        setAllDoctors(DUMMY_DOCTORS);
        setUsingDummyData(true);
      } else {
        connectionErrorMsg = 'An unexpected error occurred.';
        setAllDoctors([]);
      }
      
      setDbStatus(connectionErrorMsg);
    }
  };

  useEffect(() => {
    if (searchQuery && searchQuery.length > 1) {
      const query = searchQuery.toLowerCase();
      const filteredConditions = COMMON_CONDITIONS.filter(c => 
        c.toLowerCase().includes(query)
      );
      const filteredSpecialties = COMMON_SPECIALTIES.filter(s => 
        s.toLowerCase().includes(query)
      );
      
      setSuggestions([...filteredConditions, ...filteredSpecialties]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const memoizedFetchDoctors = useMemo(() => {
    return _.debounce(async (searchTerm) => {
      if (!searchTerm?.trim()) return;
      setLoading(true);
      setError('');
      setDbStatus('Searching for doctors...');
    
      try {
        let apiUrl = `/recommend-doctors/?query=${encodeURIComponent(searchTerm.toLowerCase())}&page=${currentPage}&limit=10`;
        
        if (userLatitude !== null && userLongitude !== null) {
          apiUrl = `/recommend-nearest-doctors/?query=${encodeURIComponent(searchTerm.toLowerCase())}&page=${currentPage}&limit=10&user_latitude=${userLatitude}&user_longitude=${userLongitude}`;
        }

        const response = await axiosInstance.get(apiUrl);
        
        if (response.data && response.data.recommended_doctors) {
          const doctors = response.data.recommended_doctors.map(doctor => {
            const conditions = doctor.conditions_treated 
              ? (Array.isArray(doctor.conditions_treated) 
                  ? doctor.conditions_treated 
                  : doctor.conditions_treated.split(',').map(c => c.trim()))
              : [];

            const treats_searched_condition = 
              doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              conditions.some(condition => 
                condition.toLowerCase().includes(searchTerm.toLowerCase())
              );

            return {
              ...doctor,
              conditions_treated: conditions,
              treats_searched_condition
            };
          });

          setDoctors(doctors);
          setTotalPages(Math.ceil(doctors.length / doctorsPerPage));
          setUsingDummyData(false);
          
          if (doctors.length > 0) {
            setDbStatus(`Found ${doctors.length} doctors treating "${searchTerm}"`);
            setError('');
          } else {
            setError(`No doctors found treating "${searchTerm}"`);
          }
        } else {
          setDoctors([]);
          setTotalPages(1);
          setError(`No doctors found treating "${searchTerm}"`);
        }
      } catch (error) {
        handleSearchError(error, searchTerm);
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, [currentPage, doctorsPerPage, userLatitude, userLongitude]);

  useEffect(() => {
    return () => {
      if (memoizedFetchDoctors.cancel) {
        memoizedFetchDoctors.cancel();
      }
    };
  }, [memoizedFetchDoctors]);

  const performSearch = (searchTerm) => {
    memoizedFetchDoctors(searchTerm);
  };

  const handleSearchError = (error, searchTerm) => {
    console.error("Error searching doctors:", error);
    setError(`An error occurred while searching for doctors. Please try again later.`);
    setDoctors([]);
    setTotalPages(1);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 500) {
        setDbStatus('Database server error (500). Please try again later.');
      } else if (status === 404) {
        setDbStatus('Database API endpoint not found (404). Please check configuration.');
      } else {
        setDbStatus(`Database error: ${status} - ${error.response.statusText}`);
      }
      return;
    } else if (error.request) {
      setDbStatus('No response received from database server. Server may be down.');
      setDoctors(DUMMY_DOCTORS.filter(doc => 
        doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.conditions_treated.some(condition => 
          condition.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ));
      setUsingDummyData(true);
    } else {
      setDbStatus('An unexpected error occurred.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const url = new URL(window.location);
    url.searchParams.set('query', searchQuery);
    window.history.replaceState({}, '', url);
    
    performSearch(searchQuery);
    setSearchPerformed(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    const url = new URL(window.location);
    url.searchParams.set('query', suggestion);
    window.history.replaceState({}, '', url);
    
    performSearch(suggestion);
    setSearchPerformed(true);
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 1) {
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleAllDoctors = () => {
    setShowAllDoctors(!showAllDoctors);
    if (!showAllDoctors && allDoctors.length === 0) {
      loadAllDoctors();
    }
  };

  useEffect(() => {
    const indexOfLastDoctor = currentPage * doctorsPerPage;
    const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
    setPaginatedDoctors(doctors.slice(indexOfFirstDoctor, indexOfLastDoctor));
    setTotalPages(Math.ceil(doctors.length / doctorsPerPage));
  }, [doctors, currentPage, doctorsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchAvailability = async (doctorId) => {
    setLoadingAvailability(true);
    try {
      const response = await axiosInstance.get(`/check-availability/${doctorId}/`);
      setAvailabilityData(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to fetch doctor availability');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBookAppointment = async (doctor) => {
    if (!localStorage.getItem('auth_token')) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    setSelectedDoctor(doctor);
    fetchAvailability(doctor.id);
    setShowBookingModal(true);
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      toast.error('Please select an appointment date and time');
      alert('Please select an appointment date and time');
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
        alert('🎉 Appointment Booked Successfully!\n\nDoctor: ' + selectedDoctor.name + '\nDate: ' + new Date(bookingDate).toLocaleString() + (bookingReason ? '\nReason: ' + bookingReason : ''));
        
        toast.success('🎉 Appointment Booked Successfully!', {
          duration: 5000,
          icon: '✅'
        });
        
        toast.success(
          `Appointment Details:\n
          🏥 Doctor: ${selectedDoctor.name}\n
          📅 Date: ${new Date(bookingDate).toLocaleString()}\n
          ${bookingReason ? `📝 Reason: ${bookingReason}` : ''}`,
          {
            duration: 8000,
            style: {
              padding: '16px',
            },
          }
        );
        
        setShowBookingModal(false);
        setSelectedDoctor(null);
        setBookingDate('');
        setBookingReason('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Unable to book appointment. Please try again.';
      alert('❌ Error: ' + errorMessage);
      
      toast.error(`❌ ${errorMessage}`, {
        duration: 4000,
        style: {
          backgroundColor: '#FEE2E2',
          color: '#DC2626'
        }
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {usingDummyData && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Database Connection Error</h3>
                <div className="mt-1 text-sm text-amber-700">
                  <p>Unable to connect to the database. The system is currently using sample data for demonstration purposes.</p>
                  <div className="mt-3">
                    <p className="text-xs text-amber-600">Possible solutions:</p>
                    <ul className="mt-1 text-xs list-disc pl-5 text-amber-600">
                      <li>Ensure the Django backend server is running</li>
                      <li>Check if MongoDB is running and properly configured</li>
                      <li>Verify network connectivity to the database server</li>
                      <li>Try a simpler search query (the current query might be too complex)</li>
                    </ul>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setDbStatus('Attempting to reconnect to database...');
                        loadAllDoctors();
                        if (searchPerformed && searchQuery) {
                          performSearch(searchQuery);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs rounded-md transition-colors flex items-center gap-1"
                    >
                      <FaDatabase className="mr-1" /> Retry Connection
                    </button>
                    {dbStatus && dbStatus.includes('error') && (
                      <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200">
                        {dbStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Find Your Medical Specialist</h1>
          <p className="text-lg text-gray-600">Search by disease, condition, or specialist type</p>
          {dbStatus && (
            <div className={`mt-2 inline-flex items-center justify-center text-sm px-2.5 py-0.5 rounded-full ${
              dbStatus.includes('error') || dbStatus.includes('failed') 
                ? 'bg-red-100 text-red-700'
                : dbStatus.includes('Attempting') 
                  ? 'bg-blue-100 text-blue-700'
                  : dbStatus.includes('connected')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
            }`}>
              {dbStatus.includes('error') || dbStatus.includes('failed') ? (
                <FaExclamationTriangle className="mr-1 h-3 w-3" />
              ) : dbStatus.includes('Attempting') ? (
                <div className="mr-1 h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : dbStatus.includes('connected') ? (
                <FaInfoCircle className="mr-1 h-3 w-3" />
              ) : (
                <FaInfoCircle className="mr-1 h-3 w-3" />
              )}
              {dbStatus}
            </div>
          )}
          {usingDummyData && !dbStatus.includes('failed') && (
            <div className="mt-1 flex items-center justify-center text-sm text-amber-500">
              <FaExclamationTriangle className="mr-1" /> Using demo data for display purposes. Database connection failed.
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/userhome"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <FaArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transition-all duration-300 hover:shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center bg-blue-50 rounded-l-lg">
                <FaSearch className="text-blue-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter a disease, condition, or specialist name..."
                className="w-full pl-16 pr-4 py-4 rounded-lg border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto transition-all duration-300">
                  <div className="p-2 bg-gray-50 text-gray-500 text-xs font-medium">
                    Suggested conditions and specialties
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 last:border-0 transition-colors duration-200"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {COMMON_CONDITIONS.includes(suggestion) ? (
                        <div className="bg-green-100 p-1.5 rounded-full">
                          <MdLocalHospital className="text-green-600" />
                        </div>
                      ) : (
                        <div className="bg-blue-100 p-1.5 rounded-full">
                          <FaStethoscope className="text-blue-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{suggestion}</div>
                        <div className="text-xs text-gray-500">
                          {COMMON_CONDITIONS.includes(suggestion) 
                            ? "Medical Condition" 
                            : "Medical Specialty"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-w-[180px]"
            >
              <FaSearch />
              Find Specialists
            </button>
          </form>
          
          <div className="mt-6">
            <div className="text-gray-700 text-sm font-medium mb-2">Common health conditions:</div>
            <div className="flex flex-wrap gap-2">
              {COMMON_CONDITIONS.slice(0, 8).map((condition, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(condition);
                    const url = new URL(window.location);
                    url.searchParams.set('query', condition);
                    window.history.replaceState({}, '', url);
                    performSearch(condition);
                    setSearchPerformed(true);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1"
                >
                  <MdLocalHospital size={14} className="text-blue-600" />
                  {condition}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={toggleAllDoctors}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors"
            >
              <FaDatabase size={14} />
              {showAllDoctors ? 'Hide All Doctors' : 'View All Available Doctors'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('Database') && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setDbStatus('Attempting to reconnect to database...');
                            loadAllDoctors();
                            if (searchQuery) {
                              performSearch(searchQuery);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Retry Connection
                        </button>
                        <button
                          onClick={() => setError(null)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showAllDoctors && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Doctors in Database ({allDoctors.length})</h2>
            {allDoctors.length === 0 ? (
              <p className="text-gray-500">No doctors found in the database</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Specialization</th>
                      <th className="px-4 py-2 text-left">Experience</th>
                      <th className="px-4 py-2 text-left">Rating</th>
                      <th className="px-4 py-2 text-left">Conditions Treated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDoctors.map((doctor, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2">{doctor.name}</td>
                        <td className="px-4 py-2">{doctor.specialization}</td>
                        <td className="px-4 py-2">{doctor.experience} years</td>
                        <td className="px-4 py-2">{doctor.rating}/5</td>
                        <td className="px-4 py-2">
                          {doctor.conditions_treated && (Array.isArray(doctor.conditions_treated) ? doctor.conditions_treated.length > 0 : false) ? (
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(doctor.conditions_treated) && doctor.conditions_treated.map((condition, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">None specified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {searchPerformed && doctors.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Found {doctors.length} specialists
                </h2>
                {usingDummyData && (
                  <p className="text-amber-500 text-sm mt-1">
                    <FaExclamationTriangle className="inline mr-1" /> 
                    Note: Showing demo data for display purposes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Searching for specialists...</p>
          </div>
        ) : (
          <>
            {searchPerformed && (
              <div className="mb-4">
                {doctors.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Found {doctors.length} specialists for "{searchQuery}"
                    </h2>
                    {usingDummyData && (
                      <p className="text-amber-500 text-sm mt-1">
                        <FaExclamationTriangle className="inline mr-1" /> 
                        Note: Showing demo data for display purposes. Database connection failed.
                      </p>
                    )}
                  </div>
                ) : !error ? (
                  <div className="text-center py-8">
                    <MdLocalHospital className="text-5xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700">No specialists found</h3>
                    <p className="text-gray-500 mt-2">Try a different search term or condition</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaExclamationTriangle className="text-5xl text-amber-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700">No specialists found</h3>
                    <p className="text-gray-700 mt-2">{error}</p>
                    <p className="text-gray-500 mt-1">You may try searching for a different condition or specialty.</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {COMMON_CONDITIONS.slice(0, 6).map((condition, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(condition);
                            const url = new URL(window.location);
                            url.searchParams.set('query', condition);
                            window.history.replaceState({}, '', url);
                            performSearch(condition);
                            setSearchPerformed(true);
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm transition-colors"
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDoctors.map((doctor) => (
                <div key={doctor.id} className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${doctor.treats_searched_condition ? 'border-l-4 border-green-500' : ''}`}>
                  <div className="bg-blue-600 text-white p-4">
                    <div className="flex items-start gap-2">
                      <FaUser className="mt-1" />
                      <div>
                        <h3 className="text-xl font-bold">{doctor.name}</h3>
                        <p className="text-lg">{doctor.specialization}</p>
                        {doctor.hospital && typeof doctor.hospital === 'object' ? (
                          <div className="mt-2">
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
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-2 rounded-md">
                          <FaBriefcase className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Experience</p>
                          <p className="font-medium text-gray-900">{doctor.experience_years} years</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-50 p-2 rounded-md">
                          <FaStar className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <div className="flex items-center gap-1">
                            <StarRating rating={doctor.rating} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-green-50 p-2 rounded-md">
                          <FaUser className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Patients Treated</p>
                          <p className="font-medium text-gray-900">{doctor.patients_treated || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-50 p-2 rounded-md">
                          <FaClock className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Availability</p>
                          <p className="font-medium text-gray-900">
                          {doctor.availability || (doctor.available ? 'Available' : 'Unavailable')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-teal-50 p-2 rounded-md">
                          <FaMoneyBillWave className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Consultation Fee</p>
                          <p className="font-medium text-gray-900">₹{doctor.consultation_fee_inr > 0 ? doctor.consultation_fee_inr : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBookAppointment(doctor)}
                      className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPhoneAlt />
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {doctors.length > 0 && (
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
          </>
        )}
      </div>

      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Book Appointment with {selectedDoctor.name}</h2>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Availability Information</h3>
              {loadingAvailability ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-600">Loading availability...</span>
                </div>
              ) : availabilityData ? (
                <div>
                  <p className="text-sm text-blue-600 mb-2">
                    <FaClock className="inline mr-2" />
                    General Hours: {availabilityData.general_availability}
                  </p>
                  {availabilityData.booked_slots.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Already booked time slots:</p>
                      <div className="space-y-1">
                        {availabilityData.booked_slots.map((slot, index) => (
                          <p key={index} className="text-xs text-red-600">
                            • {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Each consultation is {availabilityData.consultation_duration} minutes
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unable to fetch availability information</p>
              )}
            </div>

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
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedDoctor(null);
                      setBookingDate('');
                      setBookingReason('');
                    }}
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
    </div>
  );
};

export default DoctorFinder;