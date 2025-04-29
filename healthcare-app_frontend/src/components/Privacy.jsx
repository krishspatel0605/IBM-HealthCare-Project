import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaUserLock, FaDatabase, FaCookieBite } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl opacity-90">How we protect and handle your data</p>
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
              <FaShieldAlt className="text-blue-600" />
              Introduction
            </h2>
            <p className="text-gray-600">
              At HealthCare, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our healthcare platform. Please 
              read this privacy policy carefully. By continuing to use our service, you acknowledge that 
              you have read and understood this policy.
            </p>
          </motion.section>

          {/* Information We Collect */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaUserLock className="text-blue-600" />
              Information We Collect
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Medical history and health information</li>
                <li>Insurance information</li>
                <li>Communication preferences</li>
                <li>Appointment and consultation records</li>
              </ul>
            </div>
          </motion.section>

          {/* How We Use Your Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaDatabase className="text-blue-600" />
              How We Use Your Information
            </h2>
            <p className="text-gray-600">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Provide and maintain our healthcare services</li>
              <li>Process and manage your appointments</li>
              <li>Communicate with you about your healthcare</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations and healthcare regulations</li>
            </ul>
          </motion.section>

          {/* Cookies and Tracking */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose max-w-none"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaCookieBite className="text-blue-600" />
              Cookies and Tracking
            </h2>
            <p className="text-gray-600">
              We use cookies and similar tracking technologies to track activity on our platform and 
              hold certain information. You can instruct your browser to refuse all cookies or to 
              indicate when a cookie is being sent.
            </p>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-blue-50 p-6 rounded-xl"
          >
            <h2 className="text-2xl font-bold mb-4">Questions About Our Privacy Policy?</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p>Email: privacy@healthcare.com</p>
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

export default Privacy;