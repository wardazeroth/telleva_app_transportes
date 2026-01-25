from rest_framework import serializers
from .models import Ruta, Paradero, Transporte, Linea, AsignacionRuta, UserProfile, LineaUrlImagen
from django.contrib.gis.geos import Point
import json
from django.contrib.auth.models import User
from django.db import transaction

class RutaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = ['id', 'nombre', 'codigo']
        
class TransporteDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transporte
        fields = ['id', 'tipo', 'patente', 'tarifa_base', 'capacidad'] 
        
class LineaUrlImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineaUrlImagen
        fields = ('id', 'linea', 'url_imagen')

class LineaSerializer(serializers.ModelSerializer):
    imagenes = LineaUrlImagenSerializer(many=True, read_only=True)
    tipos_transporte = TransporteDetalleSerializer(many=True, read_only=True) 

    class Meta:
        model = Linea
        fields = ('id', 'nombre', 'codigo', 'descripcion', 'empresa', 'tipos_transporte', 'imagenes')
        

class TransporteSerializer(serializers.ModelSerializer):
    linea = LineaSerializer(read_only=True)  # anidar línea completa
    
    linea_id = serializers.PrimaryKeyRelatedField(
        queryset=Linea.objects.all(), 
        source='linea', 
        write_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Transporte
        fields = '__all__'        

class AsignacionRutaSerializer(serializers.ModelSerializer):
    # Lectura: nested de Transporte y Ruta
    transporte = TransporteSerializer(read_only=True)
    
    ruta = RutaSimpleSerializer(read_only=True)

    # Escritura: solo IDs
    transporte_id = serializers.PrimaryKeyRelatedField(
        queryset=Transporte.objects.all(),
        write_only=True,
        source='transporte'
    )
    ruta_id = serializers.PrimaryKeyRelatedField(
        queryset=Ruta.objects.all(),
        write_only=True,
        source='ruta'
    )

    class Meta:
        model = AsignacionRuta
        fields = (
            'id', 'transporte', 'ruta', 'transporte_id', 'ruta_id', 
            'fecha_recorrido', 'hora_salida', 'hora_llegada_estim'
        )

class RutaSerializer(serializers.ModelSerializer):
    # Sobrescribimos geometria para enviar JSON en vez de WKT String
    geometria = serializers.SerializerMethodField()
    
    # Agregamos los transportes (relación inversa related_name='transportes')
    transportes = AsignacionRutaSerializer(many=True, read_only=True)
    class Meta:
        model = Ruta
        fields = [
            'id', 'nombre', 'codigo', 'coordenadas', 
            'geometria', 'fecha_creacion', 'transportes'
        ]
    
    def get_geometria(self, obj):
        if obj.geometria:
            return json.loads(obj.geometria.geojson)
        return None

class ParaderoSerializer(serializers.ModelSerializer):
    # Lectura: rutas simplificadas
    rutas = serializers.SerializerMethodField()
    # Escritura: solo IDs
    rutas_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Ruta.objects.all(),
        write_only=True,
        source='rutas'
    )

    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()
    
    class Meta:
        model = Paradero
        fields = (
            'id', 'nombre', 'codigo', 'descripcion', 'latitud', 'longitud',
            'direccion', 'rutas', 'rutas_ids', 'activo', 'fecha_creacion'
        )
        read_only_fields = ('id', 'fecha_creacion')

    def get_rutas(self, obj):
        return [{"id": r.id, "nombre": r.nombre} for r in obj.rutas.all()]

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None
    
    def create(self, validated_data):
        request = self.context.get('request')
        lat = request.data.get('latitud')
        lon = request.data.get('longitud')
        if lat and lon:
            validated_data['ubicacion'] = Point(float(lon), float(lat), srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        lat = request.data.get('latitud')
        lon = request.data.get('longitud')
        if lat and lon:
            instance.ubicacion = Point(float(lon), float(lat), srid=4326)
        return super().update(instance, validated_data)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    pass_repeat = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'pass_repeat')

    def validate(self, data):
        if data['password'] != data['pass_repeat']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Este email ya está registrado"})
        return data

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password']
            )
            UserProfile.objects.create(user=user, rol='usuario')
        return user