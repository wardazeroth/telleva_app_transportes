import { Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Iconos personalizados
const startIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const endIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

const drawPointIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/474/474775.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const transferIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7710/7710649.png', 
    iconSize: [20, 20], 
    iconAnchor: [10, 10]
});

const ActiveRouteLayer = ({ routeData, startPoint, endPoint, routeColor = 'blue', puntosRutaDibujo = [], modoDibujar, originInput, destInput, multimodalData = null }) => {
    const map = useMap();

    useEffect(() => {
        // CASO 1: Ruta Multimodal (Micro + Caminata)
        if (multimodalData) {
            const { walkToStop, busRide, walkToDest } = multimodalData;
            const allPoints = [
                ...(walkToStop || []),
                ...(busRide || []),
                ...(walkToDest || [])
            ];
            
            if (allPoints.length > 0) {
                map.fitBounds(allPoints, { padding: [50, 50] });
            }
        } 
        // CASO 2: Ruta Estándar
        else if (routeData && routeData.geometry && !modoDibujar) {
            const bounds = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
        // CASO 3: Modo Dibujo (Centrar en último punto)
        else if (modoDibujar && puntosRutaDibujo.length > 0) {
            const lastPoint = puntosRutaDibujo[puntosRutaDibujo.length - 1];
            map.panTo(lastPoint);
        }
    }, [routeData, map, modoDibujar, puntosRutaDibujo, multimodalData]);

    // --- RENDERIZADO MODO DIBUJO ---
    if (modoDibujar && puntosRutaDibujo.length > 0) {
        return (
            <>
                <Polyline
                    positions={puntosRutaDibujo}
                    pathOptions={{
                        color: 'orange',
                        weight: 5,
                        opacity: 1
                    }}
                />
                {puntosRutaDibujo.map((position, index) => (
                    <Marker
                        key={index}
                        position={position}
                        icon={drawPointIcon}
                    >
                        <Popup>Punto {index + 1}</Popup>
                    </Marker>
                ))}
            </>
        );
    }
    
    // --- RENDERIZADO RUTA MULTIMODAL (MICRO) ---
    if (multimodalData) {
        const { walkToStop, busRide, walkToDest } = multimodalData;
        return (
            <>
                {/* Fase 1: Caminar al paradero (Punteada Gris) */}
                {walkToStop && (
                    <Polyline 
                        positions={walkToStop} 
                        pathOptions={{ color: 'gray', weight: 4, dashArray: '10, 10', opacity: 0.8 }} 
                    >
                        <Popup>Caminar hacia el paradero</Popup>
                    </Polyline>
                )}

                {/* Fase 2: Recorrido en Micro (Sólida) */}
                {busRide && (
                    <Polyline 
                        positions={busRide} 
                        pathOptions={{ color: routeColor, weight: 6, opacity: 1 }} 
                    >
                        <Popup>Recorrido en Micro</Popup>
                    </Polyline>
                )}

                {/* Fase 3: Caminar al destino (Punteada Gris) */}
                {walkToDest && (
                    <Polyline 
                        positions={walkToDest} 
                        pathOptions={{ color: 'gray', weight: 4, dashArray: '10, 10', opacity: 0.8 }} 
                    >
                        <Popup>Caminar hacia el destino</Popup>
                    </Polyline>
                )}

                {/* Marcadores Inicio/Fin */}
                {startPoint && 
                    <Marker position={startPoint} icon={startIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong className="block text-sm uppercase text-gray-500 mb-1">Inicio del viaje</strong>
                                <div className="text-sm italic">{originInput}</div>
                            </div>
                        </Popup>
                    </Marker>}
                {endPoint && 
                    <Marker position={endPoint} icon={endIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong className="block text-sm uppercase text-gray-500 mb-1">Destino</strong>
                                <div className="text-sm italic">{destInput}</div>
                            </div>
                        </Popup>
                    
                    </Marker>}
                
                {/* Puntos de Transbordo */}
                {walkToStop?.length > 0 && (
                    <Marker position={walkToStop[walkToStop.length - 1]} icon={transferIcon}>
                        <Popup>Subida: Espera aquí la micro</Popup>
                    </Marker>
                )}
                {busRide?.length > 0 && (
                    <Marker position={busRide[busRide.length - 1]} icon={transferIcon}>
                        <Popup>Bajada: Desciende aquí</Popup>
                    </Marker>
                )}
            </>
        );
    }

    // --- RENDERIZADO RUTA ESTÁNDAR (AUTO/PIE) ---
    // if (!routeData || !routeData.geometry) return null;

    const coordinates = routeData?.geometry?.coordinates || [];
    const positions = coordinates.map(c => [c[1], c[0]]);
    // const summary = routeData?.properties?.summary;

    return (
        <>
            {positions.length > 0 && (
            <Polyline 
                positions={positions} 
                pathOptions={{ color: routeColor, weight: 6, opacity: 0.8 }} 
            />
            )}

            {startPoint && (
                <Marker position={startPoint} icon={startIcon}>
                    <Popup>
                        <div className="text-center">
                            <strong className="block text-sm uppercase text-gray-500 mb-1">Inicio del viaje</strong>
                            <div className="text-sm italic">{originInput}</div>
                        </div>
                    </Popup>
                </Marker>
            )}

            {endPoint && (
                <Marker position={endPoint} icon={endIcon}>
                    <Popup>
                        <div className="text-center">
                            <strong className="block text-sm uppercase text-gray-500 mb-1">Destino</strong>
                            <div className="text-sm italic">{destInput}</div>
                            {/* { summary ? (
                                <div className="text-base font-semibold">
                                    {Math.round(summary.duration / 60)} min / {(summary.distance / 1000).toFixed(2)} km
                                </div>
                            ) : (
                                <div className="text-sm italic">Punto seleccionado</div>
                            )} */}
                        </div>
                    </Popup>
                </Marker>
            )}
        </>
    );
};

export default ActiveRouteLayer;