from typing import List, Dict, Any, Optional
from math import radians, cos, sin, asin, sqrt
import pandas as pd
import logging
from .doctor_recommender import DoctorRecommender

logger = logging.getLogger(__name__)

class LocationBasedDoctorRecommender(DoctorRecommender):
    def __init__(self, distance_weight: float = 0.6, n_estimators: int = 100):
        super().__init__(n_estimators=n_estimators)
        self.distance_weight = distance_weight

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

    def _calculate_location_score(self, distance_km: float, max_distance: float = 20.0) -> float:
        """
        Calculate a score based on distance, with closer locations getting higher scores.
        Score decreases linearly from 1.0 (at 0 km) to 0.0 (at max_distance km or beyond)
        """
        if distance_km >= max_distance:
            return 0.0
        return 1.0 - (distance_km / max_distance)

    def recommend_doctors(
        self,
        user_latitude: float,
        user_longitude: float,
        query: str = "",
        specialization: str = None,
        min_score: float = 0.0,
        limit: int = 10,
        max_distance_km: float = 20.0
    ) -> List[Dict[str, Any]]:
        """
        Recommend doctors with location as the primary factor, along with other criteria
        
        Args:
            user_latitude: User's latitude
            user_longitude: User's longitude
            query: Condition or treatment to search for (optional)
            specialization: Doctor specialization to filter by (optional)
            min_score: Minimum composite score threshold
            limit: Maximum number of recommendations to return
            max_distance_km: Maximum distance to consider (km)
            
        Returns:
            List of doctor recommendations sorted by a composite score
        """
        if self.doctors_df is None or len(self.doctors_df) == 0:
            logger.error("No doctors data available")
            return []

        results = []
        
        # Calculate distances for all doctors
        self.doctors_df['distance_km'] = self.doctors_df.apply(
            lambda row: self._haversine_distance(
                user_latitude, user_longitude,
                float(row.get('latitude', 0)),
                float(row.get('longitude', 0))
            ), axis=1
        )

        # Filter by specialization if specified
        df = self.doctors_df
        if specialization:
            df = df[df['specialization'].str.lower() == specialization.lower()]

        # Calculate similarity scores if query is provided
        similarity_scores = None
        if query:
            try:
                condition_idx = list(self.mlb.classes_).index(query.lower().strip())
                X = self.feature_transformer.transform(df)
                similarity_scores = self.classifier.predict_proba(X)[condition_idx][:, 1]
            except (ValueError, AttributeError) as e:
                logger.warning(f"Could not calculate similarity scores: {e}")
                similarity_scores = [0.0] * len(df)

        # Calculate composite scores
        for idx, row in df.iterrows():
            distance_km = row['distance_km']
            if distance_km > max_distance_km:
                continue

            location_score = self._calculate_location_score(distance_km, max_distance_km)
            similarity_score = similarity_scores[idx] if similarity_scores is not None else 0.0
            
            # Calculate other scores
            rating_score = float(row.get('rating', 0)) / 5.0
            experience_score = min(float(row.get('experience_years', 0)) / 15.0, 1.0)
            
            # Weighted composite score with adjusted weights for better accuracy
            composite_score = (
                0.4 * location_score +
                0.4 * similarity_score +
                0.15 * rating_score +
                0.05 * experience_score
            )

            if composite_score >= min_score:
                doc_data = row.to_dict()
                doc_data.update({
                    'composite_score': composite_score,
                    'location_score': location_score,
                    'similarity_score': similarity_score,
                    'distance_km': round(distance_km, 2)
                })
                results.append(doc_data)

        # Sort by composite score and limit results
        results.sort(key=lambda x: (-x['composite_score'], x['distance_km']))
        return results[:limit]

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
