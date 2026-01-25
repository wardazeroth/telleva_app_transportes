import { useEffect, useState } from 'react';
import { fleetService } from '../../api/fleetService';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminLineas = () => {
    const [lineas, setLineas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado del Modal y Formulario
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', codigo: '', empresa: '', descripcion: '', url_imagen: '', activo: true });

    // Modal Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lineaToDelete, setLineaToDelete] = useState(null);

    const cargarLineas = async () => {
        try {
            const data = await fleetService.getLineas();
            setLineas(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar líneas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarLineas(); }, []);

    const resetForm = () => {
        setFormData({ nombre: '', codigo: '', empresa: '', descripcion: '', url_imagen: '', activo: true });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenCreate = () => { resetForm(); setShowModal(true); };

    const handleOpenEdit = (linea) => {
        setCurrentId(linea.id);
        setFormData({
            nombre: linea.nombre,
            codigo: linea.codigo,
            empresa: linea.empresa || '',
            descripcion: linea.descripcion || '',
            url_imagen: '',
            activo: linea.activo
        });
        setCurrentId(linea.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const confirmDelete = (linea) => {
        setLineaToDelete(linea);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!lineaToDelete) return;
        try {
            await fleetService.deleteLinea(lineaToDelete.id);
            setLineas(lineas.filter(l => l.id !== lineaToDelete.id));
            toast.success("Línea eliminada");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        } finally {
            setLineaToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const toastId = toast.loading("Guardando...");
        try {
            if (isEditing) {
                // await fleetService.updateLineaImagen({linea: currentId, url_imagen: formData.url_imagen});
                await fleetService.updateLinea(currentId, formData);
                toast.success("Línea actualizada", { id: toastId });
                if (formData.url_imagen)
                {
                    await fleetService.createLineaImagen({ linea: currentId, url_imagen: formData.url_imagen });
                    setFormData(prev => ({ 
                    ...prev,
                    url_imagen: '' 
                }));
                }

            } else {
                

                const nuevaLinea=await fleetService.createLinea(formData);

                if (formData.url_imagen)
                {
                    await fleetService.createLineaImagen({ linea: nuevaLinea.id, url_imagen: formData.url_imagen });
                }
                toast.success("Línea creada", { id: toastId });
            }
            setShowModal(false);
            cargarLineas();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar datos", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Líneas</h2>
                    <p className="text-sm text-gray-500">Administra las empresas y líneas de transporte.</p>
                </div>
                <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <Icons.Plus /> Nueva Línea
                </button>
            </div>

            {/* Tabla */}
            {loading ? <div className="text-center py-10 text-gray-400">Cargando datos...</div> : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Línea</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lineas.map((linea) => (
                                <tr key={linea.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-blue-600">{linea.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{linea.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{linea.empresa || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${linea.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {linea.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                        <button onClick={() => handleOpenEdit(linea)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition">
                                            <Icons.Edit />
                                        </button>
                                        <button onClick={() => confirmDelete(linea)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition">
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {lineas.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No hay líneas registradas.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Creación/Edición (Mismo código que antes) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">{isEditing ? 'Editar Línea' : 'Nueva Línea'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código *</label>
                                    <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 20" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
                                    <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Línea 20" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: TransValdivia S.A." value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <textarea className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="2" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen URL</label>
                                <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxZqbURE5ghF_sTCQhDbcwBemzsH6Rz8QquA&s" value={formData.url_imagen} onChange={e => setFormData({...formData, url_imagen: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="activo" className="text-sm text-gray-700 select-none">Línea Activa</label>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition">
                                    {isEditing ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Línea"
                message={`¿Estás seguro de que deseas eliminar la línea "${lineaToDelete?.nombre}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
};

export default AdminLineas;