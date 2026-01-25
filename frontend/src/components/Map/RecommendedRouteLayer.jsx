import { Polyline, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';

const RecommendedRouteLayer = ({ recommendedRoute }) => {
    const map = useMap();

    // Efecto para centrar el mapa cuando se previsualiza una micro
    useEffect(() => {
        if (recommendedRoute && recommendedRoute.geometria) {
            // GeoJSON viene como [lon, lat], Leaflet necesita [lat, lon]
            const bounds = recommendedRoute.geometria.coordinates.map(c => [c[1], c[0]]);
            
            if (bounds.length > 0) {
                map.fitBounds(bounds, { 
                    padding: [50, 50],
                    animate: true,
                    duration: 1
                });
            }
        }
    }, [recommendedRoute, map]);

    if (!recommendedRoute || !recommendedRoute.geometria) return null;

    // GeoJSON viene como [lon, lat], Leaflet necesita [lat, lon]
    const positions = recommendedRoute.geometria.coordinates.map(c => [c[1], c[0]]);

    return (
        <Polyline 
            positions={positions}
            pathOptions={{ 
                color: 'red', 
                weight: 5, 
                opacity: 0.8,
                dashArray: '10, 10'
            }}
        >
            <Popup>
                <div className="text-center">
                    <strong className="text-red-600">Ruta Recomendada</strong>
                    <br />
                    <span className="text-sm font-bold">{recommendedRoute.ruta}</span>
                    <br />
                    <span className="text-xs text-gray-500">
                        Coincidencia: {(recommendedRoute.cobertura * 100).toFixed(0)}%
                    </span>
                </div>
            </Popup>
        </Polyline>
    );
};

export default RecommendedRouteLayer;