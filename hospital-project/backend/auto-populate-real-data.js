const db = require('./config/database');
const { searchHospitalsByCityIndia } = require('./services/osmHospitals');
require('dotenv').config();

const CITIES_TO_SEED = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Davangere'];

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
  'Cardiologist', 'Neurologist', 'Orthopedic', 'Oncologist', 
  'General Physician', 'Pediatrician', 'Gynecologist', 'Dermatologist'
];

const FACILITIES_POOL = [
  'ICU', 'Emergency Ward', '24x7 Pharmacy', 'Ambulance', 
  'Advanced Diagnostics Lab', 'Operation Theater', 'Blood Bank', 'Cafeteria'
];

const REVIEW_COMMENTS = [
  'Excellent facilities and very caring doctors.',
  'Affordable and decent healthcare services.',
  'Highly recommended, very clean environment.',
  'Good service but the wait time was a bit long.',
  'World-class doctors, very satisfied with the treatment.',
  'Friendly staff and fast emergency response.'
];

function getRandomItems(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function populateDatabase() {

  console.log('🚀 Starting Automatic Real-Data Population via OpenStreetMap...');

  for (const city of CITIES_TO_SEED) {
    try {
      console.log(`\n📍 Fetching hospitals for ${city} using OSM...`);
      const { data: hospitals } = await searchHospitalsByCityIndia(city);

      if (hospitals.length === 0) {
        console.log(`⚠️ No hospitals found for ${city}.`);
        continue;
      }

      console.log(`✅ Found ${hospitals.length} hospitals. Inserting into database...`);

      for (const hospital of hospitals) {
        // Check if hospital already exists
        const [existing] = await db.query('SELECT id FROM hospitals WHERE name = ? AND city = ? LIMIT 1', [hospital.name, hospital.city]);
        
        if (existing.length > 0) {
          console.log(`   ⏭️ Skipping: ${hospital.name} (already exists)`);
          continue;
        }

        // Insert Hospital
        const [result] = await db.query(
          `INSERT INTO hospitals (name, city, latitude, longitude, rating, cost, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            hospital.name, 
            hospital.city || city, 
            hospital.latitude, 
            hospital.longitude, 
            hospital.rating || (Math.random() * (5 - 3) + 3).toFixed(1), 
            getRandomInt(2000, 20000), // Base random cost benchmark
            hospital.location || hospital.address || 'Local Healthcare Provider'
          ]
        );
        
        const hospitalId = result.insertId;

        // Generate and Insert Doctors (2 to 5 per hospital)
        const doctorCount = getRandomInt(2, 5);
        for (let i = 0; i < doctorCount; i++) {
          const spec = SPECIALIZATIONS[getRandomInt(0, SPECIALIZATIONS.length - 1)];
          await db.query(
            `INSERT INTO doctors (hospital_id, name, specialization, availability) VALUES (?, ?, ?, ?)`,
            [hospitalId, `Dr. ${['Ramesh', 'Priya', 'Suresh', 'Mehta', 'Sharma', 'Verma', 'Patel'][getRandomInt(0, 6)]}`, spec, Math.random() > 0.3 ? 'Available' : 'Busy']
          );
        }

        // Generate and Insert Treatments (3 to 7 per hospital)
        const selectedTreatments = getRandomItems(TREATMENTS_POOL, 3, 7);
        for (const t of selectedTreatments) {
          // slightly randomize cost
          const finalCost = Math.round(t.cost * (1 + (Math.random() * 0.4 - 0.2))); 
          await db.query(
            `INSERT INTO treatments (hospital_id, name, cost) VALUES (?, ?, ?)`,
            [hospitalId, t.name, finalCost]
          );
        }

        // Generate and Insert Facilities (3 to 6 per hospital)
        const selectedFacilities = getRandomItems(FACILITIES_POOL, 3, 6);
        for (const f of selectedFacilities) {
          await db.query(
            `INSERT INTO facilities (hospital_id, name) VALUES (?, ?)`,
            [hospitalId, f]
          );
        }

        // Generate and Insert Reviews (1 to 5 per hospital)
        const reviewCount = getRandomInt(1, 5);
        for (let i = 0; i < reviewCount; i++) {
          const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
          const comment = REVIEW_COMMENTS[getRandomInt(0, REVIEW_COMMENTS.length - 1)];
          const patientName = ['Anita', 'Mahesh', 'Sonia', 'Rahul', 'John', 'Vikram'][getRandomInt(0, 5)];
          
          await db.query(
            `INSERT INTO reviews (hospital_id, patient_name, rating, comment) VALUES (?, ?, ?, ?)`,
            [hospitalId, patientName, rating, comment]
          );
        }

        console.log(`   ✔️ Inserted: ${hospital.name} (+ mock doctors/treatments)`);
      }
    } catch (error) {
      console.error(`❌ Error processing city ${city}:`, error.message);
    }
  }

  console.log('\n🎉 Real-data population complete! You now have a fully functional model with real locations.');
  process.exit(0);
}

populateDatabase();
