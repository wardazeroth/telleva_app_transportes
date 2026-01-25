import { useMapEvents } from 'react-leaflet';

const MapEvents = ({ onMapClick, modoDibujar, onMapDrawClick }) => {
    
    useMapEvents({
        click(e) {
            if (modoDibujar && onMapDrawClick) {

                onMapDrawClick(e);
            }
            else {
                onMapClick(e.latlng); // Pasar { lat, lng } al padre
            }
        },
    });
    return null;
};

export default MapEvents;