import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle dynamic map bounds fitting
const MapFitter = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [markers, map]);
  return null;
};

const GlobalMap = ({ hospitals = [], activeId, onMarkerClick }) => {
  const validHospitals = hospitals.filter(h => h.latitude && h.longitude);

  if (validHospitals.length === 0) {
    return (
      <div style={{ height: '100%', minHeight: '300px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
        <p>No map coordinates available for these locations.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', minHeight: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', zIndex: 1 }}>
      <MapContainer center={[validHospitals[0].latitude, validHospitals[0].longitude]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapFitter markers={validHospitals} />
        {validHospitals.map(hospital => {
          const isActive = activeId === hospital.id;
          return (
            <Marker 
              key={`map-marker-${hospital.id}`} 
              position={[hospital.latitude, hospital.longitude]}
              icon={isActive ? redIcon : new L.Icon.Default()}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(hospital.id)
              }}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong style={{ fontSize: '1.1em', display: 'block', marginBottom: 4 }}>{hospital.name}</strong>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>{hospital.city}</div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>⭐ {Number(hospital.rating).toFixed(1)}</span>
                    <strong style={{ color: 'var(--accent)' }}>₹{hospital.cost?.toLocaleString()}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default GlobalMap;
