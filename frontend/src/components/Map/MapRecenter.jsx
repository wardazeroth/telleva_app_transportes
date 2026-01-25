import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

const MapRecenter = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            // Animar el recentering
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5 // segundos
            });
        }
    }, [center, zoom, map]);

    return null;
};

export default MapRecenter;