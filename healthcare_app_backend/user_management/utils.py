import requests
from django.conf import settings

def get_coordinates_from_address(address):
    """
    Convert an address to latitude and longitude using Nominatim (OpenStreetMap) geocoding service.
    Returns a tuple of (latitude, longitude) or (None, None) if geocoding fails.
    """
    try:
        # Using Nominatim geocoding service (free, no API key required)
        base_url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'limit': 1
        }
        headers = {
            'User-Agent': 'HealthcareApp/1.0'  # Required by Nominatim's terms of use
        }
        
        response = requests.get(base_url, params=params, headers=headers)
        response.raise_for_status()
        
        results = response.json()
        if results:
            return float(results[0]['lat']), float(results[0]['lon'])
        return None, None
        
    except Exception as e:
        print(f"Geocoding error: {str(e)}")
        return None, None