export const FEATURED_CITIES = [
  { name: 'Bangalore', state: 'Karnataka', emoji: '🏙️' },
  { name: 'Mumbai', state: 'Maharashtra', emoji: '🏘️' },
  { name: 'Delhi', state: 'Delhi', emoji: '🕌' },
  { name: 'Hyderabad', state: 'Telangana', emoji: '💊' },
  { name: 'Davangere', state: 'Karnataka', emoji: '🏥' },
  { name: 'Pune', state: 'Maharashtra', emoji: '🎓' },
  { name: 'Chennai', state: 'Tamil Nadu', emoji: '🏖️' },
  { name: 'Kolkata', state: 'West Bengal', emoji: '🌉' },
  { name: 'Ahmedabad', state: 'Gujarat', emoji: '🏙️' },
  { name: 'Gurugram', state: 'Haryana', emoji: '🏥' },
  { name: 'Vellore', state: 'Tamil Nadu', emoji: '🏥' }
];

export const FEATURED_HOSPITALS = [
  {
    id: 'aiims-new-delhi',
    name: 'AIIMS New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.9,
    cost: 1200,
    min_treatment_cost: 1200,
    available_doctors: 48,
    total_doctors: 62,
    review_count: 1800,
    treatment_count: 4,
    latitude: 28.5672,
    longitude: 77.2100,
    description: 'India\'s flagship public tertiary-care institute with advanced specialties and emergency care.',
    treatments: [{ name: 'General Medicine', cost: 1200 }],
    facility_preview: ['Emergency', 'ICU', 'Cardiology', 'Neurology'],
    top_recommended: true
  },
  {
    id: 'apollo-hospitals-chennai',
    name: 'Apollo Hospitals Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    rating: 4.8,
    cost: 35000,
    min_treatment_cost: 35000,
    available_doctors: 36,
    total_doctors: 44,
    review_count: 2400,
    treatment_count: 4,
    latitude: 13.0287,
    longitude: 80.2717,
    description: 'A leading multi-speciality hospital known for cardiac care, oncology, and complex surgery.',
    treatments: [{ name: 'Cardiology', cost: 35000 }],
    facility_preview: ['Cardiology', 'Oncology', 'Neurology', 'Emergency'],
    top_recommended: true
  },
  {
    id: 'fortis-memorial-research-institute-gurugram',
    name: 'Fortis Memorial Research Institute',
    city: 'Gurugram',
    state: 'Haryana',
    rating: 4.7,
    cost: 45000,
    min_treatment_cost: 45000,
    available_doctors: 31,
    total_doctors: 39,
    review_count: 1500,
    treatment_count: 4,
    latitude: 28.4429,
    longitude: 77.0716,
    description: 'High-acuity care centre with strong neurology, oncology, and transplant support.',
    treatments: [{ name: 'Neurology', cost: 45000 }],
    facility_preview: ['ICU', 'Oncology', 'Neurology', 'Transplant'],
  },
  {
    id: 'medanta-the-medicity-gurugram',
    name: 'Medanta The Medicity',
    city: 'Gurugram',
    state: 'Haryana',
    rating: 4.8,
    cost: 50000,
    min_treatment_cost: 50000,
    available_doctors: 34,
    total_doctors: 41,
    review_count: 2100,
    treatment_count: 4,
    latitude: 28.3906,
    longitude: 77.0586,
    description: 'Large tertiary-care hospital with transplant, cardiac, and digestive health expertise.',
    treatments: [{ name: 'Heart Surgery', cost: 50000 }],
    facility_preview: ['Cardiology', 'Transplant', 'Gastroenterology', 'Emergency'],
  },
  {
    id: 'manipal-hospital-bengaluru',
    name: 'Manipal Hospital Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    rating: 4.6,
    cost: 30000,
    min_treatment_cost: 30000,
    available_doctors: 28,
    total_doctors: 36,
    review_count: 1700,
    treatment_count: 4,
    latitude: 12.9352,
    longitude: 77.6245,
    description: 'Established Bengaluru hospital with strong diagnostics, orthopedics, and specialty clinics.',
    treatments: [{ name: 'Orthopedics', cost: 30000 }],
    facility_preview: ['Diagnostics', 'Orthopedics', 'Emergency', 'Pharmacy'],
  },
  {
    id: 'kokilaben-hospital-mumbai',
    name: 'Kokilaben Dhirubhai Ambani Hospital',
    city: 'Mumbai',
    state: 'Maharashtra',
    rating: 4.7,
    cost: 42000,
    min_treatment_cost: 42000,
    available_doctors: 30,
    total_doctors: 37,
    review_count: 1900,
    treatment_count: 4,
    latitude: 19.1249,
    longitude: 72.8326,
    description: 'Premium Mumbai hospital with specialty care in neurology, oncology, and cardiac medicine.',
    treatments: [{ name: 'Oncology', cost: 42000 }],
    facility_preview: ['Neurology', 'Oncology', 'Cardiology', 'ICU'],
  },
  {
    id: 'christian-medical-college-vellore',
    name: 'Christian Medical College Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    rating: 4.7,
    cost: 18000,
    min_treatment_cost: 18000,
    available_doctors: 26,
    total_doctors: 33,
    review_count: 1400,
    treatment_count: 4,
    latitude: 12.9165,
    longitude: 79.1325,
    description: 'Trusted academic hospital with deep expertise in general medicine and specialist care.',
    treatments: [{ name: 'General Medicine', cost: 18000 }],
    facility_preview: ['General Medicine', 'Pediatrics', 'Neurology', 'Surgery'],
  }
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
