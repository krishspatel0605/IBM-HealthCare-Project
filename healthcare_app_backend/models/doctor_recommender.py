import numpy as np
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from skopt import BayesSearchCV
from skopt.space import Real, Integer
from Doctor.models import Doctor
from sklearn.model_selection import train_test_split
import logging
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
from math import radians, sin, cos, sqrt, atan2
from .hospital_recommender import HospitalRecommender
from django.db.models import Q

logger = logging.getLogger(__name__)

class DoctorRecommender:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = None
        self.feature_importance = None
        self.disease_embeddings = defaultdict(list)
        self.hospital_recommender = HospitalRecommender()
        
    def _preprocess_data(self, doctors):
        """Preprocess doctor data into feature matrix"""
        features = []
        for doctor in doctors:
            # Basic features
            doctor_features = [
                float(doctor.experience_years),
                float(doctor.rating),
                float(doctor.patients_treated),
                float(doctor.consultation_fee_inr),
                float(doctor.success_rate)
            ]
            features.append(doctor_features)
            
        return np.array(features)
    
    def _create_disease_embeddings(self, doctors):
        """Create disease embeddings based on doctor specializations"""
        disease_doctor_matrix = defaultdict(list)
        
        for doctor in doctors:
            conditions = doctor.conditions_treated
            if isinstance(conditions, str):
                conditions = [c.strip() for c in conditions.split(',')]
            elif not conditions:
                conditions = []
                
            for condition in conditions:
                disease_doctor_matrix[condition.lower()].append(doctor.id)
                
        return disease_doctor_matrix
    
    def _calculate_disease_similarity(self, query_disease, doctor):
        """Calculate similarity between query disease and doctor's conditions"""
        if not query_disease:
            return 1.0
            
        query_disease = query_disease.lower().strip()
        
        # Get doctor's conditions as lowercase list
        if isinstance(doctor.conditions_treated, str):
            doctor_conditions = [c.strip().lower() for c in doctor.conditions_treated.split(',')]
        else:
            doctor_conditions = [str(c).strip().lower() for c in doctor.conditions_treated] if doctor.conditions_treated else []
            
        # Exact match
        if query_disease in doctor_conditions:
            return 1.0
            
        # Partial matches
        for condition in doctor_conditions:
            if query_disease in condition or condition in query_disease:
                return 0.8
                
        # Consider specialization
        if doctor.specialization.lower() in query_disease or query_disease in doctor.specialization.lower():
            return 0.6
                
        return 0.2  # Base similarity for specialists
    
    def train_model(self):
        """Train the XGBoost model with Bayesian optimization"""
        try:
            # Get all doctors
            doctors = Doctor.objects.all()
            if not doctors:
                logger.warning("No doctors found in database")
                return False
                
            # Prepare features
            X = self._preprocess_data(doctors)
            if len(X) == 0:
                logger.warning("No valid features extracted from doctors")
                return False
                
            # Create synthetic target variable based on rating and success_rate
            y = np.array([d.rating * d.success_rate for d in doctors])
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Define search space for Bayesian optimization
            search_space = {
                'learning_rate': Real(0.01, 0.3),
                'max_depth': Integer(3, 10),
                'n_estimators': Integer(100, 500),
                'min_child_weight': Integer(1, 7),
                'subsample': Real(0.6, 1.0),
                'colsample_bytree': Real(0.6, 1.0)
            }
            
            # Initialize XGBoost model
            base_model = xgb.XGBRegressor(
                objective='reg:squarederror',
                random_state=42
            )
            
            # Bayesian optimization
            optimizer = BayesSearchCV(
                base_model,
                search_space,
                n_iter=20,
                cv=5,
                scoring='neg_mean_squared_error',
                random_state=42
            )
            
            # Fit the model
            optimizer.fit(X_train_scaled, y_train)
            
            # Save the best model
            self.model = optimizer.best_estimator_
            
            # Calculate feature importance
            self.feature_importance = self.model.feature_importances_
            
            # Create disease embeddings
            self.disease_embeddings = self._create_disease_embeddings(doctors)
            
            # Calculate and log model performance
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"Model trained successfully. Train R2: {train_score:.3f}, Test R2: {test_score:.3f}")
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return False
    
    def get_recommendations(self, query_disease=None, user_lat=None, user_lon=None, limit=10, radius_km=10):
        """
        Get doctor recommendations based on disease and location
        
        Parameters:
        - query_disease: str, the disease/condition to find doctors for
        - user_lat: float, user's latitude (optional)
        - user_lon: float, user's longitude (optional)
        - limit: int, maximum number of recommendations to return
        - radius_km: float, search radius in kilometers
        """
        try:
            if not self.model:
                if not self.train_model():
                    return []

            # First get nearby hospitals if location is provided
            nearby_hospitals = []
            if user_lat and user_lon:
                hospital_recommendations = self.hospital_recommender.get_recommendations(
                    user_lat=user_lat,
                    user_lon=user_lon,
                    radius_km=radius_km
                )
                nearby_hospitals = [hospital for hospital, _ in hospital_recommendations]

            # Get doctors from nearby hospitals or all doctors if no location
            if nearby_hospitals:
                doctors = Doctor.objects.filter(hospital__in=nearby_hospitals)
            else:
                doctors = Doctor.objects.all()

            if query_disease:
                # Use Q objects for more flexible disease/condition matching
                query_disease = query_disease.lower().strip()
                doctors = doctors.filter(
                    Q(conditions_treated__icontains=query_disease) |
                    Q(specialization__icontains=query_disease)
                )

            # If no doctors found at all, return empty list
            if not doctors.exists():
                return []

            recommendations = []
            X = self._preprocess_data(doctors)
            if len(X) == 0:
                return []

            X_scaled = self.scaler.transform(X)
            base_scores = self.model.predict(X_scaled)

            for doctor, base_score in zip(doctors, base_scores):
                # Calculate disease relevance score
                disease_score = self._calculate_disease_similarity(query_disease, doctor)
                
                # Calculate location score
                location_score = 1.0
                if user_lat and user_lon and doctor.hospital:
                    R = 6371  # Earth's radius in km
                    lat1, lon1 = radians(float(user_lat)), radians(float(user_lon))
                    lat2, lon2 = radians(float(doctor.hospital.latitude)), radians(float(doctor.hospital.longitude))
                    
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * atan2(sqrt(a), sqrt(1-a))
                    distance = R * c
                    
                    # Smoother distance scoring using sigmoid-like function
                    location_score = 1 / (1 + (distance / (radius_km/2))**2)
                
                # Calculate hospital quality score
                hospital_score = 0.5  # Default if no hospital
                if doctor.hospital:
                    hospital_score = self.hospital_recommender._calculate_quality_score(doctor.hospital)
                
                # Calculate final score with weights
                final_score = (
                    0.4 * disease_score +     # Disease relevance
                    0.4 * location_score +    # Location proximity
                    0.2 * hospital_score      # Hospital quality
                ) * base_score                # Scaled by model prediction
                
                recommendations.append((doctor, final_score))
            
            # Sort by score and return top recommendations
            recommendations.sort(key=lambda x: x[1], reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []