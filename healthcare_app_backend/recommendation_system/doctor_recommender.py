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


import pickle

class DoctorRecommender:
    def __init__(self, n_estimators: int = 100):
        self.n_estimators = n_estimators
        self.classifier = None
        self.feature_transformer = None
        self.mlb = None
        self.doctors_df = None
        self.numeric_features = [
            'experience_years', 
            'rating', 
            'patients_treated', 
            'consultation_fee_inr',
            'success_rate'
        ]
        self.categorical_features = ['specialization']
        self.cv_scores = None
        self.feature_importances_ = None

    def _preprocess_conditions(self, conditions) -> List[str]:
        """Enhanced condition preprocessing with medical term normalization"""
        if not conditions:
            return []
            
        if isinstance(conditions, str):
            conditions = [c.strip().lower() for c in conditions.split(',')]
            
        processed = []
        for condition in conditions:
            condition = str(condition).lower().strip()
            processed.append(condition)
            
            # Add parts for better partial matching
            parts = condition.split()
            if len(parts) > 1:
                processed.extend(parts)
                
                # Handle common medical terms and variations
                medical_terms = ['disease', 'syndrome', 'disorder', 'condition', 'infection']
                for term in medical_terms:
                    if term in parts:
                        # Add version without the medical term
                        processed.append(condition.replace(term, '').strip())
                        
                # Handle common prefixes/suffixes
                if 'chronic' in parts:
                    processed.append(condition.replace('chronic', '').strip())
                if 'acute' in parts:
                    processed.append(condition.replace('acute', '').strip())
                    
            # Add common abbreviations and alternates
            if 'diabetes' in condition:
                processed.extend(['dm', 't2dm', 't1dm'])
            elif 'hypertension' in condition:
                processed.extend(['htn', 'high bp', 'high blood pressure'])
            elif 'asthma' in condition:
                processed.append('respiratory disease')
                
        return list(set(processed))

    def _build_transformer(self):
        """Build enhanced feature transformer with better scaling"""
        num_transformer = make_pipeline(
            StandardScaler(with_mean=True, with_std=True)
        )
        cat_transformer = make_pipeline(
            OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        )

        return ColumnTransformer([
            ('num', num_transformer, self.numeric_features),
            ('cat', cat_transformer, self.categorical_features)
        ])

    def fit(self, doctors_data: List[Dict[str, Any]]) -> bool:
        """Fit model with cross-validation"""
        try:
            df = pd.DataFrame(doctors_data)
            
            # Handle missing fields
            df['conditions_treated'] = df['conditions_treated'].apply(self._preprocess_conditions)
            df['success_rate'] = df.get('success_rate', df['rating'] / 5.0)
            
            self.doctors_df = df.copy()
            self.mlb = MultiLabelBinarizer()
            y = self.mlb.fit_transform(df['conditions_treated'])

            self.feature_transformer = self._build_transformer()
            X = self.feature_transformer.fit_transform(df)

            # Use XGBoost with optimized parameters for logistic regression
            model = XGBClassifier(
                n_estimators=self.n_estimators,
                max_depth=5,
                learning_rate=0.1,
                objective='binary:logistic',
                base_score=0.5,  # Set base_score between 0 and 1
                scale_pos_weight=1,  # Balance positive and negative weights
                min_child_weight=1,
                gamma=0,
                subsample=0.8,
                colsample_bytree=0.8,
                importance_type='gain',
                use_label_encoder=False,
                eval_metric='logloss',
                n_jobs=-1,
                random_state=42,
                verbosity=0
            )
            
            self.classifier = MultiOutputClassifier(model, n_jobs=-1)
            
            # Perform cross-validation
            from sklearn.model_selection import cross_val_score
            self.cv_scores = cross_val_score(
                self.classifier, X, y,
                cv=5,
                scoring='accuracy'
            )
            
            # Train final model on full dataset
            self.classifier.fit(X, y)
            
            # Calculate feature importances
            self.feature_importances_ = self._calculate_feature_importance()
            
            logger.info(f"Model trained successfully with {len(df)} doctors. CV scores: {self.cv_scores.mean():.3f} (+/- {self.cv_scores.std() * 2:.3f})")
            return True

        except Exception as e:
            logger.error(f"Training failed: {str(e)}", exc_info=True)
            return False

    def _calculate_disease_similarity(self, query: str, conditions: List[str]) -> float:
        """Calculate semantic similarity between query and conditions"""
        if not query or not conditions:
            return 0.0
        
        query = query.lower().strip()
        
        # Get all relevant terms for the query condition
        query_parts = set(self._preprocess_conditions([query]))
        
        # First check for exact condition match
        for condition in conditions:
            condition = condition.lower().strip()
            if query == condition:
                return 1.0
            
        # Check if this is a known condition with specialization mapping
        specializations = self.get_specialization_terms(query)
        if specializations:
            # Check if any doctor's specialization matches
            max_similarity = 0.0
            for condition in conditions:
                condition = condition.lower().strip()
                
                # Direct match with condition
                if query in condition or condition in query:
                    return 0.95
                
                # Check if condition's specializations match query's specializations
                condition_specializations = self.get_specialization_terms(condition)
                if any(spec in specializations for spec in condition_specializations):
                    max_similarity = max(max_similarity, 0.9)
                    continue
                
                # Partial matching with more stringent requirements
                condition_parts = set(self._preprocess_conditions([condition]))
                
                # Calculate Jaccard similarity
                intersection = len(query_parts & condition_parts)
                union = len(query_parts | condition_parts)
                
                if intersection > 0:
                    # Require stronger overlap for a match
                    base_similarity = intersection / union
                    # Only give bonus if significant overlap
                    if base_similarity > 0.5:
                        term_bonus = min(0.15, 0.05 * intersection)
                        similarity = base_similarity + term_bonus
                        max_similarity = max(max_similarity, similarity)
            
            return max_similarity
            
        # For conditions without specialization mapping, require stricter matching
        max_similarity = 0.0
        for condition in conditions:
            condition = condition.lower().strip()
            condition_parts = set(self._preprocess_conditions([condition]))
            
            # Calculate overlap
            intersection = len(query_parts & condition_parts)
            union = len(query_parts | condition_parts)
            
            if intersection > 0:
                # Require at least 70% overlap for non-specialized conditions
                similarity = intersection / union
                if similarity >= 0.7:
                    max_similarity = max(max_similarity, similarity)
        
        return max_similarity

    def get_specialization_terms(self, condition: str) -> List[str]:
        """Get relevant medical specialization terms for a condition"""
        specialization_map = {
            'asthma': ['pulmonology', 'respiratory'],
            'diabetes': ['endocrinology', 'diabetology'],
            'heart': ['cardiology', 'cardiac'],
            'skin': ['dermatology'],
            'joint': ['orthopedic', 'rheumatology'],
            'brain': ['neurology'],
            'mental': ['psychiatry', 'psychology'],
            'cancer': ['oncology'],
            'kidney': ['nephrology'],
            'liver': ['hepatology', 'gastroenterology'],
            'eye': ['ophthalmology'],
            'ear': ['ent', 'otolaryngology'],
            'pregnancy': ['gynecology', 'obstetrics']
        }
        
        terms = []
        condition_lower = condition.lower()
        for key, specializations in specialization_map.items():
            if key in condition_lower:
                terms.extend(specializations)
        return terms

    def _calculate_feature_importance(self) -> Dict[str, float]:
        """Calculate normalized feature importances"""
        if not hasattr(self.classifier, 'estimators_'):
            return {}
            
        importances = np.mean([
            est.feature_importances_ 
            for est in self.classifier.estimators_
        ], axis=0)
        
        feature_names = (
            self.numeric_features +
            list(self.feature_transformer.named_transformers_['cat']
                .named_steps['onehotencoder']
                .get_feature_names_out(self.categorical_features))
        )
        
        # Normalize importances
        total = sum(importances)
        return {
            name: float(imp / total)
            for name, imp in zip(feature_names, importances)
        }

    def _validate_weights(self, weights: Dict[str, float]) -> Dict[str, float]:
        """Validate and normalize weights"""
        if not weights:
            return self._get_default_weights()
            
        # Ensure all required weights are present
        required_weights = {
            'disease_match', 'experience', 'rating', 
            'success_rate', 'patients'
        }
        
        for weight in required_weights:
            if weight not in weights:
                weights[weight] = self._get_default_weights()[weight]
                
        # Ensure weights are positive
        weights = {k: max(0.0, v) for k, v in weights.items()}
        
        # Normalize to sum to 1
        total = sum(weights.values())
        if total > 0:
            weights = {k: v/total for k, v in weights.items()}
        else:
            weights = self._get_default_weights()
            
        return weights

    def _get_default_weights(self) -> Dict[str, float]:
        """Get default weight configuration"""
        return {
            'disease_match': 0.45,  # Reduced from 0.75 to allow other factors more influence
            'experience': 0.20,     # Increased from 0.10
            'rating': 0.20,         # Increased from 0.08
            'success_rate': 0.10,   # Increased from 0.05
            'patients': 0.05        # Increased from 0.02
        }

    def _optimize_weights(self, condition: str) -> Dict[str, float]:
        """Optimize weights based on historical performance"""
        if not hasattr(self, 'condition_weights_history'):
            return self._get_default_weights()
            
        try:
            # Get historical weights for this condition
            condition_history = self.condition_weights_history.get(condition, {})
            if not condition_history:
                return self._get_default_weights()
            
            # Get relevant specializations
            specializations = self.get_specialization_terms(condition)
            if not specializations:
                return self._get_default_weights()
                
            # Filter doctors by matching specializations
            matching_docs = self.doctors_df[
                self.doctors_df['specialization'].str.lower().isin(
                    [s.lower() for s in specializations]
                )
            ]
            
            if matching_docs.empty:
                return self._get_default_weights()
                
            # Calculate performance metrics
            avg_success = matching_docs['success_rate'].mean()
            avg_rating = matching_docs['rating'].mean()
            avg_exp = matching_docs['experience_years'].mean()
            
            # Get base weights
            weights = self._get_default_weights()
            
            # Optimize based on performance patterns
            if avg_success > 90:  # Extremely high success rate
                weights['success_rate'] *= 1.5
                weights['experience'] *= 1.3
            elif avg_success > 85:  # High success rate
                weights['success_rate'] *= 1.3
                weights['experience'] *= 1.2
            
            if avg_exp > 15:  # Very experienced doctors
                weights['experience'] *= 1.4
                weights['disease_match'] *= 0.9
            elif avg_exp > 10:  # Experienced doctors
                weights['experience'] *= 1.2
                weights['disease_match'] *= 0.95
                
            if avg_rating > 4.7:  # Exceptional ratings
                weights['rating'] *= 1.5
                weights['disease_match'] *= 0.9
            elif avg_rating > 4.5:  # Very good ratings
                weights['rating'] *= 1.3
                weights['disease_match'] *= 0.95
                
            # Incorporate feature importances
            if self.feature_importances_:
                for feature, importance in self.feature_importances_.items():
                    if 'experience' in feature.lower():
                        weights['experience'] *= (1 + importance)
                    elif 'rating' in feature.lower():
                        weights['rating'] *= (1 + importance)
                    elif 'success' in feature.lower():
                        weights['success_rate'] *= (1 + importance)
                    elif 'patients' in feature.lower():
                        weights['patients'] *= (1 + importance)
            
            # Validate and normalize
            return self._validate_weights(weights)
            
        except Exception as e:
            logger.error(f"Error optimizing weights: {e}")
            return self._get_default_weights()

    def _calculate_condition_specific_weights(self, condition: str) -> Dict[str, float]:
        """Calculate dynamic weights based on the specific condition and historical data"""
        condition = condition.lower().strip()
        
        try:
            # Start with optimized weights
            weights = self._optimize_weights(condition)
            
            # Blend with historical weights if available
            if hasattr(self, 'condition_weights_history') and condition in self.condition_weights_history:
                historical_weights = self.condition_weights_history[condition]
                # 70-30 blend of historical and optimized weights
                for key in weights:
                    if key in historical_weights:
                        weights[key] = 0.7 * historical_weights[key] + 0.3 * weights[key]
            
            # Get relevant specializations for additional adjustments
            specializations = self.get_specialization_terms(condition)
            
            if specializations:
                matching_docs = self.doctors_df[
                    self.doctors_df['specialization'].str.lower().isin(
                        [s.lower() for s in specializations]
                    )
                ]
                
                if not matching_docs.empty:
                    # Calculate success metrics for final adjustments
                    recent_success = matching_docs.nlargest(5, 'success_rate')['success_rate'].mean()
                    if recent_success > 95:  # Exceptional recent performance
                        weights['success_rate'] *= 1.2
                        weights['disease_match'] *= 0.9
            
            # Store updated weights in history
            if not hasattr(self, 'condition_weights_history'):
                self.condition_weights_history = {}
            self.condition_weights_history[condition] = weights.copy()
            
            # Final validation
            return self._validate_weights(weights)
            
        except Exception as e:
            logger.error(f"Error calculating condition weights: {e}")
            return self._get_default_weights()

    def recommend_doctors(
        self,
        query: str,
        specialization: str = None,
        min_score: float = 0.7,  # Increased minimum score threshold from 0.1 to 0.7
        limit: int = None,
        weights: Dict[str, float] = None
    ) -> List[Dict[str, Any]]:
        """Get doctor recommendations with improved scoring"""
        if self.classifier is None:
            raise RuntimeError("Model not trained")

        query = query.lower().strip()
        
        # Use dynamic weights if not explicitly provided
        weights = weights or self._calculate_condition_specific_weights(query)
        
        results = []
        
        for _, doc in self.doctors_df.iterrows():
            # Enhanced disease matching
            disease_score = self._calculate_disease_similarity(query, doc.get('conditions_treated', []))
            
            # Also check specialization match
            if specialization:
                spec_match = (
                    specialization.lower() in doc.get('specialization', '').lower() or
                    doc.get('specialization', '').lower() in specialization.lower()
                )
                if spec_match:
                    disease_score = max(disease_score, 0.8)  # Boost score for matching specialization
            
            # Only include if meets minimum relevance
            if disease_score >= min_score:
                doc_dict = doc.to_dict()
                doc_dict['disease_match_score'] = disease_score
                
                # Calculate normalized component scores
                experience_score = min(doc_dict.get('experience_years', 0) / 20, 1.0)
                rating_score = doc_dict.get('rating', 0) / 5.0
                success_score = doc_dict.get('success_rate', 0) / 100
                patients_score = min(doc_dict.get('patients_treated', 0) / 2000, 1.0)
                
                # Calculate weighted composite score with more emphasis on disease match
                composite_score = (
                    weights['disease_match'] * disease_score +
                    weights['experience'] * experience_score +
                    weights['rating'] * rating_score +
                    weights['success_rate'] * success_score +
                    weights['patients'] * patients_score
                )
                
                doc_dict['composite_score'] = composite_score
                doc_dict['score_components'] = {
                    'disease_match': disease_score,
                    'experience': experience_score,
                    'rating': rating_score,
                    'success_rate': success_score,
                    'patients_treated': patients_score
                }
                
                results.append(doc_dict)
        
        # Sort by disease match score first, then composite score
        results.sort(key=lambda x: (-x['disease_match_score'], -x['composite_score']))
        
        # Return all results if no limit specified
        return results if limit is None else results[:limit]

    def save(self, filepath: str):
        """Save the enhanced model with feature importances"""
        try:
            with open(filepath, 'wb') as f:
                pickle.dump({
                    'classifier': self.classifier,
                    'feature_transformer': self.feature_transformer,
                    'mlb': self.mlb,
                    'doctors_df': self.doctors_df,
                    'numeric_features': self.numeric_features,
                    'categorical_features': self.categorical_features,
                    'n_estimators': self.n_estimators,
                    'cv_scores': self.cv_scores,
                    'feature_importances_': self.feature_importances_,  # Fixed field name
                    'condition_weights_history': getattr(self, 'condition_weights_history', {})  # Save historical weights
                }, f)
            logger.info(f"Model saved successfully to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to save model to {filepath}: {e}")
            return False

    def load(self, filepath: str):
        """Load the enhanced model with feature importances"""
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                self.classifier = data['classifier']
                self.feature_transformer = data['feature_transformer']
                self.mlb = data['mlb']
                self.doctors_df = data['doctors_df']
                self.numeric_features = data.get('numeric_features', self.numeric_features)
                self.categorical_features = data.get('categorical_features', self.categorical_features)
                self.n_estimators = data.get('n_estimators', 100)
                self.cv_scores = data.get('cv_scores')
                self.feature_importances_ = data.get('feature_importances_')  # Fixed field name
                self.condition_weights_history = data.get('condition_weights_history', {})  # Load historical weights
            logger.info(f"Model loaded successfully from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model from {filepath}: {e}")
            return False
