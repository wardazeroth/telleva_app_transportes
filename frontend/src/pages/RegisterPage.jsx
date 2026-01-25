import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); 
        
        const email = e.target.email.value;
        const password = e.target.password.value;
        const pass_repeat = e.target.pass_repeat.value;

        let newErrors = {};
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            newErrors.email = "El correo es obligatorio";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Ingresa un correo electrónico válido";
        }

        if (!password) newErrors.password = "La contraseña es obligatoria";
        if (!pass_repeat) newErrors.pass_repeat = "Debes repetir la contraseña";
        
        if (password && pass_repeat && password !== pass_repeat) {
            newErrors.pass_repeat = "Las contraseñas no coinciden";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await api.post('/register/', { email, password, pass_repeat });
            toast.success("¡Cuenta creada! Redirigiendo...");
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                setErrors(err.response.data);
                
                if (err.response.data.detail) {
                    toast.error(err.response.data.detail);
                }
            } else {
                toast.error("Error de conexión. Intenta más tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (fieldName) => `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-blue-600">Crear Cuenta</h2>
                    <p className="text-gray-500 mt-2">Únete a TeLleva</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" className={inputClass('email')} placeholder="nombre@ejemplo.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input type="password" name="password" className={inputClass('password')} placeholder="••••••••" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Repetir Contraseña</label>
                        <input type="password" name="pass_repeat" className={inputClass('pass_repeat')} placeholder="••••••••" />
                        {errors.pass_repeat && <p className="text-red-500 text-xs mt-1">{errors.pass_repeat}</p>}
                        
                        {errors.non_field_errors && <p className="text-red-500 text-xs mt-1 text-center bg-red-50 p-2 rounded">{errors.non_field_errors}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium shadow-sm transition
                        ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Ingresa aquí</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;