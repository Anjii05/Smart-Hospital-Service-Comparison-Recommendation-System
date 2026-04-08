/**
 * Geocode a place name and fetch nearby hospitals from OpenStreetMap (Overpass).
 * Nominatim usage: https://operations.osmfoundation.org/policies/nominatim/ — set OSM_CONTACT_EMAIL in .env.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

function userAgent() {
  const email = process.env.OSM_CONTACT_EMAIL || 'dev@localhost';
  return `HospitalProject/1.0 (${email})`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatimSearch(query, opts = {}) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1'
  });
  if (opts.countrycodes) params.set('countrycodes', opts.countrycodes);
  const url = `${NOMINATIM}?${params}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.length) return null;
    const row = data[0];
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon, displayName: row.display_name || query };
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeCity(cityName) {
  const t = cityName.trim();
  let geo = await nominatimSearch(t, { countrycodes: 'in' });
  if (!geo) {
    await sleep(1100);
    geo = await nominatimSearch(`${t}, India`);
  }
  if (!geo) {
    await sleep(1100);
    geo = await nominatimSearch(t);
  }
  return geo;
}

function buildOverpassQuery(lat, lon, radiusKm, opts = {}) {
  const cap = opts.maxQueryKm ?? 100;
  const r = Math.round(Math.max(5, Math.min(cap, radiusKm)) * 1000);
  return `
[out:json][timeout:60];
(
  node["amenity"="hospital"](around:${r},${lat},${lon});
  way["amenity"="hospital"](around:${r},${lat},${lon});
  relation["amenity"="hospital"](around:${r},${lat},${lon});
  node["amenity"="clinic"](around:${r},${lat},${lon});
  way["amenity"="clinic"](around:${r},${lat},${lon});
  node["healthcare"="hospital"](around:${r},${lat},${lon});
  way["healthcare"="hospital"](around:${r},${lat},${lon});
  node["healthcare"="clinic"](around:${r},${lat},${lon});
  way["healthcare"="clinic"](around:${r},${lat},${lon});
  node["healthcare"="centre"](around:${r},${lat},${lon});
  way["healthcare"="centre"](around:${r},${lat},${lon});
);
out center;
`.trim();
}

function elementCoords(el) {
  if (el.type === 'node' && el.lat != null && el.lon != null) {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center && el.center.lat != null && el.center.lon != null) {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
}

/**
 * @param {string} cityLabel - display city (user query or Nominatim context)
 * @param {number} centerLat
 * @param {number} centerLon
 * @param {number} radiusKm
 * @param {{ emergencyOnly?: boolean }} opts
 */
async function fetchOverpassJson(query) {
  let lastErr;
  for (const base of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(base, {
          signal: controller.signal,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        });
        if (!res.ok) {
          lastErr = new Error(`Overpass HTTP ${res.status}`);
          continue;
        }
        return await res.json();
      } finally {
        clearTimeout(timeout);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Overpass request failed');
}

function mapOsmElement(el, cityLabel, centerLat, centerLon) {
  const coords = elementCoords(el);
  if (!coords) return null;
  const tags = el.tags || {};
  const kind = tags.amenity || tags.healthcare || 'hospital';
  const name =
    tags.name ||
    tags['name:en'] ||
    tags['name:hi'] ||
    (kind === 'clinic' ? 'Clinic' : 'Hospital');
  const addr =
    [tags['addr:full'], tags['addr:road'], tags['addr:suburb'], tags['addr:neighbourhood']]
      .filter(Boolean)
      .join(', ') || 'Local Healthcare Provider';

  // IMPORTANT: Always use the searched city label as the city name.
  // OSM addr:city tags often store district/state instead of the city name,
  // causing hospitals to appear under the wrong city in search results.
  const city = cityLabel || tags['addr:city'] || tags['addr:district'] || 'Unknown';

  const distance_km = Math.round(haversineKm(centerLat, centerLon, coords.lat, coords.lon) * 100) / 100;

  return {
    id: `osm-${el.type}-${el.id}`,
    osm_type: el.type,
    osm_id: el.id,
    source: 'openstreetmap',
    name,
    location: addr,
    city,
    latitude: coords.lat,
    longitude: coords.lon,
    rating: null,
    emergency_available: tags.emergency === 'yes',
    distance_km,
    min_cost: null,
    available_doctors: null,
    maps_url: `https://www.openstreetmap.org/${el.type}/${el.id}`
  };
}


async function fetchOsmHospitalsNear(cityLabel, centerLat, centerLon, radiusKm, opts = {}) {
  const query = buildOverpassQuery(centerLat, centerLon, radiusKm, opts);
  const json = await fetchOverpassJson(query);
  const elements = json.elements || [];

  const rows = [];
  for (const el of elements) {
    const row = mapOsmElement(el, cityLabel, centerLat, centerLon);
    if (row) rows.push(row);
  }

  rows.sort((a, b) => a.distance_km - b.distance_km);
  return rows.slice(0, 50);
}

/**
 * When DB has no rows for a city, try OSM.
 * @returns {{ data: object[], meta: object }}
 */
async function searchHospitalsByCityIndia(cityName, options = {}) {
  const primaryRadius = options.radiusKm ?? 55;
  const geo = await geocodeCity(cityName);
  if (!geo) {
    return {
      data: [],
      meta: {
        source: 'openstreetmap',
        city_query: cityName.trim(),
        geocoded: false,
        message:
          'Could not geocode that place. Try a larger city, add the state (e.g. "Chennai, Tamil Nadu"), or check your network / firewall.'
      }
    };
  }

  let data = await fetchOsmHospitalsNear(cityName.trim(), geo.lat, geo.lon, primaryRadius);
  let usedRadius = primaryRadius;
  // 🏥 REMOVED radius expansion for City searches to keep results strict.
  // We no longer expand to 100km if 0 results found, as per user request for "particular city only".


  return {
    data,
    meta: {
      source: 'openstreetmap',
      city_query: cityName.trim(),
      geocoded: true,
      geocenter: { latitude: geo.lat, longitude: geo.lon, label: geo.displayName },
      radius_km: usedRadius,
      message:
        data.length > 0
          ? 'Results from OpenStreetMap (hospitals, clinics, medical centres). Not from your app database.'
          : `No mapped healthcare facilities within ${usedRadius} km. Try another spelling or a nearby major city. If this keeps happening, your network may be blocking Nominatim/Overpass.`
    }
  };
}

/**
 * Nearest-from-GPS: staged Overpass radii (DB often has no rows outside seeded cities).
 * @param {number} lat
 * @param {number} lon
 * @param {number} userRadiusKm - user-selected max distance
 * @returns {{ data: object[], meta: object }}
 */
async function searchOsmHospitalsNearCoordinates(lat, lon, userRadiusKm) {
  const maxUser = Math.max(5, Math.min(500, userRadiusKm));
  const maxQueryKm = 250;
  const stages = [
    Math.min(maxUser, 50),
    Math.min(maxUser, 100),
    Math.min(maxUser, 150),
    Math.min(maxUser, maxQueryKm)
  ];
  const uniqueStages = [...new Set(stages)].filter((x) => x >= 5).sort((a, b) => a - b);

  let rows = [];
  let usedQueryKm = 0;
  for (const qKm of uniqueStages) {
    usedQueryKm = qKm;
    rows = await fetchOsmHospitalsNear('Near you', lat, lon, qKm, { maxQueryKm });
    if (rows.length > 0) break;
  }

  const filtered = rows.filter((h) => Number(h.distance_km) <= maxUser).slice(0, 50);

  return {
    data: filtered,
    meta: {
      source: 'openstreetmap',
      user_radius_km: maxUser,
      overpass_query_km: usedQueryKm,
      message:
        filtered.length > 0
          ? 'Including OpenStreetMap hospitals/clinics near your location (outside app database coverage).'
          : rows.length === 0
            ? 'No mapped healthcare facilities found in this area via OpenStreetMap. Try a larger radius or browse by city.'
            : `Found facilities in the search circle but none within your ${maxUser} km limit. Try increasing the radius.`
    }
  };
}

module.exports = {
  searchHospitalsByCityIndia,
  geocodeCity,
  fetchOsmHospitalsNear,
  searchOsmHospitalsNearCoordinates
};
