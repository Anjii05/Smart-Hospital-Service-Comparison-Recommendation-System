export const FEATURED_CITIES = [
  { name: 'Bangalore', state: 'Karnataka', emoji: '🏙️' },
  { name: 'Mumbai', state: 'Maharashtra', emoji: '🏘️' },
  { name: 'Delhi', state: 'Delhi', emoji: '🕌' },
  { name: 'Hyderabad', state: 'Telangana', emoji: '💊' },
  { name: 'Davangere', state: 'Karnataka', emoji: '🏥' },
  { name: 'Pune', state: 'Maharashtra', emoji: '🎓' },
  { name: 'Chennai', state: 'Tamil Nadu', emoji: '🏖️' },
  { name: 'Kolkata', state: 'West Bengal', emoji: '🌉' },
  { name: 'Ahmedabad', state: 'Gujarat', emoji: '🏙️' }
];

export const TREATMENT_OPTIONS = [
  'General Checkup',
  'Cardiology Consultation',
  'Orthopedic Consultation',
  'MRI Scan',
  'CT Scan',
  'X-Ray',
  'Oncology Consultation',
  'Pediatrics'
];

export function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export function formatRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : '0.0';
}

export function buildSearchParamsObject(filters = {}) {
  const params = {};

  if (filters.city?.trim()) {
    params.city = filters.city.trim();
  }

  if (filters.treatment?.trim()) {
    params.treatment = filters.treatment.trim();
  }

  if (filters.cost !== undefined && filters.cost !== null && String(filters.cost).trim()) {
    params.cost = String(filters.cost).trim();
  }

  if (filters.sort?.trim()) {
    params.sort = filters.sort.trim();
  }

  if (filters.emergency) {
    params.emergency = '1';
  }

  return params;
}

export function buildSearchQuery(filters = {}) {
  const params = new URLSearchParams(buildSearchParamsObject(filters));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getDirectionsUrl(hospital) {
  if (!hospital?.latitude || !hospital?.longitude) {
    return '';
  }

  const lat = hospital.latitude;
  const lon = hospital.longitude;
  const name = hospital.name ? encodeURIComponent(hospital.name) : '';

  // Opens Google Maps with a pin at exact coordinates
  // Format: query=lat,lon always resolves to the correct location on map
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export function getHospitalHighlights(hospital) {
  const highlights = [];

  if (hospital?.top_recommended) {
    highlights.push({ tone: 'gold', label: 'Top Recommended' });
  }

  if (hospital?.distance_km !== null && hospital?.distance_km !== undefined) {
    highlights.push({ tone: 'blue', label: `${hospital.distance_km} km away` });
  }

  if (hospital?.available_doctors > 0) {
    highlights.push({
      tone: 'green',
      label: `${hospital.available_doctors}/${hospital.total_doctors} doctors free`
    });
  }

  if (hospital?.review_count > 0) {
    highlights.push({ tone: 'slate', label: `${hospital.review_count} reviews` });
  }

  return highlights;
}

export function getHospitalTags(hospital) {
  const tags = [];

  if (hospital?.city) {
    tags.push(hospital.city);
  }

  if (hospital?.treatment_count) {
    tags.push(`${hospital.treatment_count} treatments`);
  }

  if (hospital?.facility_preview?.length) {
    tags.push(...hospital.facility_preview.slice(0, 3));
  }

  return tags.slice(0, 4);
}

export function getPrimaryTreatment(hospital) {
  if (Array.isArray(hospital?.treatments) && hospital.treatments.length > 0) {
    return hospital.treatments[0].name;
  }

  if (hospital?.facility_preview?.length) {
    return hospital.facility_preview[0];
  }

  return 'General Care';
}

export function createSelectionPreview(hospital) {
  return {
    id: hospital.id,
    name: hospital.name,
    city: hospital.city,
    rating: hospital.rating,
    latitude: hospital.latitude,
    longitude: hospital.longitude
  };
}
