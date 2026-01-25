import { useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import ConfirmationModal from '../../components/ConfirmationModal';

// Iconos
// Normal: Azul (Tiene rutas vinculadas)
const iconNormal = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Huérfano: Gris/Negro (Sin rutas, alerta visual)
const iconOrphan = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Edición: Naranja/Gold
const iconEditing = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 48], // Un poco más grande
    iconAnchor: [15, 48],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [50, 50]
});

const ParaderosLayer = ({ paraderos, editId, setParaderosExistentes,setHideSidebar, isAdmin=false}) => {
    
    // Estado Modal Eliminación
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [paraderoToDelete, setParaderoToDelete] = useState(null);

    const confirmDelete = (paradero) => {
    setParaderoToDelete(paradero);
    setDeleteModalOpen(true);
    if (setHideSidebar) setHideSidebar(true);
    };

    const handleDelete = async () => {
        if (!paraderoToDelete) return;

        try {
            await api.delete(`/paraderos/${paraderoToDelete.id}/`);
            toast.success("Paradero eliminado");
            if (setParaderosExistentes) {
                setParaderosExistentes(prev => prev.filter(p => p.id !== paraderoToDelete.id));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        } finally {
            setDeleteModalOpen(false);
            setParaderoToDelete(null);
            if (setHideSidebar) setHideSidebar(false);
        }
    };

    const handleCloseModal = () => {
        setDeleteModalOpen(false);
        // SI CANCELA, TAMBIÉN VOLVEMOS A MOSTRAR EL SIDEBAR
        if (setHideSidebar) setHideSidebar(false);
    };

    return (
        <> 
            {paraderos.map((paradero) => {
                const isEditing = String(paradero.id) === String(editId) || paradero.id === 'preview-temp';
                const hasRoutes = paradero.rutas && paradero.rutas.length > 0;
                
                // Lógica de selección de icono
                let finalIcon = iconNormal;
                if (isEditing) finalIcon = iconEditing;
                else if (!hasRoutes) finalIcon = iconOrphan;

                return (
                    <Marker 
                        key={paradero.id} 
                        position={[paradero.latitud, paradero.longitud]} 
                        icon={finalIcon}
                        zIndexOffset={isEditing ? 1000 : 0}
                    >
                        {/* Etiqueta visible (Tooltip) */}
                        <Tooltip 
                            direction="top" 
                            offset={[0, -40]} 
                            opacity={isEditing ? 1 : 0.8}
                            permanent={isEditing}
                        >
                            <span className={isEditing ? "font-bold text-orange-600" : "text-gray-600"}>
                                {paradero.nombre}
                            </span>
                        </Tooltip>

                        <Popup>
                            <div className="text-center">

                                {isAdmin && (
                                <div className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                    <Link to={`/admin/paraderos/editar/${paradero.id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition">
                                        <Icons.Edit />
                                    </Link>
                                    <button 
                                        onClick={() => confirmDelete(paradero)}
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </div>
                                )}

                                <h3 className="font-bold text-lg text-blue-600">{paradero.nombre}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {paradero.direccion || "Sin dirección"}
                                </p>
                                <div className={`mt-2 text-xs p-1 rounded ${hasRoutes ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <strong>Estado: </strong> 
                                    {hasRoutes ? `${paradero.rutas.length} rutas vinculadas` : "⚠ Sin rutas (Huérfano)"}
                                </div>
                                {hasRoutes && (
                                    <div className="mt-1 text-[10px] text-gray-500">
                                        {paradero.rutas.map(r => r.nombre).join(", ")}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleDelete}
                title="Eliminar Paradero"
                message={`¿Estás seguro de eliminar el paradero "${paraderoToDelete?.nombre}"?`}
            />
        </> 
    );

};



export default ParaderosLayer;