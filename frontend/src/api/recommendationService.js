import api from './axios';

export const recommendationService = {
    getRecommendations: async (coordinates, transportMode) => {
        try {
            const response = await api.post('/rutas/recomendar/', { 
                coordenadas: coordinates,
                tipo_transporte: transportMode
            });

            console.log( response.data)
            return response.data;
        } catch (error) {
            console.error("Error obteniendo recomendaciones:", error);
            throw error;
        }
    }
};