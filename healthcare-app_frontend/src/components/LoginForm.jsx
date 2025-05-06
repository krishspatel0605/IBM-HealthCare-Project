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
        if (response.data.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (response.data.role === 'doctor') {
          navigate('/dashboard', { replace: true });
        } else if (response.data.role === 'user') {
          navigate('/userhome', { replace: true });
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
    <div className="min-h-0 min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-11/12 max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left image section */}
        <div className="md:w-1/2 relative">
          <img src={healthcareImage} alt="Healthcare" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-blue-600/40 flex items-end p-8">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-2">Welcome Back!</h3>
              <p className="text-sm opacity-90">Sign in to access your personalized healthcare experience.</p>
            </div>
          </div>
        </div>

        {/* Right form section */}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : <><FaLock className="text-lg" /> Sign In</>}
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
