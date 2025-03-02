import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import healthcareImage from '../assets/healthcare.jpg'; // Ensure the path is correct

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      email: email,
      password: password,
    };

    try {
      const response = await axios.post('http://localhost:8000/api/login/', userData);

      if (response && response.data) {
        setMessage(response.data.message || 'Login successful!');
        setError('');
        navigate('/userhome');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
          'Error occurred during login. Please check your inputs.'
        );
      } else {
        setError('Failed to connect to server. Please try again later.');
      }
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center">
      <div className="bg-white shadow-lg flex max-w-4xl w-full rounded-2xl overflow-hidden">
        {/* Left Section: Image (hidden on small screens) */}
        <div className="hidden md:flex md:w-1/2">
          <img
            src={healthcareImage}
            alt="Healthcare"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:w-1/2 p-8 bg-blue-100 flex flex-col shadow-xl items-center justify-center">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full mt-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-full w-full mt-6 hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
          {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
          <p className="text-center mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-700 transition-colors">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
