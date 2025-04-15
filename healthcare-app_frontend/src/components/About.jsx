import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaStethoscope, FaHospital, FaAward, FaUsers, FaHandshake } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Users, Shield, Heart, Clock } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About HealthCare</h1>
            <p className="text-xl opacity-90">Transforming Healthcare with Technology</p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-xl text-gray-600">
                At HealthCare, we're dedicated to connecting patients with trusted medical professionals, 
                making healthcare more accessible, and improving health outcomes through technology.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Patient-Centric Care</h3>
                </div>
                <p className="text-gray-600">
                  We believe healthcare should revolve around the patient. Our platform is designed to put 
                  patients first by providing easy access to specialists, comprehensive health information, 
                  and seamless appointment booking.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="text-blue-600 w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Quality Assurance</h3>
                </div>
                <p className="text-gray-600">
                  We carefully verify all medical professionals on our platform, ensuring they meet our 
                  high standards for qualifications and patient care. We're committed to providing access 
                  to only the best healthcare providers.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose HealthCare</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform offers unique advantages for both patients and medical professionals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <FaUsers className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Extensive Network</h3>
                <p className="text-gray-600">
                  Connect with over 10,000 verified doctors and specialists across 30+ medical fields
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <Clock className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Convenient Access</h3>
                <p className="text-gray-600">
                  Book appointments quickly and easily, with options for in-person consultations
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <Heart className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Personalized Care</h3>
                <p className="text-gray-600">
                  Find specialists tailored to your specific health conditions and needs
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Leadership Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the dedicated professionals working to transform healthcare
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Dr. Rahul Sharma",
                title: "Chief Medical Officer",
                bio: "Board-certified cardiologist with 15+ years of experience in healthcare management"
              },
              {
                name: "Priya Patel",
                title: "Chief Executive Officer",
                bio: "Healthcare technology innovator with a passion for improving patient experience"
              },
              {
                name: "Arjun Mehta",
                title: "Chief Technology Officer",
                bio: "Tech visionary leading our digital transformation and platform development"
              }
            ].map((member, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full mb-4 flex items-center justify-center">
                    <FaUserMd className="text-blue-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{member.title}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              The principles that guide everything we do at HealthCare
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { icon: <FaStethoscope />, value: "Excellence" },
              { icon: <FaHandshake />, value: "Integrity" },
              { icon: <FaHospital />, value: "Accessibility" },
              { icon: <FaAward />, value: "Innovation" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                className="bg-blue-700 p-6 rounded-xl text-center"
              >
                <div className="text-3xl mb-3 flex justify-center">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold">{item.value}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Get in Touch</h2>
              <p className="text-xl text-gray-600">
                Have questions or feedback? We'd love to hear from you.
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link 
                to="/contact" 
                className="bg-blue-600 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </Link>
              <Link 
                to="/find-doctors" 
                className="bg-white text-blue-600 px-8 py-3 rounded-full border-2 border-blue-600 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              >
                Find Specialists
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 