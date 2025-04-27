import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ArrowRight, MessageCircle, Briefcase } from 'lucide-react';
import { FaUserMd, FaStethoscope, FaClinicMedical, FaRegCalendarCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const specialties = [
  "Cardiology", "Dermatology", "Pediatrics", "Orthopedics",
  "Neurology", "Oncology", "Psychiatry", "General Surgery",
  "Obstetrics & Gynecology", "Ophthalmology", "ENT", "Urology",
  "Endocrinology", "Rheumatology", "Pulmonology", "Gastroenterology"
];

export default function DoctorPlatform() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('auth_token');
      setIsLoggedIn(!!authToken);
    };

    // Check on mount and when storage changes
    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    return () => window.removeEventListener('storage', checkAuthStatus);
  }, []);

  const handleSignIn = () => navigate('/login');
  
  const handleLogOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('cached_doctors');
    localStorage.removeItem('cached_appointments');
    
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('storage'));
    navigate('/', { replace: true });
  };
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
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
              <button 
                onClick={() => {
                  const token = localStorage.getItem('auth_token');
                  if (!token) {
                    sessionStorage.setItem('redirectUrl', '/find-doctor');
                    navigate('/login');
                    return;
                  }
                  navigate('/find-doctor');
                }} 
                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaStethoscope className="text-lg" />
                Find Specialists
              </button>
              <Link to="/about" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                <FaClinicMedical className="text-lg" />
                About
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/userhome" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                    <FaRegCalendarCheck className="text-lg" />
                    My Dashboard
                  </Link>
                  <button 
                    onClick={handleLogOut}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <FaUserMd className="text-lg" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                >
                  <FaUserMd className="text-lg" />
                  <span>Sign in</span>
                </button>
              )}
            </nav>
          </div>

          {isMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 pb-4 space-y-4"
            >
              {/* <Link to="/find-doctors" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg">
                <FaStethoscope />
                Find Doctors
              </Link> */}
              <Link to="/about" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg">
                <FaClinicMedical />
                About
              </Link>
              {isLoggedIn ? (
                <button 
                  onClick={handleLogOut}  
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FaUserMd />
                  Sign out
                </button>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FaUserMd />
                  Sign in
                </button>
              )}
            </motion.nav>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight"
                >
                  Connect with Verified Medical Professionals
                  <span className="text-blue-600 block mt-2">Build Your Healthcare Network</span>
                </motion.h1>
                <p className="text-xl text-gray-600">
                  Collaborate, consult, and grow your medical practice with peers and specialists
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      // localStorage.setItem('selectedAccountType', 'doctor');
                      navigate('/register');
                    }}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Briefcase size={20} />
                    Join as Doctor
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      const token = localStorage.getItem('auth_token');
                      if (!token) {
                        // Save the intended destination
                        sessionStorage.setItem('redirectUrl', '/find-doctor');
                        navigate('/login');
                        return;
                      }
                      navigate('/find-doctor');
                    }}
                    className="flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-full border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <User size={20} />
                    Find Specialist
                  </motion.button>
                </div>
              </div>
              <div className="hidden md:block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-teal-100 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <FaRegCalendarCheck className="text-3xl text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Book In-person Consultations </h3>
                        <p className="text-sm text-gray-600">Appointment booking with specialists</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
                      <MessageCircle className="text-3xl text-teal-600" />
                      <div>
                        <h3 className="font-semibold">Find best doctors around you</h3>
                        <p className="text-sm text-gray-600"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Doctor Search */}
        {/* Featured Doctors */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                Featured Medical Experts
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Connect with board-certified specialists across 30+ medical fields
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  whileHover={{ y: -5 }}
                  key={i} 
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full mr-4 flex items-center justify-center">
                        <FaUserMd className="text-2xl text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Dr. Sarah Johnson</h3>
                        <p className="text-gray-600">Cardiologist</p>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-blue-600">Verified</span>
                          <span className="mx-2">•</span>
                          <span className="text-sm text-green-600">Ahmedabad</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase size={16} className="text-blue-600" />
                        <span>15+ Years Experience</span>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2">
                        Consult
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Specialties Grid */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Medical Specialties
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specialties.map((specialty, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <FaStethoscope className="text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">{specialty}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FaUserMd className="text-3xl text-blue-600" />
                <span className="text-2xl font-bold">MedConnect</span>
              </div>
              <p className="text-gray-400">
                Connecting medical professionals and patients for better healthcare outcomes
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  <Link to="/profile">My Profile</Link>
                </li>
                <li className="hover:text-white transition-colors">
                  <Link to="/network">Professional Network</Link>
                </li>
                <li className="hover:text-white transition-colors">
                  <Link to="/continuing-education">Continuing Education</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Doctor Support: +1 (555) 123-4567</li>
                <li>Email: doctors@medconnect.com</li>
                <li>Emergency: 24/7 Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors">
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li className="hover:text-white transition-colors">
                  <Link to="/terms">Terms of Service</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 HealthCare. Professional Medical Network</p>
          </div>
        </div>
      </footer>
    </div>
  );
}