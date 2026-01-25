import { getCookie } from "./BaseMapa.js";

async function cargarParaderos(mapa) {
  const iconoParadero = L.icon({
    iconUrl: "/static/img/paradero.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
  });

  mapa.eachLayer((layer) => {
    if (layer.options?.paraderoData) mapa.removeLayer(layer);
  });

  try {
    const resp = await fetch("/api/paraderos/");
    if (!resp.ok) throw new Error("Error cargando paraderos");
    const paraderos = await resp.json();

    paraderos.forEach((p) => {
      L.marker([p.latitud, p.longitud], {
        icon: iconoParadero,
        paraderoData: p,
      })
        .addTo(mapa)
        .bindPopup(`
          <b>${p.nombre}</b><br>
          ${p.rutas?.length ? "Ruta(s): " + p.rutas.map(r => r.nombre).join(", ") : "Sin ruta vinculada"}
          <br>
          <button class="editar-paradero btn btn-sm btn-outline-primary mt-1" data-id="${p.id}">Editar</button>
          <button class="eliminar-paradero btn btn-sm btn-outline-danger mt-1" data-id="${p.id}">Eliminar</button>
        `);
    });
  } catch (error) {
    console.error("Error cargando paraderos:", error);
    if (typeof showToast === 'function') {
      showToast("Error al cargar paraderos", "error");
    }
  }
}

// Variable para almacenar referencia al mapa
let mapaParaderos = null;

export function initParaderos(mapa) {
  mapaParaderos = mapa;
  
  // Definir icono de paradero fuera de las funciones para que esté disponible en todo el scope
  const iconoParadero = L.icon({
    iconUrl: "/static/img/paradero.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
  });
  
  cargarParaderos(mapa);

  mapa.on("popupopen", (e) => {
    const popup = e.popup._contentNode;

    popup.querySelector(".eliminar-paradero")?.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      if (!confirm("¿Eliminar este paradero?")) return;
      try {
        const resp = await fetch(`/api/paraderos/${id}/`, {
          method: "DELETE",
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        });
        if (resp.ok) {
          mapa.removeLayer(e.popup._source);
          showToast("Paradero eliminado correctamente", "success");
          await cargarParaderos(mapa);
        } else {
          const errorText = await resp.text();
          console.error("Error al eliminar paradero:", errorText);
          showToast("Error al eliminar paradero", "error");
        }
      } catch (err) {
        console.error("Error de conexión:", err);
        showToast("Error de conexión", "error");
      }
    });

    popup.querySelector(".editar-paradero")?.addEventListener("click", async () => {
      const markerData = e.popup._source.options.paraderoData;

      if (!Alpine || !Alpine.store("ui")) {
        console.error("Alpine.js no está inicializado");
        showToast("Error: Sistema no inicializado", "error");
        return;
      }

      if (Alpine.store("ui").rutas.length === 0) {
        try {
          const resp = await fetch("/api/rutas/");
          if (!resp.ok) throw new Error("Error cargando rutas");
          const data = await resp.json();
          Alpine.store("ui").rutas = data;
        } catch (err) {
          console.error("Error cargando rutas:", err);
          showToast("Error al cargar rutas", "error");
        }
      }

      Alpine.store("ui").paraderoEditando = {
        id: markerData.id,
        nombre: markerData.nombre,
        latitud: markerData.latitud,
        longitud: markerData.longitud,
        rutas_ids: markerData.rutas ? markerData.rutas.map(r => String(r.id)) : [],
      };

      Alpine.store("ui").modalEditarParadero = true;
    });
  });

  let modoParadero = false;
  const btnAgregarParadero = document.querySelector("#btnAgregarParadero");

  btnAgregarParadero?.addEventListener("click", () => {
    modoParadero = !modoParadero;
    btnAgregarParadero.classList.toggle("btn-danger", modoParadero);
    btnAgregarParadero.textContent = modoParadero ? "Cancelar modo Paradero" : "Agregar Paradero";
  });

  mapa.on("click", async (e) => {
    if (!modoParadero) return;
    const { lat, lng } = e.latlng;
    const nombre = prompt("Nombre del paradero:");
    if (!nombre || !nombre.trim()) return;
    
    // Sanitizar nombre de paradero
    const nombreSanitizado = nombre.trim().replace(/[<>\"']/g, '').substring(0, 120);
    if (!nombreSanitizado) {
      showToast("El nombre del paradero no es válido", "error");
      return;
    }
    
    const rutaSeleccionada = Alpine?.store("ui")?.rutaSeleccionada;
    const idRuta = rutaSeleccionada ? rutaSeleccionada.id : null;

    // Mostrar indicador de carga
    if (btnAgregarParadero) {
      btnAgregarParadero.disabled = true;
      const textoOriginal = btnAgregarParadero.textContent;
      btnAgregarParadero.textContent = "Guardando...";
    }

    try {
      const resp = await fetch("/api/paraderos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          nombre: nombreSanitizado,
          latitud: lat,
          longitud: lng,
          rutas_ids: idRuta ? [idRuta] : [],
        }),
      });

      if (resp.ok) {
        await cargarParaderos(mapa);
        showToast("Paradero agregado correctamente", "success");
      } else {
        const errorText = await resp.text();
        console.error("Error al registrar paradero:", errorText);
        showToast("Error al registrar paradero", "error");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      showToast("Error de conexión", "error");
    }

    modoParadero = false;
    if (btnAgregarParadero) {
      btnAgregarParadero.textContent = "Agregar Paradero";
      btnAgregarParadero.classList.remove("btn-danger");
      btnAgregarParadero.disabled = false;
    }
  });
}

document.addEventListener("guardar-paradero", async () => {
  const datos = Alpine.store("ui").paraderoEditando;
  if (!datos?.id) return;

  const seleccion = String(datos.ruta_id || "");
  const actuales = (datos.rutas_ids || []).map(String);

  // Evita duplicados
  if (seleccion && actuales.includes(seleccion)) {
    showToast("Esta ruta ya está asociada a este paradero", "info");
    return;
  }

  // lista final sin duplicados
  const rutasUnicas = Array.from(new Set([...actuales, ...(seleccion ? [seleccion] : [])]));

  try {
    const resp = await fetch(`/api/paraderos/${datos.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        nombre: datos.nombre,
        latitud: datos.latitud,
        longitud: datos.longitud,
        rutas_ids: rutasUnicas,
      }),
    });

    if (!resp.ok) throw new Error(await resp.text());

    // Actualiza UI
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarParadero"));
    modal?.hide();
    Alpine.store("ui").modalEditarParadero = false;
    showToast("Ruta agregada correctamente", "success");
    if (mapaParaderos) {
      await cargarParaderos(mapaParaderos);
    }
  } catch (err) {
    console.error("Error al guardar paradero:", err);
    showToast("Error al guardar paradero", "error");
  }
});

// al apretar la x de la lista, se eliminará la ruta vinculada con el paradero
document.addEventListener("eliminar-ruta-modal", async (e) => {
  const rutaIdAEliminar = String(e.detail);
  const datos = Alpine.store("ui").paraderoEditando;
  if (!datos?.id) return;

  const rutasFiltradas = (datos.rutas_ids || []).filter(id => id !== rutaIdAEliminar);

  try {
    const resp = await fetch(`/api/paraderos/${datos.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ rutas_ids: rutasFiltradas }),
    });

    if (!resp.ok) throw new Error(await resp.text());

    Alpine.store("ui").paraderoEditando.rutas_ids = rutasFiltradas;
    showToast("Ruta desvinculada correctamente", "success");
    if (mapaParaderos) {
      await cargarParaderos(mapaParaderos);
    }
  } catch (err) {
    console.error("Error desvinculando ruta:", err);
    showToast("Error al eliminar ruta", "error");
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("modalEditarParadero");
  if (!modalEl) return;

  modalEl.addEventListener("hidden.bs.modal", () => {
    if (Alpine.store("ui").modalEditarParadero) {
      Alpine.store("ui").modalEditarParadero = false;
    }
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
  });

  modalEl.addEventListener("show.bs.modal", () => {
    modalEl.removeAttribute("aria-hidden");
    modalEl.removeAttribute("inert");
  });
});
