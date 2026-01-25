import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Adjuntar token si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Manejar expiración y Refresh Token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no se ha reintentado aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                // Si no hay refresh token, logout.
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Intentar refrescar el token
                const response = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken
                });

                if (response.status === 200) {
                    const newAccessToken = response.data.access;
                    
                    // Guardar nuevo token
                    localStorage.setItem('access_token', newAccessToken);
                    
                    // Actualizar el header de la petición original
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    // Reintentar la petición original
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error("Sesión expirada o refresh token inválido", refreshError);
                
                // Limpiar almacenamiento y redirigir a login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                
                // Opcional: Forzar recarga o redirigir usando window.location si no estamos en un componente React
                window.location.href = '/login'; 
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;