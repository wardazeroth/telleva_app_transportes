import { useEffect, useState } from 'react';
import { fleetService } from '../../api/fleetService';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminTransportes = () => {
    const [transportes, setTransportes] = useState([]);
    const [lineas, setLineas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal Edit/Create
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ patente: '', tipo: 'micro', capacidad: 30, tarifa_base: 0, descripcion: '', linea_id: '' });

    // Modal Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [transporteToDelete, setTransporteToDelete] = useState(null);

    const tiposTransporte = [
        { id: 'micro', label: 'Microbus' },
        { id: 'colectivo', label: 'Colectivo' },
        { id: 'bus', label: 'Bus Interurbano' }
    ];

    const cargarDatos = async () => {
        try {
            const [dataTransportes, dataLineas] = await Promise.all([
                fleetService.getTransportes(),
                fleetService.getLineas()
            ]);
            setTransportes(dataTransportes);
            setLineas(dataLineas);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos de flota");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const resetForm = () => {
        setFormData({ patente: '', tipo: 'micro', capacidad: 30, tarifa_base: 0, descripcion: '', linea_id: '' });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenCreate = () => { resetForm(); setShowModal(true); };

    const handleOpenEdit = (transporte) => {
        setFormData({
            patente: transporte.patente || '',
            tipo: transporte.tipo,
            capacidad: transporte.capacidad || 0,
            tarifa_base: transporte.tarifa_base || 0,
            descripcion: transporte.descripcion || '',
            linea_id: transporte.linea ? transporte.linea.id : ''
        });
        setCurrentId(transporte.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const confirmDelete = (transporte) => {
        setTransporteToDelete(transporte);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!transporteToDelete) return;
        try {
            await fleetService.deleteTransporte(transporteToDelete.id);
            setTransportes(transportes.filter(t => t.id !== transporteToDelete.id));
            toast.success("Vehículo eliminado");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Guardando...");
        const payload = { ...formData };
        if (!payload.linea_id) delete payload.linea_id;

        try {
            if (isEditing) {
                await fleetService.updateTransporte(currentId, payload);
                toast.success("Transporte actualizado", { id: toastId });
            } else {
                await fleetService.createTransporte(payload);
                toast.success("Transporte creado", { id: toastId });
            }
            setShowModal(false);
            const refresh = await fleetService.getTransportes();
            setTransportes(refresh);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar vehículo", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Flota</h2>
                    <p className="text-sm text-gray-500">Administra los vehículos (micros, colectivos).</p>
                </div>
                <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <Icons.Plus /> Nuevo Vehículo
                </button>
            </div>

            {loading ? <div className="text-center py-10 text-gray-400">Cargando flota...</div> : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Línea Asignada</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacidad</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transportes.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-900 uppercase">{t.patente || 'S/P'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{t.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                        {t.linea ? t.linea.nombre : <span className="text-gray-400 italic">Sin asignar</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.capacidad} pas.</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                        <button onClick={() => handleOpenEdit(t)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition">
                                            <Icons.Edit />
                                        </button>
                                        <button onClick={() => confirmDelete(t)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition">
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transportes.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No hay vehículos registrados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Creación/Edición (Omitido para brevedad, es el mismo que antes) */}
            {showModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">{isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Patente</label>
                                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="AB-CD-12" value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value.toUpperCase()})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                    <select className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                                        {tiposTransporte.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.label}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa / Línea</label>
                                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.linea_id} onChange={e => setFormData({...formData, linea_id: e.target.value})}>
                                    <option value="">-- Seleccionar Línea --</option>
                                    {lineas.map(l => (<option key={l.id} value={l.id}>{l.codigo} - {l.nombre}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidad</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tarifa Base ($)</label>
                                    <input type="number" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.tarifa_base} onChange={e => setFormData({...formData, tarifa_base: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción (Opcional)</label>
                                <textarea className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="2" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition">{isEditing ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Vehículo"
                message={`¿Estás seguro de eliminar el vehículo patente ${transporteToDelete?.patente}?`}
            />
        </div>
    );
};

export default AdminTransportes;