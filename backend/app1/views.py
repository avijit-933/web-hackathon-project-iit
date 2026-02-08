from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Register
import requests
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt

def home(request):
    return render(request, 'index.html')


def register_view(request):
    if request.method == "POST":
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        re_password = request.POST.get('re_password')

        if password != re_password:
            messages.error(request, "Passwords do not match")
            return redirect('register')

        if Register.objects.filter(email=email).exists():
            messages.error(request, "Email already registered")
            return redirect('register')

        Register.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password  # ⚠️ hash later
        )

        messages.success(request, "Registration successful. Please login.")
        return redirect('login')

    return render(request, 'register.html')


def login_view(request):
    if request.method == "POST":
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = Register.objects.get(email=email, password=password)
            request.session['user'] = user.email
            messages.success(request, "Login successful")
            return redirect('dashboard')

        except Register.DoesNotExist:
            messages.error(request, "Invalid email or password")

    return render(request, 'login.html')


def logout_view(request):
    request.session.flush()
    return redirect('login')

def dashboard(request):
    return render(request, 'dashboard.html')

def asteroid_api(request):
    API_KEY = "68qAj5eRO28O0LBVBJUS596b6kYwhHGsgkE4DgMQ"  # Replace with your NASA API key
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
                "diameter": round(
                    obj["estimated_diameter"]["kilometers"]["estimated_diameter_max"], 3
                ),
                "distance": round(
                    float(obj["close_approach_data"][0]["miss_distance"]["astronomical"]), 5
                ),
                "velocity": round(
                    float(obj["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"]), 2
                ),
                "hazardous": obj["is_potentially_hazardous_asteroid"]
            })

    return JsonResponse(asteroids, safe=False)
class AsteroidDetailsView(TemplateView):
    template_name = 'asteroate.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # You can pass initial data here if needed
        context['page_title'] = 'Asteroid Details - NEO Tracker'
        return context


@csrf_exempt
def fetch_asteroid_api(request):
    """API endpoint to fetch asteroid data (optional server-side implementation)"""
    if request.method == 'GET':
        asteroid_id = request.GET.get('id', '')
        api_key = '68qAj5eRO28O0LBVBJUS596b6kYwhHGsgkE4DgMQ'  # Use your NASA API key
        
        if not asteroid_id:
            return JsonResponse({'error': 'Asteroid ID required'}, status=400)
        
        try:
            # Make request to NASA API
            response = requests.get(
                f'https://api.nasa.gov/neo/rest/v1/neo/{asteroid_id}',
                params={'api_key': api_key}
            )
            
            if response.status_code == 200:
                data = response.json()
                return JsonResponse(data)
            else:
                return JsonResponse(
                    {'error': 'Failed to fetch asteroid data'}, 
                    status=response.status_code
                )
                
        except requests.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
def analytics(request):
    return render(request, 'analytics.html')

def about(request):
    return render(request,'about.html')