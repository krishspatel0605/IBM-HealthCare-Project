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
        # Focus on medical features only
        self.numeric_features = ['experience_years', 'rating', 'patients_treated', 'fee']
        self.categorical_features = ['specialization']

    def _preprocess_conditions(self, conditions) -> List[str]:
        if not conditions:
            return []
        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(',')]
        return [str(c).lower().strip() for c in conditions]

    def _build_transformer(self):
        num_transformer = make_pipeline(StandardScaler())
        cat_transformer = make_pipeline(OneHotEncoder(handle_unknown='ignore'))

        return ColumnTransformer([
            ('num', num_transformer, self.numeric_features),
            ('cat', cat_transformer, self.categorical_features)
        ])

    def fit(self, doctors_data: List[Dict[str, Any]]) -> bool:
        try:
            df = pd.DataFrame(doctors_data)
            # Fix: Properly handle conditions_treated column
            if 'conditions_treated' not in df.columns:
                df['conditions_treated'] = [[]]
            df['conditions_treated'] = df['conditions_treated'].apply(self._preprocess_conditions)

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
            'experience_years': [0], 'rating': [0], 'patients_treated': [0],
            'fee': [0], 'specialization': [specialization or 'General']
        }
        return self.feature_transformer.transform(pd.DataFrame(dummy))

    def recommend_doctors(
        self,
        query: str,
        specialization: str = None,
        min_score: float = 0.1,
        limit: int = 6,
        page: int = 1,
        include_importance: bool = False,
        weights: Dict[str, float] = None
    ) -> Union[List[Dict[str, Any]], Dict[str, Any]]:
        if self.classifier is None:
            raise RuntimeError("Model not trained")

        query = query.lower().strip()
        try:
            # Try exact match first
            condition_idx = list(self.mlb.classes_).index(query)
        except ValueError:
            # If exact match fails, try partial match
            matches = [i for i, cond in enumerate(self.mlb.classes_) if query in cond]
            if matches:
                condition_idx = matches[0]  # Use the first matching condition
            else:
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
                    cond for cond in doc.get('conditions_treated', []) 
                    if query in str(cond).lower()
                ]
                results.append(doc)

        # Calculate variability for numeric features
        variability = {}
        for feature in ['experience_years', 'rating', 'patients_treated']:
            if feature in self.doctors_df.columns:
                values = self.doctors_df[feature].dropna()
                variability[feature] = values.std() if not values.empty else 0.0
            else:
                variability[feature] = 0.0

        total_variability = sum(variability.values())
        if total_variability > 0:
            variability = {k: v / total_variability for k, v in variability.items()}
        else:
            variability = {k: 0 for k in variability}

        feature_imp = self.get_feature_importances()
        total_importance = sum(feature_imp.values()) if feature_imp else 0
        norm_imp = {k: (v / total_importance) if total_importance > 0 else 0 for k, v in feature_imp.items() if k in ['experience_years', 'rating', 'patients_treated']}

        for doc in results:
            spec_match = (specialization and doc.get('specialization', '').lower() == specialization.lower())

            # Prioritize medical factors in scoring
            dynamic_weights = {
                'similarity': 0.4,  # Reduced from 0.6 to balance with other factors
                'experience_years': 0.3 * norm_imp.get('experience_years', 0) * variability.get('experience_years', 0) * min(doc.get('experience_years', 0)/15, 1),
                'rating': 0.2 * norm_imp.get('rating', 0) * variability.get('rating', 0) * (doc.get('rating', 0)/5),
                'patients_treated': 0.1 * norm_imp.get('patients_treated', 0) * variability.get('patients_treated', 0) * min(doc.get('patients_treated', 0)/1000, 1),
            }

            final_weights = weights or dynamic_weights
            doc['composite_score'] = sum([
                final_weights['similarity'] * doc['similarity_score'],
                final_weights['experience_years'],
                final_weights['rating'],
                final_weights['patients_treated']
            ])
            doc['weight_components'] = final_weights

        results = sorted(results, key=lambda x: -x['composite_score'])

        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_results = results[start_idx:end_idx]

        logger.info("Returning %d doctor recommendations for query: '%s', page: %d", len(paginated_results), query, page)
        return {'recommendations': paginated_results, 'feature_importance': feature_imp} if include_importance else paginated_results

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

    def save(self, filepath: str):
        """Save the model and related components to a file."""
        try:
            with open(filepath, 'wb') as f:
                pickle.dump({
                    'classifier': self.classifier,
                    'feature_transformer': self.feature_transformer,
                    'mlb': self.mlb,
                    'doctors_df': self.doctors_df,
                    'numeric_features': self.numeric_features,
                    'categorical_features': self.categorical_features,
                    'n_estimators': self.n_estimators
                }, f)
            logger.info(f"Model saved successfully to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save model to {filepath}: {e}")

    def load(self, filepath: str):
        """Load the model and related components from a file."""
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                self.classifier = data['classifier']
                self.feature_transformer = data['feature_transformer']
                self.mlb = data['mlb']
                self.doctors_df = data['doctors_df']
                self.numeric_features = data.get('numeric_features', ['experience', 'rating', 'patients_treated', 'fee'])
                self.categorical_features = data.get('categorical_features', ['specialization'])
                self.n_estimators = data.get('n_estimators', 100)
            logger.info(f"Model loaded successfully from {filepath}")
        except Exception as e:
            logger.error(f"Failed to load model from {filepath}: {e}")
