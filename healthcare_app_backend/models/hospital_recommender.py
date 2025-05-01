import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import haversine_distances
from hospital.models import Hospital
from math import radians
import logging

logger = logging.getLogger(__name__)

class HospitalRecommender:
    def __init__(self):
        self.scaler = StandardScaler()
        
    def _calculate_distance_score(self, user_lat, user_lon, hospital_lat, hospital_lon):
        """Calculate haversine distance between user and hospital"""
        user_coords = [[radians(float(user_lat)), radians(float(user_lon))]]
        hospital_coords = [[radians(float(hospital_lat)), radians(float(hospital_lon))]]
        distance = haversine_distances(user_coords, hospital_coords)[0][0] * 6371  # Convert to kilometers
        # Convert distance to a score between 0 and 1 (closer is better)
        return 1 / (1 + distance)

    def _calculate_quality_score(self, hospital):
        """Calculate quality score based on hospital attributes"""
        doctors = hospital.doctors.all()
        if not doctors:
            return 0.5  # Default score if no doctors
        
        avg_rating = np.mean([doctor.rating for doctor in doctors])
        avg_success_rate = np.mean([doctor.success_rate for doctor in doctors])
        avg_experience = np.mean([doctor.experience_years for doctor in doctors])
        
        # Normalize scores between 0 and 1
        rating_score = avg_rating / 5.0
        success_score = avg_success_rate
        experience_score = min(avg_experience / 20.0, 1.0)  # Cap at 20 years
        
        # Weighted combination of factors
        return 0.4 * rating_score + 0.4 * success_score + 0.2 * experience_score

    def get_recommendations(self, user_lat, user_lon, radius_km=10, min_beds=1):
        """
        Get hospital recommendations based on user location and criteria
        
        Parameters:
        - user_lat: float, user's latitude
        - user_lon: float, user's longitude
        - radius_km: float, search radius in kilometers
        - min_beds: int, minimum number of available beds required
        
        Returns:
        - List of tuples (hospital, score) sorted by score
        """
        try:
            # Get all hospitals with available beds
            hospitals = Hospital.objects.filter(available_beds__gte=min_beds)
            
            if not hospitals:
                logger.warning("No hospitals found with the specified criteria")
                return []
            
            recommendations = []
            
            for hospital in hospitals:
                # Calculate distance score
                distance_score = self._calculate_distance_score(
                    user_lat, user_lon, 
                    hospital.latitude, hospital.longitude
                )
                
                # Skip hospitals outside the radius
                if distance_score < 1 / (1 + radius_km):
                    continue
                
                # Calculate quality score
                quality_score = self._calculate_quality_score(hospital)
                
                # Calculate final score (weighted average)
                final_score = 0.6 * distance_score + 0.4 * quality_score
                
                recommendations.append((hospital, final_score))
            
            # Sort by score in descending order
            recommendations.sort(key=lambda x: x[1], reverse=True)
            
            return recommendations[:10]  # Return top 10 recommendations
            
        except Exception as e:
            logger.error(f"Error generating hospital recommendations: {str(e)}")
            return []