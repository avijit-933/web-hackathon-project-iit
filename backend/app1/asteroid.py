# app1/asteroid.py
import requests
from django.http import JsonResponse

def fetch_asteroids(request):
    """
    Returns asteroid data in JSON format for JS dashboard.
    """
    API_KEY = "Mo5HsMJ9eZmh6lTyvgz23IVL6aBlAKORc12tMJ2i"  # Replace with your NASA API key
    url = f"https://api.nasa.gov/neo/rest/v1/feed?api_key={API_KEY}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    asteroids = []

    for date, objects in data.get("near_earth_objects", {}).items():
        for obj in objects:
            asteroids.append({
                "id": obj["id"],
                "name": obj["name"],
                "diameter": round(obj["estimated_diameter"]["kilometers"]["estimated_diameter_max"], 3),
                "distance": round(float(obj["close_approach_data"][0]["miss_distance"]["astronomical"]), 5),
                "velocity": round(float(obj["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"]), 2),
                "hazardous": obj["is_potentially_hazardous_asteroid"]
            })

    return JsonResponse(asteroids, safe=False)
