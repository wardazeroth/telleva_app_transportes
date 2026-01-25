import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Icons } from '../../components/Icons';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        rutas: 0,
        paraderos: 0,
        transportes: 0,
        usuarios: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats/');
                setStats(response.data);
            } catch (error) {
                console.error("Error cargando estadísticas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido al Panel</h2>
            <p className="text-gray-500 mb-8">Resumen del estado del sistema de transporte en tiempo real.</p>
            
            {/* Grid de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/rutas" className="block group">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-blue-200 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">Rutas Activas</h3>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Route /></div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {loading ? '...' : stats.rutas}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Trazados registrados</p>
                    </div>
                </Link>

                <Link to="/admin/paraderos" className="block group">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-green-200 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider group-hover:text-green-600 transition-colors">Paraderos</h3>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Icons.BusStop /></div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 group-hover:text-green-600 transition-colors">
                            {loading ? '...' : stats.paraderos}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Puntos habilitados</p>
                    </div>
                </Link>

                <Link to="/admin/transportes" className="block group"> 
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-purple-200 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider group-hover:text-purple-600 transition-colors">Flota Total</h3>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Icons.Bus /></div>
                        </div>
                        <p className="text-4xl font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {loading ? '...' : stats.transportes}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Vehículos en sistema</p>
                    </div>
                </Link>
            </div>

            {/* Bloque de Inicio Rápido */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-5 shadow-sm">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
                    <Icons.Dashboard />
                </div>
                <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">Acciones Rápidas</h4>
                    <p className="text-gray-600 mt-1 text-sm leading-relaxed max-w-2xl mb-4">
                        Accesos directos para la gestión del sistema de transporte.
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                        <Link to="/admin/rutas/nueva" className="shortcut-btn border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                            <Icons.Plus /> Nueva Ruta
                        </Link>
                        <Link to="/admin/paraderos/nuevo" className="shortcut-btn border-green-200 text-green-700 bg-green-50 hover:bg-green-100">
                            <Icons.Plus /> Nuevo Paradero
                        </Link>
                        <div className="h-8 w-px bg-gray-300 hidden sm:block mx-1"></div>
                        <Link to="/admin/lineas" className="shortcut-btn border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                            <Icons.Bus /> Gestionar Líneas
                        </Link>
                        <Link to="/admin/transportes" className="shortcut-btn border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
                            <Icons.Bus /> Gestionar Flota
                        </Link>
                        <Link to="/admin/programacion" className="shortcut-btn border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100">
                            <Icons.Dashboard /> Asignar Rutas
                        </Link>
                    </div>
                </div>
            </div>
            
            <style>{`
                .shortcut-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 700;
                    border-radius: 0.5rem;
                    border-width: 1px;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .shortcut-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;