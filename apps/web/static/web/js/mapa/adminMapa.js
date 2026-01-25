// Variables globales para almacenar referencias
let mapaAdmin = null;
let rutaPolylineAdmin = null;
let marcadorInicioAdmin = null;
let marcadorFinAdmin = null;
let medioTransporte = 'driving-car';

// Función para obtener coordenadas desde una dirección
async function obtenerCoordenadas(ubicacion) {
  if (!ubicacion || !ubicacion.trim()) {
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ubicacion)}&format=json`;
  const headers = { "User-Agent": "TeLleva/1.0" };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data.length > 0) {
      const latitud = parseFloat(data[0].lat);
      const longitud = parseFloat(data[0].lon);
      return { latitud, longitud };
    } else {
      console.warn("No se encontraron coordenadas para esta dirección.");
      return null;
    }
  } catch (error) {
    console.error("Error en la API:", error);
    return null;
  }
}

// Función para obtener dirección desde coordenadas
async function obtenerDireccion(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.display_name) {
      return data.display_name;
    } else {
      return `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
  } catch (err) {
    console.error("Error al obtener dirección:", err);
    return `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  }
}

// Función para mostrar toast
function showToastAdmin(msg, tipo = 'info') {
  if (typeof showToast === 'function') {
    showToast(msg, tipo);
    return;
  }

  // Si no existe, crear el toast manualmente
  const toastContainer = document.getElementById('toast');
  if (!toastContainer) return;

  const el = document.createElement('div');
  const color = tipo === 'error' ? 'bg-danger' : tipo === 'success' ? 'bg-success' : 'bg-secondary';
  el.className = `toast align-items-center text-white border-0 show ${color} mb-2 p-3 rounded shadow-sm`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Función para buscar ruta
async function buscarRutaAdmin() {
  if (!mapaAdmin) {
    showToastAdmin("Error: Mapa no inicializado", "error");
    return;
  }

  const inputOrigen = document.getElementById("origen");
  const inputDestino = document.getElementById("destino");

  if (!inputOrigen || !inputDestino) {
    showToastAdmin("No se encontraron los campos de origen y destino", "error");
    return;
  }

  const origenTexto = inputOrigen.value.trim();
  const destinoTexto = inputDestino.value.trim();

  if (!origenTexto && !destinoTexto) {
    showToastAdmin("Ingresa origen o destino", "error");
    return;
  }

  showToastAdmin(`Buscando rutas para ${origenTexto || "..."} → ${destinoTexto || "..."}`, "info");

  const origen = await obtenerCoordenadas(origenTexto);
  const destino = await obtenerCoordenadas(destinoTexto);

  if (!origen || !destino) {
    showToastAdmin("Dirección no encontrada", "error");
    return;
  }

  trazarRecorridoAdmin(origen, destino);
}

// Función para trazar el recorrido en el mapa
function trazarRecorridoAdmin(origen, destino) {
  if (!mapaAdmin) {
    showToastAdmin("Error: Mapa no inicializado", "error");
    return;
  }

  // Limpiar marcadores y ruta anteriores
  if (rutaPolylineAdmin) {
    mapaAdmin.removeLayer(rutaPolylineAdmin);
    rutaPolylineAdmin = null;
  }
  if (marcadorInicioAdmin) {
    mapaAdmin.removeLayer(marcadorInicioAdmin);
    marcadorInicioAdmin = null;
  }
  if (marcadorFinAdmin) {
    mapaAdmin.removeLayer(marcadorFinAdmin);
    marcadorFinAdmin = null;
  }

  const start = `${origen.longitud},${origen.latitud}`;
  const end = `${destino.longitud},${destino.latitud}`;

  fetch(`/obtener_ruta/?origen=${start}&destino=${end}&medio=${medioTransporte}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.features || !data.features.length) {
        showToastAdmin("No se encontró una ruta válida", "error");
        return;
      }

      const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
      let colorRuta = 'blue';
      if (medioTransporte === 'foot-walking') {
        colorRuta = 'green';
      } else if (medioTransporte === 'cycling-regular') {
        colorRuta = 'orange';
      }

      rutaPolylineAdmin = L.polyline(coords, { color: colorRuta, weight: 4 }).addTo(mapaAdmin);

      // Mostrar información de distancia y tiempo
      const distancia = data.features[0].properties.summary.distance;
      const duracion = data.features[0].properties.summary.duration;
      const distKm = (distancia / 1000).toFixed(2);
      const tiempoMin = Math.ceil(duracion / 60);

      const infoRuta = document.getElementById("info-ruta");
      const distanciaRuta = document.getElementById("distancia-ruta");
      const tiempoRuta = document.getElementById("tiempo-ruta");

      if (infoRuta && distanciaRuta && tiempoRuta) {
        distanciaRuta.textContent = `${distKm} km`;
        tiempoRuta.textContent = `${tiempoMin} min`;
        infoRuta.style.display = 'block';
      }

      const iconInicio = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const iconFin = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      marcadorInicioAdmin = L.marker([origen.latitud, origen.longitud], { icon: iconInicio })
        .addTo(mapaAdmin)
        .bindPopup("Inicio");

      marcadorInicioAdmin.openPopup();

      marcadorInicioAdmin.on('popupclose', () => {
        marcadorInicioAdmin.unbindPopup();
      });

      let icono = '<i class="bi bi-car-front"></i>';
      if (medioTransporte === 'foot-walking') {
        icono = '<i class="bi bi-person-walking"></i>';
      } else if (medioTransporte === 'cycling-regular') {
        icono = '<i class="bi bi-bicycle"></i>';
      }

      const inputDestino = document.getElementById("destino");
      const destinoTexto = inputDestino ? inputDestino.value : "Destino";

      marcadorFinAdmin = L.marker([destino.latitud, destino.longitud], { icon: iconFin })
        .addTo(mapaAdmin)
        .bindPopup(`
          <div class="text-center">
            ${icono} <br>
            <strong>${destinoTexto}</strong>
          </div>
        `);

      marcadorFinAdmin.openPopup();

      marcadorFinAdmin.on('popupclose', () => {
        marcadorFinAdmin.unbindPopup();
      });

      mapaAdmin.fitBounds(rutaPolylineAdmin.getBounds());
      showToastAdmin("Ruta encontrada y mostrada en el mapa", "success");
    })
    .catch(err => {
      console.error("Error al trazar la ruta:", err);
      showToastAdmin("Error al obtener la ruta. Intenta nuevamente.", "error");
    });
}

// Función para cambiar el medio de transporte
function cambiarMedioTransporte(medio) {
  medioTransporte = medio;
  
  // Actualizar estilos visuales
  const medios = document.querySelectorAll('.medio-transporte');
  medios.forEach(m => {
    m.classList.remove('text-primary', 'border-bottom', 'border-3', 'border-primary');
    m.classList.add('text-secondary');
  });

  const medioSeleccionado = document.querySelector(`[data-medio="${medio}"]`);
  if (medioSeleccionado) {
    medioSeleccionado.classList.remove('text-secondary');
    medioSeleccionado.classList.add('text-primary', 'border-bottom', 'border-3', 'border-primary');
  }

  // Si hay una ruta dibujada, volver a buscarla con el nuevo medio
  const inputOrigen = document.getElementById("origen");
  const inputDestino = document.getElementById("destino");
  if (inputOrigen && inputDestino && inputOrigen.value.trim() && inputDestino.value.trim()) {
    buscarRutaAdmin();
  }
}

// Función para centrar mapa en la ubicación del usuario
async function centrarUbicacionAdmin() {
  if (!mapaAdmin) {
    showToastAdmin("Error: Mapa no inicializado", "error");
    return;
  }

  if (!navigator.geolocation) {
    showToastAdmin("GPS no disponible", "error");
    return;
  }

  showToastAdmin("Obteniendo tu ubicación...", "info");

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;

      mapaAdmin.setView([latitude, longitude], 15);

      const marker = L.marker([latitude, longitude])
        .addTo(mapaAdmin)
        .bindPopup("Estás aquí");

      marker.openPopup();
      marker.on('popupclose', () => {
        marker.unbindPopup();
      });

      const direccion = await obtenerDireccion(latitude, longitude);
      const inputOrigen = document.getElementById("origen");
      const ubiResultado = document.getElementById("ubiResultado");

      if (inputOrigen) {
        inputOrigen.value = direccion;
      }

      if (ubiResultado) {
        ubiResultado.textContent = direccion;
        ubiResultado.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
        ubiResultado.target = "_blank";
      }

      showToastAdmin("Ubicación centrada", "success");
      resolve();
    }, () => {
      showToastAdmin("No se pudo obtener ubicación", "error");
      reject();
    });
  });
}

// Handlers de eventos (definidos fuera para poder removerlos si es necesario)
let btnRutaHandler = null;
let btnUbicacionHandler = null;

// Función para inicializar los event listeners de los botones
export function initAdminMapa(mapa) {
  mapaAdmin = mapa;

  // Función auxiliar para agregar listeners
  const agregarListeners = () => {
    const btnRuta = document.getElementById("btnRuta");
    const btnUbicacion = document.getElementById("btnUbicacion");
    const mediosTransporte = document.querySelectorAll('.medio-transporte');

    if (btnRuta) {
      // Remover listener anterior si existe
      if (btnRutaHandler) {
        btnRuta.removeEventListener("click", btnRutaHandler);
      }
      btnRutaHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        buscarRutaAdmin();
      };
      btnRuta.addEventListener("click", btnRutaHandler);
    } else {
      setTimeout(agregarListeners, 200);
      return;
    }

    if (btnUbicacion) {
      // Remover listener anterior si existe
      if (btnUbicacionHandler) {
        btnUbicacion.removeEventListener("click", btnUbicacionHandler);
      }
      btnUbicacionHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        centrarUbicacionAdmin();
      };
      btnUbicacion.addEventListener("click", btnUbicacionHandler);
    } else {
      setTimeout(agregarListeners, 200);
      return;
    }

    // Agregar listeners a los selectores de medio de transporte
    mediosTransporte.forEach(medio => {
      medio.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const medioSeleccionado = medio.getAttribute("data-medio");
        cambiarMedioTransporte(medioSeleccionado);
      });
    });
  };

  // Intentar agregar listeners inmediatamente
  agregarListeners();
}

