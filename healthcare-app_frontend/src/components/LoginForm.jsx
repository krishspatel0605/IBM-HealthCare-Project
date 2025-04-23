import React, { useState } from 'react';
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
  const navigate = useNavigate();

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
        // Store tokens consistently
        localStorage.setItem('auth_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user_role', response.data.role);
        
        setMessage('Login successful! Redirecting...');
        
        // Navigate based on role
        if (response.data.role === 'user') {
          navigate('/userhome', { replace: true });
        } else if (response.data.role === 'doctor') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left image section */}
        <div className="hidden md:block md:w-1/2 relative">
          <img src={healthcareImage} alt="Healthcare" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-blue-800/50 flex items-end p-6 text-white">
            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome Back!</h3>
              <p className="text-sm opacity-90">Sign in to access your personalized healthcare experience.</p>
            </div>
          </div>
        </div>

        {/* Right form section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your healthcare account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdEmail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Email address"
                required
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <RiEyeOffFill className="h-5 w-5 text-gray-400" /> :
                  <RiEyeFill className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
            {message && (
              <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                <FaCheckCircle className="h-5 w-5 mr-2" />
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Additional Links */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Forgot Password?
              </button>
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
