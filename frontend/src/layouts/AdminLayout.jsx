import { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Icons } from '../components/Icons';

const AdminLayout = () => {
    const { logoutUser, user } = useContext(AuthContext);
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path 
        ? "bg-blue-700 text-white shadow-md" 
        : "text-gray-300 hover:bg-gray-800 hover:text-white";

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar (Escritorio) */}
            <aside className={`
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 fixed md:relative z-20 w-64 h-full bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out shadow-xl
            `}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-500 tracking-tight">TeLleva</h1>
                        <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Administración</p>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400">
                        ✕
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
                    
                    <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin')}`}>
                        <Icons.Dashboard /> Dashboard
                    </Link>

                    {/* SECCIÓN RUTAS */}
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Gestión de Rutas</p>
                    
                    <Link to="/admin/rutas/nueva" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/rutas/nueva')}`}>
                        <Icons.Plus /> Crear Nueva Ruta
                    </Link>
                    <Link to="/admin/rutas" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/rutas')}`}>
                        <Icons.Route /> Ver Rutas
                    </Link>

                    {/* SECCIÓN PARADEROS (NUEVA) */}
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Gestión de Paraderos</p>
                    
                    <Link to="/admin/paraderos/nuevo" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/paraderos/nuevo')}`}>
                        <Icons.Plus /> Nuevo Paradero
                    </Link>
                    <Link to="/admin/paraderos" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/paraderos')}`}>
                        <Icons.BusStop /> Ver Paraderos
                    </Link>

                    {/* SECCIÓN FLOTA */}
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Gestión de Flota</p>

                    <Link to="/admin/lineas" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/lineas')}`}>
                        <Icons.Bus /> Líneas / Empresas
                    </Link>

                    <Link to="/admin/transportes" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/transportes')}`}>
                        <Icons.Bus /> Gestión de Vehículos
                    </Link>

                    <Link to="/admin/programacion" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/admin/programacion')}`}>
                        <Icons.Dashboard /> Programación / Asignación
                    </Link>

                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Sistema</p>
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 border border-gray-700/50">
                        <Icons.MapPin /> Ver Mapa Cliente
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate text-white">{user?.username}</p>
                            <p className="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <button 
                        onClick={logoutUser} 
                        className="w-full bg-red-600/90 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition shadow-md flex justify-center items-center gap-2"
                    >
                        <Icons.Logout /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header Móvil */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden z-10">
                    <span className="font-bold text-gray-800">Panel de Control</span>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 p-2 rounded hover:bg-gray-100">
                        ☰
                    </button>
                </header>

                {/* Área de contenido (Outlet renderiza las páginas hijas) */}
                <div className="flex-1 overflow-auto bg-gray-50 relative">
                    <Outlet />
                </div>
            </div>

            {/* Overlay para móvil */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;