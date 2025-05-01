import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, MultiLabelBinarizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import pickle
import logging
from typing import List, Dict, Any, Optional, Union
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import os

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')

logger = logging.getLogger(__name__)

class DoctorRecommender:
    """A recommendation system for doctors based on conditions and specializations."""
    
    def __init__(self, n_estimators: int = 100):
        """Initialize the recommender system."""
        self.classifier = None
        self.feature_transformer = None
        self.mlb = None
        self.doctors_df = None
        self.numeric_features = ['experience_years', 'rating', 'patients_treated', 'consultation_fee_inr']
        self.categorical_features = ['specialization']
        self.n_estimators = n_estimators
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))

    def preprocess_text(self, text: str) -> str:
        """Preprocess text by tokenizing, removing stopwords, and lemmatizing."""
        if not isinstance(text, str):
            return ""
        tokens = word_tokenize(text.lower())
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens if token not in self.stop_words]
        return " ".join(tokens)

    def fit(self, doctors_data: List[Dict[str, Any]]) -> None:
        """Train the recommendation model using the provided doctors data."""
        try:
            self.doctors_df = pd.DataFrame(doctors_data)
            
            # Preprocess conditions_treated
            self.doctors_df['conditions_treated'] = self.doctors_df['conditions_treated'].apply(
                lambda x: [self.preprocess_text(str(c)) for c in (x if isinstance(x, list) else [])]
            )
            
            # Initialize MultiLabelBinarizer for conditions
            self.mlb = MultiLabelBinarizer()
            conditions_matrix = self.mlb.fit_transform(self.doctors_df['conditions_treated'])
            
            # Create feature transformer
            numeric_transformer = Pipeline([
                ('scaler', StandardScaler())
            ])
            
            self.feature_transformer = ColumnTransformer(
                transformers=[
                    ('num', numeric_transformer, self.numeric_features)
                ],
                remainder='passthrough'
            )
            
            # Prepare features
            X = self.feature_transformer.fit_transform(self.doctors_df[self.numeric_features + self.categorical_features])
            y = conditions_matrix
            
            # Train classifier
            self.classifier = RandomForestClassifier(
                n_estimators=self.n_estimators,
                random_state=42,
                n_jobs=-1
            )
            self.classifier.fit(X, y)
            
            logger.info("Model trained successfully")
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def recommend_doctors(
        self,
        query: str,
        specialization: Optional[str] = None,
        limit: int = 10,
        page: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Recommend doctors based on a query condition and optional specialization.
        
        Args:
            query: The condition or symptoms to search for
            specialization: Optional specialization to filter by
            limit: Maximum number of recommendations to return
            page: Page number for pagination
            
        Returns:
            List of recommended doctors with their details
        """
        try:
            if self.classifier is None or self.doctors_df is None:
                logger.error("Model not trained")
                return []
                
            # Preprocess query
            processed_query = self.preprocess_text(query)
            
            # Get all conditions
            all_conditions = self.mlb.classes_
            
            # Find matching conditions
            matching_conditions = [c for c in all_conditions if processed_query in c]
            if not matching_conditions:
                logger.info(f"No exact matches found for query: {query}")
                return []
                
            # Get condition indices
            condition_indices = [list(all_conditions).index(c) for c in matching_conditions]
            
            # Get current doctor features
            X = self.feature_transformer.transform(self.doctors_df[self.numeric_features + self.categorical_features])
            
            # Get probability scores for matching conditions
            proba_scores = self.classifier.predict_proba(X)
            
            # Calculate average probability across matching conditions
            avg_scores = np.mean([proba_scores[i][:, idx] for i, idx in enumerate(condition_indices)], axis=0)
            
            # Get doctor indices sorted by probability
            doctor_indices = np.argsort(avg_scores)[::-1]
            
            # Apply specialization filter if provided
            if specialization:
                spec_mask = self.doctors_df['specialization'].str.lower() == specialization.lower()
                doctor_indices = doctor_indices[spec_mask[doctor_indices]]
            
            # Apply pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_indices = doctor_indices[start_idx:end_idx]
            
            # Get recommended doctors
            recommendations = self.doctors_df.iloc[paginated_indices].to_dict('records')
            
            # Add relevance scores
            for i, rec in enumerate(recommendations):
                rec['relevance_score'] = float(avg_scores[paginated_indices[i]])
                rec['matched_conditions'] = [c for c in matching_conditions if c in rec['conditions_treated']]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []

    def save(self, filepath: str) -> None:
        """Save the model and related components to a file."""
        try:
            data = {
                'classifier': self.classifier,
                'feature_transformer': self.feature_transformer,
                'mlb': self.mlb,
                'doctors_df': self.doctors_df,
                'numeric_features': self.numeric_features,
                'categorical_features': self.categorical_features,
                'n_estimators': self.n_estimators
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(data, f)
                
            logger.info(f"Model saved successfully to {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load(self, filepath: str) -> None:
        """Load the model and related components from a file."""
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                self.classifier = data['classifier']
                self.feature_transformer = data['feature_transformer']
                self.mlb = data['mlb']
                self.doctors_df = data['doctors_df']
                self.numeric_features = data.get('numeric_features', ['experience_years', 'rating', 'patients_treated', 'consultation_fee_inr'])
                self.categorical_features = data.get('categorical_features', ['specialization'])
                self.n_estimators = data.get('n_estimators', 100)
            logger.info(f"Model loaded successfully from {filepath}")
        except Exception as e:
            logger.error(f"Failed to load model from {filepath}: {e}")
            raise
