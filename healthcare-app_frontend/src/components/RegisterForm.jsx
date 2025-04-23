import React, { useState, useEffect, useRef } from 'react';
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
    role: '', // Default role
    password: '',
    confirmPassword: '',
    specialization: '',
    experience: 0,
    availability: '',
    patientsTreated: 0,
    hospital_name: '',
    address: '',
    date_of_birth: '',
    latitude: '',
    longitude: '',
    doctorName: '',
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
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    if (name === 'confirmPassword') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: value !== formData.password ? 'Passwords do not match.' : '',
      }));
    }

    if (name === 'address') {
      // Automatically fetch latitude and longitude when address changes
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        fetchCoordinates(value);
      }, 1000);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  const fetchCoordinates = async (address) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=YOUR_GOOGLE_API_KEY`);
      const { lat, lng } = response.data.results[0]?.geometry.location || {};
      if (lat && lng) {
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
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
      formData.password === formData.confirmPassword &&
      (formData.role !== 'doctor' || (formData.hospital_name && formData.specialization && formData.experience > 0))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (!formData.firstName) validationErrors.first_name = 'First name is required.';
    if (!formData.lastName) validationErrors.last_name = 'Last name is required.';
    if (!formData.email.includes('@')) validationErrors.email = 'Enter a valid email.';
    if (!formData.mobileNumber) validationErrors.mobile_number = 'Mobile number is required.';
    if (formData.mobileNumber && (!/^\d+$/.test(formData.mobileNumber) || formData.mobileNumber.length !== 10))
      validationErrors.mobile_number = 'Mobile number must be exactly 10 digits.';
    if (formData.password.length < 6) validationErrors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) validationErrors.confirm_password = 'Passwords do not match.';
    if (formData.role === 'doctor') {
      if (!formData.specialization) validationErrors.specialization = 'Specialization is required for doctors.';
      if (!formData.hospital_name) validationErrors.hospital_name = 'Hospital name is required.';
      if (formData.experience <= 0) validationErrors.experience = 'Experience must be greater than 0 years.';
      if (!formData.availability) validationErrors.availability = 'Availability is required.';
    }

    if (!formData.address) validationErrors.address = 'Address is required.';
    if (!formData.date_of_birth) validationErrors.date_of_birth = 'Date of birth is required.';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userData = {
      name: formData.firstName + ' ' + formData.lastName,
      email: formData.email,
      mobile_number: formData.mobileNumber,
      role: formData.role,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      address: formData.address,
      date_of_birth: formData.date_of_birth,
      latitude: formData.latitude,
      longitude: formData.longitude,
      hospital_name: formData.hospital_name,
      doctor_name: formData.doctorName,
      specialization: formData.specialization,
      experience: formData.experience,
      availability: formData.availability,
      patients_treated: formData.patientsTreated,
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
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="First Name"
                />
                {errors.first_name && <div className="text-red-500 text-sm">{errors.first_name}</div>}
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Last Name"
                />
                {errors.last_name && <div className="text-red-500 text-sm">{errors.last_name}</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Email"
                />
                                {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Mobile Number</label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="10-digit Mobile Number"
                />
                {errors.mobile_number && <div className="text-red-500 text-sm">{errors.mobile_number}</div>}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select Role</option>
                <option value="user">User</option>
                <option value="doctor">Doctor</option>
              </select>
              {errors.role && <div className="text-red-500 text-sm">{errors.role}</div>}
            </div>

            {formData.role === 'doctor' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Doctor Name</label>
                    <input
                      type="text"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Dr. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Hospital Name</label>
                    <input
                      type="text"
                      name="hospital_name"
                      value={formData.hospital_name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="City Hospital"
                    />
                    {errors.hospital_name && <div className="text-red-500 text-sm">{errors.hospital_name}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Cardiologist"
                    />
                    {errors.specialization && <div className="text-red-500 text-sm">{errors.specialization}</div>}
                  </div>

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
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Availability</label>
                  <input
                    type="text"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Mon-Fri, 9AM-1PM"
                  />
                  {errors.availability && <div className="text-red-500 text-sm">{errors.availability}</div>}
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Full Address"
              />
              {errors.address && <div className="text-red-500 text-sm">{errors.address}</div>}
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              {errors.date_of_birth && <div className="text-red-500 text-sm">{errors.date_of_birth}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10"
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
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10"
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
