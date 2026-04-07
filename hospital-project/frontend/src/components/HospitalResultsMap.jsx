import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency, formatRating, getDirectionsUrl } from '../utils/hospitalUi';

const INDIA_CENTER = [20.5937, 78.9629];

function createMarkerIcon(active = false) {
  return L.divIcon({
    className: active ? 'map-marker active' : 'map-marker',
    html: '<span></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -20]
  });
}

const centerIcon = L.divIcon({
  className: 'map-center-pin',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -8]
});

function MapBounds({ hospitals, searchCenter }) {
  const map = useMap();

  useEffect(() => {
    const points = hospitals
      .filter((hospital) => hospital.latitude && hospital.longitude)
      .map((hospital) => [hospital.latitude, hospital.longitude]);

    if (searchCenter?.latitude && searchCenter?.longitude) {
      points.push([searchCenter.latitude, searchCenter.longitude]);
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
    }
  }, [hospitals, map, searchCenter]);

  return null;
}

export default function HospitalResultsMap({
  hospitals = [],
  activeId,
  onMarkerClick,
  searchCenter = null,
  height = '460px'
}) {
  const validHospitals = useMemo(
    () => hospitals.filter((hospital) => hospital.latitude && hospital.longitude),
    [hospitals]
  );

  const defaultCenter = searchCenter?.latitude && searchCenter?.longitude
    ? [searchCenter.latitude, searchCenter.longitude]
    : validHospitals[0]
      ? [validHospitals[0].latitude, validHospitals[0].longitude]
      : INDIA_CENTER;

  if (validHospitals.length === 0 && !searchCenter) {
    return (
      <div className="map-empty" style={{ minHeight: height }}>
        <div>
          <strong>No coordinates available yet</strong>
          <p>Search hospitals with mapped locations to see them plotted here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-shell" style={{ height }}>
      <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapBounds hospitals={validHospitals} searchCenter={searchCenter} />

        {searchCenter?.latitude && searchCenter?.longitude && (
          <Marker
            position={[searchCenter.latitude, searchCenter.longitude]}
            icon={centerIcon}
          >
            <Popup>
              <strong>Search Center</strong>
              <div>{searchCenter.label}</div>
            </Popup>
          </Marker>
        )}

        {validHospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.latitude, hospital.longitude]}
            icon={createMarkerIcon(activeId === hospital.id)}
            eventHandlers={{
              click: () => onMarkerClick?.(hospital.id)
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{hospital.name}</strong>
                <span>{hospital.city}</span>
                <span>Rating: {formatRating(hospital.rating)}</span>
                <span>From {formatCurrency(hospital.min_treatment_cost || hospital.cost)}</span>
                {getDirectionsUrl(hospital) && (
                  <a href={getDirectionsUrl(hospital)} target="_blank" rel="noreferrer">
                    Open Directions
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
