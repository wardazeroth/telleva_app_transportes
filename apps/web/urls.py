from django.urls import path,include
from . import views
from django.contrib.auth.views import LoginView, LogoutView

urlpatterns = [
    path('', views.mapa_cliente, name='mapa_cliente'),
    path('index/', views.index, name='index'),
    path('mapa/', views.mapa_cliente, name='mapa_cliente'),
    path('api/', include('apps.api.urls')), 
    path('nueva_ruta/', views.nueva_ruta, name='nueva_ruta'),
    path('registro/', views.RegistroView.as_view(), name='registro'),
    path('login/', LoginView.as_view(), name= 'login'),
    path('logout/', LogoutView.as_view(next_page= 'login'), name= 'logout'),
    path('usuarios/', views.get_usuarios, name='get_usuarios'),
    path('obtener_ruta/', views.obtener_ruta, name='obtener_ruta'),
    
    # PUEDE ELIMINARSE
    path('recomendar_rutas/', views.recomendar_rutas, name='recomendar_rutas')
]

