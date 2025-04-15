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

    def recommend_doctors(
        self,
        query: str,
        specialization: str = None,
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
