import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="#dc2626" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to center map on a specific position
function CenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [position, map]);

  return null;
}

// Component to fit bounds to show all markers within radius
function MapBounds({
  center,
  markers,
  radius,
  singleMarker,
}: {
  center: [number, number];
  markers: NGOMarker[];
  radius?: number;
  singleMarker?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to ensure map renders properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (markers.length === 0) {
      // If no markers, just center on user location with appropriate zoom for radius
      const zoom = radius ? Math.max(10, 15 - Math.log2(radius)) : 12;
      map.setView(center, zoom);
      return;
    }

    // If single marker (NGO details page), use higher zoom without maxZoom constraint
    if (singleMarker && markers.length === 1) {
      const bounds = L.latLngBounds([center]);
      bounds.extend([markers[0].latitude, markers[0].longitude]);
      map.fitBounds(bounds, { padding: [50, 50] }); // No maxZoom for NGO details
      return;
    }

    // Create bounds that include all markers
    const bounds = L.latLngBounds([center]);
    markers.forEach((marker) => {
      bounds.extend([marker.latitude, marker.longitude]);
    });

    // Fit map to bounds with some padding
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [center, markers, radius, singleMarker, map]);

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
  radius?: number; // Radius in km
  onMarkerPopupOpen?: (position: [number, number]) => void;
  singleMarker?: boolean; // For NGO details page - removes maxZoom constraint
  centerOnPosition?: [number, number] | null; // Position to center on
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  markers,
  onMarkerClick,
  zoom = 12,
  radius,
  onMarkerPopupOpen,
  singleMarker = false,
  centerOnPosition = null,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      scrollWheelZoom={true}
      whenReady={(map) => {
        // Force map to render properly
        setTimeout(() => {
          map.target.invalidateSize();
        }, 100);
      }}>
      <MapBounds center={center} markers={markers} radius={radius} singleMarker={singleMarker} />
      <CenterMap position={centerOnPosition} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Radius circle */}
      {radius && (
        <Circle
          center={center}
          radius={radius * 1000} // Convert km to meters
          pathOptions={{
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}

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
            popupopen: () => {
              if (onMarkerPopupOpen) {
                onMarkerPopupOpen([ngo.latitude, ngo.longitude]);
              }
            },
          }}>
          <Popup maxWidth={300} minWidth={250}>
            <div
              style={{
                padding: '8px',
                maxWidth: '280px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
              }}>
              <strong
                style={{
                  fontSize: '15px',
                  color: '#1a202c',
                  display: 'block',
                  marginBottom: '8px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                }}>
                {ngo.name}
              </strong>

              <div
                style={{
                  fontSize: '13px',
                  color: '#4a5568',
                  marginBottom: '6px',
                  lineHeight: '1.5',
                }}>
                <strong>{ngo.address}</strong>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#718096',
                  marginBottom: '8px',
                  lineHeight: '1.4',
                }}>
                {ngo.city}
              </div>

              {ngo.distance !== undefined && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#667eea',
                    fontWeight: '500',
                    marginBottom: '4px',
                  }}>
                  <span>📍</span>
                  <span>{ngo.distance.toFixed(2)} km away</span>
                </div>
              )}

              {ngo.rating !== undefined && ngo.rating > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#f59e0b',
                    fontWeight: '500',
                  }}>
                  <span>⭐</span>
                  <span>
                    {ngo.rating.toFixed(1)} ({ngo.totalRatings} {ngo.totalRatings === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {onMarkerClick && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e2e8f0',
                  }}>
                  <button
                    onClick={() => onMarkerClick(ngo)}
                    style={{
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#5a67d8')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#667eea')}>
                    View Details
                  </button>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
