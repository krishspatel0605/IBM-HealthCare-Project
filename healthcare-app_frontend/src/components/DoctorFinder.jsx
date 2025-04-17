import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaStar, FaBriefcase, FaClock, FaMoneyBillWave, FaPhoneAlt, FaExclamationTriangle, FaStethoscope, FaDatabase, FaInfoCircle, FaHistory, FaBookmark, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { MdLocalHospital, MdAccountCircle } from 'react-icons/md';

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
    const response = await axios.get(`${possibleUrls[retryCount]}/${endpoint}`);
    
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
  const [sortOption, setSortOption] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
<<<<<<< HEAD

  // New state for user location
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
  
  // User-related state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [recommendedConditions, setRecommendedConditions] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check user login status on component mount
  useEffect(() => {
    // Check if user is logged in by looking for auth token in localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
      fetchUserRecentSearches(token);
      fetchUserSavedDoctors(token);
      fetchRecommendedConditions(token);
    }
  }, []);
  
  // Fetch user data
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  // Fetch user's recent searches
  const fetchUserRecentSearches = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-searches/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecentSearches(response.data.searches || []);
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      // Set some sample recent searches for demonstration
      setRecentSearches(['Asthma', 'Diabetes', 'Heart Disease']);
    }
  };
  
  // Fetch user's saved doctors
  const fetchUserSavedDoctors = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/saved-doctors/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSavedDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching saved doctors:', error);
      // Set some sample saved doctors for demonstration
      setSavedDoctors([]);
    }
  };
  
  // Fetch recommended conditions based on user profile
  const fetchRecommendedConditions = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recommended-conditions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      await axios.post(`${API_BASE_URL}/save-search/`, {
        query: query
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
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
    
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      await axios.post(`${API_BASE_URL}/save-doctor/`, {
        doctor_id: doctorId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
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
<<<<<<< HEAD

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
=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    
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
        response = await axios.get(`${API_BASE_URL}/list-all-doctors/?limit=100`);
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
<<<<<<< HEAD
    if (searchQuery && searchQuery.length > 1) {
=======
    if (searchQuery.length > 1) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
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

  // Sort doctors based on the selected option
  const sortDoctors = (doctorsList, option) => {
    const sortedList = [...doctorsList];
    
    switch(option) {
      case "exp-high-low":
        return sortedList.sort((a, b) => b.experience - a.experience);
      case "exp-low-high":
        return sortedList.sort((a, b) => a.experience - b.experience);
      case "rating-high-low":
        return sortedList.sort((a, b) => {
          // Some doctors might not have ratings
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
      case "rating-low-high":
        return sortedList.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingA - ratingB;
        });
      case "fee-low-high":
        return sortedList.sort((a, b) => {
          const feeA = a.fee || 0;
          const feeB = b.fee || 0;
          return feeA - feeB;
        });
      case "fee-high-low":
        return sortedList.sort((a, b) => {
          const feeA = a.fee || 0;
          const feeB = b.fee || 0;
          return feeB - feeA;
        });
      case "default":
      default:
        return sortedList.sort((a, b) => {
          // Prioritize doctors who treat the condition first
          if (a.treats_searched_condition && !b.treats_searched_condition) return -1;
          if (!a.treats_searched_condition && b.treats_searched_condition) return 1;
          
          // Then by similarity score if available
          const scoreA = a.similarity_score || 0;
          const scoreB = b.similarity_score || 0;
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          // Finally by experience as a tiebreaker
          return b.experience - a.experience;
        });
    }
  };

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
    setDoctors(sortDoctors(doctors, option));
    setShowSortMenu(false);
  };

  const performSearch = async (searchQuery) => {
    // Prevent searching with empty query
    if (!searchQuery || searchQuery.trim() === '') {
      setError('Please enter a condition, disease, or doctor name to search');
      return;
    }

    // Clear previous results and set loading state
    setDoctors([]);
    setLoading(true);
    setError('');
    setDbStatus('Searching for doctors...');
    const query = searchQuery.trim();

    let needsFallback = false;

    try {
      // First attempt: Use the main API with complex query
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );
<<<<<<< HEAD

      // Include sort option and user location in the API request if available
      let apiUrl = `${API_BASE_URL}/recommend-doctors/?query=${encodeURIComponent(query)}&sort_by=${sortOption === 'default' ? 'similarity' : sortOption}&limit=100`;
      if (userLatitude !== null && userLongitude !== null) {
        apiUrl += `&user_latitude=${userLatitude}&user_longitude=${userLongitude}`;
      }
      
      const apiPromise = axios.get(apiUrl);
      
      console.log(`Searching for doctors: "${query}" (sorted by: ${sortOption}) with location: ${userLatitude}, ${userLongitude}`);
=======
      
      // Include sort option in the API request
      const apiPromise = axios.get(`${API_BASE_URL}/recommend-doctors/?query=${encodeURIComponent(query)}&sort_by=${sortOption === 'default' ? 'similarity' : sortOption}&limit=100`);
      
      console.log(`Searching for doctors: "${query}" (sorted by: ${sortOption})`);
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
      setDbStatus('Connecting to database...');
      
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log("API Response:", response.data);
      setDbStatus('Connected to database');
      
      if (response.data.recommended_doctors && response.data.recommended_doctors.length > 0) {
        // Apply sorting to the doctors
        const sortedDoctors = sortDoctors(response.data.recommended_doctors, sortOption);
        setDoctors(sortedDoctors);
        setUsingDummyData(false);
        
        // Show what kind of recommendation engine is being used
        if (response.data.using_ml_recommendations) {
          console.log("Using ML recommendations");
        } else {
          console.log("Using simple filtering recommendations");
        }
      } else {
        setError(`No doctors found for "${query}"`);
      }
      
    } catch (error) {
      console.error("Error searching doctors:", error);
      needsFallback = true;
      
      try {
        // Second attempt: Use simpler search
        console.log("Attempting simple search as fallback");
        setDbStatus('Trying simplified search...');
        
        // Try the list-all-doctors API as a fallback
        const response = await performSimpleSearch(query, sortOption);
        
        if (response.recommended_doctors && response.recommended_doctors.length > 0) {
          // Apply sorting to the simplified search results
          const sortedDoctors = sortDoctors(response.recommended_doctors, sortOption);
          setDoctors(sortedDoctors);
          setUsingDummyData(false);
          setDbStatus('Using simplified search results');
        } else {
          needsFallback = true;
        }
        
      } catch (fallbackError) {
        console.error("Error with simplified search:", fallbackError);
        needsFallback = true;
        
        try {
          // Third attempt: Try alternative API URLs
          console.log("Trying alternative API URLs");
          setDbStatus('Trying alternative connections...');
          
          // Try alternative URLs if available
          const alternativeUrls = [
            'http://127.0.0.1:8000/api',
            'http://localhost:8000/api'
          ];
          
          let alternativeSuccess = false;
          
          for (const baseUrl of alternativeUrls) {
            try {
<<<<<<< HEAD
              let altUrl = `${baseUrl}/recommend-doctors/?query=${encodeURIComponent(query)}&sort_by=${sortOption}`;
              if (userLatitude !== null && userLongitude !== null) {
                altUrl += `&user_latitude=${userLatitude}&user_longitude=${userLongitude}`;
              }
              const altResponse = await axios.get(altUrl);
=======
              const altResponse = await axios.get(
                `${baseUrl}/recommend-doctors/?query=${encodeURIComponent(query)}&sort_by=${sortOption}`
              );
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
              
              if (altResponse.data.recommended_doctors && 
                  altResponse.data.recommended_doctors.length > 0) {
                setDoctors(altResponse.data.recommended_doctors);
                setUsingDummyData(false);
                setDbStatus('Connected via alternative route');
                alternativeSuccess = true;
                break;
              }
            } catch (e) {
              console.log(`Alternative URL ${baseUrl} failed:`, e);
            }
          }
          
          if (!alternativeSuccess) {
            needsFallback = true;
          }
          
        } catch (altError) {
          needsFallback = true;
        }
      }
    }
    
    // Use dummy data if all else fails
    if (needsFallback) {
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          setError('Database connection timed out');
          setDbStatus('Database connection timeout');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Network error - Backend server might be down');
          setDbStatus('Network error');
        } else {
          setError(`Error: ${error.message}`);
          setDbStatus('Database error');
        }
      } else {
        setError('Unable to connect to the database');
        setDbStatus('Connection failed');
      }
      
      console.log("Using filtered dummy data as fallback");
      setDbStatus('Using sample data (database unavailable)');
      
      // Filter dummy data based on search query
      const filteredDoctors = DUMMY_DOCTORS.filter(doctor => {
        const searchTermLower = query.toLowerCase();
        
        // Check doctor name
<<<<<<< HEAD
        if (doctor.name && doctor.name.toLowerCase().includes(searchTermLower)) {
=======
        if (doctor.name.toLowerCase().includes(searchTermLower)) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
          return true;
        }
        
        // Check specialization
<<<<<<< HEAD
        if (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTermLower)) {
=======
        if (doctor.specialization.toLowerCase().includes(searchTermLower)) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
          return true;
        }
        
        // Check conditions treated
        if (doctor.conditions_treated && doctor.conditions_treated.some(condition => 
<<<<<<< HEAD
          condition && condition.toLowerCase().includes(searchTermLower)
=======
          condition.toLowerCase().includes(searchTermLower)
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        )) {
          return true;
        }
        
        return false;
      });
      
      // Sort the filtered data based on the selected sort option
      let sortedDoctors = [...filteredDoctors];
      
      if (sortOption === 'rating') {
        sortedDoctors.sort((a, b) => b.rating - a.rating);
      } else if (sortOption === 'experience') {
        sortedDoctors.sort((a, b) => b.experience - a.experience);
      } else if (sortOption === 'fee') {
        sortedDoctors.sort((a, b) => a.fee - b.fee);
      } // Default is similarity (already sorted by matches)
      
      if (filteredDoctors.length > 0) {
        setDoctors(sortedDoctors);
        setUsingDummyData(true);
      } else {
        setError(`No doctors found for "${query}"`);
      }
    }
    
    setLoading(false);
  };

  const performSimpleSearch = async (query, sortBy = 'experience') => {
    try {
      console.log(`Performing simple search for "${query}" sorted by ${sortBy}`);
      
      // Get all doctors
      const response = await axios.get(`${API_BASE_URL}/list-all-doctors/`);
      
      if (!response.data.doctors || response.data.doctors.length === 0) {
        return { recommended_doctors: [], query, results_count: 0 };
      }
      
      // Filter doctors client-side
      const filteredDoctors = response.data.doctors.filter(doctor => {
        const queryLower = query.toLowerCase();
        
        // Check doctor name
<<<<<<< HEAD
        if (doctor.name && doctor.name.toLowerCase().includes(queryLower)) {
=======
        if (doctor.name.toLowerCase().includes(queryLower)) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
          return true;
        }
        
        // Check specialization
<<<<<<< HEAD
        if (doctor.specialization && doctor.specialization.toLowerCase().includes(queryLower)) {
=======
        if (doctor.specialization.toLowerCase().includes(queryLower)) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
          return true;
        }
        
        // Check conditions treated
        const conditions = doctor.conditions_treated || [];
        const conditionsList = Array.isArray(conditions) 
          ? conditions 
          : typeof conditions === 'string' 
            ? conditions.split(',').map(c => c.trim()) 
            : [];
            
        return conditionsList.some(condition => 
<<<<<<< HEAD
          condition && condition.toLowerCase().includes(queryLower)
=======
          condition.toLowerCase().includes(queryLower)
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        );
      });
      
      // Add matched conditions
      const enrichedDoctors = filteredDoctors.map(doctor => {
        const queryLower = query.toLowerCase();
        const conditions = doctor.conditions_treated || [];
        const conditionsList = Array.isArray(conditions) 
          ? conditions 
          : typeof conditions === 'string' 
            ? conditions.split(',').map(c => c.trim()) 
            : [];
            
        // Find conditions that match the search query
        const matchedConditions = conditionsList.filter(condition => 
          condition.toLowerCase().includes(queryLower)
        );
        
        return {
          ...doctor,
          matched_conditions: matchedConditions,
          treats_searched_condition: matchedConditions.length > 0
        };
      });
      
      // Sort based on criteria
      let sortedDoctors = [...enrichedDoctors];
      
      if (sortBy === 'rating') {
        sortedDoctors.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'experience') {
        sortedDoctors.sort((a, b) => b.experience - a.experience);
      } else if (sortBy === 'fee') {
        sortedDoctors.sort((a, b) => a.fee - b.fee);
      } else {
        // Default: Prioritize doctors who treat the condition
        sortedDoctors.sort((a, b) => {
          // First sort by whether they treat the condition
          if (a.treats_searched_condition && !b.treats_searched_condition) return -1;
          if (!a.treats_searched_condition && b.treats_searched_condition) return 1;
          
          // Then by experience
          return b.experience - a.experience;
        });
      }
      
      return {
        recommended_doctors: sortedDoctors,
        query,
        results_count: sortedDoctors.length
      };
      
    } catch (error) {
      console.error("Error in simple search:", error);
      throw error;
    }
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

  // Toggle showing all doctors
  const toggleAllDoctors = () => {
    setShowAllDoctors(!showAllDoctors);
    if (!showAllDoctors && allDoctors.length === 0) {
      loadAllDoctors();
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

        {/* Search results header with filters */}
        {searchPerformed && doctors.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
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
              
              <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                {/* Sorting dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center justify-between w-56 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <span>
                      {sortOption === "default" && "Sort By: Default"}
                      {sortOption === "exp-high-low" && "Sort: Experience (High to Low)"}
                      {sortOption === "exp-low-high" && "Sort: Experience (Low to High)"}
                      {sortOption === "rating-high-low" && "Sort: Rating (High to Low)"}
                      {sortOption === "rating-low-high" && "Sort: Rating (Low to High)"}
                      {sortOption === "fee-low-high" && "Sort: Fee (Low to High)"}
                      {sortOption === "fee-high-low" && "Sort: Fee (High to Low)"}
                    </span>
                    <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showSortMenu && (
                    <div className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-md shadow-lg">
                      <div className="py-1 border border-gray-200 rounded-md">
                        <button 
                          onClick={() => handleSortChange("default")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "default" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Default
                        </button>
                        <button 
                          onClick={() => handleSortChange("exp-high-low")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Experience: High to Low
                        </button>
                        <button 
                          onClick={() => handleSortChange("exp-low-high")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Experience: Low to High
                        </button>
                        <button 
                          onClick={() => handleSortChange("rating-high-low")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Rating: High to Low
                        </button>
                        <button 
                          onClick={() => handleSortChange("rating-low-high")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Rating: Low to High
                        </button>
                        <button 
                          onClick={() => handleSortChange("fee-low-high")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Fee: Low to High
                        </button>
                        <button 
                          onClick={() => handleSortChange("fee-high-low")}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          Fee: High to Low
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <label className="mr-2 text-sm text-gray-600">Show:</label>
                  <div className="flex">
                    <button 
                      onClick={() => setDoctors(sortDoctors(doctors, sortOption))}
                      className="bg-blue-600 text-white text-sm py-2 px-3 rounded-l-lg hover:bg-blue-700 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        const filtered = doctors.filter(d => d.treats_searched_condition);
                        setDoctors(sortDoctors(filtered, sortOption));
                      }}
                      className="bg-green-600 text-white text-sm py-2 px-3 rounded-r-lg hover:bg-green-700 transition-colors"
                    >
                      Matching Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary of specializations and conditions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-md font-medium text-blue-800 mb-2">Specialist Types Found:</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.from(new Set(doctors.map(d => d.specialization))).map((spec, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    {spec} ({doctors.filter(d => d.specialization === spec).length})
                  </span>
                ))}
              </div>
              
              <h3 className="text-md font-medium text-green-800 mb-2">Conditions Treated:</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(doctors.flatMap(d => d.matched_conditions || []))).map((cond, i) => (
                  <span key={i} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                    {cond}
                  </span>
                ))}
                {Array.from(new Set(doctors.flatMap(d => {
                  // Ensure conditions_treated is an array before using filter
                  if (!d.conditions_treated) return [];
                  const conditions = Array.isArray(d.conditions_treated) ? d.conditions_treated : 
                    (typeof d.conditions_treated === 'string' ? [d.conditions_treated] : []);
                  
                  // Now filter out the matched conditions
                  return conditions.filter(c => 
                    !(d.matched_conditions || []).includes(c)
                  );
                }))).map((cond, i) => (
                  <span key={i} className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                    {cond}
                  </span>
                ))}
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
              {doctors.map((doctor) => (
                <div key={doctor.id} className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${doctor.treats_searched_condition ? 'border-l-4 border-green-500' : ''}`}>
                  <div className="bg-blue-600 text-white p-4">
                    <div className="flex items-start gap-2">
                      <FaUser className="mt-1" />
                      <div>
                        <h3 className="text-xl font-bold">{doctor.name}</h3>
                        <p>{doctor.specialization}</p>
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
                          <p className="font-medium">{doctor.experience} years</p>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-50 p-2 rounded-md">
                          <FaStar className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <p className="font-medium">{doctor.rating} / 5</p>
                        </div>
                      </div>
                      
<<<<<<< HEAD
                      {/* Patients Treated */}
                      <div className="flex items-center gap-2">
                        <div className="bg-teal-50 p-2 rounded-md">
                          <FaUser className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Patients Treated</p>
                          <p className="font-medium">{doctor.patients_treated || 'N/A'}</p>
                        </div>
                      </div>
                      
=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        <div className="bg-green-50 p-2 rounded-md">
                          <FaClock className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Availability</p>
                          <p className="font-medium">{doctor.availability}</p>
                        </div>
                      </div>
                      
                      {/* Fee */}
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-50 p-2 rounded-md">
                          <FaMoneyBillWave className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fee</p>
                          <p className="font-medium">₹{doctor.fee}</p>
                        </div>
                      </div>
<<<<<<< HEAD

                      {/* Location / Address */}
                      {doctor.location && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="bg-gray-100 p-2 rounded-md">
                            <MdLocalHospital className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{doctor.location}</p>
                          </div>
                        </div>
                      )}
=======
                    </div>
                    
                    {/* Specializes in treating */}
                    <div className="mt-5">
                      <p className="text-sm flex items-center gap-1 font-medium text-green-700">
                        <FaStethoscope size={12} /> Specializes in treating:
                      </p>
                      <div className="mt-1">
                        {doctor.conditions_treated && Array.isArray(doctor.conditions_treated) && doctor.conditions_treated.map((condition, index) => (
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
                        ))}
                      </div>
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
                    </div>
                    
                    {/* Contact button */}
                    <button 
                      className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPhoneAlt />
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorFinder; 