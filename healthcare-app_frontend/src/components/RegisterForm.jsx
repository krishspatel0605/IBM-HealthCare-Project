import React, { useState } from 'react';
import axios from 'axios';
import healthcareImage from '../assets/healthcare.jpg';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { RiEyeFill, RiEyeOffFill, RiShieldUserFill } from 'react-icons/ri';
import { MdPassword } from 'react-icons/md';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    role: 'user', // Default role
    password: '',
    confirmPassword: '',
    address: '',
    date_of_birth: ''
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: ''
    }));

    if (name === 'firstName' || name === 'lastName') {
      if (!/^[a-zA-Z]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: 'Only letters are allowed.'
        }));
      }
    }

    if (name === 'address') {
      if (value.length < 10) {
        setErrors((prev) => ({
          ...prev,
          address: 'Address must be at least 10 characters.'
        }));
      }
    }

    if (name === 'password') {
      if (value.length < 6) {
        setErrors((prev) => ({
          ...prev,
          password: 'Password must be at least 6 characters.'
        }));
      }
    }

    if (name === 'confirmPassword') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirmPassword: value !== formData.password ? 'Passwords do not match.' : ''
      }));
    }

    if (name === 'email') {
      if (!value.includes('@')) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: 'Please enter a valid email address.'
        }));
      }
    }

    if (name === 'mobileNumber') {
      if (!/^\+?\d{1,4}[-\s]?\d{10}$/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobile_number: 'Please enter a valid mobile number with an optional country code.'
        }));
      }
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email.includes('@') &&
      formData.mobileNumber &&
      formData.role &&
      formData.address &&
      formData.date_of_birth &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    let validationErrors = {};
  
    if (!formData.firstName) validationErrors.firstName = "First name is required.";
    if (!formData.lastName) validationErrors.lastName = "Last name is required.";
    if (!formData.email.includes("@")) validationErrors.email = "Enter a valid email.";
    if (!formData.mobileNumber) validationErrors.mobile_number = "Mobile number is required.";
    if (!formData.address) validationErrors.address = "Address is required.";
    if (!formData.date_of_birth) validationErrors.date_of_birth = "Date of birth is required.";
    if (formData.password.length < 6) validationErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) validationErrors.confirmPassword = "Passwords do not match.";
    if (!formData.role) validationErrors.role = "Role is required.";
  
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userData = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email,
      mobile_number: formData.mobileNumber,
      role: formData.role,
      password: formData.password,
      address: formData.address,
      date_of_birth: formData.date_of_birth,
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
          email: backendError.email,
          mobile_number: backendError.mobile_number,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden">
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

        {/* Right: Form Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <RiShieldUserFill className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Get started with your healthcare account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['firstName', 'lastName'].map((field, i) => (
                <div key={field}>
                  <label className="block text-gray-700 mb-2 font-medium">{i === 0 ? 'First' : 'Last'} Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${i === 0 ? 'First' : 'Last'} Name`}
                    />
                  </div>
                  {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email Address"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Mobile Number</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mobile Number"
                />
              </div>
              {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Address</label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Address"
                />
              </div>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <div className="relative">
                <MdPassword className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </div>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <MdPassword className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm Password"
                />
                <div
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <RiEyeOffFill /> : <RiEyeFill />}
                </div>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center items-center space-x-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                disabled={!isFormValid()}
              >
                Register
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className="mt-2 text-center text-green-500 font-semibold">
                <FaCheckCircle className="inline mr-2" />
                {message}
              </div>
            )}
            {errors.general && (
              <div className="mt-2 text-center text-red-500 font-semibold">
                <FaExclamationTriangle className="inline mr-2" />
                {errors.general}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
