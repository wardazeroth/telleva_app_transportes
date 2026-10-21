import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_DEFAULTS } from '../../config';
import ParaderosLayer from './ParaderosLayer';
import RutasLayer from './RutasLayer';
import ActiveRouteLayer from './ActiveRouteLayer';
import RecommendedRouteLayer from './RecommendedRouteLayer';
import MapEvents from './MapEvents';
import MapRecenter from './MapRecenter';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ 
    paraderos = [], 
    rutas = [],
    onMapClick,
    onMapDrawClick, 
    modoDibujar,   
    activeRoute, 
    originInput,
    destInput,  
    recommendedRoute,
    startPoint,      
    endPoint,
    routeColor,
    centerOn,
    puntosRutaDibujo,
    multimodalData,
    editId,
    setHideSidebar,
    setParaderosExistentes,
    isAdmin= false

}) => {
    return (
        <MapContainer 
            center={MAP_DEFAULTS.CENTER} 
            zoom={MAP_DEFAULTS.ZOOM} 
            scrollWheelZoom={true} 
            className="h-full w-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
            />
            
            {/* Capas Base */}
            <RutasLayer rutas={rutas} />
            
            <ParaderosLayer paraderos={paraderos} editId={editId} setParaderosExistentes={setParaderosExistentes} setHideSidebar={setHideSidebar} isAdmin={isAdmin} />

            {/* Capas Dinámicas*/}
            <ActiveRouteLayer 
                routeData={activeRoute} 
                startPoint={startPoint} 
                endPoint={endPoint} 
                routeColor={routeColor}
                puntosRutaDibujo={puntosRutaDibujo}
                modoDibujar={modoDibujar}
                originInput={originInput}
                destInput={destInput}
                multimodalData={multimodalData}
            />

            <RecommendedRouteLayer recommendedRoute={recommendedRoute} />

            <MapEvents 
                onMapClick={onMapClick}
                onMapDrawClick={onMapDrawClick} 
                modoDibujar={modoDibujar} 
            />

            <MapRecenter center={centerOn} zoom={16} />

            <ZoomControl position="bottomright" />
        </MapContainer>
    );
};

export default MapComponent;