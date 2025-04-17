<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import healthcareImage from '../assets/healthcare.jpg';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { RiEyeFill, RiEyeOffFill, RiShieldUserFill } from 'react-icons/ri';
import { MdPassword } from 'react-icons/md';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    role: '',
    password: '',
    confirmPassword: '',
    specialization: '',
<<<<<<< HEAD
    experience: 0,
    address: '',
    latitude: '',
    longitude: ''
=======
    experience: 0
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

<<<<<<< HEAD
  const debounceTimeout = useRef(null);

=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
  const calculatePasswordStrength = (password,) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    return Math.min(strength, 4); // Max strength 4
  };
  
<<<<<<< HEAD
  const fetchCoordinates = async (address) => {
    if (!address) {
      setFormData((prev) => ({ ...prev, latitude: '', longitude: '' }));
      return;
    }
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1
        }
      });
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        setErrors((prevErrors) => ({ ...prevErrors, latitude: '', longitude: '' }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          latitude: 'Unable to find latitude for the given address.',
          longitude: 'Unable to find longitude for the given address.'
        }));
        setFormData((prev) => ({ ...prev, latitude: '', longitude: '' }));
      }
    } catch (error) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        latitude: 'Error fetching latitude.',
        longitude: 'Error fetching longitude.'
      }));
      setFormData((prev) => ({ ...prev, latitude: '', longitude: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });

    if (name === 'address') {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        fetchCoordinates(value);
      }, 1000);
    }

    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    if (name === 'email' && !value.includes('@')) {
=======
  // Inside your handleChange function, when password changes:
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
    if (e.target.name === 'password') {
      setPasswordStrength(calculatePasswordStrength(e.target.value));
    }
    // Real-time email validation
    if (e.target.name === 'email' && !e.target.value.includes('@')) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: 'Please enter a valid email address.',
      }));

    }
<<<<<<< HEAD
    if (name === 'password' && value.length < 6) {
=======

    // Real-time password validation
    if (e.target.name === 'password' && e.target.value.length < 6) {
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: 'Password must be at least 6 characters.',
      }));
    }
<<<<<<< HEAD
    if (name === 'confirmPassword') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: value !== formData.password ? 'Passwords do not match.' : '',
=======

    // Clear error when the user starts typing confirm password
    if (e.target.name === 'confirmPassword') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: e.target.value !== formData.password ? 'Passwords do not match.' : '',
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (!formData.firstName) validationErrors.first_name = "First name is required.";
    if (!formData.lastName) validationErrors.last_name = "Last name is required.";
    if (!formData.email.includes("@")) validationErrors.email = "Enter a valid email.";
    if (!formData.mobileNumber) validationErrors.mobile_number = "Mobile number is required.";
    if (formData.mobileNumber && (!/^\d+$/.test(formData.mobileNumber) || formData.mobileNumber.length !== 10)) 
      validationErrors.mobile_number = "Mobile number must be exactly 10 digits.";
    if (formData.password.length < 6) validationErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) validationErrors.confirm_password = "Passwords do not match.";
<<<<<<< HEAD

=======
    
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    // Validate doctor-specific fields
    if (formData.role === 'doctor' && !formData.specialization) {
      validationErrors.specialization = "Specialization is required for doctors.";
    }

<<<<<<< HEAD
    // Validate address, latitude, longitude
    if (!formData.address) validationErrors.address = "Address is required.";
    if (!formData.latitude) validationErrors.latitude = "Latitude is required.";
    else if (isNaN(Number(formData.latitude))) validationErrors.latitude = "Latitude must be a valid number.";
    if (!formData.longitude) validationErrors.longitude = "Longitude is required.";
    else if (isNaN(Number(formData.longitude))) validationErrors.longitude = "Longitude must be a valid number.";

=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      mobile_number: formData.mobileNumber,
      role: formData.role,
      password: formData.password,
      confirm_password: formData.confirmPassword,
<<<<<<< HEAD
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

=======
    };

    // Add doctor-specific fields if role is doctor
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    if (formData.role === 'doctor') {
      userData.specialization = formData.specialization || 'General';
      userData.experience = formData.experience || 0;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/register/', userData);
<<<<<<< HEAD
=======
      // The backend already handles doctor creation when role='doctor'
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543

      if (response && response.data) {
        setMessage(response.data.message || "Registration successful! Redirecting to login...");
        setErrors({});
<<<<<<< HEAD
=======
        
        // Redirect to login page after a short delay to show the success message
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage('');
        setErrors({ general: "Unexpected response from server." });
      }
    } catch (err) {
      console.error('Registration Error:', err);
<<<<<<< HEAD
      if (err.response) {
        const fieldErrors = {};
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors[key] = errorData[key][0];
=======
      
      if (err.response) {
        console.log('Error Status:', err.response.status);
        console.log('Error Headers:', err.response.headers);
        console.log('Error Data:', err.response.data);
        
        // Handle field errors from Django/DRF
        const fieldErrors = {};
        const errorData = err.response.data;
        
        // Parse errors from different formats that Django/DRF might return
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors[key] = errorData[key][0]; // Take first error message
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            } else if (typeof errorData[key] === 'string') {
              fieldErrors[key] = errorData[key];
            }
          });
        }
<<<<<<< HEAD
=======
        
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        setErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : { general: 'Registration failed. Please try again.' });
      } else {
        setErrors({ general: 'Failed to connect to server. Please try again later.' });
      }
      setMessage('');
    }
  };

<<<<<<< HEAD
=======
  // const isFormValid = () => {
  //   return !Object.keys(errors).length && Object.values(formData).every((field) => field !== '');
  // };

>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
<<<<<<< HEAD
=======
        {/* Image Section */}
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        <div className="md:w-1/2 relative">
          <img
            src={healthcareImage}
            alt="Healthcare"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-blue-600/40 flex items-end p-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Join Our Community</h2>
              <p className="opacity-90">Start your health journey with us</p>
            </div>
          </div>
        </div>

<<<<<<< HEAD
=======
        {/* Form Section */}
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <RiShieldUserFill className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Get started with your healthcare account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">First Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="flex-shrink-0" /> {errors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Last Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                {errors.last_name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="flex-shrink-0" /> {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FaExclamationTriangle className="flex-shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Mobile Number</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="+1 234 567 890"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FaExclamationTriangle className="flex-shrink-0" /> {errors.mobile_number}
                </p>
              )}
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-gray-700 mb-2 font-medium">Address</label>
              <input
                type="text"
                name="address"
                placeholder="123 Main St, City, Country"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              {errors.address && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FaExclamationTriangle className="flex-shrink-0" /> {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  placeholder="e.g., 37.7749"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                {errors.latitude && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="flex-shrink-0" /> {errors.latitude}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  placeholder="e.g., -122.4194"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                {errors.longitude && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <FaExclamationTriangle className="flex-shrink-0" /> {errors.longitude}
                  </p>
                )}
              </div>
            </div>

            <div>
=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
              <label className="block text-gray-700 mb-2 font-medium">Account Type</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'patient' })}
                  className={`flex-1 py-2 rounded-lg border-2 ${
                    formData.role === 'patient'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  } transition-all`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'doctor' })}
                  className={`flex-1 py-2 rounded-lg border-2 ${
                    formData.role === 'doctor'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  } transition-all`}
                >
                  Doctor
                </button>
              </div>
            </div>

<<<<<<< HEAD
=======
            {/* Doctor-specific fields */}
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            {formData.role === 'doctor' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    placeholder="e.g., Cardiology, Neurology, etc."
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  {errors.specialization && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <FaExclamationTriangle className="flex-shrink-0" /> {errors.specialization}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    min="0"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FaExclamationTriangle className="flex-shrink-0" /> {errors.password}
                </p>
              )}
            </div>
            <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        passwordStrength === 4 ? 'bg-green-500' :
                        passwordStrength >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${(passwordStrength/4)*100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Password strength: {['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1]}
                  </p>
                </div>
<<<<<<< HEAD

=======
            
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <MdPassword className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {showConfirmPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FaExclamationTriangle className="flex-shrink-0" /> {errors.confirm_password}
                </p>
              )}
            </div>

<<<<<<< HEAD
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white`}
=======

            <button
              type="submit"
              // disabled={!()}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 'bg-blue-600 hover:bg-blue-700 text-white `}
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            >
              <RiShieldUserFill className="text-lg" />
              Create Account
            </button>

            {message && (
              <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg text-green-600">
                <FaCheckCircle className="flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {errors.general && (
              <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg text-red-600">
                <FaExclamationTriangle className="flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <p className="text-center text-gray-600 mt-4">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
