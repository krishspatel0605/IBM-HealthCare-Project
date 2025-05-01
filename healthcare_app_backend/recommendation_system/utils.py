import pickle
from typing import Any, Dict, List
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def save_model(model: Any, filepath: str) -> bool:
    """
    Save a trained model to file
    
    Args:
        model: The model instance to save
        filepath: Path where model should be saved
        
    Returns:
        bool: True if save successful, False otherwise
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
        Loaded model instance or None if loading fails
    """
    try:
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        logger.info(f"Model loaded successfully from {filepath}")
        return data
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return None

def preprocess_doctor_data(doctor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare doctor data for model training/prediction
    
    Args:
        doctor: Dictionary containing doctor information
        
    Returns:
        Preprocessed doctor data
    """
    try:
        processed = {
            'id': doctor.get('id'),
            'name': doctor.get('name', ''),
            'specialization': doctor.get('specialization', 'General').lower(),
            'experience_years': float(doctor.get('experience_years', 0)),
            'rating': float(doctor.get('rating', 4.0)),
            'patients_treated': int(doctor.get('patients_treated', 0)),
            'consultation_fee_inr': float(doctor.get('consultation_fee_inr', 500))
        }
        
        # Ensure conditions treated is a list of lowercase strings
        conditions = doctor.get('conditions_treated', [])
        if isinstance(conditions, str):
            conditions = [c.strip().lower() for c in conditions.split(',')]
        else:
            conditions = [str(c).strip().lower() for c in (conditions or [])]
        processed['conditions_treated'] = conditions
        
        return processed
        
    except Exception as e:
        logger.error(f"Error preprocessing doctor data: {str(e)}")
        return {}

def batch_preprocess_doctors(doctors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Preprocess a batch of doctor records
    
    Args:
        doctors: List of doctor dictionaries
        
    Returns:
        List of preprocessed doctor data
    """
    try:
        processed = []
        for doc in doctors:
            processed_doc = preprocess_doctor_data(doc)
            if processed_doc:  # Only include successfully processed records
                processed.append(processed_doc)
        return processed
    except Exception as e:
        logger.error(f"Error batch preprocessing doctors: {str(e)}")
        return []

def get_model_path() -> str:
    """
    Get the path for saving/loading the model
    
    Returns:
        String path to model file
    """
    try:
        base_dir = Path(__file__).resolve().parent.parent
        models_dir = base_dir / 'models'
        os.makedirs(models_dir, exist_ok=True)
        return str(models_dir / 'doctor_recommender.pkl')
    except Exception as e:
        logger.error(f"Error getting model path: {str(e)}")
        return 'doctor_recommender.pkl'  # Fallback to current directory