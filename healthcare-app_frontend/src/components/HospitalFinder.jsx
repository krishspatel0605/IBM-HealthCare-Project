import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HospitalFinder = () => {
  const [hospitals, setHospitals] = useState([]);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation permission denied or unavailable:', error.message);
          setError('Unable to access your location. Showing all hospitals.');
          fetchHospitals();
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Showing all hospitals.');
      fetchHospitals();
    }
  }, []);

  useEffect(() => {
    if (userLatitude !== null && userLongitude !== null) {
      fetchHospitals(userLatitude, userLongitude);
    }
  }, [userLatitude, userLongitude]);

  const fetchHospitals = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/get_nearest_hospitals/';
      if (lat !== undefined && lon !== undefined) {
        url += `?user_latitude=${lat}&user_longitude=${lon}`;
      }
      const response = await axios.get(url);
      setHospitals(response.data);
    } catch (err) {
      setError('Failed to fetch hospitals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-finder p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Nearest Hospitals</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading hospitals...</p>
      ) : hospitals.length === 0 ? (
        <p>No hospitals found.</p>
      ) : (
        <ul className="space-y-4">
          {hospitals.map((hospital) => (
            <li key={hospital.id} className="border p-4 rounded shadow">
              <h3 className="text-xl font-bold">{hospital.name}</h3>
              <p>{hospital.address}</p>
              <p>Specialization: {hospital.specialization}</p>
              <p>Available Beds: {hospital.available_beds}</p>
              <p>Distance: {hospital.distance_km} km</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HospitalFinder;
