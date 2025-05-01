from typing import List, Dict, Any, Optional
from math import radians, cos, sin, asin, sqrt
import pandas as pd
import logging
from .doctor_recommender import DoctorRecommender

logger = logging.getLogger(__name__)

class LocationBasedDoctorRecommender(DoctorRecommender):
    def __init__(self, distance_weight: float = 0.5, n_estimators: int = 100):  # Reduced from 0.7 to 0.5
        super().__init__(n_estimators=n_estimators)
        self.distance_weight = distance_weight
        self.max_search_radius = 50.0  # Maximum search radius in km

    def fit(self, doctors_data: List[Dict[str, Any]]) -> bool:
        """Override fit to ensure all required fields are present"""
        try:
            # Add defaults for required fields if missing
            processed_data = []
            for doc in doctors_data:
                doc_copy = doc.copy()
                if 'consultation_fee_inr' not in doc_copy:
                    doc_copy['consultation_fee_inr'] = doc_copy.get('fee', 500)  # Default fee
                if 'experience_years' not in doc_copy:
                    doc_copy['experience_years'] = doc_copy.get('experience', 0)
                processed_data.append(doc_copy)
            
            return super().fit(processed_data)
        except Exception as e:
            logger.error(f"LocationBasedDoctorRecommender training failed: {str(e)}")
            return False

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        """
        # convert decimal degrees to radians 
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # haversine formula 
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        r = 6371  # Radius of earth in kilometers
        return c * r

    def _calculate_location_score(self, distance_km: float, max_distance: float = 30.0) -> float:
        """Calculate location score with stronger distance penalties"""
        if distance_km >= max_distance:
            return 0.0
            
        # More aggressive distance-based scoring
        if distance_km <= 2.0:  # Very nearby doctors get highest priority
            return 1.0
        elif distance_km <= 5.0:
            return 0.9
        elif distance_km <= 10.0:
            return 0.7
        elif distance_km <= 15.0:
            return 0.5
        else:
            # Steeper linear decay for further distances
            return max(0.0, 0.5 * (1 - (distance_km - 15) / (max_distance - 15)))

    def recommend_doctors(
        self,
        user_latitude: float,
        user_longitude: float,
        query: str = "",
        specialization: str = None,
        min_score: float = 0.5,  # Reduced from 0.7 to allow more results
        limit: int = None,
        max_distance_km: float = 30.0
    ) -> List[Dict[str, Any]]:
        """Recommend doctors prioritizing both location and medical relevance equally"""
        if self.doctors_df is None or len(self.doctors_df) == 0:
            logger.error("No doctors data available")
            return []

        try:
            # Calculate distances for all doctors
            self.doctors_df['distance_km'] = self.doctors_df.apply(
                lambda row: self._haversine_distance(
                    user_latitude, user_longitude,
                    float(row.get('latitude', 0)),
                    float(row.get('longitude', 0))
                ), axis=1
            )

            # First filter by maximum distance but allow expansion if no results
            df = self.doctors_df[self.doctors_df['distance_km'] <= max_distance_km].copy()
            
            if len(df) == 0:
                # Gradually expand search radius if no results
                expanded_distance = min(max_distance_km * 1.5, self.max_search_radius)
                df = self.doctors_df[self.doctors_df['distance_km'] <= expanded_distance].copy()

            if len(df) == 0:
                return []

            # Filter by specialization if specified
            if specialization:
                specialization_match = df['specialization'].str.lower().str.contains(specialization.lower())
                df = df[specialization_match]

            if len(df) == 0:
                return []

            # Calculate scores for each doctor
            results = []
            for idx, row in df.iterrows():
                distance_km = row['distance_km']
                location_score = self._calculate_location_score(distance_km, max_distance_km)
                
                # Calculate medical relevance score with enhanced matching
                similarity_score = self._calculate_disease_similarity(query, row.get('conditions_treated', [])) if query else 1.0

                # Allow very nearby doctors with moderate relevance
                if similarity_score < min_score and distance_km > 10.0:
                    continue

                rating_score = float(row.get('rating', 0)) / 5.0
                experience_score = min(float(row.get('experience_years', 0)) / 15.0, 1.0)
                success_score = float(row.get('success_rate', 0)) / 100.0
                
                # Equal weighting between location and medical factors
                composite_score = (
                    self.distance_weight * location_score +
                    (1 - self.distance_weight) * (
                        0.5 * similarity_score +     # Medical relevance still important
                        0.2 * rating_score +         # Consider doctor quality
                        0.2 * experience_score +     # Value experience
                        0.1 * success_score         # Include success rate
                    )
                )

                # More lenient inclusion criteria
                if composite_score >= min_score or (distance_km <= 10.0 and similarity_score >= 0.3):
                    doc_data = row.to_dict()
                    doc_data.update({
                        'composite_score': round(composite_score, 3),
                        'location_score': round(location_score, 3),
                        'similarity_score': round(similarity_score, 3),
                        'rating_score': round(rating_score, 3),
                        'experience_score': round(experience_score, 3),
                        'success_score': round(success_score, 3),
                        'distance_km': round(distance_km, 2)
                    })
                    results.append(doc_data)

            # Sort results with balanced consideration
            results.sort(key=lambda x: (
                -x['similarity_score'] * 0.5 - (1 - x['distance_km']/max_distance_km) * 0.5,  # Balance relevance and distance
                -x['composite_score']  # Use composite as tiebreaker
            ))
            
            return results if limit is None else results[:limit]

        except Exception as e:
            logger.error(f"Error in recommend_doctors: {str(e)}")
            return []

class LocationBasedHospitalRecommender:
    def __init__(self, hospitals_df: pd.DataFrame, max_distance_km: float = 20.0):
        self.hospitals_df = hospitals_df
        self.max_distance_km = max_distance_km

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        """
        # convert decimal degrees to radians 
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # haversine formula 
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        r = 6371  # Radius of earth in kilometers
        return c * r

    def _calculate_location_score(self, distance_km: float) -> float:
        """
        Calculate a score based on distance, with closer hospitals getting higher scores.
        Score decreases linearly from 1.0 (at 0 km) to 0.0 (at max_distance_km or beyond)
        """
        if distance_km >= self.max_distance_km:
            return 0.0
        return 1.0 - (distance_km / self.max_distance_km)

    def recommend_hospitals(
        self,
        user_latitude: float,
        user_longitude: float,
        specialization: str = None,
        min_score: float = 0.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend hospitals based on proximity and specialization
        
        Args:
            user_latitude: User's latitude
            user_longitude: User's longitude
            specialization: Hospital specialization to filter by (optional)
            min_score: Minimum location score threshold
            limit: Maximum number of recommendations to return
        
        Returns:
            List of hospital recommendations sorted by location score and distance
        """
        if self.hospitals_df is None or len(self.hospitals_df) == 0:
            logger.error("No hospitals data available")
            return []

        df = self.hospitals_df

        # Filter by specialization if specified
        if specialization:
            df = df[df['specialization'].str.lower() == specialization.lower()]

        results = []

        # Calculate distances and location scores
        df['distance_km'] = df.apply(
            lambda row: self._haversine_distance(
                user_latitude, user_longitude,
                float(row.get('latitude', 0)),
                float(row.get('longitude', 0))
            ), axis=1
        )

        for idx, row in df.iterrows():
            distance_km = row['distance_km']
            if distance_km > self.max_distance_km:
                continue

            location_score = self._calculate_location_score(distance_km)

            if location_score >= min_score:
                hospital_data = row.to_dict()
                hospital_data.update({
                    'location_score': location_score,
                    'distance_km': round(distance_km, 2)
                })
                results.append(hospital_data)

        # Sort by location score descending and distance ascending
        results.sort(key=lambda x: (-x['location_score'], x['distance_km']))

        return results[:limit]
