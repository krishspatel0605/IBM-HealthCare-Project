import React, { useState } from 'react';
import axios from 'axios';
import healthcareImage from '../assets/healthcare.jpg'; // Ensure the path is correct

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    role: 'patient',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });

    // Real-time email validation
    if (e.target.name === 'email' && !e.target.value.includes('@')) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: 'Please enter a valid email address.',
      }));
    }

    // Real-time password validation
    if (e.target.name === 'password' && e.target.value.length < 6) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: 'Password must be at least 6 characters.',
      }));
    }

    // Clear error when the user starts typing confirm password
    if (e.target.name === 'confirmPassword') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirm_password: e.target.value !== formData.password ? 'Passwords do not match.' : '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (!formData.firstName) validationErrors.first_name = "First name is required.";
    if (!formData.lastName) validationErrors.last_name = "Last name is required.";
    if (!formData.email.includes("@")) validationErrors.email = "Enter a valid email.";
    if (formData.password.length < 6) validationErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) validationErrors.confirm_password = "Passwords do not match.";

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
    };

    try {
      const response = await axios.post('http://localhost:8000/api/register/', userData);

      if (response && response.data) {
        setMessage(response.data.message || "Registration successful!");
        setErrors({});
      } else {
        setMessage('');
        setErrors({ general: "Unexpected response from server." });
      }
    } catch (err) {
      if (err.response && err.response.data) {
        console.log('Error Response:', err.response.data);
        const fieldErrors = err.response.data.details || {};
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Failed to connect to server. Please try again later.' });
      }
      setMessage('');
    }
  };

  const isFormValid = () => {
    return !Object.keys(errors).length && Object.values(formData).every((field) => field !== '');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center">
      <div className="bg-white shadow-lg flex max-w-4xl w-full rounded-2xl overflow-hidden">
        {/* Left Section: Image */}
        <div className="hidden md:flex md:w-1/2">
          <img src={healthcareImage} alt="Healthcare" className="object-cover w-full h-full" />
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:w-1/2 p-8 bg-blue-100 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm px-4">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.first_name && <p className="text-red-600 text-sm">{errors.first_name}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.last_name && <p className="text-red-600 text-sm">{errors.last_name}</p>}
                </div>
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-blue-600"
                />
                {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="mobileNumber"
                  placeholder="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-blue-600"
                />
                {errors.mobile_number && <p className="text-red-600 text-sm">{errors.mobile_number}</p>}
              </div>

              <div className="mt-4 flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === 'patient'}
                    onChange={handleChange}
                  />
                  <span className="text-gray-700">Patient</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={formData.role === 'doctor'}
                    onChange={handleChange}
                  />
                  <span className="text-gray-700">Doctor</span>
                </label>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-blue-600"
                />
                <button type="button" onClick={togglePasswordVisibility} className="text-blue-600 mt-2">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
              </div>
              <div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:ring-2 focus:ring-blue-600"
                />
                <button type="button" onClick={toggleConfirmPasswordVisibility} className="text-blue-600 mt-2">
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
                {errors.confirm_password && <p className="text-red-600 text-sm">{errors.confirm_password}</p>}
              </div>

              <button
                type="submit"
                className={`bg-blue-600 text-white px-6 py-3 rounded-full w-full mt-6 ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                // disabled={!isFormValid()}
              >
                Create Account
              </button>
            </form>

            {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
            {errors.general && <p className="text-red-600 mt-4 text-center">{errors.general}</p>}

            <p className="text-center mt-6">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
