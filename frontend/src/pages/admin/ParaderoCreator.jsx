import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MapComponent from '../../components/Map/MapComponent';
import { mapService } from '../../api/mapService';
import { geocodingService } from '../../api/geocodingService';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

const ParaderoCreator = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Estados del Formulario
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        direccion: '',
        latitud: null,
        longitud: null,
        rutas_ids: []
    });

    const mapaContainerRef = useRef(null);
    
    // Estado Selector Rutas
    const [selectedRutaId, setSelectedRutaId] = useState('');

    // Contexto Visual
    const [rutasExistentes, setRutasExistentes] = useState([]);
    const [paraderosExistentes, setParaderosExistentes] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // --- NUEVOS ESTADOS UX ---
    const [mapCenter, setMapCenter] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    const [originInput, setOriginInput] = useState("");
    const [showRutasEnMapa, setShowRutasEnMapa] = useState(true);

    const [modoDibujar, setModoDibujar] = useState(true);

    const [hideSidebar, setHideSidebar] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [rutas, paraderos] = await Promise.all([
                    mapService.getRutas(),
                    mapService.getParaderos()
                ]);
                setRutasExistentes(rutas);
                setParaderosExistentes(paraderos);

                // Modo Edición: Cargar y Centrar
                if (id) {
                    const response = await api.get(`/paraderos/${id}/`);
                    const data = response.data;
                    
                    setFormData({
                        nombre: data.nombre,
                        codigo: data.codigo || '',
                        descripcion: data.descripcion || '',
                        direccion: data.direccion || '',
                        latitud: data.latitud,
                        longitud: data.longitud,
                        rutas_ids: data.rutas_ids || data.rutas?.map(r => r.id) || [] 
                    });

                    // CENTRAR MAPA EN EL PARADERO
                    if (data.latitud && data.longitud) {
                        setMapCenter([data.latitud, data.longitud]);
                    }
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error al cargar datos");
            }
        };
        cargarDatos();
    }, [id]);

        useEffect(() => 
        {
            if (!mapaContainerRef.current) {
            return; 
            }
    
            const mapElement = mapaContainerRef.current.querySelector('.leaflet-container')
    
            if (mapElement) {
                if (modoDibujar) {
                    mapElement.style.cursor = 'crosshair';
                } else {
                    mapElement.style.cursor = '';
                }
            }
        }, [modoDibujar]); 

    const handleMapClick = (latlng) => {
        setFormData(prev => ({
            ...prev,
            latitud: latlng.lat,
            longitud: latlng.lng
        }));
    };

    const handleAddRuta = () => {
        if (!selectedRutaId) return;
        const rutaIdInt = parseInt(selectedRutaId);

        if (formData.rutas_ids.includes(rutaIdInt)) {
            toast.error("Esa ruta ya está vinculada");
            return;
        }
        setFormData(prev => ({ ...prev, rutas_ids: [...prev.rutas_ids, rutaIdInt] }));
        setSelectedRutaId('');
    };

    const handleRemoveRuta = (rutaId) => {
        setFormData(prev => ({ ...prev, rutas_ids: prev.rutas_ids.filter(id => id !== rutaId) }));
    };

    const getRutaNombre = (id) => {
        const ruta = rutasExistentes.find(r => r.id === id);
        return ruta ? ruta.nombre : 'Ruta desconocida';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitud || !formData.longitud) {
            toast.error("Selecciona una ubicación en el mapa");
            return;
        }
        if (!formData.nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        setIsSaving(true);
        try {
            const payload = { ...formData };
            if (id) {
                await api.put(`/paraderos/${id}/`, payload);
                toast.success("Paradero actualizado");
            } else {
                await api.post('/paraderos/', payload);
                toast.success("Paradero creado");
            }
            navigate('/admin/paraderos');
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Tu navegador no soporta geolocalización");
            return;
        }
    
        const toastId = toast.loading("Obteniendo ubicación...");
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { lat: latitude, lng: longitude };
    
            setMapCenter([latitude, longitude]);
            setStartPoint(coords);
    
            try {
                const address = await geocodingService.reverseGeocode(latitude, longitude);
                setOriginInput(address);
                toast.success("Ubicación actualizada", { id: toastId });
            } catch (error) {
                console.error(error);
                setOriginInput("Mi ubicación actual");
                toast.success("Ubicación encontrada", { id: toastId });
            }
    
        }, (error) => {
            console.error("Error GPS:", error);
            toast.error("No se pudo obtener ubicación", { id: toastId });
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    };

    const paraderosVisuales = [
        // Excluimos el actual de la lista para no duplicarlo
        ...paraderosExistentes.filter(p => String(p.id) !== String(id)),
        // Agregamos la versión del formulario
        ...(formData.latitud && formData.longitud ? [{
            id: id || 'preview-temp',
            nombre: formData.nombre || 'Nuevo Paradero',
            latitud: formData.latitud,
            longitud: formData.longitud,
            direccion: formData.direccion,
            rutas: []
        }] : [])
    ];

    return (
        <div className="flex h-full relative">
            {/* Sidebar */}
            {!hideSidebar && (
            <div className="absolute top-4 left-4 z-[1000] bg-white shadow-xl rounded-xl w-80 max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-xl">
                    <h3 className="font-bold text-gray-700">{id ? 'Editar Paradero' : 'Nuevo Paradero'}</h3>
                    <button onClick={() => navigate('/admin/paraderos')} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Campos Texto */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
                        <input type="text" required className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Paradero Hospital" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código</label>
                            <input type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} placeholder="P-01"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
                            <input type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Calle X"/>
                        </div>
                    </div>
                    
                    {/* Ubicación Info */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-800 font-semibold mb-1">Ubicación</p>
                        {formData.latitud ? (
                            <p className="text-xs text-gray-600 font-mono">{formData.latitud.toFixed(5)}, {formData.longitud.toFixed(5)}</p>
                        ) : (
                            <p className="text-xs text-orange-600 flex items-center gap-1"><Icons.MapPin /> Haz clic en el mapa</p>
                        )}
                    </div>

                    {/* Selector Rutas */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rutas Asociadas</label>
                        <div className="flex gap-2 mb-3">
                            <select className="flex-1 p-2 border border-gray-300 rounded-lg text-xs" value={selectedRutaId} onChange={(e) => setSelectedRutaId(e.target.value)}>
                                <option value="">Seleccionar ruta...</option>
                                {rutasExistentes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                            <button type="button" onClick={handleAddRuta} className="bg-blue-100 text-blue-700 px-3 rounded-lg text-xs font-bold hover:bg-blue-200">+</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.rutas_ids.length === 0 && <span className="text-xs text-gray-400 italic">Sin rutas vinculadas</span>}
                            {formData.rutas_ids.map(rutaId => (
                                <span key={rutaId} className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full shadow-sm">
                                    {getRutaNombre(rutaId)}
                                    <button type="button" onClick={() => handleRemoveRuta(rutaId)} className="text-red-400 hover:text-red-600 ml-1 font-bold">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Botones Footer */}
                    <div className="pt-2 flex gap-2">
                        <button type="button" onClick={() => navigate('/admin/paraderos')} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md flex justify-center items-center gap-2">
                            {isSaving ? 'Guardando...' : <><Icons.Save /> Guardar</>}
                        </button>
                    </div>
                </form>
            </div>
            )}

            
            <div className="bg-white/95 backdrop-blur shadow-lg rounded-xl p-1.5 flex items-center border border-gray-200">
                <button onClick={handleMyLocation} className="p-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
                    <Icons.Crosshair />
                </button>
            </div>

            <div className="absolute top-4 right-60 z-[1000] bg-white/90 backdrop-blur shadow-md rounded-lg p-2 border border-gray-200">
                <button onClick={handleMyLocation} className="p-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
                    <Icons.Crosshair />
                </button>
            </div>

            {/* Control Flotante: Capas */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur shadow-md rounded-lg p-2 border border-gray-200">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        checked={showRutasEnMapa} 
                        onChange={(e) => setShowRutasEnMapa(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mostrar Trazados de Rutas</span>
                </label>
            </div>

            {/* Mapa */}
            <div className="flex-1 relative" ref={mapaContainerRef}>
                <MapComponent 
                    paraderos={paraderosVisuales} 
                    rutas={showRutasEnMapa ? rutasExistentes : []}
                    onMapClick={handleMapClick} 
                    centerOn={mapCenter}
                    startPoint={startPoint}
                    originInput = {originInput}
                    editId={id || 'preview-temp'}
                    setHideSidebar={setHideSidebar}
                    setParaderosExistentes={setParaderosExistentes}
                    isAdmin={true}
                />
            </div>
        </div>
    );
};

export default ParaderoCreator;