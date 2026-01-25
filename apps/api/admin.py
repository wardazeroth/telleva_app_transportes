from django.contrib import admin
from .models import Ruta, Paradero, UserProfile, Transporte, Linea, AsignacionRuta

@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'fecha_creacion')
    search_fields = ('nombre','')

@admin.register(Paradero)
class ParaderoAdmin(admin.ModelAdmin):
    list_display = ('id', 'codigo', 'nombre', 'direccion', 'activo')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'codigo', 'direccion')
    filter_horizontal = ('rutas',)
    
@admin.register(Transporte)
class TransporteAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'linea', 'fecha_creacion', 'patente')
    search_fields = ('tipo__tipo', 'linea__nombre', 'linea__empresa')
    
@admin.register(AsignacionRuta)
class AsignacionRutaAdmin(admin.ModelAdmin):
    list_display = ('id', 'transporte', 'ruta', 'fecha_recorrido', 'hora_salida', 'hora_llegada_estim')
    search_fields = ('transporte.linea.nombre', 'ruta.nombre')
    
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'rol')

@admin.register(Linea)
class LineaAdmin(admin.ModelAdmin):
    list_display = ('id', 'codigo', 'nombre', 'activo')  
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('codigo', 'nombre')