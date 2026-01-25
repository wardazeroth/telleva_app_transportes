import { useEffect, useState } from 'react';
import { fleetService } from '../../api/fleetService';
import { mapService } from '../../api/mapService';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminAsignaciones = () => {
    const [asignaciones, setAsignaciones] = useState([]);
    const [transportes, setTransportes] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ transporte_id: '', ruta_id: '', hora_salida: '', hora_llegada_estim: '' });

    // Modal Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [asigToDelete, setAsigToDelete] = useState(null);

    const cargarDatos = async () => {
        try {
            const [dataAsig, dataTrans, dataRutas] = await Promise.all([
                fleetService.getAsignaciones(),
                fleetService.getTransportes(),
                mapService.getRutas()
            ]);
            setAsignaciones(dataAsig);
            setTransportes(dataTrans);
            setRutas(dataRutas);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const confirmDelete = (item) => {
        setAsigToDelete(item);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!asigToDelete) return;
        try {
            await fleetService.deleteAsignacion(asigToDelete.id);
            setAsignaciones(asignaciones.filter(a => a.id !== asigToDelete.id));
            toast.success("Asignación eliminada");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.transporte_id || !formData.ruta_id) {
            toast.error("Selecciona transporte y ruta");
            return;
        }
        const payload = {...formData };
        if (payload.hora_salida === '') {
            payload.hora_salida = null;
        }
        if (payload.hora_llegada_estim === '') {
            payload.hora_llegada_estim = null;
        }

        const toastId = toast.loading("Asignando...");

        try {
            await fleetService.createAsignacion(payload);
            toast.success("Asignación creada", { id: toastId });
            setShowModal(false);
            setFormData({ transporte_id: '', ruta_id: '', hora_salida: '', hora_llegada_estim: '' });
            const data = await fleetService.getAsignaciones();
            setAsignaciones(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al crear asignación", { id: toastId });
        }
    };

    const getTransporteLabel = (t) => {
        const linea = t.linea ? `${t.linea.codigo} ${t.linea.nombre}` : 'Sin Línea';
        return `${linea} - ${t.patente || 'S/P'} (${t.tipo})`;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Programación de Rutas</h2>
                    <p className="text-sm text-gray-500">Asigna vehículos a los trazados geográficos.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <Icons.Plus /> Nueva Asignación
                </button>
            </div>

            {loading ? <div className="text-center py-10 text-gray-400">Cargando programación...</div> : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Línea / Vehículo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ruta Geográfica</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Horario Salida</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {asignaciones.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{item.transporte?.linea?.nombre || 'Línea ???'}</span>
                                            <span className="text-xs text-gray-500">Patente: {item.transporte?.patente || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 bg-blue-50 text-blue-600 rounded"><Icons.Route /></span>
                                            <span className="text-sm font-medium text-gray-700">{item.ruta?.nombre || 'Ruta eliminada'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{item.hora_salida ? item.hora_salida.slice(0,5) : '--:--'} hrs</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => confirmDelete(item)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition">
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {asignaciones.length === 0 && <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-400">No hay vehículos asignados a rutas actualmente.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Nueva Asignación</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehículo (Flota)</label>
                                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.transporte_id} onChange={e => setFormData({...formData, transporte_id: e.target.value})} required>
                                    <option value="">-- Seleccionar Vehículo --</option>
                                    {transportes.map(t => (<option key={t.id} value={t.id}>{getTransporteLabel(t)}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ruta (Trazado)</label>
                                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.ruta_id} onChange={e => setFormData({...formData, ruta_id: e.target.value})} required>
                                    <option value="">-- Seleccionar Ruta --</option>
                                    {rutas.map(r => (<option key={r.id} value={r.id}>{r.codigo ? `[${r.codigo}] ` : ''}{r.nombre}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Salida</label>
                                    <input type="time" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.hora_salida} onChange={e => setFormData({...formData, hora_salida: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Llegada Estimada</label>
                                    <input type="time" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.hora_llegada_estim} onChange={e => setFormData({...formData, hora_llegada_estim: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition">Asignar Ruta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Desvincular Transporte"
                message="¿Estás seguro de que deseas desvincular este transporte de la ruta?"
            />
        </div>
    );
};

export default AdminAsignaciones;