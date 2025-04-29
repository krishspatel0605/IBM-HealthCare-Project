import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import healthcareImage from '../assets/healthcare.jpg';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaCheckCircle, FaExclamationTriangle, FaRupeeSign , FaMapMarkerAlt , FaCalendar } from 'react-icons/fa';
import { RiEyeFill, RiEyeOffFill, RiShieldUserFill } from 'react-icons/ri';
import { MdPassword } from 'react-icons/md';
import {  ClockIcon, HospitalIcon, Stethoscope } from 'lucide-react';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    role: '', // Default role
    password: '',
    confirmPassword: '',
    specialization: '',
    experience: 0,
    availability: '',
    consultation_fee_inr: 0,
    patients_treated: 0,
    rating: 0,
    conditions_treated: '',
    hospital_name: '',
    address: '',
    date_of_birth: '',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const debounceTimeout = useRef(null);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    return Math.min(strength, 4); // Max strength 4
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Trigger address geocoding when address is changed
    if (name === 'address') {
      // We don't need to fetch coordinates here anymore
      // The backend will handle this
    }

    // Password strength calculation
    if (name === 'password') {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        setPasswordStrength(calculatePasswordStrength(value));
      }, 300);
    }
  };

  const fetchCoordinates = async (address) => {
    // We don't need to fetch coordinates in the frontend anymore
    // The backend will handle this automatically when the address is provided
    setFormData((prev) => ({
      ...prev,
      address
    }));
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email.includes('@') &&
      formData.mobileNumber &&
      formData.role &&
      formData.address &&
      (formData.role !== 'doctor' || (
        formData.hospital_name && 
        formData.specialization && 
        formData.experience > 0 &&
        formData.consultation_fee_inr > 0 &&
        formData.conditions_treated &&
        formData.patients_treated
      )) &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (!formData.email) validationErrors.email = 'Email is required.';
    if (!formData.password) validationErrors.password = 'Password is required.';
    if (!formData.confirmPassword) validationErrors.confirmPassword = 'Please confirm your password.';
    if (formData.password !== formData.confirmPassword) validationErrors.confirmPassword = 'Passwords do not match.';
    if (!formData.firstName || !formData.lastName) validationErrors.name = 'Name is required.';
    if (!formData.mobileNumber) validationErrors.mobileNumber = 'Mobile number is required.';
    
    if (formData.role === 'doctor') {
      if (!formData.specialization) validationErrors.specialization = 'Specialization is required for doctors.';
      if (!formData.hospital_name) validationErrors.hospital_name = 'Hospital name is required.';
      if (formData.experience <= 0) validationErrors.experience = 'Experience must be greater than 0 years.';
      if (!formData.availability) validationErrors.availability = 'Availability is required.';
      if (formData.consultation_fee_inr <= 0) validationErrors.consultation_fee_inr = 'Consultation fee must be greater than 0.';
      if (!formData.conditions_treated) validationErrors.conditions_treated = 'Conditions treated must be specified.';
      if (formData.patients_treated <= 0) validationErrors.patients_treated = 'Patients treated must be greater than 0.';
    }

    if (!formData.address) validationErrors.address = 'Address is required.';
    if (!formData.role) validationErrors.role = 'Role is required.';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    
    }

    const userData = {
      name: formData.firstName + ' ' + formData.lastName,
      email: formData.email,
      mobile_number: formData.mobileNumber,  // Keep as mobile_number for backend
      role: formData.role,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      address: formData.address,
      // date_of_birth is optional, only include if provided
      ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
      // Doctor-specific fields
      ...(formData.role === 'doctor' && {
        hospital_name: formData.hospital_name,
        specialization: formData.specialization,
        experience: formData.experience,
        availability: formData.availability,
        consultation_fee_inr: formData.consultation_fee_inr,
        conditions_treated: formData.conditions_treated,
        patients_treated: formData.patients_treated,

      })
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/register/`, userData);

      if (response && response.data) {
        setMessage(response.data.message || "Registration successful! An activation link has been sent to your email.");
        setErrors({});
      } else {
        setMessage('');
        setErrors({ general: "Unexpected response from server." });
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const backendError = err.response.data;
        setErrors({
          ...errors,
          email: backendError.email,
          mobileNumber: backendError.mobile_number, // Match frontend field name
          general: backendError.error || 'Registration failed.',
        });
      } else {
        setErrors({ general: 'Failed to connect to server. Please try again later.' });
      }
      setMessage('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-0 min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-11/12 max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left: Image Section */}
        <div className="md:w-1/2 relative">
          <img src={healthcareImage} alt="Healthcare" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-blue-600/40 flex items-end p-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-2">Join Our Community</h2>
              <p className="opacity-90">Start your health journey with us</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
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
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="First Name"
                />
                {errors.first_name && <div className="text-red-500 text-sm">{errors.first_name}</div>}
              </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Last Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Last Name"
                />
                {errors.last_name && <div className="text-red-500 text-sm">{errors.last_name}</div>}
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Email"
                />
                                {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
              </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Mobile Number</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Mobile Number"
                />
                {errors.mobileNumber && <div className="text-red-500 text-sm">{errors.mobileNumber}</div>}
              </div>
              </div>
            </div>


            <div>
              <label className="block text-gray-700 mb-2 font-medium">Role</label>
              <div className="relative">
                <RiShieldUserFill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select Role</option>
                <option value="user">User</option>
                <option value="doctor">Doctor</option>
              </select>
              {errors.role && <div className="text-red-500 text-sm">{errors.role}</div>}
            </div>
            </div>

            {formData.role === 'doctor' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Hospital Name</label>
                    <div className="relative">
                      <HospitalIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="hospital_name"
                      value={formData.hospital_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="City Hospital"
                      />
                    {errors.hospital_name && <div className="text-red-500 text-sm">{errors.hospital_name}</div>}
                  </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Specialization</label>
                    <div className="relative">
                      <RiShieldUserFill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Cardiologist"
                    />
                    {errors.specialization && <div className="text-red-500 text-sm">{errors.specialization}</div>}
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Years of Experience</label>
                    
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="5"
                      min="1"
                    />
                    {errors.experience && <div className="text-red-500 text-sm">{errors.experience}</div>}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Consultation Fee (INR)</label>
                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="consultation_fee_inr"
                      value={formData.consultation_fee_inr}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="500"
                      min="1"
                    />
                    {errors.consultation_fee_inr && <div className="text-red-500 text-sm">{errors.consultation_fee_inr}</div>}
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Availability</label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Mon-Fri, 9AM-1PM"
                    />
                    {errors.availability && <div className="text-red-500 text-sm">{errors.availability}</div>}
                  </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Conditions Treated</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="conditions_treated" 
                      value={formData.conditions_treated}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Heart Disease, Diabetes"
                      />
                    {errors.conditions_treated && <div className="text-red-500 text-sm">{errors.conditions_treated}</div>}
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>

                    <label className="block text-gray-700 mb-2 font-medium">Patients Treated</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="patients_treated"
                      value={formData.patients_treated}
                      onChange={handleChange}
                      className="ww-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="100"
                      min="1"
                      />
                    {errors.patients_treated && <div className="text-red-500 text-sm">{errors.patients_treated}</div>}
                  </div>
                  </div>
                </div>

              </>
            )}

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Address</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Full Address"
              />
              {errors.address && <div className="text-red-500 text-sm">{errors.address}</div>}
            </div>
            </div>

            {formData.role === 'user' && (
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Date of Birth</label>
                <div className="relative">
                  <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                {errors.date_of_birth && <div className="text-red-500 text-sm">{errors.date_of_birth}</div>}
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  
                <label className="block text-gray-700 mb-2 font-medium">Password</label> 
                <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Password"

                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                  </button>
                </div>
                {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Confirm Password</label>
                <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Confirm Password"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                  </button>
                </div>
                {errors.confirm_password && <div className="text-red-500 text-sm">{errors.confirm_password}</div>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300"
              disabled={!isFormValid()}
            >
              Register
            </button>

            {message && (
              <div className="mt-4 text-green-600 text-center flex items-center justify-center gap-2">
                <FaCheckCircle /> {message}
              </div>
            )}
            {errors.general && (
              <div className="mt-4 text-red-600 text-center flex items-center justify-center gap-2">
                <FaExclamationTriangle /> {errors.general}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
