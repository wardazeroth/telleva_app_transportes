from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RutasAPI, ParaderoAPI, TransporteAPI, LineaAPI, LineaUrlImagenAPI, AsignacionRutaAPI, RegisterAPIView, DashboardStatsAPI
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.api.authentication.serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenViewBase
from apps.web.views import obtener_ruta

class CustomTokenObtainPairView(TokenViewBase):
    serializer_class = CustomTokenObtainPairSerializer

# crea las rutas automáticamente para /api/rutas/ sin definir cada URL a mano
router = DefaultRouter()

# controlador principal de la API para el modelo Ruta
# Permite hacer CRUD de rutas desde el frontend
router.register(r'rutas', RutasAPI, basename='ruta')
router.register(r'paraderos', ParaderoAPI, basename='paradero')
router.register(r'transportes', TransporteAPI, basename='transporte')
router.register(r'asignaciones_rutas', AsignacionRutaAPI, basename='asignacion_ruta')
router.register(r'lineas/imagenes', LineaUrlImagenAPI, basename='linea_url_imagen')
router.register(r'lineas', LineaAPI, basename='linea')

urlpatterns = [
    path('', include(router.urls)),
    # Endpoints para obtener y refrescar tokens JWT.
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), # obtener token de login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # refrescar token
    path('register/', RegisterAPIView.as_view(), name='register_api'),
    path('dashboard/stats/', DashboardStatsAPI.as_view(), name='dashboard_stats'),
    
    path('obtener_ruta/', obtener_ruta, name='api_obtener_ruta'),
]
