const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

function userAgent() {
  const email = process.env.OSM_CONTACT_EMAIL || 'dev@localhost';
  return `HospitalProject/2.0 (${email})`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return radiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickBestGeocodeResult(results, query) {
  const lowered = String(query || '').toLowerCase();
  const priority = ['city', 'administrative', 'town', 'municipality', 'county'];

  const sorted = [...results].sort((left, right) => {
    const leftTypeIndex = priority.indexOf(left.type);
    const rightTypeIndex = priority.indexOf(right.type);

    const leftPriority = leftTypeIndex === -1 ? 99 : leftTypeIndex;
    const rightPriority = rightTypeIndex === -1 ? 99 : rightTypeIndex;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftName = String(left.display_name || '').toLowerCase();
    const rightName = String(right.display_name || '').toLowerCase();
    const leftQueryBoost = leftName.includes(lowered) ? 0 : 1;
    const rightQueryBoost = rightName.includes(lowered) ? 0 : 1;

    return leftQueryBoost - rightQueryBoost;
  });

  return sorted[0] || null;
}

function parseBoundingBox(row) {
  const values = Array.isArray(row?.boundingbox) ? row.boundingbox.map((value) => Number(value)) : [];
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return {
    min_lat: Math.min(values[0], values[1]),
    max_lat: Math.max(values[0], values[1]),
    min_lon: Math.min(values[2], values[3]),
    max_lon: Math.max(values[2], values[3])
  };
}

async function nominatimSearch(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(options.limit || 5)
  });

  if (options.countrycodes) {
    params.set('countrycodes', options.countrycodes);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${NOMINATIM}?${params}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent(),
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeCity(cityName) {
  const trimmed = String(cityName || '').trim();
  if (!trimmed) {
    return null;
  }

  const attempts = [
    () => nominatimSearch(trimmed, { countrycodes: 'in' }),
    async () => {
      await sleep(1100);
      return nominatimSearch(`${trimmed}, India`, { countrycodes: 'in' });
    },
    async () => {
      await sleep(1100);
      return nominatimSearch(trimmed);
    }
  ];

  for (const attempt of attempts) {
    const rows = await attempt();
    const best = pickBestGeocodeResult(rows, trimmed);

    if (!best) {
      continue;
    }

    const latitude = Number(best.lat);
    const longitude = Number(best.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    return {
      latitude,
      longitude,
      display_name: best.display_name || trimmed,
      address: best.address || {},
      bounding_box: parseBoundingBox(best)
    };
  }

  return null;
}

function buildOverpassQuery(latitude, longitude, radiusKm, options = {}) {
  const radiusMeters = Math.round(Math.max(3, Math.min(options.maxQueryKm || 120, radiusKm)) * 1000);
  const secondary = options.includeSecondary
    ? `
  node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
  node["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
  way["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
  node["healthcare"="centre"](around:${radiusMeters},${latitude},${longitude});
  way["healthcare"="centre"](around:${radiusMeters},${latitude},${longitude});
`
    : '';

  return `
[out:json][timeout:45];
(
  node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
  relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
  node["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
  way["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
  relation["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
${secondary});
out center;
`.trim();
}

async function fetchOverpassJson(query) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        });

        if (!response.ok) {
          lastError = new Error(`Overpass HTTP ${response.status}`);
          continue;
        }

        return await response.json();
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Overpass request failed');
}

function elementCoords(element) {
  if (element.type === 'node' && element.lat != null && element.lon != null) {
    return { latitude: Number(element.lat), longitude: Number(element.lon) };
  }

  if (element.center?.lat != null && element.center?.lon != null) {
    return { latitude: Number(element.center.lat), longitude: Number(element.center.lon) };
  }

  return null;
}

function mapOsmElement(element, cityProfile) {
  const coords = elementCoords(element);
  if (!coords) {
    return null;
  }

  const tags = element.tags || {};
  const facilityType = tags.healthcare || tags.amenity || 'hospital';
  const address =
    [
      tags['addr:housename'],
      tags['addr:housenumber'],
      tags['addr:road'],
      tags['addr:suburb'],
      tags['addr:neighbourhood']
    ]
      .filter(Boolean)
      .join(', ') || 'OpenStreetMap';

  return {
    id: `osm-${element.type}-${element.id}`,
    source: 'openstreetmap',
    osm_type: element.type,
    osm_id: element.id,
    facility_type: facilityType,
    name:
      tags.name ||
      tags['name:en'] ||
      tags['name:hi'] ||
      (facilityType === 'clinic' ? 'Clinic' : 'Hospital'),
    city: cityProfile.canonical_city,
    state: cityProfile.state || null,
    location: address,
    latitude: coords.latitude,
    longitude: coords.longitude,
    rating: null,
    emergency_available: tags.emergency === 'yes',
    distance_km: Number(
      haversineKm(
        Number(cityProfile.latitude),
        Number(cityProfile.longitude),
        coords.latitude,
        coords.longitude
      ).toFixed(2)
    )
  };
}

function pointWithinProfile(row, cityProfile, expansionKm = 0) {
  if (!cityProfile) {
    return true;
  }

  const minLat = Number(cityProfile.min_lat);
  const maxLat = Number(cityProfile.max_lat);
  const minLon = Number(cityProfile.min_lon);
  const maxLon = Number(cityProfile.max_lon);

  if (
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLon) &&
    Number.isFinite(maxLon)
  ) {
    const latBuffer = expansionKm / 110.574;
    const lonBuffer = expansionKm / (111.320 * Math.max(Math.cos((Number(cityProfile.latitude) * Math.PI) / 180), 0.2));

    if (
      row.latitude >= minLat - latBuffer &&
      row.latitude <= maxLat + latBuffer &&
      row.longitude >= minLon - lonBuffer &&
      row.longitude <= maxLon + lonBuffer
    ) {
      return true;
    }
  }

  return row.distance_km <= Number(cityProfile.radius_km || 18) + expansionKm;
}

function dedupeHospitals(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows) {
    const key = [
      String(row.name || '').toLowerCase(),
      Number(row.latitude).toFixed(4),
      Number(row.longitude).toFixed(4)
    ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

async function fetchOsmHospitalsNear(cityProfile, radiusKm, options = {}) {
  const query = buildOverpassQuery(
    Number(cityProfile.latitude),
    Number(cityProfile.longitude),
    radiusKm,
    options
  );

  const json = await fetchOverpassJson(query);
  const mapped = (json.elements || [])
    .map((element) => mapOsmElement(element, cityProfile))
    .filter(Boolean)
    .filter((row) => pointWithinProfile(row, cityProfile, options.expansionKm || 3));

  return dedupeHospitals(mapped)
    .sort((left, right) => left.distance_km - right.distance_km)
    .slice(0, 80);
}

async function searchHospitalsByCityIndia(cityName, options = {}) {
  const cityProfile = options.cityProfile || await geocodeCity(cityName);

  if (!cityProfile) {
    return {
      data: [],
      meta: {
        source: 'openstreetmap',
        geocoded: false,
        city_query: String(cityName || '').trim(),
        message: 'Could not resolve that city through OpenStreetMap.'
      }
    };
  }

  const primaryRadius = Number(options.radiusKm || cityProfile.radius_km || 18);
  let hospitals = await fetchOsmHospitalsNear(cityProfile, primaryRadius, { includeSecondary: false, expansionKm: 3 });

  if (hospitals.length < 6) {
    const secondary = await fetchOsmHospitalsNear(cityProfile, primaryRadius + 4, {
      includeSecondary: true,
      expansionKm: 4
    });
    hospitals = dedupeHospitals([...hospitals, ...secondary]);
  }

  return {
    data: hospitals,
    meta: {
      source: 'openstreetmap',
      geocoded: true,
      city_query: String(cityName || '').trim(),
      geocenter: {
        latitude: Number(cityProfile.latitude),
        longitude: Number(cityProfile.longitude),
        label: cityProfile.display_name || cityProfile.canonical_city
      },
      canonical_city: cityProfile.canonical_city || null,
      radius_km: primaryRadius,
      message: hospitals.length > 0
        ? 'OpenStreetMap data fetched and filtered to the searched city boundary.'
        : 'No mapped hospitals found inside the searched city area.'
    }
  };
}

async function searchOsmHospitalsNearCoordinates(latitude, longitude, userRadiusKm) {
  const searchCenter = {
    canonical_city: 'Near You',
    latitude: Number(latitude),
    longitude: Number(longitude),
    radius_km: Math.max(5, Math.min(250, Number(userRadiusKm || 25))),
    display_name: 'Near You'
  };

  let hospitals = await fetchOsmHospitalsNear(searchCenter, searchCenter.radius_km, {
    includeSecondary: false,
    expansionKm: 2
  });

  if (hospitals.length < 5) {
    const secondary = await fetchOsmHospitalsNear(searchCenter, searchCenter.radius_km, {
      includeSecondary: true,
      expansionKm: 2
    });
    hospitals = dedupeHospitals([...hospitals, ...secondary]);
  }

  return {
    data: hospitals.filter((hospital) => hospital.distance_km <= searchCenter.radius_km),
    meta: {
      source: 'openstreetmap',
      geocoded: true,
      radius_km: searchCenter.radius_km,
      geocenter: {
        latitude: searchCenter.latitude,
        longitude: searchCenter.longitude,
        label: searchCenter.display_name
      }
    }
  };
}

module.exports = {
  fetchOsmHospitalsNear,
  geocodeCity,
  haversineKm,
  searchHospitalsByCityIndia,
  searchOsmHospitalsNearCoordinates
};
