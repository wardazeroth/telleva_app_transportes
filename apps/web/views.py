
from django.shortcuts import render

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
# Las 2 primeras, solo para probar post sin formulario
from django.contrib import messages
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpRequest, JsonResponse
from apps.api.models import Ruta
from django.contrib.auth.models import User
from django.views import View
from django.contrib.auth.decorators import login_required   
from django.db import transaction, IntegrityError
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from apps.api.models import *
from apps.api.serializers import AsignacionRutaSerializer
import json, os
import requests
#postGis
# from django.contrib.gis.db.models.functions import Intersection, Length, Distance
from django.contrib.gis.geos import LineString
from django.db import connection


# Create your views here.

#Metodo provisorio para probar post sin formulario
@method_decorator(csrf_exempt, name='dispatch')
class RegistroView(View):
    def get(self, request: HttpRequest):
        return render(request, 'registration/registro.html')
    def post(self, request: HttpRequest):
        try:
            #parsear JSON (PRUEBAS)
            data = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            #Método oficial desde formulario template
            data = request.POST
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        pass_repeat = data.get('pass_repeat')
        if password != pass_repeat:
            return HttpResponse('Las contraseñas no coinciden')

        # Validar si el usuario ya existe
        if User.objects.filter(username=email).exists():
            messages.warning(request, 'El usuario ya existe')
            return redirect('/registro/')

        try:
            with transaction.atomic():
                # create_user de por sí guarda el usuario en bd
                User.objects.create_user(username=email, email=email, password=password)
        except IntegrityError:
            messages.warning(request, 'El usuario ya existe')
            return redirect('/registro/')

        messages.success(request, 'Usuario creado')
        return redirect('/')

@login_required
def index(request):
    # """Vista privada para staff."""
    # if not request.user.is_staff:
    #     return redirect('mapa_cliente')
    return render(request, 'index.html')

def nueva_ruta(request: HttpRequest):
    if request.method == 'POST':
        nueva_ruta = Ruta()
        nueva_ruta.origen = request.POST.get('origen')
        nueva_ruta.destino = request.POST.get('destino')
        nueva_ruta.guardar_coordenadas()
        nueva_ruta.save()
        return HttpResponse(f'Ruta guardada: {nueva_ruta.origen} a {nueva_ruta.destino}')
    else:
        return render(request, 'nueva_ruta.html')
    
def get_usuarios(request: HttpRequest):
    usuarios = User.objects.all() 
    return JsonResponse({'usuarios': list(usuarios.values('id', 'username', 'email'))})

def home(request):
    """Vista raíz: redirige según si el usuario está logueado o no"""
    if request.user.is_authenticated:
        # Si es admin va al panel index
        if request.user.is_staff or request.user.is_superuser:
            return redirect('index')
        # Si es usuario normal
        else:
            return redirect('mapa_cliente')
    # Si no esta logueado
    return redirect('mapa_cliente')

def mapa_cliente(request):
    """Vista pública solo de consulta"""
    return render(request, 'mapa_cliente.html')


def obtener_ruta(request):
    medio = request.GET.get('medio', 'driving-car')
    
    # Validar medio de transporte
    medios_validos = ['driving-car', 'foot-walking', 'cycling-regular', 'micro', 'colectivo']
    if medio not in medios_validos:
        return JsonResponse({"error": "Medio de transporte no válido"}, status=400)
    
    api_key = os.getenv('API_KEY_MAPS')
    if not api_key:
        return JsonResponse({"error": "API key no configurada"}, status=500)
    
    medio_api = 'driving-car' if medio == 'micro' or medio == 'colectivo' else medio
    
    url = f'https://api.openrouteservice.org/v2/directions/{medio_api}'

    url = f'https://api.openrouteservice.org/v2/directions/{medio}'
    
    medio_api = 'driving-car' if medio == 'micro' or medio == 'colectivo' else medio
    
    url = f'https://api.openrouteservice.org/v2/directions/{medio_api}'

    
    origen = request.GET.get('origen')
    destino = request.GET.get('destino')
    
    if not origen or not destino:
        return JsonResponse({"error": "Origen y destino son requeridos"}, status=400)
    
    # Validar formato de coordenadas
    try:
        origen_coords = origen.split(',')
        destino_coords = destino.split(',')
        if len(origen_coords) != 2 or len(destino_coords) != 2:
            raise ValueError("Formato inválido")
        float(origen_coords[0])
        float(origen_coords[1])
        float(destino_coords[0])
        float(destino_coords[1])
    except (ValueError, IndexError):
        return JsonResponse({"error": "Formato de coordenadas inválido. Use: lon,lat"}, status=400)
    
    params = {
        "api_key": api_key,
        "start": origen,
        "end": destino
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()  # Lanza excepción si hay error HTTP
        data = response.json()
        return JsonResponse(data)
    except requests.exceptions.Timeout:
        return JsonResponse({"error": "Tiempo de espera agotado al obtener la ruta"}, status=504)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Error al comunicarse con el servicio de rutas: {str(e)}"}, status=502)
    except Exception as e:
        return JsonResponse({"error": f"Error inesperado: {str(e)}"}, status=500)


# ESTA FUNCION PUEDE ELIMINARSE, SE DEJA SOLO COMO REFERENCIA DE USO DE SQL PURO
@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  
@permission_classes([])
def recomendar_rutas(request):
    try:
        coords = request.data.get('coordenadas', [])
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
            LIMIT 3;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, [geom_wkt, geom_wkt, geom_wkt, geom_wkt, geom_wkt])
            rows = cursor.fetchall()

        rutas = []
        for id_ruta, nombre, codigo, geojson, similitud, cobertura, orientacion in rows:
            transportes = AsignacionRuta.objects.filter(ruta_id=id_ruta)
            transportes_serializados = AsignacionRutaSerializer(transportes, many=True).data
            
            rutas.append({
                "id": id_ruta,
                "ruta": nombre,
                "codigo": codigo,
                "geometria": json.loads(geojson),
                "similitud": float(similitud),
                "cobertura": round(float(cobertura or 0), 4),
                "transportes": transportes_serializados
            })

        return Response(rutas)

    except Exception as e:
        print("ERROR recomendar_rutas:", e)
        return Response({"error": str(e)}, status=500)


###########################
# @csrf_exempt
# @api_view(['POST'])
# @authentication_classes([])  
# @permission_classes([])
# def recomendar_rutas(request): 
#     try:
#         coords = request.data.get('coordenadas', [])
#         geom_buscada = LineString(coords, srid=4326)
#         geom_wkt = geom_buscada.wkt

#         sql = """
#             SELECT id, nombre, codigo,
#                 ST_AsGeoJSON(geometria) AS geom,

#                 ST_Distance(
#                     ST_Simplify(geometria, 5),
#                     ST_Simplify(ST_GeomFromText(%s, 4326), 5)
#                 ) AS similitud,

#                 ST_Length(
#                     ST_Intersection(
#                         ST_Buffer(ST_GeomFromText(%s, 4326), 0.0009),
#                         ST_Buffer(geometria, 0.0009)
#                     )
#                 ) / NULLIF(
#                     ST_Length(ST_Buffer(ST_GeomFromText(%s, 4326), 0.0009)),
#                     0
#                 ) AS cobertura

#             FROM api_ruta
#             ORDER BY cobertura DESC, similitud ASC
#             LIMIT 3;
#         """

#         with connection.cursor() as cursor:
#             cursor.execute(sql, [geom_wkt, geom_wkt, geom_wkt])
#             rows = cursor.fetchall()

#         rutas = []
#         for id_ruta, nombre, codigo, geojson, similitud, cobertura in rows:
#             transportes = AsignacionRuta.objects.filter(ruta_id = id_ruta)
#             print("Ruta:", id_ruta, "Transportes encontrados:", transportes.count())
#             transportes_serializados = AsignacionRutaSerializer(transportes, many=True).data
            
#             rutas.append({
#                 "id": id_ruta,
#                 "ruta": nombre,
#                 "codigo": codigo,
#                 "geometria": json.loads(geojson),
#                 "similitud": float(similitud),
#                 "cobertura": round(float(cobertura or 0), 4),
#                 "transportes": transportes_serializados
#             })

#         return Response(rutas)

#     except Exception as e:
#         print("ERROR recomendar_rutas:", e)
#         return Response({"error": str(e)}, status=500)