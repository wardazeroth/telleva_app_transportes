import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/Map/MapComponent';
import { mapService } from '../../api/mapService';
import { routeService } from '../../api/routeService';
import { geocodingService } from '../../api/geocodingService';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';
import api from '../../api/axios';


const RouteCreator = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const mapaContainerRef = useRef(null);

    // Estados de datos
    const [paraderos, setParaderos] = useState([]);
    const [rutasExistentes, setRutasExistentes] = useState([]);
    
    // Estados de Dibujo
    const [modoDibujar, setModoDibujar] = useState(true);
    const [puntosRuta, setPuntosRuta] = useState([]);
    const [puntosEliminados, setPuntosEliminados] = useState([]);

    //Estados mapa
    const [mapCenter, setMapCenter] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    
            // --- ESTADOS DE UI ---
    const [originInput, setOriginInput] = useState("");

    // Estado de Guardado
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showEraseRouteModal, setShowEraseRouteModal] = useState(false);
    const [rutaNombre, setRutaNombre] = useState('');
    const [rutaCodigo, setRutaCodigo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Estado para controlar visibilidad de otras rutas
    const [showRutasEnMapa, setShowRutasEnMapa] = useState(false); 

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [dataParaderos, dataRutas] = await Promise.all([
                    mapService.getParaderos(),
                    mapService.getRutas()
                ]);
                setParaderos(dataParaderos);
                
                // Filtramos la ruta actual de la lista de fondo para no verla duplicada al editar
                if (id) {
                    setRutasExistentes(dataRutas.filter(r => String(r.id) !== String(id)));
                    
                    // Cargar datos de la ruta a editar
                    try {
                        const currentRuta = dataRutas.find(r => String(r.id) === String(id));
                        
                        if (currentRuta) {
                            setRutaNombre(currentRuta.nombre);
                            setRutaCodigo(currentRuta.codigo || '');
                            
                            let coords = currentRuta.coordenadas;
                            // Normalización simple por si viene en formato objeto o array
                            if (coords && coords.length > 0 && !Array.isArray(coords[0])) {
                                coords = coords.map(p => [p.latitud, p.longitud]);
                            }
                            setPuntosRuta(coords || []);
                            toast.success(`Editando: ${currentRuta.nombre}`, { icon: '✏️' });
                        }
                    } catch (e) {
                        console.error("Error cargando ruta detalle", e);
                    }

                } else {
                    setRutasExistentes(dataRutas);
                }

            } catch (error) {
                console.error("Error cargando datos:", error);
                toast.error("Error al cargar contexto del mapa");
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


    const handleMapClick = (latlng) => { };

    const handleMapDrawClick = (e) => {
        if (!modoDibujar) return;
        const { lat, lng } = e.latlng;
        setPuntosRuta(prev => [...prev, [lat, lng]]);
        setPuntosEliminados([]);
    };

    const handleDeshacer = () => {
        if (puntosRuta.length === 0) return;
        const nuevosPuntos = [...puntosRuta];
        const punto = nuevosPuntos.pop();
        setPuntosRuta(nuevosPuntos);
        setPuntosEliminados(prev => [...prev, punto]);
    };

    const handleRehacer = () => {
        if (puntosEliminados.length === 0) return;
        const nuevosEliminados = [...puntosEliminados];
        const punto = nuevosEliminados.pop();
        setPuntosRuta(prev => [...prev, punto]);
        setPuntosEliminados(nuevosEliminados);
    };

    const handleLimpiar = () => {
        setShowEraseRouteModal(true);
    };

    const confirmarBorrar = () => {
        setPuntosRuta([]);
        setPuntosEliminados([]);
        setShowEraseRouteModal(false);
    }

    const handleGuardarClick = () => {
        if (puntosRuta.length < 2) {
            toast.error("Dibuja al menos 2 puntos");
            return;
        }
        setShowSaveModal(true);
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
    

    const confirmarGuardar = async () => {
        if (!rutaNombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                nombre: rutaNombre,
                codigo: rutaCodigo,
                coordenadas: puntosRuta
            };

            if (id) {
                await routeService.guardarRuta(rutaNombre, puntosRuta); 
                await api.put(`/rutas/${id}/`, payload);
                toast.success("Ruta actualizada");
            } else {
                await api.post('/rutas/', payload);
                toast.success("Ruta creada");
            }
            navigate('/admin/rutas');
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
            setShowSaveModal(false);
        }
    };

    return (
        <div className="relative h-full w-full flex flex-col">
            {/* Header Flotante */}
            <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur shadow-md rounded-xl px-4 py-2 border border-gray-200 flex items-center gap-3">
                <button onClick={() => navigate('/admin/rutas')} className="text-gray-400 hover:text-gray-700 transition">
                    ⬅
                </button>
                <div>
                    <h1 className="text-sm font-bold text-gray-800">{id ? 'Editando Ruta' : 'Nueva Ruta'}</h1>
                    <p className="text-xs text-gray-500">{puntosRuta.length} puntos trazados</p>
                </div>
            </div>

            {/* Barra de Herramientas */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-2 w-max">
                <div className= "bg-white/95 backdrop-blur shadow-lg rounded-xl p-1.5 flex items-center gap-1 border border-gray-200">
                    <button onClick={handleDeshacer} disabled={puntosRuta.length === 0} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition" title="Deshacer">
                        ↩️
                    </button>
                    <button onClick={handleRehacer} disabled={puntosEliminados.length === 0} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition" title="Rehacer">
                        ↪️
                    </button>
                    <div className="h-5 w-px bg-gray-300 mx-1"></div>
                    
                    <button onClick={handleLimpiar} disabled={puntosRuta.length === 0} className="p-2 hover:bg-red-50 text-red-500 rounded-lg disabled:opacity-30 transition" title="Borrar todo">
                        <Icons.Trash />
                    </button>
                </div>

                <div className="bg-white/95 backdrop-blur shadow-lg rounded-xl p-1.5 flex items-center border border-gray-200">
                    <button onClick={handleMyLocation} className="p-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
                        <Icons.Crosshair />
                    </button>
                </div>
            </div>

            {/* Toggle para ver otras rutas */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur shadow-md rounded-lg p-2 border border-gray-200">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        checked={showRutasEnMapa} 
                        onChange={(e) => setShowRutasEnMapa(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mostrar Otras Rutas</span>
                </label>
            </div>

            {/* Botones de Acción Inferiores */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-3 w-full max-w-md justify-center px-4">
                {/* Botón Cancelar */}
                <button 
                    onClick={() => navigate('/admin/rutas')}
                    className="px-6 py-3 rounded-full font-bold text-gray-600 bg-white shadow-xl transition-all transform hover:scale-105 hover:bg-gray-50 border border-gray-200"
                >
                    Cancelar
                </button>

                <button 
                    onClick={handleGuardarClick}
                    disabled={puntosRuta.length < 2}
                    className={`
                        flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-xl transition-all transform hover:scale-105
                        ${puntosRuta.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
                    `}
                >
                    <Icons.Save /> {id ? 'Actualizar' : 'Guardar Ruta'}
                </button>
            </div>

            {/* Modal Guardar */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">{id ? 'Actualizar Ruta' : 'Guardar Nueva Ruta'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                <input type="text" autoFocus value={rutaNombre} onChange={(e) => setRutaNombre(e.target.value)} placeholder="Ej: Variante Teja - Centro" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código (Opcional)</label>
                                <input type="text" value={rutaCodigo} onChange={(e) => setRutaCodigo(e.target.value)} placeholder="Ej: R-01" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">Volver</button>
                            <button onClick={confirmarGuardar} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                                {isSaving ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            { showEraseRouteModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Borrar Ruta</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">¿Estás seguro de que deseas borrar esta ruta? Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowEraseRouteModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">Cancelar</button>
                            <button onClick={confirmarBorrar} disabled={isSaving} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                                {isSaving ? 'Borrando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mapa */}
            <div className="flex-1 relative" ref={mapaContainerRef}>
                <MapComponent 
                    paraderos={paraderos}
                    rutas={showRutasEnMapa ? rutasExistentes : []}                    
                    onMapClick={handleMapClick} 
                    onMapDrawClick={handleMapDrawClick}
                    modoDibujar={modoDibujar}
                    originInput = {originInput}
                    puntosRutaDibujo={puntosRuta}
                    centerOn={mapCenter || (puntosRuta.length > 0 ? puntosRuta[0] : null)}
                    startPoint={startPoint}
                />
            </div>
        </div>
    );
};

export default RouteCreator;