import { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MapComponent from '../components/Map/MapComponent';
import { mapService } from '../api/mapService';
import { routeService } from '../api/routeService';
import { geocodingService } from '../api/geocodingService';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// Iconos SVG simples para no instalar librerías extra
const Icons = {
    Car: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h12"/></svg>,
    Bike: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>,
    Walk: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4v6l-2 3-3-2-2 3h4l2 5 3-3V9l2-2 3 1 2-4"/><circle cx="13" cy="4" r="1"/></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    Crosshair: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>

};

const AdminMapPage = () => {
    const { user, logoutUser } = useContext(AuthContext);
    // --- ESTADOS DE DATOS ---
    const [paraderos, setParaderos] = useState([]);
    const [rutas, setRutas] = useState([]);

    // --- ESTADOS DE RUTA ---
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null);
    
    // NUEVO: Estado del Medio de Transporte
    const [transportMode, setTransportMode] = useState('driving-car'); // driving-car, cycling-regular, foot-walking

    // --- ESTADOS DE UI ---
    const [originInput, setOriginInput] = useState("");
    const [destInput, setDestInput] = useState("");
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);

    const debouncedOrigin = useDebounce(originInput, 1000);
    const debouncedDest = useDebounce(destInput, 1000);

    const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
    const [selectionStep, setSelectionStep] = useState('start');

    // ESTADOS DE MODO-ADMIN
    const [modoDibujar, setModoDibujar] = useState(false);
    const [puntosRuta, setPuntosRuta] = useState([]);
    const [puntosEliminados, setPuntosEliminados] = useState([]);
    const [showNameModal, setShowNameModal] = useState(false);
    const [rutaNombre, setRutaNombre] = useState('');
    const [isSaving, setIsSaving] = useState(false)
    //---Referencias --
    const btnDibujarRef = useRef(null);
    const btnGuardarRutaRef = useRef(null);
    const mapaContainerRef = useRef(null);

    // Cargar datos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [dataParaderos, dataRutas] = await Promise.all([
                    mapService.getParaderos(),
                    mapService.getRutas()
                ]);
                setParaderos(dataParaderos);
                setRutas(dataRutas);
            } catch (error) {
                console.error("Error cargando mapa:", error);
            }
        };
        cargarDatos();
    }, []);

    // --- LÓGICA DE SUGERENCIAS ---
    useEffect(() => {
        const buscar = async () => {
            if (debouncedOrigin.length > 2) {
                const results = await geocodingService.searchAddress(debouncedOrigin);
                setOriginSuggestions(results);
            } else {
                setOriginSuggestions([]);
            }
        };
        buscar();
    }, [debouncedOrigin]);

    useEffect(() => {
        const buscar = async () => {
            if (debouncedDest.length > 2) {
                const results = await geocodingService.searchAddress(debouncedDest);
                setDestSuggestions(results);
            } else {
                setDestSuggestions([]);
            }
        };
        buscar();
    }, [debouncedDest]);

    // Recalcular ruta si cambia el medio de transporte y ya hay puntos definidos
    useEffect(() => {
        if (startPoint && endPoint) {
            calculateRoute(startPoint, endPoint);
        }
    }, [transportMode]);

    const handleInputChange = (e, type) => {
        const value = e.target.value;
        if (type === 'start') {
            setOriginInput(value);
            if (startPoint) setStartPoint(null);
        } else {
            setDestInput(value);
            if (endPoint) setEndPoint(null);
        }
    };

    const selectSuggestion = (item, type) => {
        const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        if (type === 'start') {
            setStartPoint(coords);
            setOriginInput(item.display_name);
            setOriginSuggestions([]);
        } else {
            setEndPoint(coords);
            setDestInput(item.display_name);
            setDestSuggestions([]);
        }
    };

    const handleBlur = (type) => {
        setTimeout(() => {
            if (type === 'start') setOriginSuggestions([]);
            else setDestSuggestions([]);
        }, 200);
    };

    // --- LÓGICA DE MAPA ---
    const toggleMapSelection = () => {
        if (isMapSelectionMode) {
            setIsMapSelectionMode(false);
            setSelectionStep('start');
            toast("Modo selección desactivado");
        } else {
            setIsMapSelectionMode(true);
            setSelectionStep('start');
            toast("Haz clic en el mapa para marcar el ORIGEN");
        }
    };

    const handleMapClick = async (latlng) => {
        if (!isMapSelectionMode) return;

        const address = await geocodingService.reverseGeocode(latlng.lat, latlng.lng);

        if (selectionStep === 'start') {
            setStartPoint(latlng);
            setOriginInput(address);
            setSelectionStep('end');
            toast.success("Origen marcado. Ahora selecciona DESTINO.");
        } else if (selectionStep === 'end') {
            setEndPoint(latlng);
            setDestInput(address);
            setSelectionStep('finished');
            setIsMapSelectionMode(false);
            toast.success("Puntos definidos. Calculando...");
            calculateRoute(startPoint, latlng); 
        }
    };

    const handleSearchRoute = async () => {
        let start = startPoint;
        let end = endPoint;

        if (!start && originInput.length > 2) {
            const results = await geocodingService.searchAddress(originInput);
            if (results.length > 0) {
                start = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
                setStartPoint(start);
                setOriginInput(results[0].display_name);
            }
        }

        if (!end && destInput.length > 2) {
            const results = await geocodingService.searchAddress(destInput);
            if (results.length > 0) {
                end = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
                setEndPoint(end);
                setDestInput(results[0].display_name);
            }
        }

        if (!start || !end) {
            toast.error("No se encontraron coordenadas válidas.");
            return;
        }

        calculateRoute(start, end);
    };

    const handleMapDrawClick = (e) => {
        if (!modoDibujar) return;
        
        const {lat, lng} = e.latlng
        setPuntosRuta(prevPuntos => {
            const nuevosPuntos = [ ...prevPuntos, [lat, lng]];
            return nuevosPuntos
        })
    }

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

    const calculateRoute = async (start, end) => {
        const toastId = toast.loading('Calculando ruta...');
        try {
            // Pasamos el transportMode actual al servicio
            const data = await routeService.calculateRoute(start, end, transportMode);
            if (data.features && data.features.length > 0) {
                setActiveRoute(data.features[0]);
                toast.success('Ruta encontrada', { id: toastId });
            } else {
                toast.error('No se encontró camino disponible', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error de servicio', { id: toastId });
        }
    };

    const clearRoute = () => {
        setStartPoint(null);
        setEndPoint(null);
        setActiveRoute(null);
        setOriginInput("");
        setDestInput("");
        setIsMapSelectionMode(false);
        setSelectionStep('start');
    };

    // Helper: Obtener color según modo
    const getRouteColor = () => {
        switch(transportMode) {
            case 'foot-walking': return 'green';
            case 'cycling-regular': return 'orange';
            default: return 'blue';
        }
    };

    const formatDistance = (meters) => (meters / 1000).toFixed(2) + " km";
    const formatDuration = (seconds) => {
        const min = Math.round(seconds / 60);
        return min > 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
    };

    const trazarRuta = () => {
        const modo = !modoDibujar;
        setModoDibujar(modo)

        if (modo) {
            setPuntosRuta([]);
            setPuntosEliminados([]);              
            toast.success("Modo de dibujo de ruta activado. ¡Haz clic en el mapa!");
        } else {
                toast("Modo de dibujo de ruta desactivado.");
        }
    };

    const handleGuardarRuta = () => {
        if (puntosRuta.length < 2) {
            toast.error("Necesitas al menos 2 puntos para guardar una ruta");     
        return;
        }
        setShowNameModal(true);
    };

    const confirmarGuardarRuta = async() => {
        setIsSaving(true);
        setShowNameModal(false);

        try {
            await routeService.guardarRuta(rutaNombre, puntosRuta)

            setPuntosRuta([]);
            setPuntosEliminados([]);
            setModoDibujar(false);
            setActiveRoute(null);
        
            toast.success(`Ruta ${rutaNombre} guardada exitosamente`);
            setRutaNombre('');
        }catch (error) {
            console.error('Error al guardar la ruta, ', error)
            toast.error('Error al guardar la ruta. Intenta nuevamente')
        } finally {
            setIsSaving(false)
        }

    };

    return (
        <div className="relative h-screen w-full bg-gray-100 overflow-hidden font-sans">
            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full z-[1000] p-4 flex justify-between pointer-events-none">
                <button onClick={handleMyLocation} className="p-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
                    <Icons.Crosshair />
                </button>
                <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 pointer-events-auto">
                    <h1 className="text-xl font-bold text-blue-600">TeLleva</h1>
                </div>
                <div className="pointer-events-auto">
                    {user ? (
                        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 flex gap-2 items-center">
                            <span className="py-1 px-2 font-semibold text-sm hidden sm:block">{user.username}</span>
                            {(user.rol === 'admin' || user.is_staff) && (
                                <Link to="/admin" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium transition">Admin</Link>
                            )}
                            <button onClick={logoutUser} className="text-red-500 px-2 py-1 hover:bg-red-50 rounded-md text-sm transition">Salir</button>
                        </div>
                    ) : (
                        <Link to="/login" className="bg-white shadow-lg text-blue-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition pointer-events-auto">Ingresar</Link>
                    )}
                </div>
            </nav>
            
            {/* Panel de Búsqueda */}
            <div className="absolute top-20 left-4 z-[1000] w-full max-w-sm pointer-events-auto">
                <div className="bg-white shadow-xl rounded-xl p-4 border border-gray-100 space-y-4">
                    
                    {/* Selector de Transporte */}
                    <div className="flex justify-center bg-gray-100 rounded-lg p-1">
                        {[
                            { id: 'driving-car', icon: Icons.Car, label: 'Auto' },
                            { id: 'cycling-regular', icon: Icons.Bike, label: 'Bici' },
                            { id: 'foot-walking', icon: Icons.Walk, label: 'Pie' },
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setTransportMode(mode.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    transportMode === mode.id 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <mode.icon /> {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Origen</label>
                        <div className="flex items-center border border-gray-300 rounded-lg mt-1 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                            <span className="pl-2 text-green-600 text-xs">●</span>
                            <input 
                                type="text" 
                                className="w-full p-2 outline-none text-sm"
                                placeholder="Ingresa origen"
                                value={originInput}
                                onChange={(e) => handleInputChange(e, 'start')}
                                onBlur={() => handleBlur('start')}
                            />
                        </div>
                        {originSuggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                {originSuggestions.map((item, idx) => (
                                    <li key={idx} 
                                        onMouseDown={() => selectSuggestion(item, 'start')}
                                        className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                    >
                                        <span className="font-semibold text-gray-700">{item.address?.road || item.name}</span>
                                        <span className="text-gray-500 text-[10px] block truncate">{item.display_name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Destino</label>
                        <div className="flex items-center border border-gray-300 rounded-lg mt-1 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                            <span className="pl-2 text-red-600"><Icons.MapPin /></span>
                            <input 
                                type="text" 
                                className="w-full p-2 outline-none text-sm"
                                placeholder="Ingresa destino"
                                value={destInput}
                                onChange={(e) => handleInputChange(e, 'end')}
                                onBlur={() => handleBlur('end')}
                            />
                        </div>
                        {destSuggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                {destSuggestions.map((item, idx) => (
                                    <li key={idx} 
                                        onMouseDown={() => selectSuggestion(item, 'end')}
                                        className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                    >
                                        <span className="font-semibold text-gray-700">{item.address?.road || item.name}</span>
                                        <span className="text-gray-500 text-[10px] block truncate">{item.display_name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={handleSearchRoute}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition shadow-md flex justify-center items-center gap-2"
                        >
                            <Icons.Search /> Buscar
                        </button>
                        
                        <button 
                            onClick={toggleMapSelection}
                            className={`px-3 rounded-lg border transition shadow-sm ${isMapSelectionMode ? 'bg-orange-100 border-orange-400 text-orange-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                            title="Seleccionar en mapa"
                        >
                            <Icons.MapPin />
                        </button>
                    </div>
                    
                    {activeRoute && (
                        <button onClick={clearRoute} className="w-full flex justify-center items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-2 transition">
                            <Icons.Trash /> Limpiar mapa
                        </button>
                    )}
                </div>
            </div>

            {/* Tarjeta de Resultados */}
            {activeRoute && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-11/12 max-w-md pointer-events-auto animate-bounce-in">
                    <div className="bg-white shadow-2xl rounded-2xl p-5 border-l-8 border-blue-500 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiempo Estimado</p>
                            <p className="text-3xl font-extrabold text-gray-800">
                                {formatDuration(activeRoute.properties.summary.duration)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distancia</p>
                            <p className="text-xl font-bold text-blue-600">
                                {formatDistance(activeRoute.properties.summary.distance)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-4 right-4 z-[1000] w-full max-w-sm pointer-events-auto bg-white/1   backdrop-blur-md p-4 rounded-xl shadow-2xl">
                <div className="text-center mt-4 flex justify-center gap-2 flex-wrap"> 
                    <button onClick={trazarRuta} 
                    ref={btnDibujarRef}
                    className={`btn font-medium py-2 px-4 rounded-lg transition duration-150 ${
                            modoDibujar 
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                        aria-label="Activar modo de dibujo de ruta"
                    >{modoDibujar ? "Detener dibujo" : "Trazar ruta"}
                    </button>
                    <button onClick={handleGuardarRuta}
                            ref = {btnGuardarRutaRef}
                            className={`btn bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ${!modoDibujar && 'hidden'}`} 
                            aria-label="Guardar la ruta dibujada"
                        >Guardar ruta
                    </button> 		
                    <button 
                        id="btnLimpiarRuta" 
                        className={`btn bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ${!modoDibujar && 'hidden'}`} 
                        aria-label="Limpiar la ruta dibujada"
                        >
                        Limpiar ruta
                    </button>
                    <button 
                            id="btnDeshacerPunto" 
                            className={`btn border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-150 ${!modoDibujar && 'hidden'}`} 
                            aria-label="Deshacer último punto agregado"
                        >
                            ↩️ Deshacer
                        </button>
                        
                    <button 
                            id="btnRehacerPunto" 
                            className={`btn border border-gray-400 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-150 ${!modoDibujar && 'hidden'}`} 
                            aria-label="Rehacer último punto eliminado"
                        >
                            ↪️ Rehacer
                        </button>

                    <button id="btnAgregarParadero" className="btn bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150" aria-label="Activar modo para agregar paradero en el mapa">Agregar Paradero</button>
                </div>
            </div>

            {showNameModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[2000]">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-80">
                        <h3 className="text-lg font-bold mb-4">Guardar Ruta</h3>
                        <input
                            type="text"
                            className="w-full border border-gray-300 p-2 rounded-md mb-4"
                            placeholder="Nombre de la ruta (máx. 120 caracteres)"
                            value={rutaNombre}
                            onChange={(e) => setRutaNombre(e.target.value)}
                            maxLength={120}
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => { setShowNameModal(false); setRutaNombre(''); }} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmarGuardarRuta} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                    
                </div>
            )}
                {showNameModal && (
    <div className="fixed inset-0 flex items-center justify-center z-[2000]">
        
        {/* Contenido del Modal (El cuadro blanco/tarjeta) */}
        <div className="bg-white p-6 rounded-lg shadow-2xl w-80">
            <h3 className="text-lg font-bold mb-4">Guardar Ruta</h3>
            <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded-md mb-4"
                placeholder="Nombre de la ruta (máx. 120 caracteres)"
                value={rutaNombre}
                onChange={(e) => setRutaNombre(e.target.value)}
                maxLength={120}
            />
            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => { setShowNameModal(false); setRutaNombre(''); }} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    Cancelar
                </button>
                <button 
                    onClick={confirmarGuardarRuta} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Confirmar
                </button>
            </div>
        </div>
        
    </div>
)}
            {/* Mapa */}
            <MapComponent 
                paraderos={paraderos} 
                rutas={rutas}
                onMapClick={handleMapClick}
                onMapDrawClick={handleMapDrawClick}
                modoDibujar={modoDibujar}
                activeRoute={activeRoute}
                startPoint={startPoint}
                endPoint={endPoint}
                routeColor={getRouteColor()}
                puntosRutaDibujo={puntosRuta}
            />
        </div>
    );
};

export default AdminMapPage;