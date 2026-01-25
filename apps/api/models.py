from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import LineString, Point

class UserProfile(models.Model):
    roles =(('usuario', 'Usuario'), ('admin', 'Admin'))
    user = models.OneToOneField(User, related_name = 'usuario', on_delete=models.CASCADE)
    rol = models.CharField(max_length=255, choices=roles, default = 'usuario')
    
    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name} {(self.rol)}'

class Ruta(models.Model):
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=10, unique=True, null=True)
    coordenadas = ArrayField(
        base_field=models.JSONField(),
        help_text="Lista de pares [lat, lon]",
        blank=True,
        null=True
    )
    geometria = gis_models.LineStringField(srid=4326, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.codigo or ''} {self.nombre}"
    
    def save(self, *args, **kwargs):
        # Mejorar el manejo de errores aquí
        if self.coordenadas:
            try:
                puntos = [(c[1], c[0]) for c in self.coordenadas if len(c) == 2]
                if len(puntos) >= 2:
                    self.geometria = LineString(puntos, srid=4326)
            except Exception as e:
                print(f"Error generando geometría para ruta {self.nombre}: {e}")
        super().save(*args, **kwargs)

class Linea(models.Model):
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(max_length=10, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    empresa = models.CharField(max_length=100, unique=True, null=True)

    class Meta:
        verbose_name = "Línea"
        verbose_name_plural = "Líneas"
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
class LineaUrlImagen(models.Model):
    linea = models.ForeignKey(Linea, on_delete=models.CASCADE, related_name='imagenes')
    url_imagen = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"Imagen de {self.linea.nombre}"

class Transporte(models.Model):
    tipos = (('bus', 'Bus'), ('micro', 'Micro'), ('colectivo', 'Colectivo'), ('auto', 'Auto'), ('moto', 'Moto'))
    tipo = models.CharField(max_length=20, choices=tipos)
    descripcion = models.TextField(blank=True)
    linea = models.ForeignKey(Linea, on_delete=models.CASCADE, related_name='tipos_transporte', null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    tarifa_base = models.DecimalField(max_digits=6, decimal_places=2, null=True)
    capacidad = models.IntegerField(null=True)
    patente = models.CharField(max_length=20, unique=True, null=True)
        
    def __str__(self):
        return f"{self.linea}"

class AsignacionRuta(models.Model):   
    transporte = models.ForeignKey(Transporte, on_delete=models.CASCADE, related_name='transportes')
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='transportes')
    fecha_recorrido = models.DateField(null=True, blank=True)
    hora_salida = models.TimeField(null=True, blank=True)
    hora_llegada_estim = models.TimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ruta.nombre} en {self.transporte.linea}"

class Paradero(models.Model):
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=10, unique=True, null=True)
    descripcion = models.TextField(blank=True)
    # latitud = models.FloatField()
    # longitud = models.FloatField()
    ubicacion = gis_models.PointField(srid=4326, null=True)
    
    direccion = models.CharField(max_length=255, blank=True)
    rutas = models.ManyToManyField(Ruta, related_name='paraderos')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Paradero"
        verbose_name_plural = "Paraderos"
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo or ''} - {self.nombre}"

    # @property
    # def coordenadas(self):
    #     return [self.latitud, self.longitud]