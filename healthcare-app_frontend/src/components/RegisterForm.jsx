import React, { useState } from 'react';
import axios from 'axios';
import healthcareImage from '../assets/healthcare.jpg'; // Make sure to provide the correct path to the image

const RegisterForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState('patient');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      mobile_number: mobileNumber,
      role: role,
      password: password,
      confirm_password: confirmPassword
    };
  
    try {
      const response = await axios.post('http://localhost:8000/api/register/', userData);
  
      // Check if response.data exists
      if (response && response.data) {
        setMessage(response.data.message);
        setError('');
      } else {
        setError('Unexpected response format');
        setMessage('');
      }
    } catch (err) {
      // Check if err.response is defined
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again later.');
      
      }
      setMessage('');
    }
    
  };
  
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0B648B]">
      <div className="bg-[#BFE7F9] rounded-lg shadow-lg flex max-w-6xl rounded-2xl overflow-hidden">
        
        {/* Left Section: Image */}
        <div className="flex justify-start items-start w-1/2 py-0 max-h-cover overflow-hidden">
          <img
            src={healthcareImage}
            alt="Healthcare"
            className="w-[380px] h-[621px] object-cover rounded-lg"
          />
        </div>

        {/* Right Section: Form */}
        <div className="w-10/12 flex justify-center items-center p-16">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-bold mb-4 text-center text-[#262626]">Create Account</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border rounded-md p-2 w-full"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border rounded-md p-2 w-full"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-md p-2 w-full mt-4"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="border rounded-md p-2 w-full mt-4"
              />
              <div className="mt-4 flex items-center">
                <label className="mr-4">
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={role === 'patient'}
                    onChange={() => setRole('patient')}
                  /> Patient
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={role === 'doctor'}
                    onChange={() => setRole('doctor')}
                  /> Doctor
                </label>
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-md p-2 w-full mt-4"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border rounded-md p-2 w-full mt-4"
              />
              <button
                type="submit"
                className="bg-[#0B648B] text-white rounded p-2 w-full mt-6"
              >
                Create Account
              </button>
            </form>
            {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            <p className="text-center mt-4">
              Already have an account?{" "}
              <a href="/login" className="text-[#0B648B]">
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
