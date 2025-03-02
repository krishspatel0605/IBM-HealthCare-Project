import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, Search, User, PhoneCall } from 'lucide-react';
import {  FaUserMd, FaHospital,  } from 'react-icons/fa';


export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
           <Link to="/" className="flex items-center gap-2">
                <FaHospital className="text-3xl text-blue-600" />
                  <Link to="/" className="text-2xl font-bold text-blue-600">
                  Health<span className="text-teal-600">Care</span>
                  </Link>          
            </Link>
            
            {/* Mobile menu button */}
            <button onClick={toggleMenu} className="md:hidden text-gray-600">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {/* <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </Link> */}
              {/* <Link to="/service" className="text-gray-600 hover:text-blue-600 transition-colors">
                Services
              </Link> */}
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </Link>
              {/* <Link to="/doctors" className="text-gray-600 hover:text-blue-600 transition-colors">
                Doctors
              </Link> */}
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </Link>
              <button 
                onClick={handleSignIn}
                className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FaUserMd className="text-lg" />
                <span>Sign in </span>
              </button>
            </nav>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4">
              <div className="flex flex-col space-y-4">
                <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
                <Link to="/service" className="text-gray-600 hover:text-blue-600">Services</Link>
                <Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link>
                <Link to="/doctors" className="text-gray-600 hover:text-blue-600">Doctors</Link>
                <Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
                <button 
                  onClick={handleSignIn}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 w-full"
                >
                  Sign in
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
                Your Health, Our Priority: Find the Right Doctor Today
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                Connect with top healthcare professionals and book appointments with ease. 
                Quality healthcare is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors">
                  <Calendar size={20} />
                  Book Appointment
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-full border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <User size={20} />
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search doctors, specialties..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
              Top Rated Doctors
            </h2>
            <p className="text-center mb-12 max-w-2xl mx-auto text-gray-600">
              Book appointments with highly qualified doctors who provide exceptional care 
              and maintain the highest standards of medical practice.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                      <div>
                        <h3 className="font-bold text-gray-800">Dr. Sarah Johnson</h3>
                        <p className="text-gray-600">Cardiologist</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-yellow-400">★</span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">(120+ reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="inline-flex items-center gap-1">
                        <PhoneCall size={16} className="text-blue-600" />
                        <span className="text-gray-600">Available Today</span>
                      </span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">HealthCare</h3>
              <p className="text-gray-400 mb-4">
                Providing quality healthcare services and connecting patients with the best medical professionals.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/service" className="text-gray-400 hover:text-white">Services</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/doctors" className="text-gray-400 hover:text-white">Doctors</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>1234 Healthcare Ave</li>
                <li>New York, NY 10001</li>
                <li>+1 (555) 123-4567</li>
                <li>contact@healthcare.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 HealthCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}