import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const LoginPage = () => {
    const { loginUser, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); 

    useEffect(() => {
        if (user) {
            if (user.rol === 'admin' || user.is_staff) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); 
        
        const username = e.target.username.value;
        const password = e.target.password.value;

        let newErrors = {};
        if (!username) newErrors.username = "Ingresa tu email o usuario";
        if (!password) newErrors.password = "Ingresa tu contraseña";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Completa los campos requeridos");
            return;
        }

        setLoading(true);
        const success = await loginUser(username, password);
        if (!success) setLoading(false);
    };

    const inputClass = (fieldName) => `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-blue-600">Bienvenido</h2>
                    <p className="text-gray-500 mt-2">Ingresa a TeLleva</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Usuario / Email</label>
                        <input 
                            type="text" 
                            name="username" 
                            className={inputClass('username')}
                            placeholder="ejemplo@correo.com"
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input 
                            type="password" 
                            name="password" 
                            className={inputClass('password')}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition
                        ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Regístrate aquí
                        </Link>
                    </p>
                    <div className="mt-4">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                            ← Volver al mapa
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;