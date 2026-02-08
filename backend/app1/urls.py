from django.urls import path
from . import views 

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    #path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
   
    #path('asteroid_api/', views.asteroid_api, name='dasteroid_api'),
   path('dashboard/', views.dashboard, name='dashboard'),  # your HTML page
    path('asteroids/', views.asteroid_api, name='asteroid_api'),  # JSON endpoint
   path('details/', views.AsteroidDetailsView.as_view(), name='details'),
   path('api/fetch-asteroid/', views.fetch_asteroid_api, name='fetch_asteroid_api'),
   path('analytics',views.analytics, name='analytics'),
   path('about',views.about, name = 'about')

]
