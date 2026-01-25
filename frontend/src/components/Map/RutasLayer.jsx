import { Polyline, Popup } from 'react-leaflet';

const RutasLayer = ({ rutas }) => {
    return (
        <>
            {rutas.map((ruta) => {
                // Validación de datos
                if (!ruta.geometria || !ruta.geometria.coordinates) return null;

                // GeoJSON viene como [lon, lat], Leaflet necesita [lat, lon]
                // Hacemos el swap de coordenadas
                const positions = ruta.geometria.coordinates.map(coord => [coord[1], coord[0]]);

                return (
                    <Polyline 
                        key={ruta.id} 
                        positions={positions}
                        pathOptions={{ 
                            color: 'blue', 
                            weight: 4, 
                            opacity: 0.7 
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <strong className="text-blue-700">{ruta.nombre}</strong>
                                <br />
                                <span className="text-xs text-gray-500">{ruta.codigo || "Sin código"}</span>
                            </div>
                        </Popup>
                    </Polyline>
                );
            })}
        </>
    );
};

export default RutasLayer;