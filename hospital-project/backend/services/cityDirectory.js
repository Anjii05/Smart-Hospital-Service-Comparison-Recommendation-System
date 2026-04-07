const { pool: db } = require('../config/database');
const { geocodeCity, haversineKm } = require('./osmLookup');

const HYDRATE_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;

const KNOWN_CITY_PROFILES = [
  { canonical_city: 'Bangalore', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, radius_km: 30, aliases: ['bangalore', 'bengaluru', 'bangaluru'] },
  { canonical_city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, radius_km: 28, aliases: ['mumbai', 'bombay'] },
  { canonical_city: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090, radius_km: 32, aliases: ['delhi', 'new delhi'] },
  { canonical_city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, radius_km: 24, aliases: ['hyderabad'] },
  { canonical_city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, radius_km: 22, aliases: ['pune'] },
  { canonical_city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, radius_km: 22, aliases: ['chennai', 'madras'] },
  { canonical_city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, radius_km: 22, aliases: ['kolkata', 'calcutta'] },
  { canonical_city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714, radius_km: 20, aliases: ['ahmedabad'] },
  { canonical_city: 'Mysuru', state: 'Karnataka', latitude: 12.2958, longitude: 76.6394, radius_km: 12, aliases: ['mysuru', 'mysore'] },
  { canonical_city: 'Davangere', state: 'Karnataka', latitude: 14.4644, longitude: 75.9210, radius_km: 11, aliases: ['davangere', 'davanagere'] },
  { canonical_city: 'Belagavi', state: 'Karnataka', latitude: 15.8497, longitude: 74.4977, radius_km: 18, aliases: ['belagavi', 'belgaum'] },
  { canonical_city: 'Dharwad', state: 'Karnataka', latitude: 15.4589, longitude: 75.0078, radius_km: 12, aliases: ['dharwad'] },
  { canonical_city: 'Hubballi', state: 'Karnataka', latitude: 15.3647, longitude: 75.1240, radius_km: 16, aliases: ['hubballi', 'hubli'] },
  { canonical_city: 'Chitradurga', state: 'Karnataka', latitude: 14.2306, longitude: 76.3983, radius_km: 10, aliases: ['chitradurga'] },
  { canonical_city: 'Shivamogga', state: 'Karnataka', latitude: 13.9299, longitude: 75.5681, radius_km: 12, aliases: ['shivamogga', 'shimoga'] },
  { canonical_city: 'Mangaluru', state: 'Karnataka', latitude: 12.9141, longitude: 74.8560, radius_km: 14, aliases: ['mangaluru', 'mangalore'] },
  { canonical_city: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673, radius_km: 14, aliases: ['kochi', 'cochin'] },
  { canonical_city: 'Vellore', state: 'Tamil Nadu', latitude: 12.9165, longitude: 79.1325, radius_km: 8, aliases: ['vellore'] },
  { canonical_city: 'Manipal', state: 'Karnataka', latitude: 13.3525, longitude: 74.7928, radius_km: 6, aliases: ['manipal'] },
  { canonical_city: 'Bailhongal', state: 'Karnataka', latitude: 15.8167, longitude: 74.8667, radius_km: 8, aliases: ['bailhongal'] }
];

const KNOWN_ALIAS_INDEX = new Map();
for (const profile of KNOWN_CITY_PROFILES) {
  for (const alias of profile.aliases) {
    KNOWN_ALIAS_INDEX.set(alias, profile);
  }
}

function normalizeCityKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function buildBoundingBoxFromRadius(latitude, longitude, radiusKm) {
  const latDelta = radiusKm / 110.574;
  const lonDelta = radiusKm / (111.320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.2));

  return {
    min_lat: latitude - latDelta,
    max_lat: latitude + latDelta,
    min_lon: longitude - lonDelta,
    max_lon: longitude + lonDelta
  };
}

function deriveRadiusFromBoundingBox(boundingBox, latitude, longitude) {
  if (!boundingBox) {
    return 18;
  }

  const corners = [
    [boundingBox.min_lat, boundingBox.min_lon],
    [boundingBox.min_lat, boundingBox.max_lon],
    [boundingBox.max_lat, boundingBox.min_lon],
    [boundingBox.max_lat, boundingBox.max_lon]
  ].filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));

  if (corners.length === 0) {
    return 18;
  }

  const maxDistance = Math.max(
    ...corners.map(([lat, lon]) => haversineKm(latitude, longitude, lat, lon))
  );

  return Math.min(40, Math.max(6, Number((maxDistance + 2).toFixed(2))));
}

function inflateBoundingBox(profile, expansionKm = 0) {
  if (!profile) {
    return null;
  }

  if (
    Number.isFinite(profile.min_lat) &&
    Number.isFinite(profile.max_lat) &&
    Number.isFinite(profile.min_lon) &&
    Number.isFinite(profile.max_lon) &&
    expansionKm === 0
  ) {
    return {
      min_lat: profile.min_lat,
      max_lat: profile.max_lat,
      min_lon: profile.min_lon,
      max_lon: profile.max_lon
    };
  }

  const radius = Number(profile.radius_km || 18) + expansionKm;
  return buildBoundingBoxFromRadius(Number(profile.latitude), Number(profile.longitude), radius);
}

function mapStoredProfile(row) {
  if (!row) {
    return null;
  }

  return {
    query_key: row.query_key,
    query_name: row.query_name,
    canonical_city: row.canonical_city,
    state: row.state || null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radius_km: Number(row.radius_km),
    min_lat: row.min_lat === null ? null : Number(row.min_lat),
    max_lat: row.max_lat === null ? null : Number(row.max_lat),
    min_lon: row.min_lon === null ? null : Number(row.min_lon),
    max_lon: row.max_lon === null ? null : Number(row.max_lon),
    source: row.source,
    display_name: row.display_name,
    last_hydrated_at: row.last_hydrated_at
  };
}

async function upsertCityProfile(profile, queryName) {
  const query_key = normalizeCityKey(queryName || profile.query_name || profile.canonical_city);
  const query_name = titleCase(queryName || profile.query_name || profile.canonical_city);
  const boundingBox = inflateBoundingBox(profile, 0);

  await db.query(
    `
      INSERT INTO city_directory (
        query_key,
        query_name,
        canonical_city,
        state,
        latitude,
        longitude,
        radius_km,
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        source,
        display_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        query_name = VALUES(query_name),
        canonical_city = VALUES(canonical_city),
        state = VALUES(state),
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        radius_km = VALUES(radius_km),
        min_lat = VALUES(min_lat),
        max_lat = VALUES(max_lat),
        min_lon = VALUES(min_lon),
        max_lon = VALUES(max_lon),
        source = VALUES(source),
        display_name = VALUES(display_name)
    `,
    [
      query_key,
      query_name,
      profile.canonical_city,
      profile.state || null,
      Number(profile.latitude),
      Number(profile.longitude),
      Number(profile.radius_km),
      boundingBox?.min_lat ?? null,
      boundingBox?.max_lat ?? null,
      boundingBox?.min_lon ?? null,
      boundingBox?.max_lon ?? null,
      profile.source || 'seed',
      profile.display_name || null
    ]
  );

  return {
    ...profile,
    query_key,
    query_name,
    min_lat: boundingBox?.min_lat ?? null,
    max_lat: boundingBox?.max_lat ?? null,
    min_lon: boundingBox?.min_lon ?? null,
    max_lon: boundingBox?.max_lon ?? null
  };
}

function getKnownProfile(query) {
  const key = normalizeCityKey(query);
  const match = KNOWN_ALIAS_INDEX.get(key);

  if (!match) {
    return null;
  }

  const boundingBox = buildBoundingBoxFromRadius(match.latitude, match.longitude, match.radius_km);

  return {
    query_key: key,
    query_name: titleCase(query),
    canonical_city: match.canonical_city,
    state: match.state,
    latitude: match.latitude,
    longitude: match.longitude,
    radius_km: match.radius_km,
    min_lat: boundingBox.min_lat,
    max_lat: boundingBox.max_lat,
    min_lon: boundingBox.min_lon,
    max_lon: boundingBox.max_lon,
    source: 'seed',
    display_name: `${match.canonical_city}, ${match.state}`
  };
}

async function getStoredProfile(query) {
  const key = normalizeCityKey(query);
  const lowered = String(query || '').trim().toLowerCase();

  const [[row]] = await db.query(
    `
      SELECT *
      FROM city_directory
      WHERE query_key = ?
         OR LOWER(canonical_city) = ?
      ORDER BY query_key = ? DESC, updated_at DESC
      LIMIT 1
    `,
    [key, lowered, key]
  );

  return mapStoredProfile(row);
}

async function getDatabaseFallbackProfile(query) {
  const cleaned = String(query || '').trim();
  if (!cleaned) {
    return null;
  }

  const lowered = cleaned.toLowerCase();
  const [rows] = await db.query(
    `
      SELECT
        MIN(city) AS city,
        AVG(latitude) AS latitude,
        AVG(longitude) AS longitude,
        COUNT(*) AS hospital_count
      FROM hospitals
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          LOWER(city) = ?
          OR LOWER(city) LIKE ?
          OR LOWER(COALESCE(location, '')) LIKE ?
        )
    `,
    [lowered, `%${lowered}%`, `%${lowered}%`]
  );

  const row = rows[0];
  if (!row || row.latitude === null || row.longitude === null || Number(row.hospital_count) === 0) {
    return null;
  }

  const canonicalCity = titleCase(row.city || cleaned);
  const radiusKm = Number(row.hospital_count) >= 10 ? 16 : 12;
  const boundingBox = buildBoundingBoxFromRadius(Number(row.latitude), Number(row.longitude), radiusKm);

  return {
    query_key: normalizeCityKey(cleaned),
    query_name: titleCase(cleaned),
    canonical_city: canonicalCity,
    state: null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radius_km: radiusKm,
    min_lat: boundingBox.min_lat,
    max_lat: boundingBox.max_lat,
    min_lon: boundingBox.min_lon,
    max_lon: boundingBox.max_lon,
    source: 'database_fallback',
    display_name: canonicalCity
  };
}

function chooseCanonicalCity(geoResult, requestedCity) {
  const address = geoResult?.address || {};
  const raw =
    address.city ||
    address.town ||
    address.municipality ||
    address.county ||
    address.state_district ||
    requestedCity;

  const normalized = normalizeCityKey(raw);
  const known = KNOWN_ALIAS_INDEX.get(normalized);

  if (known) {
    return { canonical_city: known.canonical_city, state: known.state };
  }

  return {
    canonical_city: titleCase(raw),
    state: address.state || null
  };
}

async function resolveCityProfile(query, options = {}) {
  const cleaned = String(query || '').trim();
  if (!cleaned) {
    return null;
  }

  const knownProfile = getKnownProfile(cleaned);
  if (knownProfile) {
    return upsertCityProfile(knownProfile, cleaned);
  }

  const storedProfile = await getStoredProfile(cleaned);
  if (storedProfile) {
    return storedProfile;
  }

  const databaseFallback = await getDatabaseFallbackProfile(cleaned);
  if (databaseFallback && options.allowDatabaseFallback !== false) {
    return upsertCityProfile(databaseFallback, cleaned);
  }

  if (options.allowGeocode === false) {
    return null;
  }

  const geoResult = await geocodeCity(cleaned);
  if (!geoResult) {
    return null;
  }

  const { canonical_city, state } = chooseCanonicalCity(geoResult, cleaned);
  const boundingBox = geoResult.bounding_box || buildBoundingBoxFromRadius(geoResult.latitude, geoResult.longitude, 18);
  const radius_km = deriveRadiusFromBoundingBox(boundingBox, geoResult.latitude, geoResult.longitude);

  return upsertCityProfile(
    {
      canonical_city,
      state,
      latitude: geoResult.latitude,
      longitude: geoResult.longitude,
      radius_km,
      min_lat: boundingBox.min_lat,
      max_lat: boundingBox.max_lat,
      min_lon: boundingBox.min_lon,
      max_lon: boundingBox.max_lon,
      source: 'nominatim',
      display_name: geoResult.display_name || canonical_city
    },
    cleaned
  );
}

function getCitySearchTerms(requestedCity, cityProfile) {
  const terms = new Set();
  const requestedKey = normalizeCityKey(requestedCity);

  if (requestedKey) {
    terms.add(requestedKey);
  }

  if (cityProfile?.canonical_city) {
    terms.add(normalizeCityKey(cityProfile.canonical_city));
  }

  const knownProfile = cityProfile
    ? KNOWN_ALIAS_INDEX.get(normalizeCityKey(cityProfile.canonical_city))
    : KNOWN_ALIAS_INDEX.get(requestedKey);

  if (knownProfile) {
    for (const alias of knownProfile.aliases) {
      terms.add(normalizeCityKey(alias));
    }
  }

  return [...terms].filter(Boolean);
}

function pointWithinCityCoverage(latitude, longitude, cityProfile, expansionKm = 0) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !cityProfile) {
    return false;
  }

  const boundingBox = inflateBoundingBox(cityProfile, expansionKm);
  if (
    boundingBox &&
    latitude >= boundingBox.min_lat &&
    latitude <= boundingBox.max_lat &&
    longitude >= boundingBox.min_lon &&
    longitude <= boundingBox.max_lon
  ) {
    return true;
  }

  return haversineKm(
    Number(cityProfile.latitude),
    Number(cityProfile.longitude),
    latitude,
    longitude
  ) <= Number(cityProfile.radius_km || 18) + expansionKm;
}

async function markCityHydrated(cityOrProfile) {
  const profile = typeof cityOrProfile === 'string'
    ? await resolveCityProfile(cityOrProfile, { allowGeocode: false })
    : cityOrProfile;

  if (!profile) {
    return;
  }

  await db.query(
    `
      UPDATE city_directory
      SET last_hydrated_at = CURRENT_TIMESTAMP
      WHERE query_key = ?
         OR LOWER(canonical_city) = ?
    `,
    [normalizeCityKey(profile.query_name || profile.canonical_city), String(profile.canonical_city).toLowerCase()]
  );
}

function shouldHydrateCity(cityProfile) {
  if (!cityProfile?.last_hydrated_at) {
    return true;
  }

  return Date.now() - new Date(cityProfile.last_hydrated_at).getTime() > HYDRATE_INTERVAL_MS;
}

module.exports = {
  buildBoundingBoxFromRadius,
  getCitySearchTerms,
  markCityHydrated,
  normalizeCityKey,
  pointWithinCityCoverage,
  resolveCityProfile,
  shouldHydrateCity,
  titleCase
};
