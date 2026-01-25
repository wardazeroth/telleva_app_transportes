import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminParaderos = () => {
    const [paraderos, setParaderos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado Modal Eliminación
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [paraderoToDelete, setParaderoToDelete] = useState(null);

    const cargarParaderos = async () => {
        try {
            const response = await api.get('/paraderos/');
            setParaderos(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar paraderos");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (paradero) => {
        setParaderoToDelete(paradero);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!paraderoToDelete) return;

        try {
            await api.delete(`/paraderos/${paraderoToDelete.id}/`);
            toast.success("Paradero eliminado");
            setParaderos(paraderos.filter(p => p.id !== paraderoToDelete.id));
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        } finally {
            setParaderoToDelete(null);
        }
    };

    useEffect(() => {
        cargarParaderos();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Paraderos</h2>
                    <p className="text-sm text-gray-500">Administra los puntos de subida y bajada de la red.</p>
                </div>
                <Link to="/admin/paraderos/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <Icons.Plus /> Nuevo Paradero
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Cargando datos...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paraderos.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{p.codigo || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm truncate max-w-xs" title={p.direccion}>
                                        {p.direccion || 'Sin dirección'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                        <Link to={`/admin/paraderos/editar/${p.id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition">
                                            <Icons.Edit />
                                        </Link>
                                        <button 
                                            onClick={() => confirmDelete(p)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paraderos.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                                        No hay paraderos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Paradero"
                message={`¿Estás seguro de eliminar el paradero "${paraderoToDelete?.nombre}"?`}
            />
        </div>
    );
};

export default AdminParaderos;