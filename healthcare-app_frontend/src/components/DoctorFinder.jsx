import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaStar, FaBriefcase, FaClock, FaMoneyBillWave, FaPhoneAlt, FaExclamationTriangle, FaStethoscope, FaDatabase, FaInfoCircle, FaHistory, FaBookmark, FaRegStar, FaStarHalfAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { MdLocalHospital, MdAccountCircle } from 'react-icons/md';
import { toast } from 'react-toastify';
import _ from 'lodash';

// Set the base API URL with fallback options
const getApiBaseUrl = () => {
  // Try different possible backend URLs in order of preference
  const possibleUrls = [
    'http://localhost:8000/api',  // Default development URL
    'http://127.0.0.1:8000/api',  // Alternative localhost URL
    window.location.origin + '/api' // Same-origin API for production
  ];
  // Get stored URL from localStorage if available
  const storedUrl = localStorage.getItem('api_base_url');
  if (storedUrl) {
    return storedUrl;
  }
  return possibleUrls[0]; // Default to first option
};

const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('Axios request interceptor - token:', token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers['Authorization']);
    } else {
      console.log('No auth token found, Authorization header not set');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
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

    // Handle 401 Unauthorized globally
    if (response && response.status === 401) {
      console.warn('Received 401 Unauthorized response. Clearing auth token and redirecting to login.');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login'; // Redirect to login page
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Helper function to try alternative API URLs if the main one fails
const tryAlternativeApiUrls = async (endpoint, retryCount = 0) => {
  const possibleUrls = [
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api',
    window.location.origin + '/api'
  ];
  
  // Don't retry more than available URLs
  if (retryCount >= possibleUrls.length) {
    throw new Error('All API URL options failed');
  }
  
  try {
    const response = await axiosInstance.get(`${possibleUrls[retryCount]}/${endpoint}`);
    
    // If successful, save this working URL for future use
    localStorage.setItem('api_base_url', possibleUrls[retryCount]);
    console.log(`Connection established with: ${possibleUrls[retryCount]}`);
    
    return response;
  } catch (error) {
    console.error(`Failed to connect to ${possibleUrls[retryCount]}: ${error.message}`);
    // Try the next URL
    return tryAlternativeApiUrls(endpoint, retryCount + 1);
  }
};

// Common conditions for suggestions
const COMMON_CONDITIONS = [
  "Asthma", "Diabetes", "Heart Disease", "Hypertension", 
  "Arthritis", "Depression", "Anxiety", "Cancer", 
  "Allergies", "COPD", "Bronchitis", "Skin Conditions"
];

// Common specialties for suggestions
const COMMON_SPECIALTIES = [
  "Cardiology", "Dermatology", "Neurology", "Pulmonology",
  "Pediatrics", "Orthopedics", "Gynecology", "Urology",
  "Psychiatry", "Oncology", "Gastroenterology"
];

// Fallback dummy doctors data for when API fails
const DUMMY_DOCTORS = [
  {
    id: 1,
    name: "Dr. Amit Patel",
    specialization: "Pulmonology",
    experience: 15,
    mobile_number: "9876543210",
    availability: "9 AM - 5 PM",
    fee: 1200,
    patients_treated: 2000,
    rating: 4.8,
    conditions_treated: ["Asthma", "COPD", "Bronchitis", "Pneumonia"]
  },
  {
    id: 2,
    name: "Dr. Sarah Miller",
    specialization: "Respiratory Medicine",
    experience: 10,
    mobile_number: "9876543211",
    availability: "10 AM - 6 PM",
    fee: 1000,
    patients_treated: 1500,
    rating: 4.6,
    conditions_treated: ["Asthma", "Tuberculosis", "Lung Cancer"]
  },
  {
    id: 3,
    name: "Dr. John Williams",
    specialization: "Dermatologist",
    experience: 9,
    mobile_number: "9876543214",
    availability: "10 AM - 6 PM",
    fee: 900,
    patients_treated: 1200,
    rating: 4.5,
    conditions_treated: ["Acne", "Eczema", "Psoriasis", "Skin Cancer"]
  }
];

// Star rating component for visual display
const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
  }
  
  // Add empty stars
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

  // New state for user location
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  
  // User-related state
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
  const navigate = useNavigate();
  
  const location = useLocation();
  
  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Save the current URL for redirect after login
      sessionStorage.setItem('redirectUrl', '/find-doctor' + location.search);
      navigate('/login');
      return;
    }
  }, [navigate, location]);

  // Check user login status on component mount and on location change for debugging
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      console.log('Checking login status on DoctorFinder page load. Token:', token);
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
  
  // Fetch user data
  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get(`/user-profile/`);
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  // Fetch user's recent searches
  const fetchUserRecentSearches = async () => {
    try {
      const response = await axiosInstance.get(`/user-searches/`);
      setRecentSearches(response.data.searches || []);
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      // Set some sample recent searches for demonstration
      setRecentSearches(['Asthma', 'Diabetes', 'Heart Disease']);
    }
  };
  
  // Fetch user's saved doctors
  const fetchUserSavedDoctors = async () => {
    try {
      const response = await axiosInstance.get(`/saved-doctors/`);
      setSavedDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching saved doctors:', error);
      // Set some sample saved doctors for demonstration
      setSavedDoctors([]);
    }
  };
  
  // Fetch recommended conditions based on user profile
  const fetchRecommendedConditions = async () => {
    try {
      const response = await axiosInstance.get(`/recommended-conditions/`);
      setRecommendedConditions(response.data.conditions || []);
    } catch (error) {
      console.error('Error fetching recommended conditions:', error);
      // Set some sample recommended conditions based on common health issues
      setRecommendedConditions(['Asthma', 'Diabetes', 'Heart Disease']);
    }
  };
  
  // Save search to user history
  const saveSearchToHistory = async (query) => {
    if (!isLoggedIn || !query.trim()) return;
    
    try {
      await axiosInstance.post(`/save-search/`, {
        query: query
      });
      
      // Update recent searches list
      setRecentSearches(prev => {
        const newSearches = [query, ...prev.filter(s => s !== query)].slice(0, 5);
        return newSearches;
      });
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };
  
  // Save doctor to user's favorites
  const saveDoctor = async (doctorId) => {
    if (!isLoggedIn) {
      alert('Please log in to save doctors to your favorites');
      return;
    }
    
    try {
      await axiosInstance.post(`/save-doctor/`, {
        doctor_id: doctorId
      });
      
      // Update saved doctors UI
      setSavedDoctors(prev => [...prev, doctors.find(d => d.id === doctorId)]);
      alert('Doctor saved to your favorites');
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Error saving doctor to favorites');
    }
  };

  // Get query parameter from URL when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryFromURL = queryParams.get('query');

    // Request user location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation permission denied or unavailable:', error.message);
          setUserLatitude(null);
          setUserLongitude(null);
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setUserLatitude(null);
      setUserLongitude(null);
    }
    
    // Load all doctors to check if database has data
    loadAllDoctors();
    
    if (queryFromURL) {
      setSearchQuery(queryFromURL);
      performSearch(queryFromURL);
    }
  }, [location.search]);

  // Load all doctors from the database to check if any data exists
  const loadAllDoctors = async () => {
    setDbStatus('Attempting to connect to database...');
    try {
      setUsingDummyData(false);
      
      let response;
      try {
        // First try the main API URL
        response = await axiosInstance.get(`/list-all-doctors/?limit=100`);
      } catch (initialError) {
        console.log("Initial API URL failed, trying alternatives");
        // If that fails, try alternative URLs
        response = await tryAlternativeApiUrls('list-all-doctors/?limit=100');
      }
      
      if (response.data && response.data.doctors) {
        // Normalize conditions_treated in all doctors
        const normalizedDoctors = response.data.doctors.map(doctor => {
          // Ensure conditions_treated is always an array
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
      
      // Provide more detailed error messages based on the error type
      if (err.message && err.message.includes('Network Error')) {
        connectionErrorMsg = 'Network error: Unable to connect to the database server. Please check if the backend server is running.';
      } else if (err.response) {
        const status = err.response.status;
        if (status === 500) {
          connectionErrorMsg = 'Database server error (500). Please try again later.';
        } else if (status === 404) {
          connectionErrorMsg = 'Database API endpoint not found (404). Please check configuration.';
        } else {
          connectionErrorMsg = `Database error: ${status} - ${err.response.statusText}`;
        }
      } else if (err.request) {
        connectionErrorMsg = 'No response received from database server. Server may be down.';
      }
      
      setDbStatus(connectionErrorMsg);
      setAllDoctors(DUMMY_DOCTORS);
      setUsingDummyData(true);
    }
  };

  // Filter suggestions based on input
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
          apiUrl += `&user_latitude=${userLatitude}&user_longitude=${userLongitude}`;
        }

        const response = await axiosInstance.get(apiUrl);
        
        if (response.data && response.data.recommended_doctors) {
          const doctors = response.data.recommended_doctors.map(doctor => {
            // Normalize conditions_treated to always be an array
            const conditions = doctor.conditions_treated 
              ? (Array.isArray(doctor.conditions_treated) 
                  ? doctor.conditions_treated 
                  : doctor.conditions_treated.split(',').map(c => c.trim()))
              : [];

            // Check if doctor treats the searched condition
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

  // Clean up function
  useEffect(() => {
    return () => {
      if (memoizedFetchDoctors.cancel) {
        memoizedFetchDoctors.cancel();
      }
    };
  }, [memoizedFetchDoctors]);

  // Update performSearch to use memoized function
  const performSearch = (searchTerm) => {
    memoizedFetchDoctors(searchTerm);
  };

  const handleSearchError = (error, searchTerm) => {
    console.error("Error searching doctors:", error);
    setError(`An error occurred while searching for doctors. Please try again later.`);
    setDoctors([]);
    setTotalPages(1);
    
    // Set appropriate error message based on error type
    if (error.response) {
      const status = error.response.status;
      if (status === 500) {
        setDbStatus('Database server error (500). Please try again later.');
      } else if (status === 404) {
        setDbStatus('Database API endpoint not found (404). Please check configuration.');
      } else {
        setDbStatus(`Database error: ${status} - ${error.response.statusText}`);
      }
    } else if (error.request) {
      setDbStatus('No response received from database server. Server may be down.');
    } else {
      setDbStatus('An unexpected error occurred.');
    }

    // Set to dummy data if database error
    setDoctors(DUMMY_DOCTORS.filter(doc => 
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.conditions_treated.some(condition => 
        condition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ));
    setUsingDummyData(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Remove navigation - just perform the search directly
    // Update URL without page navigation using history.replaceState
    const url = new URL(window.location);
    url.searchParams.set('query', searchQuery);
    window.history.replaceState({}, '', url);
    
    performSearch(searchQuery);
    setSearchPerformed(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Remove navigation - just perform the search directly
    // Update URL without page navigation
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

  // Close suggestions when clicking outside
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

  // Calculate paginated doctors whenever doctors array or page changes
  useEffect(() => {
    const indexOfLastDoctor = currentPage * doctorsPerPage;
    const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
    setPaginatedDoctors(doctors.slice(indexOfFirstDoctor, indexOfLastDoctor));
    // Update total pages based on doctors length
    setTotalPages(Math.ceil(doctors.length / doctorsPerPage));
  }, [doctors, currentPage, doctorsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookAppointment = async (doctor) => {
    if (!localStorage.getItem('auth_token')) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
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
        // First success message
        toast.success('Great! Your appointment has been successfully booked. A confirmation email will be sent shortly.');
        
        // Show a second toast with appointment details
        toast.success(`Appointment Details:
        Doctor: ${selectedDoctor.name}
        Date: ${new Date(bookingDate).toLocaleString()}
        ${bookingReason ? `Reason: ${bookingReason}` : ''}`);
        
        setShowBookingModal(false);
        setSelectedDoctor(null);
        setBookingDate('');
        setBookingReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
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

        {/* User welcome section (only if logged in) */}
        {isLoggedIn && userData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MdAccountCircle className="text-blue-600 text-2xl" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold">Welcome, {userData.first_name || 'User'}</h2>
                  <p className="text-gray-600">Find the right specialist for your healthcare needs</p>
                </div>
              </div>
            </div>
            
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaHistory className="mr-2 text-gray-500" /> Your Recent Searches:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(search);
                        // Remove navigation, just update URL and perform search
                        const url = new URL(window.location);
                        url.searchParams.set('query', search);
                        window.history.replaceState({}, '', url);
                        performSearch(search);
                        setSearchPerformed(true);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommended conditions based on user profile */}
            {recommendedConditions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" /> Recommended for you:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendedConditions.map((condition, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(condition);
                        // Remove navigation, just update URL and perform search
                        const url = new URL(window.location);
                        url.searchParams.set('query', condition);
                        window.history.replaceState({}, '', url);
                        performSearch(condition);
                        setSearchPerformed(true);
                      }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm transition-colors flex items-center"
                    >
                      <MdLocalHospital className="mr-1 text-blue-600" size={14} />
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
              
              {/* Suggestions dropdown with enhanced UI */}
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
                    // Remove navigation, just update URL and perform search
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
          
          {/* Improved error message display */}
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

        {/* Show all doctors section */}
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

        {/* Search results header */}
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
                            // Remove navigation, just update URL and perform search
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
                        {doctor.hospital && (
                          <div>
                            <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                              <MdLocalHospital className="text-blue-200" size={14} />
                              {doctor.hospital.name}
                            </p>
                            <p className="text-sm text-blue-100 mt-1 flex items-center gap-1">
                              <FaMapMarkerAlt className="text-blue-200" size={14} />
                              {doctor.hospital.address}
                            </p>
                          </div>
                        )}
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
                          <p className="font-medium text-gray-900">{doctor.experience_years} years</p>
                        </div>
                      </div>
                      
                      {/* Rating */}
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
                      
                      {/* Patients Treated */}
                      <div className="flex items-center gap-2">
                        <div className="bg-green-50 p-2 rounded-md">
                          <FaUser className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Patients Treated</p>
                          <p className="font-medium text-gray-900">{doctor.patients_treated || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-50 p-2 rounded-md">
                          <FaClock className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Availability</p>
                          <p className="font-medium text-gray-900">{doctor.availability}</p>
                        </div>
                      </div>
                    </div>

                    {/* Fee and Location in a separate row */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {/* Consultation Fee */}
                      <div className="flex items-center gap-2">
                        <div className="bg-teal-50 p-2 rounded-md">
                          <FaMoneyBillWave className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Consultation Fee</p>
                          <p className="font-medium text-gray-900">₹{doctor.consultation_fee_inr}</p>
                        </div>
                      </div>

                      {/* Location */}
                      {doctor.hospital && doctor.hospital.address && (
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-50 p-2 rounded-md">
                            <MdLocalHospital className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{doctor.hospital.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Appointment button */}
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

            {/* Add pagination controls */}
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

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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