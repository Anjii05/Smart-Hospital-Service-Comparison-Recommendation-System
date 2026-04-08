const { pool: db } = require('../config/database');
const { searchHospitalsByCityIndia } = require('./osmHospitals');

const TREATMENTS_POOL = [
  { name: 'General Checkup', cost: 500 },
  { name: 'MRI Scan', cost: 5000 },
  { name: 'X-Ray', cost: 1000 },
  { name: 'Angiography', cost: 15000 },
  { name: 'Heart Surgery', cost: 250000 },
  { name: 'Chemotherapy', cost: 45000 },
  { name: 'Orthopedic Consultation', cost: 800 },
  { name: 'CT Scan', cost: 3500 },
  { name: 'Blood Test', cost: 400 },
  { name: 'Ultrasound', cost: 1200 },
];

const SPECIALIZATIONS = [
  'Cardiologist', 'Neurologist', 'Orthopedic Surgeon', 'Oncologist',
  'General Physician', 'Pediatrician', 'Gynecologist', 'Dermatologist',
  'Gastroenterologist', 'Pulmonologist', 'Endocrinologist', 'Urologist',
  'Ophthalmologist', 'ENT Specialist', 'Psychiatrist', 'Radiologist'
];

const FACILITIES_POOL = [
  'ICU', 'Emergency Ward', '24x7 Pharmacy', 'Ambulance',
  'Advanced Diagnostics Lab', 'Operation Theater', 'Blood Bank', 'Cafeteria',
  'Physiotherapy Unit', 'Neonatal ICU', 'Radiology Center', 'Dialysis Unit',
  'Cardiac Care Unit', 'Ayurvedic Wing', 'Dental Clinic', 'Eye Care Center'
];

// Large pool of Indian doctor first and last names
const DOCTOR_FIRST_NAMES = [
  'Arun', 'Anitha', 'Arjun', 'Asha', 'Ashok', 'Aishwarya',
  'Balaji', 'Bhavana', 'Bhaskar', 'Bharathi',
  'Chandra', 'Chitra', 'Chithra', 'Chandrakant',
  'Deepa', 'Dinesh', 'Divya', 'Dhruv',
  'Ganesh', 'Geetha', 'Girish', 'Gopal',
  'Harish', 'Hema', 'Hemant', 'Hemalatha',
  'Jagdish', 'Janaki', 'Jayanta', 'Jyoti',
  'Karthik', 'Kavitha', 'Kiran', 'Krishnappa',
  'Lakshmi', 'Latha', 'Lokesh', 'Lavanya',
  'Mahesh', 'Madhuri', 'Manoj', 'Meena',
  'Nagesh', 'Nalini', 'Narayan', 'Nandita',
  'Pavan', 'Padmavathi', 'Prasad', 'Priya',
  'Rajesh', 'Ramesh', 'Rekha', 'Rohit',
  'Santhosh', 'Savitha', 'Shivakumar', 'Shruti',
  'Sridhar', 'Sunitha', 'Suresh', 'Swathi',
  'Uday', 'Uma', 'Usha', 'Umesh',
  'Venkat', 'Vidya', 'Vijay', 'Vimala',
  'Yashoda', 'Yogesh', 'Yashas', 'Yesudas'
];

const DOCTOR_LAST_NAMES = [
  'Agarwal', 'Anand', 'Bhat', 'Bose',
  'Chakraborty', 'Chaudhary', 'Das', 'Dave',
  'Desai', 'Deshpande', 'Dixit', 'Fernandes',
  'Gandhi', 'Ghosh', 'Gowda', 'Gupta',
  'Hegde', 'Iyer', 'Jain', 'Joshi',
  'Kapoor', 'Kaur', 'Khan', 'Krishnan',
  'Kumar', 'Mehta', 'Menon', 'Mishra',
  'Mukherjee', 'Nair', 'Naik', 'Narayanan',
  'Patel', 'Pillai', 'Rao', 'Rathore',
  'Reddy', 'Roy', 'Saxena', 'Shah',
  'Sharma', 'Shukla', 'Singh', 'Sinha',
  'Srinivasan', 'Tiwari', 'Varma', 'Verma',
  'Yadav', 'Zutshi'
];

// Large pool of patient names for reviews
const PATIENT_FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aishwarya', 'Akash', 'Alok', 'Amrita',
  'Ananya', 'Anil', 'Anita', 'Anjali', 'Ankit', 'Ankita',
  'Arjun', 'Asha', 'Ashish', 'Ayesha',
  'Deepak', 'Deepika', 'Divya', 'Farhan',
  'Gaurav', 'Gayatri', 'Harini', 'Harsha',
  'Ishaan', 'Ishita', 'Kiran', 'Kirti',
  'Komal', 'Kunal', 'Lakshmi', 'Lavanya',
  'Manish', 'Manisha', 'Meena', 'Megha',
  'Mohit', 'Monika', 'Murugan', 'Nalini',
  'Nikhil', 'Nikita', 'Nisha', 'Pooja',
  'Pranav', 'Preethi', 'Priya', 'Rahul',
  'Raj', 'Rajani', 'Ramya', 'Ravi',
  'Rekha', 'Rohit', 'Sachin', 'Sandeep',
  'Sangeetha', 'Sanjay', 'Sarita', 'Seema',
  'Shivam', 'Shruti', 'Sneha', 'Sonia',
  'Sunil', 'Sunita', 'Tarun', 'Usha',
  'Vijay', 'Vijaya', 'Vikas', 'Vikram',
  'Vinay', 'Vineeta', 'Vishal', 'Yamini', 'Yogita', 'Zara'
];

const PATIENT_LAST_NAMES = [
  'Agarwal', 'Bhat', 'Chandra', 'Das', 'Desai', 'Gandhi',
  'Gowda', 'Gupta', 'Hegde', 'Iyer', 'Joshi', 'Kaur',
  'Krishna', 'Kumar', 'Mehta', 'Menon', 'Mishra', 'Nair',
  'Patel', 'Pillai', 'Rao', 'Reddy', 'Shah', 'Sharma',
  'Singh', 'Srinivas', 'Tiwari', 'Varma', 'Verma', 'Yadav'
];

const REVIEW_COMMENTS = [
  'The doctors were attentive and explained everything clearly.',
  'Very affordable with good quality care. Impressed with the services.',
  'Clean, well-maintained hospital with modern diagnostic equipment.',
  'Staff was very courteous and helpful throughout our visit.',
  'Highly experienced specialists. Satisfied with the treatment outcome.',
  'The emergency team responded quickly and was very professional.',
  'Good infrastructure and smooth patient management process.',
  'Reasonable waiting time and thorough consultation by the doctor.',
  'Excellent care provided throughout our hospital stay.',
  'Diagnostic facilities are modern and reports were delivered fast.',
  'The nursing staff was extremely caring and supportive.',
  'Overall a great experience — would definitely recommend to family.',
  'Doctor took time to understand the problem and gave a clear diagnosis.',
  'The pharmacy is well-stocked and operates around the clock.',
  'Specialist consultation was very insightful and helpful.',
  'Hospital is easily accessible and well-organized.',
  'Good follow-up care and post-treatment support was provided.',
  'World-class treatment at very reasonable rates.',
  'Impressed with the cleanliness and hygiene standards maintained.',
  'Friendly administration and minimal paperwork for admission.'
];

/** Fisher-Yates shuffle — returns a new shuffled copy. */
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRandomItems(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffle(array).slice(0, count);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns `count` guaranteed-unique doctor full names by shuffling the full pool
 * and pairing first[i] with last[i] — no two doctors at the same hospital share a name.
 */
function uniqueDoctorNames(count) {
  const firstNames = shuffle(DOCTOR_FIRST_NAMES);
  const lastNames = shuffle(DOCTOR_LAST_NAMES);
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(`Dr. ${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`);
  }
  return names;
}

/**
 * Returns `count` guaranteed-unique patient full names — no two reviewers at the
 * same hospital share a name.
 */
function uniquePatientNames(count) {
  const firstNames = shuffle(PATIENT_FIRST_NAMES);
  const lastNames = shuffle(PATIENT_LAST_NAMES);
  const names = [];
  for (let i = 0; i < count; i++) {
    names.push(`${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`);
  }
  return names;
}

/** Returns `count` unique review comments drawn without replacement. */
function uniqueReviewComments(count) {
  return shuffle(REVIEW_COMMENTS).slice(0, Math.min(count, REVIEW_COMMENTS.length));
}

function pickTreatments() {
  const withoutGeneral = TREATMENTS_POOL.filter((t) => t.name !== 'General Checkup');
  const selected = getRandomItems(withoutGeneral, 2, 6);
  return [TREATMENTS_POOL.find((t) => t.name === 'General Checkup'), ...selected];
}

/**
 * Hydrates the database with real hospitals for a given city and generates mock dependencies.
 */
async function hydrateCity(city) {
  console.log(`\n⏳ Hydrating missing data for city: ${city}...`);
  try {
    const { data: hospitals } = await searchHospitalsByCityIndia(city);

    if (hospitals.length === 0) {
      console.log(`⚠️ OSM found no hospitals for ${city}.`);
      return false;
    }

    let insertedCount = 0;
    for (const hospital of hospitals) {
      // Skip if already in DB
      const [existing] = await db.query(
        'SELECT id FROM hospitals WHERE name = ? AND city = ? LIMIT 1',
        [hospital.name, hospital.city || city]
      );
      if (existing.length > 0) continue;

      // Insert Hospital
      const [result] = await db.query(
        `INSERT INTO hospitals (
          name, city, location, latitude, longitude, rating, cost, description, phone, image_url, emergency_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hospital.name,
          hospital.city || city,
          hospital.location || hospital.address || 'Local Healthcare Provider',
          hospital.latitude,
          hospital.longitude,
          hospital.rating || (Math.random() * (5 - 3.2) + 3.2).toFixed(1),
          getRandomInt(3000, 25000),
          `${hospital.name} is a registered healthcare facility in ${hospital.city || city}, offering medical consultation, diagnostic services, and specialized treatments.`,
          hospital.phone || null,
          hospital.image_url || null,
          hospital.emergency_available ? 1 : 0
        ]
      );

      const hospitalId = result.insertId;

      // Generate Doctors — unique names and unique specializations per hospital
      const doctorCount = getRandomInt(2, 5);
      const doctorNames = uniqueDoctorNames(doctorCount);
      const specializations = shuffle(SPECIALIZATIONS);

      for (let i = 0; i < doctorCount; i++) {
        const spec = specializations[i % specializations.length];
        const isAvailable = Math.random() > 0.3;
        await db.query(
          `INSERT INTO doctors (hospital_id, name, specialization, available, availability) VALUES (?, ?, ?, ?, ?)`,
          [hospitalId, doctorNames[i], spec, isAvailable ? 1 : 0, isAvailable ? 'Available' : 'Busy']
        );
      }

      // Generate Treatments
      const selectedTreatments = pickTreatments();
      for (const t of selectedTreatments) {
        const finalCost = Math.round(t.cost * (1 + (Math.random() * 0.4 - 0.2)));
        await db.query(
          `INSERT INTO treatments (hospital_id, name, cost) VALUES (?, ?, ?)`,
          [hospitalId, t.name, finalCost]
        );
      }

      // Generate Facilities
      const selectedFacilities = getRandomItems(FACILITIES_POOL, 3, 6);
      for (const f of selectedFacilities) {
        await db.query(
          `INSERT INTO facilities (hospital_id, facility_name, name) VALUES (?, ?, ?)`,
          [hospitalId, f, f]
        );
      }

      // Generate Reviews — unique patient names and unique comments per hospital
      const reviewCount = getRandomInt(1, 4);
      const patientNames = uniquePatientNames(reviewCount);
      const reviewComments = uniqueReviewComments(reviewCount);

      for (let i = 0; i < reviewCount; i++) {
        const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
        await db.query(
          `INSERT INTO reviews (hospital_id, patient_name, rating, comment) VALUES (?, ?, ?, ?)`,
          [hospitalId, patientNames[i], rating, reviewComments[i]]
        );
      }

      insertedCount++;
    }

    console.log(`✅ Hydrated ${insertedCount} new hospitals for ${city}.`);
    return insertedCount > 0;
  } catch (error) {
    console.error(`❌ Hydration Error for ${city}:`, error.message);
    return false;
  }
}

module.exports = { hydrateCity };
