import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';

export default function LogoutButton({ className }) {
  const navigate = useNavigate();

  const handleLogOut = () => {
    // Clear all auth-related items from storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('cached_doctors');
    localStorage.removeItem('cached_appointments');
    
    // Trigger storage event for other components to update
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to home page and replace history
    navigate('/', { replace: true });
  };

  return (
    <button
      onClick={handleLogOut}
      className={`bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md ${className || ''}`}
    >
      <FaUserMd className="text-lg" />
      <span>Logout</span>
    </button>
  );
}
