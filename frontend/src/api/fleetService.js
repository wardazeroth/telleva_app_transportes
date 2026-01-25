import api from './axios';

export const fleetService = {
    // --- LÍNEAS (Empresas) ---
    getLineas: async () => {
        const response = await api.get('/lineas/');
        return response.data;
    },
    createLinea: async (data) => {
        const response = await api.post('/lineas/', data);
        return response.data;
    },
    updateLinea: async (id, data) => {
        const response = await api.put(`/lineas/${id}/`, data);
        return response.data;
    },
    deleteLinea: async (id) => {
        const response = await api.delete(`/lineas/${id}/`);
        return response.data;
    },

    // --- LÍNEAS (Imágenes) ---
    getLineaImagenes: async () => {
        const response = await api.get('/lineas/imagenes/');
        return response.data;
    },
    createLineaImagen: async (data) => {
        const response = await api.post('/lineas/imagenes/', data);
        return response.data;
    },
    updateLineaImagen: async (id, data) => {
        const response = await api.put(`/lineas/imagenes/${id}/`, data);
        return response.data;
    },
    deleteLineaImagen: async (id) => {
        const response = await api.delete(`/lineas/imagenes/${id}/`);
        return response.data;
    },

    // --- TRANSPORTES (Vehículos) ---
    getTransportes: async () => {
        const response = await api.get('/transportes/');
        return response.data;
    },
    createTransporte: async (data) => {
        const response = await api.post('/transportes/', data);
        return response.data;
    },
    updateTransporte: async (id, data) => {
        const response = await api.put(`/transportes/${id}/`, data);
        return response.data;
    },
    deleteTransporte: async (id) => {
        const response = await api.delete(`/transportes/${id}/`);
        return response.data;
    },

    // --- ASIGNACIONES (Vinculación Rutas-Vehículos) ---
    getAsignaciones: async () => {
        const response = await api.get('/asignaciones_rutas/');
        return response.data;
    },
    createAsignacion: async (data) => {
        const response = await api.post('/asignaciones_rutas/', data);
        return response.data;
    },
    deleteAsignacion: async (id) => {
        const response = await api.delete(`/asignaciones_rutas/${id}/`);
        return response.data;
    }
};