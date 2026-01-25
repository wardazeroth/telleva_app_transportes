import api from './axios';

export const routeService = {
    calculateRoute: async (originCoords, destCoords, transportMode = 'driving-car') => {
        // Formato requerido por backend: "lon,lat"
        const originStr = `${originCoords.lng},${originCoords.lat}`;
        const destStr = `${destCoords.lng},${destCoords.lat}`;

        const response = await api.get('/obtener_ruta/', {
            params: {
                origen: originStr,
                destino: destStr,
                medio: transportMode
            }
        });
        return response.data;
    },

    guardarRuta: async (nombre, coordenadas) => {
        const response = await api.post('/rutas/', { 
            nombre: nombre,
            coordenadas: coordenadas,
        });

        return response.data;
    }
};
