    import { useContext, useState, useEffect, useRef } from 'react';
    import { Link } from 'react-router-dom';
    import { AuthContext } from '../context/AuthContext';
    import MapComponent from '../components/Map/MapComponent';
    import { mapService } from '../api/mapService';
    import { routeService } from '../api/routeService';
    import { geocodingService } from '../api/geocodingService';
    import { recommendationService } from '../api/recommendationService';
    import { useDebounce } from '../hooks/useDebounce';
    import toast from 'react-hot-toast';
    import L from 'leaflet';

    const Icons = {
        Car: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h12"/></svg>,
        Bike: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>,
        Walk: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4v6l-2 3-3-2-2 3h4l2 5 3-3V9l2-2 3 1 2-4"/><circle cx="13" cy="4" r="1"/></svg>,
        Colectivo: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.5 11a2.5 2.5 0 0 1 2.5 2.5V16a1 1 0 0 1-1 1h-1" />
            <path d="M4 17H3a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 1 2.5-2.5" />
            <path d="M5 11h14l-1.5-4.5A2 2 0 0 0 15.6 5H8.4a2 2 0 0 0-1.9 1.5z" />
            <path d="M9 5v-2h6v2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M9 17h6" /></svg>),
        Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
        MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
        Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
        Crosshair: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>,
        Bus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
        ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
        ChevronUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    };

    const ClientMapPage = () => {
        const mapaContainerRef = useRef(null);

        const { user, logoutUser } = useContext(AuthContext);
        
        // --- ESTADOS DE DATOS ---
        const [paraderos, setParaderos] = useState([]);

        // --- ESTADOS DE RUTA ---
        const [startPoint, setStartPoint] = useState(null);
        const [endPoint, setEndPoint] = useState(null);
        const [activeRoute, setActiveRoute] = useState(null);

        // ---ESTADO DE TRANSPORTE
        const [selectedTransporte, setSelectedTransporte] = useState(null);
        
        // Estados para la recomendación de micros
        const [recommendedRoute, setRecommendedRoute] = useState(null);
        const [transportOptions, setTransportOptions] = useState([]);
        const [multimodalRoute, setMultimodalRoute] = useState(null);
        
        const [transportMode, setTransportMode] = useState('driving-car');

        // Estado para previsualización (solo línea roja)
        const [previewRoute, setPreviewRoute] = useState(null);

        // --- ESTADOS DE UI ---
        const [originInput, setOriginInput] = useState("");
        const [destInput, setDestInput] = useState("");
        const [originSuggestions, setOriginSuggestions] = useState([]);
        const [destSuggestions, setDestSuggestions] = useState([]);

        const debouncedOrigin = useDebounce(originInput, 1000);
        const debouncedDest = useDebounce(destInput, 1000);

        const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
        const [selectionStep, setSelectionStep] = useState('start');
        const [mapCenter, setMapCenter] = useState(null);
        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        // Estado para controlar si el panel inferior está abierto o cerrado (Móvil)
        const [isPanelOpen, setIsPanelOpen] = useState(true);
        
        //modal
        const [showModal, setShowModal] = useState(false);

        useEffect(() => {
            const cargarDatos = async () => {
                try {
                    const dataParaderos = await mapService.getParaderos();
                    setParaderos(dataParaderos);
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

        useEffect(() => {
            if (startPoint && endPoint) {
                calculateRoute(startPoint, endPoint);
            }
        }, [transportMode]);

        
        useEffect(() => 
        {
            if (!mapaContainerRef.current) {
            return; 
            }

            const mapElement = mapaContainerRef.current.querySelector('.leaflet-container')

            if (mapElement) {
                if (isMapSelectionMode) {
                    mapElement.style.cursor = 'crosshair';
                } else {
                    mapElement.style.cursor = '';
                }
            }
        }, [isMapSelectionMode]); 

        useEffect(() => {
            let interval;
            if (showModal && selectedTransporte?.linea?.imagenes?.length > 1)
            {
                interval = setInterval(() => {
                    setCurrentImageIndex((prevIndex) => 
                        prevIndex === selectedTransporte.linea.imagenes.length - 1 ? 0 : prevIndex + 1    
                    );
                }, 3000);
            }
            return () => clearInterval(interval);
        }, [showModal, selectedTransporte]);

        //Resetear indice
        useEffect(() => {
            setCurrentImageIndex(0);
        }, [selectedTransporte]);

        // --- MANEJADORES DE INPUTS ---
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
                // En móvil, colapsamos el panel para ver el mapa mejor
                if (window.innerWidth < 768) setIsPanelOpen(false); 
                toast("Haz clic en el mapa para marcar el ORIGEN", { icon: '📍' });
            }
        };

        const handleMapClick = async (latlng) => {
            if (!isMapSelectionMode) return;

            const currentStep = selectionStep

            const address = await geocodingService.reverseGeocode(latlng.lat, latlng.lng);

            if (!isMapSelectionMode) return;

            if (currentStep === 'start') {
                setStartPoint(latlng);
                setOriginInput(address);
                setSelectionStep('end');
                toast.success("Origen marcado. Ahora selecciona DESTINO.");
            } else if (currentStep === 'end') {
                setEndPoint(latlng);
                setDestInput(address);
                setSelectionStep('finished');
                setIsMapSelectionMode(false);
                setIsPanelOpen(true); // Reabrimos el panel al terminar
                toast.success("Puntos definidos. Calculando...");
                calculateRoute(startPoint, latlng); 
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

        const calculateRoute = async (start, end) => {
            const toastId = toast.loading('Calculando ruta...');
            
            setIsPanelOpen(true);

            setRecommendedRoute(null);
            setTransportOptions([]);
            setMultimodalRoute(null);
            setPreviewRoute(null);

            if (transportMode === 'micro' || transportMode === 'colectivo') {
                setActiveRoute(null); 
            }

            try {
                const data = await routeService.calculateRoute(start, end, transportMode);
                
                if (data.features && data.features.length > 0) {
                    const routeFeature = data.features[0];

                    if (transportMode !== 'micro' && transportMode !== 'colectivo') {
                        setActiveRoute(routeFeature);
                        toast.success('Ruta encontrada', { id: toastId });
                    } else {
                        toast.loading('Buscando transporte público...', { id: toastId });
                        const routeCoordinates = routeFeature.geometry.coordinates;
                        buscarRecomendacion(routeCoordinates, transportMode, toastId);
                    }

                } else {
                    toast.error('No se encontró camino disponible', { id: toastId });
                }
            } catch (error) {
                console.error(error);
                toast.error('Error de servicio', { id: toastId });
            }
        };

        const buscarRecomendacion = async (coordinates, mode, toastId) => {
            try {
                const recommendations = await recommendationService.getRecommendations(coordinates, mode);
                
                if (!recommendations || recommendations.length === 0) {
                    setRecommendedRoute(null);
                    setTransportOptions([]);

                    if (transportMode === 'micro') {
                        toast.error("No hay micros cercanas para este trayecto", { id: toastId });
                    } else if (transportMode === 'colectivo') {
                        toast.error("No hay colectivos cercanos para este trayecto", { id: toastId })
                    }
                    return;
                }

                setTransportOptions(recommendations);
                toast.success(`Se encontraron ${recommendations.length} opciones`, { id: toastId, icon: '🚌' });

            } catch (error) {
                console.error("Error buscando recomendación:", error);
                toast.error("Error al buscar micros", { id: toastId });
            }
        };

        const findClosestPointIndex = (path, point) => {
            let minDistance = Infinity;
            let index = -1;
            for (let i = 0; i < path.length; i++) {
                const dist = L.latLng(path[i][1], path[i][0]).distanceTo(L.latLng(point.lat, point.lon));
                if (dist < minDistance) {
                    minDistance = dist;
                    index = i;
                }
            }
            return index;
        };

        const handlePreviewTransport = (option) => {
            setPreviewRoute(option);
            setRecommendedRoute(null);
            setMultimodalRoute(null);
        };

        const handlePreviewTransporte =  async (transporteId) => {
            const dataTransporte = await mapService.getTransporte(transporteId);
            setSelectedTransporte(dataTransporte)

            setShowModal(true);
        }

        const handleConfirmTransport = async (e, option) => {
            e.stopPropagation();
            const toastId = toast.loading("Calculando itinerario completo...");
            setPreviewRoute(null);
            
            try {
                const subida = option.paraderos_clave.subida;
                const bajada = option.paraderos_clave.bajada;

                const walk1 = await routeService.calculateRoute(
                    startPoint, 
                    { lat: subida.lat, lng: subida.lon }, 
                    'foot-walking'
                );

                const walk2 = await routeService.calculateRoute(
                    { lat: bajada.lat, lng: bajada.lon }, 
                    endPoint, 
                    'foot-walking'
                );

                const fullBusRoute = option.geometria.coordinates;
                const startIndex = findClosestPointIndex(fullBusRoute, subida);
                const endIndex = findClosestPointIndex(fullBusRoute, bajada);

                let trimmedBusRoute = [];
                if (startIndex !== -1 && endIndex !== -1) {
                    if (startIndex <= endIndex) {
                        trimmedBusRoute = fullBusRoute.slice(startIndex, endIndex + 1);
                    } else {
                        trimmedBusRoute = fullBusRoute.slice(endIndex, startIndex + 1).reverse();
                    }
                } else {
                    trimmedBusRoute = fullBusRoute;
                }

                const geoWalk1 = walk1.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const geoWalk2 = walk2.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const geoBus = trimmedBusRoute.map(c => [c[1], c[0]]);

                const distWalk1 = walk1.features[0].properties.summary.distance;
                const distWalk2 = walk2.features[0].properties.summary.distance;
                const timeWalk1 = walk1.features[0].properties.summary.duration;
                const timeWalk2 = walk2.features[0].properties.summary.duration;
                
                let distBus = 0;
                for(let i=0; i < geoBus.length - 1; i++) {
                    distBus += L.latLng(geoBus[i]).distanceTo(L.latLng(geoBus[i+1]));
                }
                const timeBus = distBus / 6.9;

                const totalDistance = distWalk1 + distBus + distWalk2;
                const totalDuration = timeWalk1 + timeBus + timeWalk2;

                setMultimodalRoute({
                    walkToStop: geoWalk1,
                    busRide: geoBus,
                    walkToDest: geoWalk2
                });

                setActiveRoute({
                    properties: {
                        summary: {
                            distance: totalDistance,
                            duration: totalDuration
                        }
                    }
                });

                setRecommendedRoute(null);
                setTransportOptions([]); 
                setIsPanelOpen(false); // Cerrar panel al confirmar para ver el mapa
                
                toast.success(`Viaje iniciado. Tiempo: ${formatDuration(totalDuration)}`, { id: toastId });

            } catch (error) {
                console.error("Error calculando tramos:", error);
                toast.error("Error al calcular itinerario", { id: toastId });
                
                setMultimodalRoute({
                    walkToStop: null,
                    busRide: option.geometria.coordinates.map(c => [c[1], c[0]]),
                    walkToDest: null
                });
            }
        };

        const clearRoute = () => {
            setStartPoint(null);
            setEndPoint(null);
            setActiveRoute(null);
            setRecommendedRoute(null);
            setTransportOptions([]);
            setOriginInput("");
            setDestInput("");
            setMultimodalRoute(null);
            setPreviewRoute(null);
            setIsMapSelectionMode(false);
            setSelectionStep('start');
            setIsPanelOpen(true); // Reabrir panel al limpiar
        };

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

        return (
            <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden font-sans flex flex-col">
                
                {/* Navbar Responsivo */}
                <nav className="absolute top-0 left-0 w-full z-[1000] p-2 md:p-4 flex justify-between pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 md:p-3 pointer-events-auto flex items-center">
                        <h1 className="text-lg md:text-xl font-bold text-blue-600 flex items-center gap-2">
                            TeLleva
                        </h1>
                    </div>
                    <div className="pointer-events-auto">
                        {user ? (
                            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 flex gap-2 items-center">
                                <span className="hidden md:block py-1 px-2 font-semibold text-sm">{user.username}</span>
                                {(user.rol === 'admin' || user.is_staff) && (
                                    <Link to="/admin" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium transition">Admin</Link>
                                )}
                                <button onClick={logoutUser} className="text-red-500 px-2 py-1 hover:bg-red-50 rounded-md text-sm transition">
                                    <span className="md:hidden"><Icons.Trash /></span>
                                    <span className="hidden md:inline">Salir</span>
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="bg-white shadow-lg text-blue-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 transition pointer-events-auto">Ingresar</Link>
                        )}
                    </div>
                </nav>

                {/* --- PANEL DE BÚSQUEDA RESPONSIVO (Bottom Sheet) --- */}
                <div 
                    className={`
                        absolute z-[1000] pointer-events-auto flex flex-col transition-all duration-500 ease-in-out
                        /* Móvil: Bottom Sheet con altura dinámica */
                        w-full left-0 bottom-0 rounded-t-3xl bg-white shadow-[0_-5px_30px_rgba(0,0,0,0.15)]
                        /* Escritorio: Panel flotante lateral */
                        md:top-20 md:left-4 md:w-100 md:bottom-auto md:rounded-xl md:bg-transparent md:shadow-none
                        ${isPanelOpen ? 'h-auto max-h-[80dvh]' : 'h-14 md:h-auto'} 
                    `}
                >
                    {/* Handle para colapsar en móvil */}
                    <div 
                        className="md:hidden w-full flex justify-center items-center py-3 cursor-pointer touch-pan-y"
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                    >
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    {/* Contenido del Panel */}
                    <div className={`
                        p-4 space-y-3 overflow-y-auto md:bg-white md:shadow-xl md:rounded-xl md:border md:border-gray-100
                        ${!isPanelOpen ? 'hidden md:block' : 'block'}
                    `}>
                        
                        {/* Selector de Transporte */}
                        <div className="flex justify-center bg-gray-100 rounded-lg p-1">
                            {[
                                { id: 'micro', icon: Icons.Bus, label: 'Micro' },
                                { id: 'driving-car', icon: Icons.Car, label: 'Auto' },
                                { id: 'cycling-regular', icon: Icons.Bike, label: 'Bici' },
                                { id: 'colectivo', icon: Icons.Colectivo, label: 'Colectivo'},
                                { id: 'foot-walking', icon: Icons.Walk, label: 'Pie' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTransportMode(mode.id)}
                                    className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                                        transportMode === mode.id 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <span className="scale-90 md:scale-100"><mode.icon /></span> 
                                    <span className="hidden md:inline">{mode.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Inputs Origen/Destino */}
                        <div className="relative space-y-3">
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                                <span className="pl-3 text-green-600 text-xs">●</span>
                                <input 
                                    type="text" 
                                    className="w-full p-3 outline-none text-sm"
                                    placeholder="¿Dónde estás?"
                                    value={originInput}
                                    onChange={(e) => handleInputChange(e, 'start')}
                                    onBlur={() => handleBlur('start')}
                                />
                                <button onClick={handleMyLocation} className="p-3 text-gray-400 hover:text-blue-600 border-l border-gray-100">
                                    <Icons.Crosshair />
                                </button>
                            </div>
                            {originSuggestions.length > 0 && (
                                <ul className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                    {originSuggestions.map((item, idx) => (
                                        <li key={idx} onMouseDown={() => selectSuggestion(item, 'start')} className="p-3 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                            <span className="font-semibold text-gray-800 block">{item.address?.road || item.name}</span>
                                            <span className="text-gray-500 text-[10px]">{item.display_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                                <span className="pl-3 text-red-600"><Icons.MapPin /></span>
                                <input 
                                    type="text" 
                                    className="w-full p-3 outline-none text-sm"
                                    placeholder="¿A dónde vas?"
                                    value={destInput}
                                    onChange={(e) => handleInputChange(e, 'end')}
                                    onBlur={() => handleBlur('end')}
                                />
                            </div>
                            {destSuggestions.length > 0 && (
                                <ul className="absolute top-full left-0 z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                    {destSuggestions.map((item, idx) => (
                                        <li key={idx} onMouseDown={() => selectSuggestion(item, 'end')} className="p-3 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                            <span className="font-semibold text-gray-800 block">{item.address?.road || item.name}</span>
                                            <span className="text-gray-500 text-[10px]">{item.display_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={handleSearchRoute} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md flex justify-center items-center gap-2 transition-transform active:scale-95">
                                <Icons.Search /> Buscar Ruta
                            </button>
                            <button onClick={toggleMapSelection} className={`px-4 rounded-xl border transition-all shadow-sm active:scale-95 ${isMapSelectionMode ? 'bg-orange-100 border-orange-400 text-orange-600' : 'bg-white border-gray-300 text-gray-600'}`} title="Seleccionar en mapa">
                                <Icons.MapPin />
                            </button>
                        </div>
                        
                        {/* BOTÓN LIMPIAR VISIBLE SI HAY DATOS (Puntos o Ruta) */}
                        {(startPoint || endPoint || activeRoute || transportOptions.length > 0) && (
                            <button onClick={clearRoute} className="w-full flex justify-center items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-2 py-2">
                                <Icons.Trash /> Limpiar todo
                            </button>
                        )}
                    </div>

                    {/* --- LISTA DE RESULTADOS --- */}
                    {transportOptions.length > 0 && !multimodalRoute && isPanelOpen && (
                        <div className="bg-white md:shadow-xl md:rounded-xl overflow-hidden border-t md:border border-gray-100 shrink-0 max-h-64 overflow-y-auto mx-0 md:mt-4">
                            <div className="bg-blue-50 p-3 border-b border-blue-100 sticky top-0 z-10">
                                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                                    Opciones ({transportOptions.length})
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {transportOptions.map((option, idx) => {
                                    const isSelected = previewRoute?.id === option.id;
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => handlePreviewTransport(option)}
                                            className={`p-3 cursor-pointer transition hover:bg-blue-50 group ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    {/* <p className="font-bold text-gray-800 text-sm group-hover:text-blue-700">
                                                        {option.ruta}
                                                    </p> */}
                                                    <div className="flex gap-2 mt-1 flex-wrap">
                                                        {option.transportes.slice(0, 3).map((t, i) => (
                                                            <span key={i}
                                                            onClick={() => handlePreviewTransporte(t.transporte.id)}
                                                            className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                                {t.transporte?.linea?.nombre || 'Bus'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isSelected ? (
                                                        <button 
                                                            onClick={(e) => handleConfirmTransport(e, option)}
                                                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md transition-all animate-pulse"
                                                        >
                                                            IR
                                                        </button>
                                                    ) : (
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${option.cobertura > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {(option.cobertura * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tarjeta de Resultados (Tiempo/Distancia) - Flotante arriba en móvil */}
                {activeRoute && (
                    <div className={`
                        absolute z-[1000] pointer-events-auto animate-bounce-in w-11/12 max-w-md transition-all duration-500
                        /* Móvil: Arriba (debajo del navbar) */
                        top-16 left-1/2 -translate-x-1/2
                        /* Escritorio: Abajo al centro */
                        md:top-auto md:bottom-8 
                    `}>
                        <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border-l-8 border-green-500 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Tiempo Total</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-gray-800">
                                    {formatDuration(activeRoute.properties.summary.duration)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Distancia</p>
                                <p className="text-lg md:text-xl font-bold text-blue-600">
                                    {formatDistance(activeRoute.properties.summary.distance)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && selectedTransporte && (
                <div className="absolute top-18 right-4 z-[1000] bg-white shadow-xl rounded-xl w-80 max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-xl">
                        <h3 className="font-bold text-gray-700">Línea: {selectedTransporte.linea.nombre || 'N/A'}</h3>
                        <button onClick={() => {setShowModal(false); setSelectedTransporte(null)}}  className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        {/* Campos Texto */}
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                    <p className="text-sm font-medium">{selectedTransporte.linea.nombre || 'Nombre No Definido'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                                    <p className="text-sm font-medium">{selectedTransporte.linea.empresa || 'Empresa No Definida'}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <p className="text-sm font-medium">{selectedTransporte.linea.descripcion|| 'Sin descripción'}</p>
                                </div>
                            </div>
                        
                            <div className="w-36 h-36 flex-shrink-0">
                                <div className="flex flex-col gap-2">
                                    {selectedTransporte.linea.imagenes && selectedTransporte.linea.imagenes.length > 0 ? (                                                                                 
                                        <img 
                                            key = {currentImageIndex}
                                            src={selectedTransporte.linea.imagenes[currentImageIndex].url_imagen} 
                                            alt="Imagen Línea"
                                            className="w-full h-full object-cover animate-fade-in"
                                        />                                      
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                            <Icons.Bus className="text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>  
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">    
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-5 text-center">INFORMACIÓN DE INTERÉS</label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidad</label>
                                <p className="text-sm font-medium">{selectedTransporte.capacidad} pasajeros</p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tarifa</label>
                                <p className="text-sm font-medium">${selectedTransporte.tarifa_base}</p>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Mapa */}
                <div className="flex-1 relative" ref={mapaContainerRef}>
                    <MapComponent 
                        paraderos={paraderos} 
                        onMapClick={handleMapClick}
                        recommendedRoute={previewRoute}
                        activeRoute={activeRoute}
                        originInput = {originInput}
                        destInput = {destInput}
                        startPoint={startPoint}
                        endPoint={endPoint}
                        routeColor={getRouteColor()}
                        centerOn={mapCenter}
                        multimodalData={multimodalRoute}
                        isAdmin={false}
                    />
                </div>
            </div>
        );
    };

    export default ClientMapPage;