import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker for NGO locations
const ngoIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="#dc2626" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to update map center
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface NGOMarker {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating?: number;
  totalRatings?: number;
}

interface MapComponentProps {
  center: [number, number];
  markers: NGOMarker[];
  onMarkerClick?: (ngo: NGOMarker) => void;
  zoom?: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  markers,
  onMarkerClick,
  zoom = 12,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      scrollWheelZoom={true}
    >
      <ChangeMapView center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User location marker */}
      <Marker position={center}>
        <Popup>
          <strong>Your Location</strong>
        </Popup>
      </Marker>

      {/* NGO location markers */}
      {markers.map((ngo) => (
        <Marker
          key={ngo.id}
          position={[ngo.latitude, ngo.longitude]}
          icon={ngoIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(ngo),
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <strong style={{ fontSize: '14px' }}>{ngo.name}</strong>
              <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
                {ngo.address}, {ngo.city}
              </p>
              {ngo.distance !== undefined && (
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                  📍 {ngo.distance.toFixed(2)} km away
                </p>
              )}
              {ngo.rating !== undefined && (
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                  ⭐ {ngo.rating.toFixed(1)} ({ngo.totalRatings} reviews)
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
