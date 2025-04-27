import React from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 min-h-screen py-16">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-8">If you have any questions or need assistance, please reach out to us using the information below. Our team is here to help!</p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12 space-y-8 transform transition-all hover:scale-105 duration-300">
          <h2 className="text-2xl font-semibold text-gray-800">Get in Touch</h2>
          <p className="text-gray-600 mb-6">We're just a message away. Feel free to contact us through the following channels:</p>

          <ul className="space-y-6">
            <li className="flex items-center space-x-4">
              <FaEnvelope className="text-blue-600 text-xl" />
              <span className="text-gray-700 text-lg">support@healthcareapp.com</span>
            </li>
            <li className="flex items-center space-x-4">
              <FaPhoneAlt className="text-blue-600 text-xl" />
              <span className="text-gray-700 text-lg">+1 (555) 123-4567</span>
            </li>
            <li className="flex items-center space-x-4">
              <FaMapMarkerAlt className="text-blue-600 text-xl" />
              <span className="text-gray-700 text-lg">123 Healthcare St, Wellness City, HC 12345</span>
            </li>
          </ul>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Or, fill out the form below, and we'll get back to you as soon as possible. We're here to assist you!</p>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transform hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
