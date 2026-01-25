import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminRoutes = () => {
    const [rutas, setRutas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado Modal Eliminación
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [rutaToDelete, setRutaToDelete] = useState(null);

    const cargarRutas = async () => {
        try {
            const response = await api.get('/rutas/');
            setRutas(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el listado de rutas");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (ruta) => {
        setRutaToDelete(ruta);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!rutaToDelete) return;

        try {
            await api.delete(`/rutas/${rutaToDelete.id}/`);
            toast.success("Ruta eliminada");
            setRutas(rutas.filter(r => r.id !== rutaToDelete.id));
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar la ruta");
        } finally {
            setRutaToDelete(null);
        }
    };

    useEffect(() => {
        cargarRutas();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Rutas</h2>
                    <p className="text-sm text-gray-500">Visualiza y administra los trazados del sistema.</p>
                </div>
                <Link 
                    to="/admin/rutas/nueva" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                >
                    <Icons.Plus /> Nueva Ruta
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Cargando rutas...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    {rutas.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            <p>No hay rutas registradas aún.</p>
                            <Link to="/admin/rutas/nueva" className="text-blue-600 hover:underline mt-2 inline-block">
                                ¡Crea la primera!
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Puntos</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rutas.map((ruta) => (
                                    <tr key={ruta.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {ruta.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {ruta.codigo || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {ruta.coordenadas ? ruta.coordenadas.length : 0} puntos
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                            {/* Botón Ver/Editar */}
                                            <Link 
                                                to={`/admin/rutas/editar/${ruta.id}`} 
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition"
                                                title="Ver en Mapa / Editar"
                                            >
                                                <Icons.Edit />
                                            </Link>
                                            <button 
                                                onClick={() => confirmDelete(ruta)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition"
                                                title="Eliminar Ruta"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Ruta"
                message={`¿Estás seguro de eliminar la ruta "${rutaToDelete?.nombre}"? Esta acción borrará el trazado geográfico permanentemente.`}
            />
        </div>
    );
};

export default AdminRoutes;