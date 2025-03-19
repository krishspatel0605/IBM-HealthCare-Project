import numpy as np
# Modified imports to avoid ComplexWarning issue
try:
    from sklearn.neighbors import NearestNeighbors
    from sklearn.preprocessing import StandardScaler, MultiLabelBinarizer
except ImportError:
    # Fallback for newer numpy versions where ComplexWarning might not be available
    import warnings
    warnings.warn("Using simplified implementation due to sklearn import error")
    NearestNeighbors = None
    StandardScaler = None
    MultiLabelBinarizer = None

import pandas as pd
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleRecommender:
    """
    A simple recommendation system based on filtering and sorting
    """
    def __init__(self):
        self.doctors_df = None
        
    def fit(self, doctors_data: List[Dict[str, Any]]) -> None:
        """Load the doctor data into a DataFrame"""
        self.doctors_df = pd.DataFrame(doctors_data)
        # Ensure numeric fields are properly formatted
        for field in ['experience', 'rating', 'fee']:
            if field in self.doctors_df.columns:
                self.doctors_df[field] = pd.to_numeric(self.doctors_df[field], errors='coerce').fillna(0)
        logger.info(f"Simple recommender loaded with {len(self.doctors_df)} doctors")
    
    def recommend_doctors(self, 
                         query: str, 
                         sort_by: str = "experience", 
                         limit: int = 10) -> List[Dict[str, Any]]:
        """
        Recommends doctors based on filtering and sorting
        
        Args:
            query: The disease/condition to search for
            sort_by: Sorting criteria - "experience", "rating", or "fee"
            limit: Maximum number of doctors to return
            
        Returns:
            List of recommended doctors
        """
        if self.doctors_df is None or len(self.doctors_df) == 0:
            logger.warning("No doctor data available for recommendations")
            return []
        
        # Normalize the sort_by parameter
        sort_by = sort_by.lower() if sort_by else "experience"
        
        # Convert query to lowercase for case-insensitive matching
        query_lower = query.lower()
        
        try:
            # Filter doctors who treat the given condition
            # First ensure conditions_treated is in string format for filtering
            self.doctors_df['conditions_str'] = self.doctors_df['conditions_treated'].apply(
                lambda x: ','.join(x) if isinstance(x, list) else str(x)
            )
            
            # Filter doctors
            matching_docs = self.doctors_df[
                self.doctors_df['conditions_str'].str.lower().str.contains(query_lower, na=False) |
                self.doctors_df['specialization'].str.lower().str.contains(query_lower, na=False)
            ]
            
            if len(matching_docs) == 0:
                logger.info(f"No doctors found for condition: {query}")
                return []
            
            # Sort doctors based on the chosen criteria
            if sort_by == "experience":
                sorted_docs = matching_docs.sort_values(
                    by=["experience", "rating"], 
                    ascending=[False, False]
                )
            elif sort_by == "rating":
                sorted_docs = matching_docs.sort_values(
                    by=["rating", "experience"], 
                    ascending=[False, False]
                )
            elif sort_by == "fee":
                sorted_docs = matching_docs.sort_values(
                    by=["fee"], 
                    ascending=[True]  # Lower fee preferred
                )
            else:
                # Default to experience
                sorted_docs = matching_docs.sort_values(
                    by=["experience", "rating"], 
                    ascending=[False, False]
                )
            
            # Convert to list of dictionaries
            recommendations = sorted_docs.head(limit).to_dict('records')
            
            # Add matched conditions and similarity score
            for doctor in recommendations:
                conditions = doctor.get('conditions_treated', [])
                if isinstance(conditions, str):
                    conditions = [c.strip() for c in conditions.split(',')]
                
                # Find matching conditions
                matched_conditions = [
                    cond for cond in conditions
                    if query_lower in cond.lower()
                ]
                
                doctor['matched_conditions'] = matched_conditions
                doctor['similarity_score'] = 1.0 if matched_conditions else 0.5
                
                # Clean up temporary field
                if 'conditions_str' in doctor:
                    del doctor['conditions_str']
            
            logger.info(f"Found {len(recommendations)} recommendations with simple filtering")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in simple recommendation: {str(e)}")
            return []

class DoctorRecommender:
    def __init__(self, n_neighbors: int = 20):
        """
        Initialize the DoctorRecommender with KNN model
        
        Args:
            n_neighbors (int): Number of neighbors to consider for KNN
        """
        self.n_neighbors = n_neighbors
        self.simple_recommender = SimpleRecommender()
        
        # Check if sklearn components are available
        if NearestNeighbors is None or StandardScaler is None or MultiLabelBinarizer is None:
            logger.warning("Scikit-learn components not available - using simple recommender only")
            self.use_sklearn = False
        else:
            # Initialize sklearn components
            self.knn_model = NearestNeighbors(
                n_neighbors=n_neighbors,
                metric='cosine',
                algorithm='brute'
            )
            self.scaler = StandardScaler()
            self.mlb = MultiLabelBinarizer()
            self.use_sklearn = True
            
        self.feature_names = []
        self.doctors_df = None
        
    def _preprocess_conditions(self, conditions: List[str]) -> List[str]:
        """Preprocess conditions to standardize format"""
        if not conditions:
            return []
        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(',')]
        return [c.lower().strip() for c in conditions]
    
    def _create_feature_matrix(self, doctors_data: List[Dict[str, Any]]) -> np.ndarray:
        """
        Create a feature matrix from doctors data
        
        Args:
            doctors_data: List of doctor dictionaries
            
        Returns:
            Feature matrix as numpy array
        """
        if not self.use_sklearn:
            # If sklearn isn't available, return empty matrix
            return np.array([])
            
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(doctors_data)
        self.doctors_df = df.copy()
        
        # Preprocess conditions treated
        df['conditions_treated'] = df['conditions_treated'].apply(self._preprocess_conditions)
        
        # Create binary features for conditions
        conditions_matrix = self.mlb.fit_transform(df['conditions_treated'])
        conditions_df = pd.DataFrame(
            conditions_matrix,
            columns=[f'treats_{c}' for c in self.mlb.classes_]
        )
        
        # Create binary features for specialization
        specialization_dummies = pd.get_dummies(
            df['specialization'],
            prefix='spec'
        )
        
        # Numeric features to scale
        numeric_features = ['experience', 'rating']
        # Add fee if available
        if 'fee' in df.columns:
            numeric_features.append('fee')
        # Add patients_treated if available
        if 'patients_treated' in df.columns:
            numeric_features.append('patients_treated')
            
        numeric_df = df[numeric_features].fillna(0)
        
        # Scale numeric features
        scaled_numeric = self.scaler.fit_transform(numeric_df)
        scaled_numeric_df = pd.DataFrame(
            scaled_numeric,
            columns=numeric_features
        )
        
        # Combine all features
        feature_matrix = pd.concat([
            scaled_numeric_df,
            conditions_df,
            specialization_dummies
        ], axis=1)
        
        self.feature_names = feature_matrix.columns.tolist()
        return feature_matrix.values
    
    def fit(self, doctors_data: List[Dict[str, Any]]) -> None:
        """
        Fit the KNN model with doctors data
        
        Args:
            doctors_data: List of doctor dictionaries containing:
                - name
                - specialization
                - conditions_treated
                - experience
                - rating
                - patients_treated (optional)
                - fee (optional)
        """
        try:
            # Always fit the simple recommender as a fallback
            self.simple_recommender.fit(doctors_data)
            
            # Only attempt sklearn model fit if available
            if self.use_sklearn:
                logger.info("Creating feature matrix for %d doctors", len(doctors_data))
                feature_matrix = self._create_feature_matrix(doctors_data)
                
                if feature_matrix.size > 0:
                    logger.info("Fitting KNN model with feature matrix of shape %s", feature_matrix.shape)
                    self.knn_model.fit(feature_matrix)
                    logger.info("KNN model fitted successfully")
                else:
                    logger.warning("Empty feature matrix, KNN model not fitted")
            
        except Exception as e:
            logger.error("Error fitting KNN model: %s", str(e))
            logger.info("Will use simple recommender instead")
    
    def _get_query_features(self, query: str, specialization: str = None) -> np.ndarray:
        """Create feature vector for a query"""
        if not self.use_sklearn:
            # Return empty array if sklearn isn't available
            return np.array([])
            
        # Initialize zero vector
        query_vector = np.zeros(len(self.feature_names))
        
        # Process query conditions
        query_conditions = [query.lower().strip()]
        query_conditions_matrix = self.mlb.transform([query_conditions])
        
        # Get condition feature indices
        condition_features = [
            i for i, name in enumerate(self.feature_names)
            if name.startswith('treats_')
        ]
        
        # Set condition features
        query_vector[condition_features] = query_conditions_matrix[0]
        
        # Set specialization feature if provided
        if specialization:
            spec_feature = f'spec_{specialization}'
            if spec_feature in self.feature_names:
                spec_idx = self.feature_names.index(spec_feature)
                query_vector[spec_idx] = 1
        
        return query_vector.reshape(1, -1)
    
    def recommend_doctors(
        self,
        query: str,
        specialization: str = None,
        sort_by: str = None,
        min_score: float = 0.1,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend doctors based on query condition and optional specialization
        
        Args:
            query: Condition or disease to search for
            specialization: Optional specialization to filter by
            sort_by: Sorting criteria - "experience", "rating", "fee", or "similarity" (default)
            min_score: Minimum similarity score threshold
            limit: Maximum number of recommendations to return
            
        Returns:
            List of recommended doctors with similarity scores
        """
        # If sklearn isn't available, use simple recommender directly
        if not self.use_sklearn:
            logger.info("Using simple recommender as sklearn components aren't available")
            return self.simple_recommender.recommend_doctors(
                query=query, 
                sort_by=sort_by or "experience", 
                limit=limit
            )
            
        try:
            # Get query features
            query_vector = self._get_query_features(query, specialization)
            
            # Find nearest neighbors
            distances, indices = self.knn_model.kneighbors(query_vector)
            
            # Convert distances to similarity scores (1 - distance)
            similarities = 1 - distances.flatten()
            
            # Filter by minimum score
            valid_indices = similarities >= min_score
            recommended_indices = indices.flatten()[valid_indices]
            scores = similarities[valid_indices]
            
            # Get recommended doctors
            recommendations = []
            for idx, score in zip(recommended_indices, scores):
                doctor = self.doctors_df.iloc[idx].to_dict()
                doctor['similarity_score'] = float(score)
                doctor['matched_conditions'] = [
                    cond for cond in doctor['conditions_treated']
                    if query.lower() in cond.lower()
                ]
                recommendations.append(doctor)
            
            # Sort based on criteria
            if sort_by:
                sort_by = sort_by.lower()
                
                if sort_by == "experience":
                    recommendations.sort(key=lambda x: (-x.get('experience', 0), -x.get('rating', 0)))
                elif sort_by == "rating":
                    recommendations.sort(key=lambda x: (-x.get('rating', 0), -x.get('experience', 0)))
                elif sort_by == "fee":
                    recommendations.sort(key=lambda x: x.get('fee', float('inf')))
                else:
                    # Default to similarity score
                    recommendations.sort(key=lambda x: -x['similarity_score'])
            else:
                # Default to similarity score
                recommendations.sort(key=lambda x: -x['similarity_score'])
            
            # Limit results
            recommendations = recommendations[:limit]
            
            logger.info(
                "Found %d KNN recommendations for query '%s'",
                len(recommendations),
                query
            )
            
            # If KNN fails to find good recommendations, fall back to simple recommender
            if not recommendations:
                logger.info("KNN found no recommendations, falling back to simple filtering")
                return self.simple_recommender.recommend_doctors(
                    query=query, 
                    sort_by=sort_by or "experience", 
                    limit=limit
                )
                
            return recommendations
            
        except Exception as e:
            logger.error("Error in KNN recommendations: %s", str(e))
            # Fall back to simple recommender
            logger.info("Falling back to simple filtering due to KNN error")
            return self.simple_recommender.recommend_doctors(
                query=query,
                sort_by=sort_by or "experience",
                limit=limit
            ) 