import axios from 'axios';

const nominatim = axios.create();

export const geocodingService = {
    searchAddress: async (query) => {
        if (!query || query.length < 3) return [];
        
        try {
            // Viewbox acotado a Valdivia/Región de los Ríos aprox para mejorar precisión
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=cl&viewbox=-73.3,-39.7,-73.1,-39.9&bounded=0`;
            const response = await nominatim.get(url);
            return response.data;
        } catch (error) {
            console.error("Error buscando dirección:", error);
            return [];
        }
    },

    reverseGeocode: async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const response = await nominatim.get(url);
            return response.data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch (error) {
            console.error("Error obteniendo dirección:", error);
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    }
};