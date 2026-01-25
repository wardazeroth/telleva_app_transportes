import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../api/axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('access_token') 
        ? { access: localStorage.getItem('access_token'), refresh: localStorage.getItem('refresh_token') } 
        : null
    );
    const [loading, setLoading] = useState(true);

    const loginUser = async (username, password) => {
        try {
            const response = await api.post('/token/', { username, password });
            
            if (response.status === 200) {
                setAuthTokens(response.data);
                const decoded = jwtDecode(response.data.access);
                setUser(decoded);
                
                // Guardar en navegador
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);

                toast.success(`Bienvenido, ${decoded.username}`);
                return true;
            }
        } catch (error) {
            console.error("Error login:", error);
            if (error.response && error.response.status === 401) {
                toast.error("Credenciales incorrectas"); // <--- TOAST
            } else {
                toast.error("Error al conectar con el servidor");
            }
            return false;
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    // Al cargar la app, verificar si ya había sesión
    useEffect(() => {
        if (authTokens) {
            const decoded = jwtDecode(authTokens.access);
            setUser(decoded);
        }
        setLoading(false);
    }, [authTokens]);

    const contextData = {
        user,
        loginUser,
        logoutUser
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <p>Cargando...</p> : children}
        </AuthContext.Provider>
    );
};