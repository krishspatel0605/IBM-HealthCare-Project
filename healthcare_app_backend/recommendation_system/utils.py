import pickle
from typing import Any, Dict, List
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def save_model(model: Any, filepath: str) -> bool:
    """
    Save the trained model to a file
    
    Args:
        model: Trained model instance
        filepath: Path to save the model
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
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
            model = pickle.load(f)
        logger.info(f"Model loaded successfully from {filepath}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return None

def preprocess_doctor_data(doctor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Preprocess a single doctor's data for the recommendation system
    
    Args:
        doctor: Dictionary containing doctor information
        
    Returns:
        Preprocessed doctor data
    """
    processed = doctor.copy()
    
    # Ensure numeric fields are float/int
    try:
        processed['experience'] = float(doctor.get('experience', 0))
        processed['rating'] = float(doctor.get('rating', 0))
        processed['patients_treated'] = int(doctor.get('patients_treated', 0))
    except (ValueError, TypeError):
        processed['experience'] = 0.0
        processed['rating'] = 0.0
        processed['patients_treated'] = 0
    
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