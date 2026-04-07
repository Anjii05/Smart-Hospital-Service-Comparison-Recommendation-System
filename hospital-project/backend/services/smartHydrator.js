const { pool: db } = require('../config/database');
const { markCityHydrated, resolveCityProfile } = require('./cityDirectory');
const { searchHospitalsByCityIndia } = require('./osmLookup');

const TREATMENTS_POOL = [
  { name: 'General Checkup', cost: 500 },
  { name: 'MRI Scan', cost: 5000 },
  { name: 'CT Scan', cost: 3500 },
  { name: 'X-Ray', cost: 1000 },
  { name: 'Blood Test', cost: 400 },
  { name: 'Ultrasound', cost: 1200 },
  { name: 'Angiography', cost: 15000 },
  { name: 'Heart Surgery', cost: 250000 },
  { name: 'Chemotherapy', cost: 45000 },
  { name: 'Orthopedic Consultation', cost: 800 },
  { name: 'Cardiology Consultation', cost: 1200 },
  { name: 'Neurology Consultation', cost: 1400 }
];

const SPECIALIZATIONS = [
  'Cardiologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Oncologist',
  'General Physician',
  'Pediatrician',
  'Gynecologist',
  'Dermatologist',
  'Gastroenterologist',
  'Pulmonologist'
];

const FACILITIES_POOL = [
  'ICU',
  'Emergency Ward',
  '24x7 Pharmacy',
  'Ambulance',
  'Advanced Diagnostics Lab',
  'Operation Theater',
  'Blood Bank',
  'Cafeteria',
  'Radiology Center',
  'Physiotherapy Unit'
];

const REVIEW_COMMENTS = [
  'Doctors were attentive and the treatment process was clear.',
  'Emergency handling was fast and reassuring.',
  'Good value for money with clean facilities.',
  'Helpful staff and quick diagnostics.',
  'Strong specialist support and follow-up care.'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomDoctorName(seed) {
  const firstNames = ['Aarav', 'Priya', 'Kiran', 'Rohit', 'Sneha', 'Ananya', 'Vikram', 'Meera'];
  const lastNames = ['Sharma', 'Rao', 'Patel', 'Verma', 'Reddy', 'Nair', 'Bhat', 'Joshi'];
  return `Dr. ${firstNames[seed % firstNames.length]} ${lastNames[(seed * 3) % lastNames.length]}`;
}

function consultationFeeForSpecialization(specialization, seed) {
  const lowered = String(specialization || '').toLowerCase();

  if (lowered.includes('cardio')) return 1200 + ((seed % 4) * 120);
  if (lowered.includes('neuro')) return 1400 + ((seed % 4) * 120);
  if (lowered.includes('ortho')) return 900 + ((seed % 4) * 100);
  if (lowered.includes('onco')) return 1500 + ((seed % 4) * 130);
  if (lowered.includes('gastro')) return 950 + ((seed % 4) * 90);
  return 600 + ((seed % 4) * 80);
}

async function findExistingHospital(hospital) {
  const [rows] = await db.query(
    `
      SELECT id
      FROM hospitals
      WHERE LOWER(name) = LOWER(?)
        AND (
          (latitude IS NOT NULL AND longitude IS NOT NULL AND ABS(latitude - ?) < 0.0008 AND ABS(longitude - ?) < 0.0008)
          OR LOWER(city) = LOWER(?)
        )
      LIMIT 1
    `,
    [hospital.name, hospital.latitude, hospital.longitude, hospital.city]
  );

  return rows[0] || null;
}

async function ensureHospitalChildren(hospitalId, seedBase) {
  const [[doctorCountRow], [treatmentCountRow], [facilityCountRow], [reviewCountRow]] = await Promise.all([
    db.query('SELECT COUNT(*) AS count FROM doctors WHERE hospital_id = ?', [hospitalId]),
    db.query('SELECT COUNT(*) AS count FROM treatments WHERE hospital_id = ?', [hospitalId]),
    db.query('SELECT COUNT(*) AS count FROM facilities WHERE hospital_id = ?', [hospitalId]),
    db.query('SELECT COUNT(*) AS count FROM reviews WHERE hospital_id = ?', [hospitalId])
  ]);

  if (Number(doctorCountRow[0].count) === 0) {
    const doctorTotal = getRandomInt(3, 6);
    const specializationPool = shuffle(SPECIALIZATIONS);

    for (let index = 0; index < doctorTotal; index += 1) {
      const specialization = specializationPool[index % specializationPool.length];
      const isAvailable = index % 3 !== 0;
      await db.query(
        `
          INSERT INTO doctors (
            hospital_id,
            name,
            specialization,
            experience_years,
            consultation_fee,
            available,
            availability
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          hospitalId,
          randomDoctorName(seedBase + index),
          specialization,
          5 + ((seedBase + index) % 18),
          consultationFeeForSpecialization(specialization, seedBase + index),
          isAvailable ? 1 : 0,
          isAvailable ? 'Available' : 'Busy'
        ]
      );
    }
  }

  if (Number(treatmentCountRow[0].count) === 0) {
    // 🏥 ALWAYS add "General Checkup" and "Emergency" so filters don't fail immediately
    const mandatory = [
      { name: 'General Checkup', cost: 500 + (seedBase % 300) },
      { name: 'Emergency Consultation', cost: 800 + (seedBase % 400) }
    ];

    const randomPool = shuffle(TREATMENTS_POOL).slice(0, getRandomInt(2, 4));
    const allToInsert = [...mandatory, ...randomPool];

    for (const treatment of allToInsert) {
      const cost = Math.round(treatment.cost * (0.9 + (Math.random() * 0.2)));
      await db.query(
        'INSERT INTO treatments (hospital_id, name, cost) VALUES (?, ?, ?)',
        [hospitalId, treatment.name, cost]
      );
    }
  }

  if (Number(facilityCountRow[0].count) === 0) {
    // 🏥 ALWAYS add Emergency Ward as a facility
    const mandatoryFac = ['Emergency Ward', '24x7 Pharmacy'];
    const randomFac = shuffle(FACILITIES_POOL).slice(0, getRandomInt(2, 4));
    const allFac = [...new Set([...mandatoryFac, ...randomFac])];

    for (const facility of allFac) {
      await db.query(
        'INSERT INTO facilities (hospital_id, name) VALUES (?, ?)',
        [hospitalId, facility]
      );
    }
  }

  if (Number(reviewCountRow[0].count) === 0) {
    const comments = shuffle(REVIEW_COMMENTS).slice(0, getRandomInt(2, 4));
    for (let index = 0; index < comments.length; index += 1) {
      await db.query(
        'INSERT INTO reviews (hospital_id, patient_name, rating, comment) VALUES (?, ?, ?, ?)',
        [hospitalId, `Patient ${seedBase + index + 1}`, getRandomInt(4, 5), comments[index]]
      );
    }
  }
}

async function hydrateCity(cityName) {
  const cityProfile = await resolveCityProfile(cityName);
  if (!cityProfile) {
    return false;
  }

  const { data: hospitals } = await searchHospitalsByCityIndia(cityName, { cityProfile });
  if (!Array.isArray(hospitals) || hospitals.length === 0) {
    return false;
  }

  let insertedCount = 0;

  for (let index = 0; index < hospitals.length; index += 1) {
    const hospital = hospitals[index];
    const existing = await findExistingHospital({
      ...hospital,
      city: cityProfile.canonical_city
    });

    let hospitalId = existing?.id || null;

    if (!hospitalId) {
      const [result] = await db.query(
        `
          INSERT INTO hospitals (
            name,
            location,
            city,
            state,
            latitude,
            longitude,
            rating,
            phone,
            image_url,
            description,
            emergency_available,
            cost,
            treatments
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          hospital.name,
          hospital.location || 'OpenStreetMap',
          cityProfile.canonical_city,
          cityProfile.state,
          hospital.latitude,
          hospital.longitude,
          Number((3.8 + Math.random() * 1.1).toFixed(1)),
          hospital.phone || null,
          hospital.image_url || null,
          `${hospital.name} is a mapped healthcare facility in ${cityProfile.canonical_city}.`,
          hospital.emergency_available ? 1 : 0,
          getRandomInt(2000, 25000),
          'General Checkup, Emergency Consultation' // Initial tags
        ]
      );

      hospitalId = result.insertId;
      insertedCount += 1;
    } else {
      await db.query(
        `
          UPDATE hospitals
          SET city = ?,
              state = COALESCE(?, state),
              location = COALESCE(NULLIF(?, ''), location),
              latitude = COALESCE(?, latitude),
              longitude = COALESCE(?, longitude),
              emergency_available = COALESCE(?, emergency_available)
          WHERE id = ?
        `,
        [
          cityProfile.canonical_city,
          cityProfile.state,
          hospital.location || null,
          hospital.latitude || null,
          hospital.longitude || null,
          hospital.emergency_available ? 1 : null,
          hospitalId
        ]
      );
    }

    const hospitalIdInserted = await ensureHospitalChildren(hospitalId, index + 11);

    // 🏥 SYNC TREATMENTS TAGS BACK TO HOSPITAL TABLE
    const [treatmentRows] = await db.query('SELECT name FROM treatments WHERE hospital_id = ?', [hospitalId]);
    if (treatmentRows.length > 0) {
      const tags = treatmentRows.map(r => r.name).join(', ');
      await db.query('UPDATE hospitals SET treatments = ? WHERE id = ?', [tags, hospitalId]);
    }
  }

  await markCityHydrated(cityProfile);
  return insertedCount > 0;
}

module.exports = {
  hydrateCity
};
