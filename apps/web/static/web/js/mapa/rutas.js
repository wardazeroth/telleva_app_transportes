import { getCookie } from "./BaseMapa.js";

export function initRutas(mapa) {
  // Botones y contenedor del mapa
  const btnDibujar = document.querySelector("#btnDibujar");
  const btnGuardarRuta = document.querySelector("#btnGuardarRuta");
  const btnLimpiarRuta = document.querySelector("#btnLimpiarRuta");
  const btnDeshacerPunto = document.querySelector("#btnDeshacerPunto");
  const btnRehacerPunto = document.querySelector("#btnRehacerPunto");
  const mapaContainer = document.getElementById("mapa");

  // Variables para dibujo
  let puntosRuta = [];
  let lineaRuta = null;
  let puntosEliminados = [];
  let modoDibujar = false;

  // Activar o desactivar modo dibujo
  btnDibujar?.addEventListener("click", () => {
    modoDibujar = !modoDibujar;

    if (modoDibujar) {
      puntosRuta = [];
      puntosEliminados = [];
      if (lineaRuta) mapa.removeLayer(lineaRuta);
    }

    btnDibujar.textContent = modoDibujar ? "Detener dibujo" : "Modo dibujar ruta";
    btnDibujar.classList.toggle("btn-danger", modoDibujar);
    btnGuardarRuta.classList.toggle("d-none", !modoDibujar);
    btnLimpiarRuta.classList.toggle("d-none", !modoDibujar);
    btnDeshacerPunto.classList.toggle("d-none", !modoDibujar);
    btnRehacerPunto.classList.toggle("d-none", !modoDibujar);
    mapaContainer.classList.toggle("modo-dibujo-activo", modoDibujar);
  });

  // Agregar puntos al hacer clic en el mapa
  mapa.on("click", (e) => {
    if (!modoDibujar) return;
    const { lat, lng } = e.latlng;
    puntosRuta.push([lat, lng]);
    if (lineaRuta) mapa.removeLayer(lineaRuta);
    lineaRuta = L.polyline(puntosRuta, { color: "orange", weight: 4 }).addTo(mapa);
  });

  // Deshacer último punto
  btnDeshacerPunto?.addEventListener("click", () => {
    if (puntosRuta.length === 0) return;
    const puntoEliminado = puntosRuta.pop();
    puntosEliminados.push(puntoEliminado);
    if (lineaRuta) mapa.removeLayer(lineaRuta);
    if (puntosRuta.length > 0)
      lineaRuta = L.polyline(puntosRuta, { color: "orange", weight: 4 }).addTo(mapa);
  });

  // Rehacer punto eliminado
  btnRehacerPunto?.addEventListener("click", () => {
    if (puntosEliminados.length === 0) return;
    const puntoRecuperado = puntosEliminados.pop();
    puntosRuta.push(puntoRecuperado);
    if (lineaRuta) mapa.removeLayer(lineaRuta);
    lineaRuta = L.polyline(puntosRuta, { color: "orange", weight: 4 }).addTo(mapa);
  });

  // Limpiar ruta actual
  btnLimpiarRuta?.addEventListener("click", () => {
    if (!puntosRuta.length && !lineaRuta) return;

    if (confirm("¿Seguro que quieres limpiar la ruta dibujada?")) {
      if (lineaRuta) mapa.removeLayer(lineaRuta);
      puntosRuta = [];
      lineaRuta = null;
      modoDibujar = false;
      puntosEliminados = [];
      btnDibujar.textContent = "Modo dibujar ruta";
      btnDibujar.classList.remove("btn-danger");
      btnGuardarRuta.classList.add("d-none");
      btnLimpiarRuta.classList.add("d-none");
      btnDeshacerPunto.classList.add("d-none");
      btnRehacerPunto.classList.add("d-none");
    }
  });

  // Guardar ruta en el backend
  btnGuardarRuta?.addEventListener("click", async () => {
    if (puntosRuta.length < 2) {
      if (typeof showToast === 'function') {
        showToast("Necesitas al menos 2 puntos para guardar una ruta", "error");
      } else {
        alert("Necesitas al menos 2 puntos para guardar una ruta");
      }
      return;
    }
    
    // Solicitar nombre con validación
    const nombre = prompt("Nombre de la ruta:");
    if (!nombre || !nombre.trim()) {
      return;
    }
    
    // Sanitizar nombre de ruta
    const nombreSanitizado = nombre.trim().replace(/[<>\"']/g, '').substring(0, 120);
    if (!nombreSanitizado) {
      if (typeof showToast === 'function') {
        showToast("El nombre de la ruta no es válido", "error");
      } else {
        alert("El nombre de la ruta no es válido");
      }
      return;
    }

    // Mostrar indicador de carga
    const textoOriginal = btnGuardarRuta.textContent;
    btnGuardarRuta.disabled = true;
    btnGuardarRuta.textContent = "Guardando...";

    try {
      const resp = await fetch("/api/rutas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          nombre: nombreSanitizado,
          coordenadas: puntosRuta,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      // Limpiar todo después de guardar
      if (lineaRuta) mapa.removeLayer(lineaRuta);
      puntosRuta = [];
      lineaRuta = null;
      modoDibujar = false;
      puntosEliminados = [];
      btnDibujar.textContent = "Modo dibujar ruta";
      btnDibujar.classList.remove("btn-danger");
      btnGuardarRuta.classList.add("d-none");
      btnLimpiarRuta.classList.add("d-none");
      btnDeshacerPunto.classList.add("d-none");
      btnRehacerPunto.classList.add("d-none");

      cargarRutas(); // recargar rutas del backend
      if (typeof showToast === 'function') {
        showToast("Ruta guardada correctamente", "success");
      }
    } catch (error) {
      console.error("Error al guardar ruta:", error);
      if (typeof showToast === 'function') {
        showToast("Error al guardar la ruta. Intenta nuevamente.", "error");
      } else {
        alert("Error al guardar la ruta. Intenta nuevamente.");
      }
    } finally {
      // Restaurar botón
      btnGuardarRuta.disabled = false;
      btnGuardarRuta.textContent = textoOriginal;
    }
  });

  // Variable para evitar cargas duplicadas
  let rutasCargando = false;
  let rutasCargadas = false;

  // Cargar rutas ya existentes desde el backend
  async function cargarRutas() {
    // Evitar cargas duplicadas simultáneas
    if (rutasCargando) {
      return;
    }
    
    rutasCargando = true;
    try {
      const response = await fetch("/api/rutas/");
      if (!response.ok) throw new Error("Error cargando rutas");
      const data = await response.json();
      const rutas = Array.isArray(data) ? data : data.results || [];

      // Limpiar rutas existentes antes de cargar nuevas
      mapa.eachLayer((layer) => {
        if (layer instanceof L.Polyline && layer.options?.color === "blue" && layer.options?.weight === 5) {
          mapa.removeLayer(layer);
        }
      });

      rutas.forEach((rt) => {
        if (!rt.coordenadas || !Array.isArray(rt.coordenadas) || rt.coordenadas.length < 2) return;
        
        // Verificar formato de coordenadas: [[lat, lon], ...] o [{latitud, longitud}, ...]
        let coords = [];
        if (Array.isArray(rt.coordenadas[0])) {
          // Formato: [[lat, lon], [lat, lon]]
          coords = rt.coordenadas.filter(p => Array.isArray(p) && p.length === 2);
        } else if (rt.coordenadas[0]?.latitud !== undefined && rt.coordenadas[0]?.longitud !== undefined) {
          // Formato: [{latitud: x, longitud: y}, ...]
          coords = rt.coordenadas
            .filter(p => p.latitud != null && p.longitud != null)
            .map(p => [p.latitud, p.longitud]);
        }
        
        if (coords.length < 2) return;
        
        const linea = L.polyline(coords, {
          color: "blue",
          weight: 5,
          opacity: 0.85,
        })
          .addTo(mapa)
          .bindPopup(rt.nombre || "Ruta");

        linea.on("click", () => {
          if (Alpine && Alpine.store("ui")) {
            Alpine.store("ui").rutaSeleccionada = rt;
            Alpine.store("ui").mostrarDetalles = true;
          }
        });
      });
      rutasCargadas = true;
    } catch (error) {
      console.error("Error cargando rutas:", error);
      if (typeof showToast === 'function') {
        showToast("Error al cargar las rutas", "error");
      }
    } finally {
      rutasCargando = false;
    }
  }

  // Cargar rutas solo una vez al inicializar
  if (!rutasCargadas) {
    cargarRutas();
  }
}