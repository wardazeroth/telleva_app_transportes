import { crearMapaBase, inicializarAutocompletado } from "./BaseMapa.js";
import { initRutas } from "./rutas.js";
import { initParaderos } from "./paraderos.js";
import { initAdminMapa } from "./adminMapa.js";

document.addEventListener("DOMContentLoaded", () => {
  try {
    const mapaElement = document.getElementById("mapa");
    if (!mapaElement) {
      console.error("Elemento #mapa no encontrado");
      return;
    }
    
    const mapa = crearMapaBase();
    if (!mapa) {
      console.error("No se pudo crear el mapa");
      return;
    }
    
    inicializarAutocompletado();
    initRutas(mapa);
    initParaderos(mapa);
    initAdminMapa(mapa);
  } catch (error) {
    console.error("Error en mainMapa.js:", error);
  }
});