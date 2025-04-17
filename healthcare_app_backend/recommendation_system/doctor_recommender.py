<<<<<<< HEAD
from typing import List, Dict, Any, Union
import numpy as np
import pandas as pd
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MultiLabelBinarizer
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.multioutput import MultiOutputClassifier
from xgboost import XGBClassifier
from collections import defaultdict
from math import radians, cos, sin, asin, sqrt

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class DoctorRecommender:
    def __init__(self, n_estimators: int = 100):
        self.n_estimators = n_estimators
        self.classifier = None
        self.feature_transformer = None
        self.mlb = None
        self.doctors_df = None
        # Ensure these attributes are always defined
        self.numeric_features = ['experience', 'rating', 'patients_treated', 'fee']
        self.categorical_features = ['specialization']

    def _preprocess_conditions(self, conditions) -> List[str]:
=======
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
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
        if not conditions:
            return []
        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(',')]
<<<<<<< HEAD
        return [str(c).lower().strip() for c in conditions]

    def _build_transformer(self):
        num_transformer = make_pipeline(StandardScaler())
        cat_transformer = make_pipeline(OneHotEncoder(handle_unknown='ignore'))

        return ColumnTransformer([
            ('num', num_transformer, self.numeric_features),
            ('cat', cat_transformer, self.categorical_features)
        ])

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        return 2 * asin(sqrt(a)) * 6371  # Earth radius in km

    def fit(self, doctors_data: List[Dict[str, Any]]) -> bool:
        try:
            df = pd.DataFrame(doctors_data)
            df['conditions_treated'] = df.get('conditions_treated', [[]]).apply(self._preprocess_conditions)

            self.doctors_df = df.copy()
            self.mlb = MultiLabelBinarizer()
            y = self.mlb.fit_transform(df['conditions_treated'])

            self.feature_transformer = self._build_transformer()
            X = self.feature_transformer.fit_transform(df)

            model = XGBClassifier(
                n_estimators=self.n_estimators,
                importance_type='weight',
                use_label_encoder=False,
                eval_metric='logloss',
                n_jobs=-1,
                verbosity=0
            )
            self.classifier = MultiOutputClassifier(model, n_jobs=-1)
            self.classifier.fit(X, y)

            logger.info("Model trained successfully with %d doctors", len(df))
            return True

        except Exception as e:
            logger.error("Training failed: %s", str(e), exc_info=True)
            return False

    def _transform_query(self, specialization: str = None) -> np.ndarray:
        dummy = {
            'experience': [0], 'rating': [0], 'patients_treated': [0],
            'fee': [0], 'specialization': [specialization or 'General']
        }
        return self.feature_transformer.transform(pd.DataFrame(dummy))

=======
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
    
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    def recommend_doctors(
        self,
        query: str,
        specialization: str = None,
<<<<<<< HEAD
        user_latitude: float = None,
        user_longitude: float = None,
        sort_by: str = None,
        min_score: float = 0.1,
        limit: int = 6,
        page: int = 1,
        include_importance: bool = False,
        weights: Dict[str, float] = None
    ) -> Union[List[Dict[str, Any]], Dict[str, Any]]:
        if self.classifier is None:
            raise RuntimeError("Model not trained")

        try:
            condition_idx = list(self.mlb.classes_).index(query.lower().strip())
        except ValueError:
            logger.warning("Query condition '%s' not found in training set", query)
            return []

        X = self.feature_transformer.transform(self.doctors_df)
        y_probas = self.classifier.predict_proba(X)
        scores = y_probas[condition_idx][:, 1]

        results = []
        for i, score in enumerate(scores):
            if score >= min_score:
                doc = self.doctors_df.iloc[i].to_dict()
                doc['similarity_score'] = float(score)
                doc['matched_conditions'] = [
                    cond for cond in doc['conditions_treated'] if query.lower() in cond.lower()
                ]
                results.append(doc)

        if user_latitude is not None and user_longitude is not None:
            for doc in results:
                doc_lat, doc_lon = float(doc.get('latitude', 0)), float(doc.get('longitude', 0))
                doc['distance_km'] = self._haversine_distance(user_latitude, user_longitude, doc_lat, doc_lon)
            results.sort(key=lambda x: x['distance_km'])

        # Sort by medical priorities - prioritize Experience, Rating, Patients Treated explicitly
        results.sort(key=lambda x: (
            -x.get('experience', 0),
            -x.get('rating', 0),
            -x.get('patients_treated', 0)
        ))

        # Calculate variability (standard deviation) for numeric features - focus on main targeted fields
        variability = {}
        for feature in ['experience', 'rating', 'patients_treated']:
            if feature in self.doctors_df.columns:
                values = self.doctors_df[feature].dropna()
                variability[feature] = values.std() if not values.empty else 0.0
            else:
                variability[feature] = 0.0

        # Normalize variability to sum to 1 to avoid scale issues
        total_variability = sum(variability.values())
        if total_variability > 0:
            variability = {k: v / total_variability for k, v in variability.items()}
        else:
            variability = {k: 0 for k in variability}

        feature_imp = self.get_feature_importances()
        total_importance = sum(feature_imp.values()) if feature_imp else 0
        # Normalize importance only for main targeted fields
        norm_imp = {k: (v / total_importance) if total_importance > 0 else 0 for k, v in feature_imp.items() if k in ['experience', 'rating', 'patients_treated']}

        for doc in results:
            spec_match = (specialization and doc.get('specialization', '').lower() == specialization.lower())

            # Dynamic weights based on feature importance and variability - only main fields
            dynamic_weights = {
                'similarity': 0.6,  # increase weight on similarity
                'specialization': 0,  # remove specialization influence
                'experience': 0.2 * norm_imp.get('experience', 0) * variability.get('experience', 0) * min(doc.get('experience', 0)/15, 1),
                'rating': 0.15 * norm_imp.get('rating', 0) * variability.get('rating', 0) * (doc.get('rating', 0)/5),
                'patients_treated': 0.05 * norm_imp.get('patients_treated', 0) * variability.get('patients_treated', 0) * min(doc.get('patients_treated', 0)/1000, 1),
                'fee': 0  # remove fee influence
            }

            final_weights = weights or dynamic_weights

            doc['composite_score'] = sum([
                final_weights['similarity'] * doc['similarity_score'],
                final_weights['specialization'],
                final_weights['experience'],
                final_weights['rating'],
                final_weights['patients_treated'],
                final_weights['fee']
            ])
            doc['weight_components'] = final_weights

        results = sorted(results, key=lambda x: -x['composite_score'])

        # Implement pagination: show 'limit' results per page
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        logger.debug(f"Pagination parameters - page: {page}, limit: {limit}, start_idx: {start_idx}, end_idx: {end_idx}, total_results: {len(results)}")

        paginated_results = results[start_idx:end_idx]

        logger.info("Returning %d doctor recommendations for query: '%s', page: %d", len(paginated_results), query, page)

        return {'recommendations': paginated_results, 'feature_importance': feature_imp} if include_importance else paginated_results

    def recommend_nearest_doctors(self, user_latitude: float, user_longitude: float, limit: int = 10) -> List[Dict[str, Any]]:
        if self.doctors_df is None:
            logger.error("Doctors dataset is not available")
            return []

        self.doctors_df['distance_km'] = self.doctors_df.apply(
            lambda row: self._haversine_distance(
                user_latitude, user_longitude,
                float(row.get('latitude', 0)),
                float(row.get('longitude', 0))
            ), axis=1
        )
        nearest = self.doctors_df.sort_values('distance_km').head(limit)
        logger.info("Nearest doctors found: %d", len(nearest))
        return nearest.to_dict(orient='records')

    def get_feature_importances(self) -> Dict[str, float]:
        if self.classifier is None:
            return {}

        try:
            importances = self.classifier.estimators_[0].feature_importances_
            feature_names = (
                self.feature_transformer.transformers_[0][2] +
                list(self.feature_transformer.transformers_[1][1].named_steps['onehotencoder'].get_feature_names_out())
            )

            return {
                feat: float(importances[i])
                for i, feat in enumerate(feature_names)
                if i < len(importances)
            }
        except Exception as e:
            logger.error("Failed to compute feature importances: %s", str(e), exc_info=True)
            return {}
=======
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
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
