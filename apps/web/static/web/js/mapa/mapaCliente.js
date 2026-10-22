function mapaCliente() {
  return {
    origen: '',
    destino: '',
    medio: 'driving-car',
    colorRuta: 'blue',
    distancia: '',
    tiempo: '',
    mapa: null,
    rutaPolyline: null,
    rutaRecomendada: null,
    marcadorInicio: null,
    marcadorFin: null,
    rutaRec: null,
    lineas: '',
    
    async init() {

      const info = document.getElementById("info");

      // Limpiar mapa anterior si existe
      if (this.mapa) {
        console.warn("Mapa ya inicializado. Reiniciando...");
        if (this.marcadorInicio) this.marcadorInicio.remove();
        if (this.marcadorFin) this.marcadorFin.remove();
        if (this.rutaPolyline) this.rutaPolyline.remove();
        if (this.rutaRecomendada) this.rutaRecomendada.remove();

        this.mapa.off();
        this.mapa.remove();
      }

      this.mapa = L.map("mapa").setView([-39.8196, -73.2459], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.mapa);


      await this.centrarUbicacion();

      // --- Cargar elementos iniciales ---
      await this.cargarParaderos();
      await this.cargarRutas();

      console.log("Mapa inicializado correctamente");
    },

    async setMedio(medio) {
      let medioTexto = '';
      this.medio = medio;
      await this.buscarRuta();
      if (this.medio === 'foot-walking') {
        medioTexto = 'Caminando';
      } else if (this.medio === 'cycling-regular') {
        medioTexto = 'Bicicleta';
      } else {
        medioTexto = 'Auto';
      }
      this.toast(`Medio de transporte cambiado a: ${medioTexto}`, "success");
    },

    async cargarParaderos() {
      const iconoParadero = L.icon({
        iconUrl: "/static/img/paradero.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      try {
        const resp = await fetch("/api/paraderos/");
        if (!resp.ok) throw new Error("Error cargando paraderos");
        const paraderos = await resp.json();

        paraderos.forEach(p => {
          L.marker([p.latitud, p.longitud], { icon: iconoParadero })
            .addTo(this.mapa)
            .bindPopup(`
              <b>${p.nombre}</b><br>
              Rutas: ${p.rutas?.map(r => r.nombre).join(", ") || "Ninguna"}
            `);
        });
      } catch (err) {
        console.error("Error al cargar paraderos:", err);
        this.toast("No se pudieron cargar los paraderos", "error");
      }
    },

    async cargarRutas() {
      try {
        const resp = await fetch("/api/rutas/");
        if (!resp.ok) throw new Error("Error cargando rutas");
        const rutas = await resp.json();

        rutas.forEach(r => {
          if (!r.coordenadas?.length) return;
          
          // Las coordenadas vienen como [[lat, lon], [lat, lon], ...]
          // Verificar si es array de arrays o array de objetos
          let coords = [];
          if (Array.isArray(r.coordenadas[0])) {
            // Formato: [[lat, lon], [lat, lon]]
            coords = r.coordenadas.filter(p => Array.isArray(p) && p.length === 2);
          } else if (r.coordenadas[0]?.latitud && r.coordenadas[0]?.longitud) {
            // Formato: [{latitud: x, longitud: y}, ...]
            coords = r.coordenadas
              .filter(p => p.latitud && p.longitud)
              .map(p => [p.latitud, p.longitud]);
          }
          
          if (coords.length < 2) return;

          // L.polyline(coords, { color: "blue", weight: 3 })
          //   .addTo(this.mapa)
          //   .bindPopup(`<b>${r.nombre}</b><br>${r.empresa || "Sin empresa"}`);
        });
      } catch (err) {
        console.error("Error al cargar rutas:", err);
        this.toast("No se pudieron cargar las rutas", "error");
      }
    },

    async buscarRuta() {
      if (!this.origen && !this.destino) {
        this.toast("Ingresa origen o destino", "error");
        return;
      }

      this.toast(`Buscando rutas para ${this.origen || "..."} → ${this.destino || "..."}`, "info");

      const origen = await obtenerCoordenadas(this.origen);
      const destino = await obtenerCoordenadas(this.destino);
      if (!origen || !destino) {
        this.toast("Dirección no encontrada", "error");
        return;
      }

      try {
        await geolocalizacion();
        this.trazar_recorrido(origen, destino);
      } catch (error) {
        console.error("Error obteniendo ubicación:", error);
        this.toast("No se pudo obtener tu ubicación", "error");
      }
    },

    trazar_recorrido(origen, destino) {
      const mapa = this.mapa;
      
      if (!mapa) {
        console.error("Mapa no inicializado");
        this.toast("Error: Mapa no inicializado", "error");
        return;
      }

      let icono = '<i class="bi bi-car-front"></i> '
      
      if (this.rutaPolyline) this.rutaPolyline.remove();
      if (this.rutaRecomendada) this.rutaRecomendada.remove();
      if (this.marcadorInicio) this.marcadorInicio.remove();
      if (this.marcadorFin) this.marcadorFin.remove();

      const start = `${origen.longitud},${origen.latitud}`;
      const end = `${destino.longitud},${destino.latitud}`;

      console.log("Obteniendo ruta de", this.medio);
      fetch(`/obtener_ruta/?origen=${start}&destino=${end}&medio=${this.medio}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Ruta:", data);
          if (!data || !data.features || !data.features.length) {
            console.warn("No se encontraron rutas.");
            this.toast("No se encontró una ruta válida", "error");
            return;
          }

          const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
          const coords2 = data.features[0].geometry.coordinates

          if (this.medio === 'foot-walking') {
            this.colorRuta = 'green';
          } else if (this.medio === 'cycling-regular') {
            this.colorRuta = 'orange';
          } else {
            this.colorRuta = 'blue';
          }
          this.rutaPolyline = L.polyline(coords, { color: this.colorRuta, weight: 4 }).addTo(mapa);
          
          let distancia = data.features[0].properties.summary.distance;
          let duracion = data.features[0].properties.summary.duration;
          let dist = (distancia / 1000).toFixed(2);
          let tiempo = Math.ceil(duracion / 60);
          this.distancia = `${dist} km`;
          this.tiempo =`${tiempo} min`;
          console.log("Distancia y tiempo obtenidos:", this.distancia);

          this.recomendar_rutas(coords2);

          // Mostrar información de distancia y tiempo
          const infoElement = document.getElementById("info");
          if (infoElement) {
            infoElement.style.display = 'block';
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

          this.marcadorInicio = L.marker([origen.latitud, origen.longitud], { icon: iconInicio })
            .addTo(mapa)
            .bindPopup("Inicio")

          this.marcadorInicio.openPopup();

          this.marcadorInicio.on('popupclose', () => {
            // El popup se cerró manualmente: limpiar referencia para evitar el error en zoom
            this.marcadorInicio.unbindPopup();
          });
          
          if (this.medio === 'foot-walking') {
            icono = '<i class="bi bi-person-walking"></i>'
          } else if (this.medio === 'cycling-regular') {
            icono = '<i class="bi bi-bicycle"></i>'
          }

          this.marcadorFin = L.marker([destino.latitud, destino.longitud], { icon: iconFin })
            .addTo(mapa)
            .bindPopup(`
            <div class="text-center">
              ${icono} <br>
              <strong>${this.destino || "Destino"}</strong>
            </div>
          `);

          this.marcadorFin.openPopup();

          this.marcadorFin.on('popupclose', () => {
            this.marcadorFin.unbindPopup();
          });

          mapa.fitBounds(this.rutaPolyline.getBounds());
        })
        .catch(err => {
          console.error("Error al trazar la ruta:", err);
          this.toast("Error al obtener la ruta. Intenta nuevamente.", "error");
        });
    },

    // Helper interno para obtener cookies y evitar error CSRF
    getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    },

    async recomendar_rutas(coords2) {
          //Pintar ruta recomendada
          const mapa = this.mapa;

          const csrftoken = this.getCookie('csrftoken');

          fetch(`/api/rutas/recomendar/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({'coordenadas': coords2})
          })
          .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Error ${response.status}: ${text}`);
            }
            return response.json();
          })
          .then(result => {
            console.log('Rutas recomendada guardada:', result);
          
            
            
            if (!result || result.length === 0) {
            console.warn("No hay rutas recomendadas");
            this.toast("No hay rutas similares registradas", "info");
            return;
            }
            console.log('geometria', result[0].geometria)

            if (!result[0].geometria) {
              console.error("La API respondió pero no trajo geometría:", result);
              return;
            }

              // Convertir (x,y) a (lat,lng)
              const coordsRec = result[0].geometria.coordinates.map(c => [c[1], c[0]]);
              const lineasTrans = result[0].transportes.map(t => t.transporte.linea.nombre)
              console.log('los transportes son: ', lineasTrans);
              this.rutaRec = coordsRec;
              
              this.lineas = lineasTrans;

              const transportElement = document.getElementById('transportes')
              if (transportElement) {
                transportElement.style.display = 'block';
              }

              // Pintar la línea recomendada
              this.rutaRecomendada = L.polyline(coordsRec, { color: 'red', weight: 4 }).addTo(mapa);
          })
          .catch(error => {
            console.error('Error al guardar la ruta recomendada:', error);
            this.toast("Error al obtener recomendaciones", "error");
          });
        },

    async centrarUbicacion() {
      if (!navigator.geolocation) {
        this.toast("GPS no disponible", "error");
        return;
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(async pos => {
          const { latitude, longitude } = pos.coords;

          this.mapa.setView([latitude, longitude], 15);

          const marker = L.marker([latitude, longitude])
            .addTo(this.mapa)
            .bindPopup("Estás aquí")
            
            marker.openPopup();
            marker.on('popupclose', () => {
            marker.unbindPopup();
            });

          this.origen = await obtenerDireccion(latitude, longitude);
          resolve();
        }, () => {
          this.toast("No se pudo obtener ubicación", "error");
          reject();
        });
      });
    },

    toast(msg, tipo = "info") {
      const el = document.createElement("div");
      const color =
        tipo === "error"
          ? "bg-danger"
          : tipo === "success"
          ? "bg-success"
          : "bg-secondary";
      el.className = `toast text-white p-2 mb-2 rounded shadow ${color} show`;
      el.textContent = msg;
      document.getElementById("toast").appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  };
}

async function obtenerDireccion(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.display_name) {
      console.log("Dirección obtenida:", data.display_name);
      return data.display_name;
    } else {
      return `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
  } catch (err) {
    console.error("Error al obtener dirección:", err);
    return `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  }
}

async function obtenerCoordenadas(ubicacion) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ubicacion)}&format=json`;
  const headers = { "User-Agent": "MiApp/1.0 (guardaajavier@gmail.com)" };

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

function geolocalizacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocalizador no es soportado por tu navegador');
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      { enableHighAccuracy: true }
    );
  });
}
