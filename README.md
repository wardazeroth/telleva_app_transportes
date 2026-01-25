# TeLleva - Sistema de Gestión de Transporte Urbano
TeLleva es una plataforma integral diseñada para la gestión, visualización y optimización del transporte público a escala urbana. Permite a municipalidades y empresas de transporte administrar rutas, paraderos y flotas, ofreciendo a los ciudadanos información precisa para sus viajes diarios.


# Características Principales
Panel Administrativo: Control total (CRUD) sobre Paraderos, Rutas y Unidades de Transporte.

Mapa Interactivo: Visualización en tiempo real basada en Leaflet con herramientas de dibujo de trazados.

Gestión de Infraestructura: Vinculación inteligente de paraderos a múltiples rutas.

Arquitectura Escalable: Preparado para integraciones con GPS y sistemas de monitoreo de flotas.

Interfaz Responsiva: Optimizado para centros de control y dispositivos móviles.


# Stack Tecnológico
Frontend: React.js, Tailwind CSS, React-Leaflet.

Backend: Python (Django).

Base de Datos: PostgreSQL con extensión PostGIS para datos geográficos.

Servicios Geográficos: OpenStreetMap (Tiles) y OpenRouteService (Routing).

API: RESTful API con documentación Swagger/OpenAPI.

Requisitos Previos e Integraciones
Antes de la instalación, asegúrate de contar con:

Node.js (v18.0 o superior) y npm/yarn.

PostgreSQL (v14 o superior).

Cuenta en OpenRouteService (ORS): Fundamental para las funciones de trazado.

Configuración de OpenRouteService
Para que el sistema siga la geometría de las calles y no solo dibuje líneas rectas:

Regístrate en el Dashboard de ORS.

Obtén una API Key (Token) gratuita o de pago.

Cópiala en tu archivo .env.

Nota para Clientes: Para implementaciones a gran escala, el sistema permite configurar un servidor propio de ORS vía Docker, garantizando la privacidad de los datos.


# Instalación y Configuración
[!IMPORTANT] Nota sobre el Acceso: Este repositorio es de carácter privado y propiedad de TriVertex-SpA. Para obtener acceso, solicita permisos al administrador del sistema.

1. Obtención del Código
Requiere un Token de Acceso Personal (PAT) configurado.

Bash

git clone https://github.com/TriVertex-SpA/TeLleva
cd TeLleva
2. Configuración del Entorno
Crea un archivo .env en la raíz del proyecto basándote en el siguiente esquema:

Fragmento de código

Database variables:
DB_HOST='postgis_db'
DB_PORT=5432
POSTGRES_DB='telleva_db'
POSTGRES_USER='postgres'
POSTGRES_PASSWORD='tu_password'

Geolocation API:
API_KEY_MAPS='tu_clave_openrouteservice_aqui'
🚀 Ejecución del Sistema
A. Despliegue con Docker (Recomendado)
El archivo docker-compose.yml configura automáticamente el Backend, Frontend y la base de Datos PostGIS.


# Construir y levantar contenedores
docker-compose up --build
Frontend: http://localhost:5173

API/Admin: http://localhost:8000

B. Ejecución Nativa (Desarrollo)
Si prefieres ejecutar los servicios por separado:

1. Backend (Django):

Bash

cd backend
python -m venv venv
source venv/bin/activate # o venv\Scripts\activate en Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
2. Frontend (Vite):

Bash

cd frontend
npm install
npm run dev


# Estructura del Proyecto

    1 TeLleva/
    2 ├── apps/
    3 │   ├── api/
    4 │   ├── secure/
    5 │   └── web/
    6 ├── frontend/
    7 │   ├── public/
    8 │   └── src/
    9 ├── TeLleva/
   10 ├── .env.sample
   11 ├── requirements.txt
   12 ├── manage.py
   13 └── docker-compose.yml

apps/: Directorio de aplicaciones modulares de Django.

api/: Núcleo del backend. Modelos de datos, serializadores y lógica de peticiones REST.

secure/: Gestión de autenticación y seguridad.

web/: Recursos estáticos y vistas específicas.

frontend/: Corazón de la interfaz en React.

src/api/: Conexión con el backend.

src/components/: UI Reutilizable (mapas, botones, modales).

src/pages/: Vistas completas (Login, Admin, Mapa).

manage.py: Utilidad administrativa de Django.

requirements.txt: Dependencias de Python.


# Guía de Uso del Panel de Administrador de TeLleva

Este documento describe las funcionalidades principales del panel de administración de la plataforma TeLleva, diseñado para gestionar el sistema de transporte.

## 1. Acceso al Panel

Para ingresar al panel, utiliza tus credenciales de administrador en la página de **Login**. El sistema te redirigirá automáticamente al dashboard de administración si tu cuenta tiene los permisos necesarios.

## 2. Dashboard Principal

El dashboard es la página de inicio y ofrece un resumen del estado del sistema. Aquí encontrarás:

- **Estadísticas Clave**: Tarjetas que muestran el número total de rutas, paraderos y vehículos registrados.
- **Acciones Rápidas**: Botones para acceder directamente a las funcionalidades más comunes, como crear una nueva ruta, añadir un paradero o gestionar la flota.

## 3. Gestión de Rutas

Esta sección permite administrar los trazados geográficos que los vehículos seguirán.

- **Crear una Ruta**:
    1.  Ve a **Gestión de Rutas** y haz clic en **"Nueva Ruta"** o usa el acceso directo del dashboard.
    2.  Se abrirá un mapa interactivo. Haz clic en el mapa para trazar la secuencia de puntos que conforman la ruta.
    3.  Puedes usar los botones de **deshacer**, **rehacer** y **limpiar** para corregir el trazado.
    4.  Una vez finalizado, haz clic en **"Guardar Ruta"**. Se te pedirá un nombre y un código opcional para identificarla.

- **Editar y Eliminar Rutas**:
    - En la lista de rutas, puedes hacer clic en el icono de **editar** (lápiz) para modificar el trazado en el mapa.
    - El icono de **eliminar** (papelera) borrará la ruta permanentemente.

## 4. Gestión de Paraderos

Los paraderos son los puntos específicos donde los pasajeros pueden subir o bajar de un vehículo.

- **Crear un Paradero**:
    1.  Ve a **Gestión de Paraderos** y haz clic en **"Nuevo Paradero"**.
    2.  En el mapa, haz clic en la ubicación exacta donde deseas colocar el paradero.
    3.  Rellena el formulario con el **nombre** (obligatorio), código y dirección.
    4.  Puedes asociar el paradero a una o más rutas existentes seleccionándolas de la lista.
    5.  Haz clic en **"Guardar"**.

- **Editar y Eliminar Paraderos**:
    - En la lista de paraderos, el icono de **editar** te permite cambiar la ubicación, el nombre y las rutas asociadas.
    - El icono de **eliminar** lo borrará del sistema.

## 5. Gestión de Líneas

Las "Líneas" representan a las empresas o agrupaciones de transporte que operan en el sistema (ej: "Línea 20", "Buses Regionales").

- **Crear y Administrar Líneas**:
    1.  En la sección **"Gestión de Líneas"**, puedes crear una nueva línea.
    2.  Debes proporcionar un **nombre** y un **código** que la identifiquen.
    3.  Puedes añadir información adicional como la empresa, una descripción y marcarla como **activa** o **inactiva**.

## 6. Gestión de Flota (Vehículos)

Aquí se administran los vehículos individuales que forman parte del sistema.

- **Crear y Administrar Vehículos**:
    1.  En **"Gestión de Flota"**, haz clic en **"Nuevo Vehículo"**.
    2.  Rellena los datos del vehículo: **patente**, **tipo** (micro, colectivo, etc.), y **capacidad**.
    3.  Asigna el vehículo a una de las **Líneas** creadas en el paso anterior.
    4.  Guarda los cambios.

## 7. Programación de Rutas (Asignaciones)

Esta es la funcionalidad clave que conecta la flota con los trazados geográficos.

- **Asignar un Vehículo a una Ruta**:
    1.  Ve a la sección **"Programación de Rutas"** o **"Asignaciones"**.
    2.  Haz clic en **"Nueva Asignación"**.
    3.  En el formulario:
        - Selecciona un **vehículo** de tu flota.
        - Selecciona una **ruta** (trazado geográfico).
        - Opcionalmente, puedes definir una **hora de salida** y una hora estimada de llegada.
    4.  Haz clic en **"Asignar Ruta"**.

Esto crea un viaje programado que podrá ser visualizado por los usuarios. Puedes eliminar cualquier asignación desde la lista principal de esta sección.


# Aplicación en Gobiernos y Empresas
Municipalidades: Fomenta el concepto de Smart City, mejora la planificación urbana y ofrece transparencia sobre recorridos oficiales.

Empresas de Transporte: Optimiza la logística de flotas, transporte de personal y permite un control estricto del cumplimiento de trazados.# telleva_app_transportes
