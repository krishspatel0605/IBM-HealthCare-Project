import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TextField } from '@mui/material';
import { FaUserMd, FaStethoscope, FaRegCalendarCheck, FaPhoneAlt, FaFirstAid, FaClinicMedical, FaSearch, FaStar, FaStarHalfAlt, FaRegStar, FaBriefcase, FaClock, FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

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

// Star rating component
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
      <span className="text-gray-600 text-sm">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function DoctorSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("default");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!authToken) {
      // If no token is found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

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
      default:
        return sortedList;
    }
  };

  // Improve the performSearch function to better handle diseases
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') return;
    
    setSearchLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      console.log(`Searching for doctors treating: "${query}"`);
      
      // Use the recommend-doctors endpoint which is better for disease search
      const response = await axios.get(
        `${API_BASE_URL}/recommend-doctors/?query=${encodeURIComponent(query)}&sort_by=${sortOption === 'default' ? 'similarity' : sortOption}&limit=100`
      );
      
      if (response.data && response.data.recommended_doctors) {
        const recommendedDoctors = response.data.recommended_doctors;
        
        // Process doctors to mark those who treat the searched condition
        const processedDoctors = recommendedDoctors.map(doctor => {
          // Create a copy of the doctor object
          const processedDoctor = { ...doctor };
          
          // Check if this doctor treats the searched condition
          if (doctor.conditions_treated) {
            const conditions = Array.isArray(doctor.conditions_treated) 
              ? doctor.conditions_treated 
              : typeof doctor.conditions_treated === 'string'
                ? doctor.conditions_treated.split(',').map(c => c.trim())
                : [];
                
            const matchFound = conditions.some(condition => 
              condition.toLowerCase().includes(query.toLowerCase())
            );
            
            processedDoctor.treats_searched_condition = matchFound;
          }
          
          return processedDoctor;
        });
        
        // Apply sorting to the doctors
        const sortedDoctors = sortDoctors(processedDoctors, sortOption);
        setFilteredDoctors(sortedDoctors);
        console.log(`Found ${sortedDoctors.length} doctors for "${query}"`);
      } else {
        console.log(`No doctors found for "${query}"`);
        setError(`No doctors found for "${query}"`);
        setFilteredDoctors([]);
      }
    } catch (error) {
      console.error("Error searching doctors:", error);
      
      // Try to fetch all doctors and filter client-side as a fallback
      try {
        const response = await axios.get(`${API_BASE_URL}/list-all-doctors/`);
        
        if (response.data && response.data.doctors) {
          // Filter doctors client-side
          const filtered = response.data.doctors.filter(doctor => {
            const queryLower = query.toLowerCase();
            
            // Check if doctor treats the condition
            if (doctor.conditions_treated) {
              const conditions = Array.isArray(doctor.conditions_treated) 
                ? doctor.conditions_treated 
                : typeof doctor.conditions_treated === 'string' 
                  ? doctor.conditions_treated.split(',').map(c => c.trim()) 
                  : [];
              
              return conditions.some(condition => 
                condition.toLowerCase().includes(queryLower)
              );
            }
            
            // Also check name and specialization as fallback
            return doctor.name.toLowerCase().includes(queryLower) ||
                   doctor.specialization.toLowerCase().includes(queryLower);
          });
          
          // Mark doctors that treat the condition
          const processedDoctors = filtered.map(doctor => ({
            ...doctor,
            treats_searched_condition: true // All filtered doctors treat the condition in fallback mode
          }));
          
          setFilteredDoctors(sortDoctors(processedDoctors, sortOption));
          console.log(`Found ${filtered.length} doctors (fallback) for "${query}"`);
        } else {
          setError(`No doctors found for "${query}"`);
          setFilteredDoctors([]);
        }
      } catch (fallbackError) {
        console.error("Fallback search failed:", fallbackError);
        setError(`Search failed. Please try again later.`);
        setFilteredDoctors([]);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [sortOption]); // Include sortOption in the dependencies

  // Fetch doctors data from the backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/list-all-doctors/?limit=10`);
        if (response.data && response.data.doctors) {
          // Apply default sorting to the doctors when they are first loaded
          const doctorsData = response.data.doctors;
          setDoctors(doctorsData);
          setFilteredDoctors(sortDoctors(doctorsData, sortOption));
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Could not load doctors. Please try again later.");
      }
      setLoading(false);
    };

    const fetchAppointments = async () => {
      try {
        // Use the actual appointments API endpoint
        const response = await axios.get(`${API_BASE_URL}/user-appointments/`);
        if (response.data && response.data.appointments) {
          setUpcomingAppointments(response.data.appointments);
        } else {
          // If no appointments or invalid format, set to empty array
          setUpcomingAppointments([]);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setUpcomingAppointments([]);
      }
    };

    fetchDoctors();
    fetchAppointments();
    
    // Check for query parameters in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromURL = urlParams.get('query');
    if (queryFromURL) {
      setSearchQuery(queryFromURL);
      performSearch(queryFromURL);
    }
  }, [sortOption, performSearch]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.length > 2) {
      const filtered = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query) ||
        (doctor.conditions_treated && Array.isArray(doctor.conditions_treated) && 
          doctor.conditions_treated.some(condition => 
            condition.toLowerCase().includes(query)
          )
        )
      );
      
      setFilteredDoctors(sortDoctors(filtered, sortOption));
    } else {
      setFilteredDoctors(sortDoctors(doctors, sortOption));
    }
  };

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
    setFilteredDoctors(sortDoctors(filteredDoctors, option));
    setShowSortMenu(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Instead of navigating to another page, perform the search here
      // Update URL without page navigation using history.replaceState
      const url = new URL(window.location);
      url.searchParams.set('query', searchQuery);
      window.history.replaceState({}, '', url);
      
      // Perform the search with API call
      performSearch(searchQuery);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleLogOut = () => {
    // Clear all possible authentication tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token');
    
    // Use a slight delay before redirecting to ensure tokens are cleared
    setTimeout(() => {
      // Redirect to home page instead of login page
      window.location.href = '/'; // Use direct URL change instead of navigate
    }, 100);
  };

  // Update the Health Tips section with real content
  const healthTips = [
    "Regular exercise improves both physical and mental health",
    "Annual check-ups can detect potential health issues early",
    "Maintain a balanced diet rich in fruits and vegetables for optimal health",
    "Stay hydrated by drinking at least 8 glasses of water daily",
    "Get 7-9 hours of quality sleep every night for better overall health"
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !searchPerformed) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
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
                onChange={handleSearch}
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
              
              {/* Sort Dropdown */}
              <div className="relative mt-3 md:mt-0">
                <button 
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center justify-between w-56 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <span>
                    {sortOption === "default" && "Sort By: Default"}
                    {sortOption === "exp-high-low" && "Sort: Experience (High to Low)"}
                    {/* {sortOption === "exp-low-high" && "Sort: Experience (Low to High)"} */}
                    {sortOption === "rating-high-low" && "Sort: Rating (High to Low)"}
                    {/* {sortOption === "rating-low-high" && "Sort: Rating (Low to High)"} */}
                    {/* {sortOption === "fee-low-high" && "Sort: Fee (Low to High)"} */}
                    {sortOption === "fee-high-low" && "Sort: Fee (High to Low)"}
                  </span>
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {showSortMenu && (
                  <div className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-md shadow-lg">
                    <div className="py-1 border border-gray-200 rounded-md">
                      {/* Sort options */}
                      <button onClick={() => handleSortChange("default")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "default" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Default</button>
                      <button onClick={() => handleSortChange("exp-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Experience: High to Low</button>
                      <button onClick={() => handleSortChange("exp-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Experience: Low to High</button>
                      <button onClick={() => handleSortChange("rating-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Rating: High to Low</button>
                      <button onClick={() => handleSortChange("rating-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Rating: Low to High</button>
                      <button onClick={() => handleSortChange("fee-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Fee: Low to High</button>
                      <button onClick={() => handleSortChange("fee-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Fee: High to Low</button>
                    </div>
                  </div>
                )}
              </div>
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
                          {doctor.hospital && <p className="text-sm text-blue-100 mt-1">{doctor.hospital}</p>}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaUserMd className="text-blue-600" />
                  Featured Doctors
                </h2>
                
                {/* Sort Dropdown */}
                <div className="relative mt-3 md:mt-0">
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
                        <button onClick={() => handleSortChange("default")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "default" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Default</button>
                        <button onClick={() => handleSortChange("exp-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Experience: High to Low</button>
                        <button onClick={() => handleSortChange("exp-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "exp-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Experience: Low to High</button>
                        <button onClick={() => handleSortChange("rating-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Rating: High to Low</button>
                        <button onClick={() => handleSortChange("rating-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "rating-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Rating: Low to High</button>
                        <button onClick={() => handleSortChange("fee-low-high")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-low-high" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Fee: Low to High</button>
                        <button onClick={() => handleSortChange("fee-high-low")} className={`block w-full text-left px-4 py-2 text-sm ${sortOption === "fee-high-low" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}>Fee: High to Low</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Display the filtered doctors */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
                    <div className="bg-blue-600 text-white p-4">
                      <div className="flex items-start gap-2">
                        <FaUserMd className="mt-1" />
                        <div>
                          <h3 className="text-xl font-bold">{doctor.name}</h3>
                          <p>{doctor.specialization}</p>
                          {doctor.hospital && <p className="text-sm text-blue-100 mt-1">{doctor.hospital}</p>}
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
            </div>
          </div>
        )}
      </main>

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