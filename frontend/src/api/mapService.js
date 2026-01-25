import api from './axios';

export const mapService = {
    getParaderos: async () => {
        const response = await api.get('/paraderos/');
        return response.data;
    },

    getRutas: async () => {
        const response = await api.get('/rutas/');
        return response.data;
    },

    getLineas: async () => {
        const response = await api.get('/lineas/')
        return response.data;
    },

    getLinea: async (lineaId) => {
        const response = await api.get(`/lineas/${lineaId}`)
        return response.data;
    },

    getTransportes: async () => {
        const response = await api.get('/transportes/')
        return response.data
    },

    getTransporte: async (transporteId) => {
        const response = await api.get(`/transportes/${transporteId}`)
        return response.data
    }
};