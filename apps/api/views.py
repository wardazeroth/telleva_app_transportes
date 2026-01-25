from rest_framework import viewsets, status
from .models import Ruta, Paradero, Transporte, Linea, AsignacionRuta, LineaUrlImagen
from .serializers import RutaSerializer, ParaderoSerializer, TransporteSerializer, LineaSerializer, AsignacionRutaSerializer, UserRegistrationSerializer, LineaUrlImagenSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import LineString, Point
from django.contrib.gis.measure import D
from django.db import connection
import json
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser
from django.contrib.auth.models import User

# Vista que maneja las operaciones CRUD de las rutas
class RutasAPI(viewsets.ModelViewSet):
    queryset = Ruta.objects.all().order_by('-fecha_creacion')
    serializer_class = RutaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def recomendar(self, request):
        try:
            coords = request.data.get('coordenadas', [])
            tipo_transporte = request.data.get('tipo_transporte', 'driving-car') # Default

            # --- Bloqueo para modos privados ---
            # Si el usuario no está buscando explícitamente micros, no se devuelve nada.
            if tipo_transporte != 'micro' and tipo_transporte != 'colectivo':
                return Response([]) 
            
            
            # Crear geometrías de Origen y Destino del usuario
            puntos_usuario = [Point(c[0], c[1], srid=4326) for c in coords]
            origen_usuario = puntos_usuario[0]
            destino_usuario = puntos_usuario[-1]

            geom_buscada = LineString(coords, srid=4326)
            geom_wkt = geom_buscada.wkt

            sql = """
                SELECT id, nombre, codigo,
                    ST_AsGeoJSON(geometria) AS geom,
                    ST_Distance(
                        ST_Simplify(geometria, 5),
                        ST_Simplify(ST_GeomFromText(%s, 4326), 5)
                    ) AS similitud,
                    ST_Length(
                        ST_Intersection(
                            ST_Buffer(ST_GeomFromText(%s, 4326), 0.0009),
                            ST_Buffer(geometria, 0.0009)
                        )
                    ) / NULLIF(
                        ST_Length(ST_Buffer(ST_GeomFromText(%s, 4326), 0.0009)),
                        0
                    ) AS cobertura,
                    GREATEST(
                        0,
                        ST_LineLocatePoint(geometria, ST_EndPoint(ST_GeomFromText(%s, 4326)))
                        -
                        ST_LineLocatePoint(geometria, ST_StartPoint(ST_GeomFromText(%s, 4326)))
                    ) AS orientacion
                FROM api_ruta
                ORDER BY orientacion DESC, cobertura DESC, similitud ASC
                LIMIT 5; 
            """

            with connection.cursor() as cursor:
                cursor.execute(sql, [geom_wkt, geom_wkt, geom_wkt, geom_wkt, geom_wkt])
                rows = cursor.fetchall()

            rutas = []
            for id_ruta, nombre, codigo, geojson, similitud, cobertura, orientacion in rows:
                
                # --- Filtro estricto por tipo de transporte ---
                transportes = AsignacionRuta.objects.filter(
                    ruta_id=id_ruta, 
                    transporte__tipo= tipo_transporte
                )
                
                # Si esta ruta geométrica no tiene micros asociadas, se omite
                if not transportes.exists():
                    continue
                
                # Obtener todos los paraderos de esta ruta
                paraderos_ruta = Paradero.objects.filter(rutas__id=id_ruta)
                
                if not paraderos_ruta.exists():
                    continue

                # 1. Buscar paradero más cercano al Origen del usuario
                paradero_subida = min(paraderos_ruta, key=lambda p: p.ubicacion.distance(origen_usuario))
                
                # 2. Buscar paradero más cercano al Destino del usuario
                paradero_bajada = min(paraderos_ruta, key=lambda p: p.ubicacion.distance(destino_usuario))

                # Serializamos los paraderos clave
                subida_data = {
                    "id": paradero_subida.id,
                    "nombre": paradero_subida.nombre,
                    "lat": paradero_subida.ubicacion.y,
                    "lon": paradero_subida.ubicacion.x
                }
                bajada_data = {
                    "id": paradero_bajada.id,
                    "nombre": paradero_bajada.nombre,
                    "lat": paradero_bajada.ubicacion.y,
                    "lon": paradero_bajada.ubicacion.x
                }

                transportes_serializados = AsignacionRutaSerializer(transportes, many=True).data
                
                rutas.append({
                    "ruta": nombre,
                    "geometria": json.loads(geojson),
                    "similitud": float(similitud),
                    "cobertura": round(float(cobertura or 0), 4),
                    "transportes": transportes_serializados,
                    "paraderos_clave": {
                        "subida": subida_data,
                        "bajada": bajada_data
                    }
                })

            return Response(rutas)

        except Exception as e:
            print("ERROR recomendar_rutas:", e)
            return Response({"error": str(e)}, status=500)

class ParaderoAPI(viewsets.ModelViewSet):
    queryset = Paradero.objects.all().order_by('-fecha_creacion')
    serializer_class = ParaderoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
class TransporteAPI(viewsets.ModelViewSet):
    queryset = Transporte.objects.all().order_by('-fecha_creacion')
    serializer_class = TransporteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
class AsignacionRutaAPI(viewsets.ModelViewSet):
    queryset = AsignacionRuta.objects.all().order_by('-fecha_creacion')
    serializer_class = AsignacionRutaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
class LineaAPI(viewsets.ModelViewSet):
    queryset = Linea.objects.all().order_by('codigo')
    serializer_class = LineaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class LineaUrlImagenAPI(viewsets.ModelViewSet):
    queryset = LineaUrlImagen.objects.all().order_by('linea')
    serializer_class = LineaUrlImagenSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado exitosamente"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardStatsAPI(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = {
            "rutas": Ruta.objects.count(),
            "paraderos": Paradero.objects.count(),
            "transportes": Transporte.objects.count(),
            "usuarios": User.objects.count(),
        }
        return Response(stats)