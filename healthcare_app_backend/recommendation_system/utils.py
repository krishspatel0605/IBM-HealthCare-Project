import pickle
from typing import Any, Dict, List
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def save_model(model: Any, filepath: str) -> bool:
    """
    Save the trained model to a file with all fields
    
    Args:
        model: Trained model instance
        filepath: Path to save the model
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump({
                'classifier': model.classifier,
                'feature_transformer': model.feature_transformer,
                'mlb': model.mlb,
                'doctors_df': model.doctors_df,
                'numeric_features': model.numeric_features,
                'categorical_features': model.categorical_features,
                'n_estimators': model.n_estimators,
                'cv_scores': getattr(model, 'cv_scores', None),
                'feature_importances_': getattr(model, 'feature_importances_', None),
                'condition_weights_history': getattr(model, 'condition_weights_history', {})
            }, f)
        logger.info(f"Model saved successfully to {filepath}")
        return True
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        return False

def load_model(filepath: str) -> Any:
    """
    Load a trained model from file
    
    Args:
        filepath: Path to the saved model
        
    Returns:
        Loaded model instance
    """
    try:
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            
        # Return the raw data dictionary
        return data
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return None

def preprocess_doctor_data(doctor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Preprocess a single doctor's data for the recommendation system
    """
    processed = doctor.copy()
    
    # Ensure numeric fields are float/int with consistent naming
    try:
        # Use experience_years consistently instead of experience
        processed['experience_years'] = float(doctor.get('experience_years', doctor.get('experience', 0)))
        processed['rating'] = float(doctor.get('rating', 0))
        processed['patients_treated'] = int(doctor.get('patients_treated', 0))
        processed['consultation_fee_inr'] = float(doctor.get('consultation_fee_inr', doctor.get('fee', 500)))
        processed['success_rate'] = float(doctor.get('success_rate', doctor.get('rating', 0)) / 5.0 * 100)
    except (ValueError, TypeError):
        processed['experience_years'] = 0.0
        processed['rating'] = 0.0
        processed['patients_treated'] = 0
        processed['consultation_fee_inr'] = 500.0
        processed['success_rate'] = 0.0
    
    # Ensure conditions_treated is a list
    conditions = doctor.get('conditions_treated', [])
    if isinstance(conditions, str):
        conditions = [c.strip() for c in conditions.split(',')]
    processed['conditions_treated'] = conditions
    
    # Ensure specialization is a string
    processed['specialization'] = str(doctor.get('specialization', ''))
    
    return processed

def batch_preprocess_doctors(doctors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Preprocess a batch of doctor records
    
    Args:
        doctors: List of doctor dictionaries
        
    Returns:
        List of preprocessed doctor records
    """
    return [preprocess_doctor_data(doc) for doc in doctors]

def get_model_path() -> str:
    """Get the path for saving/loading the model"""
    base_dir = Path(__file__).parent.parent
    models_dir = base_dir / 'models'
    return str(models_dir / 'doctor_recommender.pkl')