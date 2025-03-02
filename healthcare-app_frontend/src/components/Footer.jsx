import React from "react";
import { Link } from "react-router-dom";
import { FaHospital } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <FaHospital className="text-2xl" />
              HealthCare
            </h3>
            <p className="text-gray-400">
              Committed to providing accessible, high-quality healthcare solutions for everyone.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white">Services</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">Email: info@healthcare.com</li>
              <li className="text-gray-400">Phone: +123 456 789</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link to="/" className="text-gray-400 hover:text-white">Facebook</Link>
              <Link to="/" className="text-gray-400 hover:text-white">Twitter</Link>
              <Link to="/" className="text-gray-400 hover:text-white">Instagram</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
