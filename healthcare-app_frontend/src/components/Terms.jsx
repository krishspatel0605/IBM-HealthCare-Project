import React from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaUserMd, FaCalendarCheck, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl opacity-90">Please read these terms carefully before using our platform</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaGavel className="text-blue-600" />
              Agreement to Terms
            </h2>
            <p className="text-gray-600">
              By accessing or using the HealthCare platform, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our services. These Terms of 
              Service apply to all users of the platform, including doctors, patients, and visitors.
            </p>
          </motion.section>

          {/* Medical Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaUserMd className="text-blue-600" />
              Medical Services
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">Our platform facilitates:</p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Connection between patients and healthcare providers</li>
                <li>Online appointment booking</li>
                <li>Access to medical professionals' profiles and credentials</li>
                <li>Secure communication channels for healthcare-related discussions</li>
              </ul>
              <p className="text-gray-600">
                While we verify credentials of healthcare providers, we are not responsible for the actual 
                medical advice or treatment provided. Always consult with qualified healthcare professionals 
                for medical conditions.
              </p>
            </div>
          </motion.section>

          {/* Appointments and Cancellations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaCalendarCheck className="text-blue-600" />
              Appointments and Cancellations
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">Users agree to:</p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Provide accurate information when booking appointments</li>
                <li>Cancel or reschedule appointments at least 24 hours in advance</li>
                <li>Pay any applicable cancellation fees as per the healthcare provider's policy</li>
                <li>Arrive on time for scheduled appointments</li>
              </ul>
            </div>
          </motion.section>

          {/* User Responsibilities */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-blue-600" />
              User Responsibilities
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">Users must:</p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Maintain the confidentiality of their account credentials</li>
                <li>Provide accurate and truthful information</li>
                <li>Not misuse or attempt to harm the platform</li>
                <li>Respect the privacy and rights of other users</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-blue-50 p-6 rounded-xl"
          >
            <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p>Email: legal@healthcare.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
            <div className="mt-6">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Contact Us
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Terms;