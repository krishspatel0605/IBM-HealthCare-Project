import React from 'react';

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="mb-4">If you have any questions or need assistance, please reach out to us using the information below.</p>
      <ul className="list-disc list-inside">
        <li>Email: support@healthcareapp.com</li>
        <li>Phone: +1 (555) 123-4567</li>
        <li>Address: 123 Healthcare St, Wellness City, HC 12345</li>
      </ul>
    </div>
  );
};

export default Contact;
