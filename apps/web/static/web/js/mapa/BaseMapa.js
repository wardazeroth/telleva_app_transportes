// BaseMapa.js
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Crear mapa base
export function crearMapaBase() {
  const mapa = L.map("mapa").setView([-39.8196, -73.2459], 15);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(mapa);

  return mapa;
}

// Autocompletado con Nominatim
export function configurarAutocompletado(input) {
  let timeoutId = null;
  let isLoading = false;

  input.addEventListener("input", () => {
    const query = input.value.trim();
    const listaId = input.id + "-lista";
    let lista = document.getElementById(listaId);

    // Limpiar timeout anterior (debounce)
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!lista) {
      lista = document.createElement("ul");
      lista.id = listaId;
      lista.className = "list-group position-absolute w-100 shadow-sm bg-white";
      lista.style.top = "100%";
      lista.style.left = "0";
      lista.style.maxHeight = "240px";
      lista.style.overflowY = "auto";
      lista.style.zIndex = "2000";
      lista.setAttribute("role", "listbox");
      lista.setAttribute("aria-label", "Sugerencias de direcciones");
      input.parentElement.appendChild(lista);

      input.addEventListener("blur", () => setTimeout(() => { lista.innerHTML = ""; }, 150));
    }

    if (query.length < 2) {
      lista.innerHTML = "";
      return;
    }

    // Mostrar indicador de carga
    if (!isLoading) {
      lista.innerHTML = '<li class="list-group-item text-muted">Buscando...</li>';
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    timeoutId = setTimeout(async () => {
      if (isLoading) return;
      isLoading = true;

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=cl&viewbox=-74,-38,-72,-40&bounded=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const lugares = await response.json();

        lista.innerHTML = "";
        if (lugares.length === 0) {
          const item = document.createElement("li");
          item.className = "list-group-item text-muted";
          item.textContent = "No se encontraron resultados";
          lista.appendChild(item);
        } else {
          lugares.forEach((lugar) => {
            const item = document.createElement("li");
            item.className = "list-group-item list-group-item-action";
            item.setAttribute("role", "option");
            item.setAttribute("tabindex", "0");
            item.textContent = lugar.display_name;
            item.onclick = () => {
              input.value = lugar.display_name;
              input.dataset.lat = lugar.lat;
              input.dataset.lon = lugar.lon;
              lista.innerHTML = "";
            };
            // Permitir selección con Enter
            item.onkeydown = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                item.onclick();
              }
            };
            lista.appendChild(item);
          });
        }
      } catch (error) {
        console.error("Error en autocompletado:", error);
        lista.innerHTML = '<li class="list-group-item text-danger">Error al buscar direcciones</li>';
      } finally {
        isLoading = false;
      }
    }, 300);
  });
}

// Inicializar autocompletado
export function inicializarAutocompletado() {
  const origen = document.getElementById("origen");
  const destino = document.getElementById("destino");
  if (origen) configurarAutocompletado(origen);
  if (destino) configurarAutocompletado(destino);
}
