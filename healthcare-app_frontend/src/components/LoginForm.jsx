import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import healthcareImage from '../assets/healthcare.jpg';
import { FaUser, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiEyeFill, RiEyeOffFill } from 'react-icons/ri';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Redirect user if already logged in based on role
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      if (role === 'doctor') {
        navigate('/dashboard');
      } else if (role === 'patient') {
        navigate('/userhome');
      } else if (role === 'admin') {
        navigate('/');
      } else {
        navigate('/');
      }
    } else {
      setIsCheckingAuth(false);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
  
    const emailPattern = /^[^\s@]+@[^\s@]+$/;
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    } else if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/login/`,
        { email, password },
        { withCredentials: true }
      );
  
      if (response.data.otp_required) {
        setLoading(false);
        const otpURL = `/verify-login-otp?email=${encodeURIComponent(email)}`;
        navigate(otpURL);
      } else if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('role', response.data.role); // Store role in localStorage
        setMessage('Login successful! Redirecting...');
        setLoading(false);
  
        if (response.data.role === 'patient') {
          navigate('/userhome');
        } else if (response.data.role === 'doctor') {
          navigate('/dashboard');
        } else if (response.data.role === 'admin') {
          navigate('/');
        } else {
          navigate('/');
        }
      } else {
        setLoading(false);
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    }
  };

  if (isCheckingAuth) {
    return null; // or a loader component if preferred
  }
  
  return (
    <div className="min-h-0 min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-11/12 max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Image Section */}
        <div className="md:w-1/2 relative">
          <img
            src={healthcareImage}
            alt="Healthcare"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-blue-600/40 flex items-end p-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
              <p className="opacity-90">Your health journey starts here</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <FaUser className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
            <p className="text-gray-600">Access your healthcare account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm">
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg text-red-600">
                <FaExclamationTriangle className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg text-green-600">
                <FaCheckCircle className="flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              ) : (
                <FaLock className="text-lg" />
              )}
              Sign In
            </button>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create Account
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
