import os
import logging
from .utils import get_model_path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_model():
    """Delete the existing model file to force retraining"""
    try:
        model_path = get_model_path()
        if os.path.exists(model_path):
            os.remove(model_path)
            logger.info(f"Successfully deleted model file: {model_path}")
            return True
        else:
            logger.info(f"No model file found at: {model_path}")
            return False
    except Exception as e:
        logger.error(f"Error resetting model: {str(e)}")
        return False

if __name__ == "__main__":
    success = reset_model()
    if success:
        print("Model reset successfully. It will be retrained on the next request.")
    else:
        print("Failed to reset model or no model exists.") 