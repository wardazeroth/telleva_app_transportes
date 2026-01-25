FROM python:3.12

# Dependencias del sistema para GeoDjango
RUN apt-get update \
    && apt-get install -y \
        binutils \
        libproj-dev \
        gdal-bin \
        libgdal-dev \
    && apt-get clean

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de requerimientos
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copiar proyecto
COPY . .

# Exponer puerto
EXPOSE 8000

# Ejecutar servidor por defecto
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
