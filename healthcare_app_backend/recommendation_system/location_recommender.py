import numpy as np
from typing import List, Dict, Any, Optional
import logging
from geopy.distance import geodesic
import nltk
from nltk.tokenize import word_tokenize, RegexpTokenizer
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('stopwords')
    nltk.download('wordnet')

logger = logging.getLogger(__name__)

class LocationBasedRecommender:
    """Base class for location-based recommendations"""
    
    def __init__(self):
        """Initialize the recommender with required NLTK resources."""
        self.lemmatizer = WordNetLemmatizer()
        try:
            self.stop_words = set(stopwords.words('english'))
        except LookupError:
            nltk.download('stopwords')
            self.stop_words = set(stopwords.words('english'))
        self.tokenizer = RegexpTokenizer(r'\w+')
        self.items = []

    def preprocess_text(self, text: str) -> str:
        """Preprocess text by tokenizing, removing stopwords, and lemmatizing."""
        if not isinstance(text, str):
            return ""
        try:
            # Use simple regexp tokenizer instead of punkt
            tokens = self.tokenizer.tokenize(text.lower())
            tokens = [self.lemmatizer.lemmatize(token) for token in tokens if token not in self.stop_words]
            return " ".join(tokens)
        except Exception as e:
            logger.error(f"Error in text preprocessing: {str(e)}")
            return text.lower()  # Fallback to simple lowercase if tokenization fails

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers."""
        return geodesic((lat1, lon1), (lat2, lon2)).kilometers

    def calculate_similarity_score(self, item: Dict[str, Any], query: str = None) -> float:
        """Calculate similarity score between item and query. Override in subclasses."""
        raise NotImplementedError

    def get_recommendations(
        self,
        user_latitude: float,
        user_longitude: float,
        query: Optional[str] = None,
        max_distance_km: float = 20.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recommendations sorted by distance and relevance."""
        try:
            recommendations = []
            
            for item in self.items:
                # Calculate distance
                distance = self.calculate_distance(
                    user_latitude,
                    user_longitude,
                    item['latitude'],
                    item['longitude']
                )
                
                # Skip if too far
                if distance > max_distance_km:
                    continue
                    
                # Calculate similarity score
                similarity = self.calculate_similarity_score(item, query)
                
                # Combine distance and similarity scores
                # Distance score decreases with distance (inverse relationship)
                distance_score = 1 / (1 + distance)
                final_score = 0.7 * similarity + 0.3 * distance_score
                
                recommendations.append({
                    **item,
                    'distance_km': round(distance, 2),
                    'relevance_score': round(final_score, 3)
                })
            
            # Sort by final score descending
            recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []

class LocationBasedDoctorRecommender(LocationBasedRecommender):
    """Location-based doctor recommendations."""
    
    def fit(self, doctors_data: List[Dict[str, Any]]) -> None:
        """Process doctor data for recommendations."""
        self.items = []
        for doc in doctors_data:
            processed_doc = {
                **doc,
                'conditions_treated': [
                    self.preprocess_text(str(c)) 
                    for c in (doc.get('conditions_treated', []) or [])
                ],
                'specialization': self.preprocess_text(doc.get('specialization', ''))
            }
            self.items.append(processed_doc)

    def calculate_similarity_score(self, doctor: Dict[str, Any], query: str = None) -> float:
        """Calculate similarity between doctor and query."""
        if not query:
            return 1.0  # No query means all doctors are equally relevant
            
        query = self.preprocess_text(query)
        
        # Check specialization match
        spec_match = float(query in doctor['specialization'])
        
        # Check conditions match
        conditions_match = float(
            any(query in condition for condition in doctor['conditions_treated'])
        )
        
        # Consider experience and rating
        experience_score = min(doctor.get('experience_years', 0) / 20.0, 1.0)  # Cap at 20 years
        rating_score = doctor.get('rating', 0) / 5.0  # Assuming 5-star rating system
        
        # Combine scores with weights
        return 0.3 * spec_match + 0.3 * conditions_match + 0.2 * experience_score + 0.2 * rating_score

    def recommend_doctors(
        self,
        user_latitude: float,
        user_longitude: float,
        query: Optional[str] = None,
        specialization: Optional[str] = None,
        max_distance_km: float = 20.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get doctor recommendations based on location and query."""
        if specialization:
            query = specialization if not query else f"{query} {specialization}"
            
        return self.get_recommendations(
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            query=query,
            max_distance_km=max_distance_km,
            limit=limit
        )

class LocationBasedHospitalRecommender(LocationBasedRecommender):
    """Location-based hospital recommendations."""
    
    def fit(self, hospitals_data: List[Dict[str, Any]]) -> None:
        """Process hospital data for recommendations."""
        self.items = []
        for hospital in hospitals_data:
            processed_hospital = {
                **hospital,
                'diseases_treated': [
                    self.preprocess_text(str(d)) 
                    for d in (hospital.get('diseases_treated', []) or [])
                ],
                'specialization': self.preprocess_text(hospital.get('specialization', ''))
            }
            self.items.append(processed_hospital)

    def calculate_similarity_score(self, hospital: Dict[str, Any], query: str = None) -> float:
        """Calculate similarity between hospital and query."""
        if not query:
            return 1.0
            
        query = self.preprocess_text(query)
        
        # Check specialization match
        spec_match = float(query in hospital['specialization'])
        
        # Check diseases match
        diseases_match = float(
            any(query in disease for disease in hospital['diseases_treated'])
        )
        
        # Consider bed availability and doctor count
        bed_score = min(hospital.get('available_beds', 0) / 100.0, 1.0)  # Cap at 100 beds
        doctor_score = min(len(hospital.get('doctors', [])) / 20.0, 1.0)  # Cap at 20 doctors
        
        # Combine scores with weights
        return 0.3 * spec_match + 0.3 * diseases_match + 0.2 * bed_score + 0.2 * doctor_score

    def recommend_hospitals(
        self,
        user_latitude: float,
        user_longitude: float,
        query: Optional[str] = None,
        max_distance_km: float = 20.0,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get hospital recommendations based on location and query."""
        return self.get_recommendations(
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            query=query,
            max_distance_km=max_distance_km,
            limit=limit
        )
