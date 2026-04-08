#!/usr/bin/env node
const mysql = require('mysql2/promise');
require('dotenv').config();

const DATABASE_NAME = process.env.DB_NAME || 'hospital_db';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Anjali123',
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true
};

const sampleHospitals = [
  {
    name: 'AIIMS New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi',
    phone: '+91-11-26588500',
    email: 'info@aiims.edu',
    latitude: 28.5672,
    longitude: 77.2100,
    rating: 4.9,
    cost: 1200,
    description: 'India\'s flagship public tertiary-care institute with advanced specialties and emergency care.',
    treatmentTags: ['General Medicine', 'Cardiology', 'Neurology', 'Orthopedics'],
    doctors: [
      { name: 'Dr. R. Kumar', specialization: 'General Physician', availability: 'Available' },
      { name: 'Dr. A. Mehta', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. S. Rao', specialization: 'Neurologist', availability: 'Busy' }
    ],
    treatments: [
      { name: 'General Medicine', cost: 1200 },
      { name: 'Cardiology', cost: 2400 },
      { name: 'Neurology', cost: 2600 },
      { name: 'Orthopedics', cost: 1800 }
    ],
    facilities: ['Emergency', 'ICU', 'Cardiology', 'Neurology'],
    reviews: [
      { patient_name: 'Amit', rating: 5.0, comment: 'Excellent care and trusted doctors.' }
    ]
  },
  {
    name: 'Apollo Hospitals Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'Greams Road, Thousand Lights, Chennai',
    phone: '+91-44-28293333',
    email: 'care@apollohospitals.com',
    latitude: 13.0287,
    longitude: 80.2717,
    rating: 4.8,
    cost: 35000,
    description: 'A leading multi-speciality hospital known for cardiac care, oncology, and complex surgery.',
    treatmentTags: ['Cardiology', 'Oncology', 'Neurology', 'Emergency Care'],
    doctors: [
      { name: 'Dr. N. Iyer', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. P. Menon', specialization: 'Oncologist', availability: 'Available' }
    ],
    treatments: [
      { name: 'Cardiology', cost: 35000 },
      { name: 'Oncology', cost: 42000 },
      { name: 'Neurology', cost: 30000 },
      { name: 'Emergency Care', cost: 5000 }
    ],
    facilities: ['Cardiology', 'Oncology', 'Neurology', 'Emergency'],
    reviews: [
      { patient_name: 'Divya', rating: 4.8, comment: 'Great infrastructure and specialist support.' }
    ]
  },
  {
    name: 'Fortis Memorial Research Institute',
    city: 'Gurugram',
    state: 'Haryana',
    address: 'Sector 44, Gurugram',
    phone: '+91-124-4921021',
    email: 'info@fortishealthcare.com',
    latitude: 28.4429,
    longitude: 77.0716,
    rating: 4.7,
    cost: 45000,
    description: 'High-acuity care centre with strong neurology, oncology, and transplant support.',
    treatmentTags: ['Cardiology', 'Oncology', 'Orthopedics', 'Transplant'],
    doctors: [
      { name: 'Dr. S. Kapoor', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. M. Singh', specialization: 'Neurologist', availability: 'Busy' }
    ],
    treatments: [
      { name: 'Cardiology', cost: 45000 },
      { name: 'Oncology', cost: 52000 },
      { name: 'Orthopedics', cost: 28000 },
      { name: 'Transplant', cost: 75000 }
    ],
    facilities: ['ICU', 'Oncology', 'Neurology', 'Transplant'],
    reviews: [
      { patient_name: 'Rahul', rating: 4.7, comment: 'Strong specialist team and modern care.' }
    ]
  },
  {
    name: 'Medanta The Medicity',
    city: 'Gurugram',
    state: 'Haryana',
    address: 'Sector 38, Gurugram',
    phone: '+91-124-4141414',
    email: 'info@medanta.org',
    latitude: 28.3906,
    longitude: 77.0586,
    rating: 4.8,
    cost: 50000,
    description: 'Large tertiary-care hospital with transplant, cardiac, and digestive health expertise.',
    treatmentTags: ['Cardiology', 'Transplant Surgery', 'Gastroenterology', 'Neurology'],
    doctors: [
      { name: 'Dr. V. Sharma', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. K. Gupta', specialization: 'Gastroenterologist', availability: 'Available' }
    ],
    treatments: [
      { name: 'Cardiology', cost: 50000 },
      { name: 'Transplant Surgery', cost: 80000 },
      { name: 'Gastroenterology', cost: 22000 },
      { name: 'Neurology', cost: 36000 }
    ],
    facilities: ['Cardiology', 'Transplant', 'Gastroenterology', 'Emergency'],
    reviews: [
      { patient_name: 'Sneha', rating: 4.9, comment: 'Excellent hospital with broad specialty coverage.' }
    ]
  },
  {
    name: 'Manipal Hospital Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Old Airport Road, Bengaluru',
    phone: '+91-80-25024444',
    email: 'care@manipalhospitals.com',
    latitude: 12.9352,
    longitude: 77.6245,
    rating: 4.6,
    cost: 30000,
    description: 'Established Bengaluru hospital with strong diagnostics, orthopedics, and specialty clinics.',
    treatmentTags: ['General Checkup', 'Cardiology', 'Orthopedics', 'Diagnostics'],
    doctors: [
      { name: 'Dr. S. Rao', specialization: 'General Physician', availability: 'Available' },
      { name: 'Dr. P. Iyer', specialization: 'Orthopedic', availability: 'Available' }
    ],
    treatments: [
      { name: 'General Checkup', cost: 1500 },
      { name: 'Cardiology', cost: 30000 },
      { name: 'Orthopedics', cost: 22000 },
      { name: 'Diagnostics', cost: 5000 }
    ],
    facilities: ['Diagnostics', 'Orthopedics', 'Emergency', 'Pharmacy'],
    reviews: [
      { patient_name: 'Arjun', rating: 4.6, comment: 'Reliable care and easy appointment flow.' }
    ]
  },
  {
    name: 'Kokilaben Dhirubhai Ambani Hospital',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai',
    phone: '+91-22-30999999',
    email: 'info@kokilabenhospital.com',
    latitude: 19.1249,
    longitude: 72.8326,
    rating: 4.7,
    cost: 42000,
    description: 'Premium Mumbai hospital with specialty care in neurology, oncology, and cardiac medicine.',
    treatmentTags: ['Cardiology', 'Neurology', 'Oncology', 'Emergency'],
    doctors: [
      { name: 'Dr. N. Shah', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. R. Bhatia', specialization: 'Neurologist', availability: 'Busy' }
    ],
    treatments: [
      { name: 'Cardiology', cost: 42000 },
      { name: 'Neurology', cost: 38000 },
      { name: 'Oncology', cost: 55000 },
      { name: 'Emergency', cost: 8000 }
    ],
    facilities: ['Neurology', 'Oncology', 'Cardiology', 'ICU'],
    reviews: [
      { patient_name: 'Priya', rating: 4.7, comment: 'Comfortable facilities and expert team.' }
    ]
  },
  {
    name: 'Christian Medical College Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    address: 'Ida Scudder Road, Vellore',
    phone: '+91-416-2281000',
    email: 'info@cmch-vellore.edu',
    latitude: 12.9165,
    longitude: 79.1325,
    rating: 4.7,
    cost: 18000,
    description: 'Trusted academic hospital with deep expertise in general medicine and specialist care.',
    treatmentTags: ['General Medicine', 'Pediatrics', 'Neurology', 'Surgery'],
    doctors: [
      { name: 'Dr. J. Joseph', specialization: 'General Physician', availability: 'Available' },
      { name: 'Dr. L. Thomas', specialization: 'Pediatrician', availability: 'Available' }
    ],
    treatments: [
      { name: 'General Medicine', cost: 18000 },
      { name: 'Pediatrics', cost: 16000 },
      { name: 'Neurology', cost: 22000 },
      { name: 'Surgery', cost: 28000 }
    ],
    facilities: ['General Medicine', 'Pediatrics', 'Neurology', 'Surgery'],
    reviews: [
      { patient_name: 'Karthik', rating: 4.8, comment: 'Highly trusted teaching hospital.' }
    ]
  }
];

async function tableExists(connection, tableName) {
  const [[result]] = await connection.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name = ?
    `,
    [DATABASE_NAME, tableName]
  );

  return Number(result.count) > 0;
}

async function columnExists(connection, tableName, columnName) {
  const [[result]] = await connection.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
    `,
    [DATABASE_NAME, tableName, columnName]
  );

  return Number(result.count) > 0;
}

async function getColumns(connection, tableName) {
  const [rows] = await connection.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
    `,
    [DATABASE_NAME, tableName]
  );

  return new Set(rows.map((row) => row.column_name || row.COLUMN_NAME));
}

async function ensureColumn(connection, tableName, columnName, definition) {
  if (await columnExists(connection, tableName, columnName)) {
    return;
  }

  await connection.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
  );
}

async function createTables(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\``);
  await connection.query(`USE \`${DATABASE_NAME}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      latitude DOUBLE,
      longitude DOUBLE,
      rating FLOAT DEFAULT 0,
      cost INT DEFAULT 0,
      description TEXT
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hospital_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      specialization VARCHAR(255) NOT NULL,
      availability VARCHAR(50) DEFAULT 'Available',
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS treatments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hospital_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      cost INT NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS facilities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hospital_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hospital_id INT NOT NULL,
      patient_name VARCHAR(255),
      rating FLOAT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn(connection, 'hospitals', 'cost', 'INT DEFAULT 0');
  await ensureColumn(connection, 'hospitals', 'description', 'TEXT');
  await ensureColumn(connection, 'hospitals', 'treatments', 'TEXT');
  await ensureColumn(connection, 'doctors', 'availability', "VARCHAR(50) DEFAULT 'Available'");
  await ensureColumn(connection, 'reviews', 'patient_name', 'VARCHAR(255)');
  await ensureColumn(connection, 'facilities', 'name', 'VARCHAR(255)');

  if (await columnExists(connection, 'doctors', 'available')) {
    await connection.query(`
      UPDATE doctors
      SET availability = CASE
        WHEN available = 1 THEN 'Available'
        ELSE 'Busy'
      END
      WHERE availability IS NULL OR availability = ''
    `);
  }

  if (await columnExists(connection, 'facilities', 'facility_name')) {
    await connection.query(`
      UPDATE facilities
      SET name = COALESCE(name, facility_name)
      WHERE name IS NULL OR name = ''
    `);
  }
}

async function syncLegacyServices(connection) {
  if (!(await tableExists(connection, 'services'))) {
    return;
  }

  const serviceColumns = await getColumns(connection, 'services');
  const nameColumn = serviceColumns.has('service_name') ? 'service_name' : 'name';

  if (!nameColumn || !serviceColumns.has('hospital_id') || !serviceColumns.has('cost')) {
    return;
  }

  const [legacyServices] = await connection.query(
    `SELECT hospital_id, ${nameColumn} AS name, cost FROM services WHERE ${nameColumn} IS NOT NULL AND cost IS NOT NULL`
  );

  for (const service of legacyServices) {
    await upsertChildRow(
      connection,
      'treatments',
      'SELECT id FROM treatments WHERE hospital_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [service.hospital_id, service.name],
      {
        hospital_id: service.hospital_id,
        name: service.name,
        cost: Number(service.cost)
      }
    );
  }

  await connection.query(`
    UPDATE hospitals h
    JOIN (
      SELECT hospital_id, MIN(cost) AS min_cost
      FROM treatments
      GROUP BY hospital_id
    ) t ON t.hospital_id = h.id
    SET h.cost = CASE
      WHEN h.cost IS NULL OR h.cost = 0 THEN t.min_cost
      ELSE h.cost
    END
  `);
}

async function upsertHospital(connection, hospital, hospitalColumns) {
  const values = {
    name: hospital.name,
    city: hospital.city,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    rating: hospital.rating,
    cost: hospital.cost,
    description: hospital.description
  };

  if (hospitalColumns.has('state')) {
    values.state = hospital.state;
  }

  if (hospitalColumns.has('address')) {
    values.address = hospital.address;
  }

  if (hospitalColumns.has('location')) {
    values.location = hospital.address;
  }

  if (hospitalColumns.has('phone')) {
    values.phone = hospital.phone;
  }

  if (hospitalColumns.has('email')) {
    values.email = hospital.email;
  }

  if (hospitalColumns.has('emergency_available')) {
    values.emergency_available = 1;
  }

  if (hospitalColumns.has('treatments')) {
    values.treatments = hospital.treatmentTags.join(', ');
  }

  const [[existing]] = await connection.query(
    'SELECT id FROM hospitals WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [hospital.name]
  );

  if (existing) {
    const updateColumns = Object.keys(values);
    const updateClause = updateColumns.map((column) => `\`${column}\` = ?`).join(', ');
    await connection.query(
      `UPDATE hospitals SET ${updateClause} WHERE id = ?`,
      [...updateColumns.map((column) => values[column]), existing.id]
    );
    return existing.id;
  }

  const insertColumns = Object.keys(values);
  const placeholders = insertColumns.map(() => '?').join(', ');

  const [result] = await connection.query(
    `INSERT INTO hospitals (${insertColumns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
    insertColumns.map((column) => values[column])
  );

  return result.insertId;
}

async function upsertChildRow(connection, tableName, lookupSql, lookupParams, payload) {
  const [[existing]] = await connection.query(lookupSql, lookupParams);
  const columns = Object.keys(payload);

  if (existing) {
    const updateClause = columns.map((column) => `\`${column}\` = ?`).join(', ');
    await connection.query(
      `UPDATE \`${tableName}\` SET ${updateClause} WHERE id = ?`,
      [...columns.map((column) => payload[column]), existing.id]
    );
    return existing.id;
  }

  const placeholders = columns.map(() => '?').join(', ');
  const [result] = await connection.query(
    `INSERT INTO \`${tableName}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
    columns.map((column) => payload[column])
  );

  return result.insertId;
}

async function seedHospital(connection, hospital, schemaColumns) {
  const hospitalId = await upsertHospital(connection, hospital, schemaColumns.hospitals);

  for (const doctor of hospital.doctors) {
    const payload = {
      hospital_id: hospitalId,
      name: doctor.name,
      specialization: doctor.specialization
    };

    if (schemaColumns.doctors.has('availability')) {
      payload.availability = doctor.availability;
    }

    if (schemaColumns.doctors.has('available')) {
      payload.available = doctor.availability.toLowerCase() === 'available' ? 1 : 0;
    }

    await upsertChildRow(
      connection,
      'doctors',
      'SELECT id FROM doctors WHERE hospital_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [hospitalId, doctor.name],
      payload
    );
  }

  for (const treatment of hospital.treatments) {
    await upsertChildRow(
      connection,
      'treatments',
      'SELECT id FROM treatments WHERE hospital_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [hospitalId, treatment.name],
      {
        hospital_id: hospitalId,
        name: treatment.name,
        cost: treatment.cost
      }
    );
  }

  for (const facilityName of hospital.facilities) {
    const payload = {
      hospital_id: hospitalId,
      name: facilityName
    };

    if (schemaColumns.facilities.has('facility_name')) {
      payload.facility_name = facilityName;
    }

    await upsertChildRow(
      connection,
      'facilities',
      schemaColumns.facilities.has('facility_name')
        ? 'SELECT id FROM facilities WHERE hospital_id = ? AND LOWER(COALESCE(name, facility_name)) = LOWER(?) LIMIT 1'
        : 'SELECT id FROM facilities WHERE hospital_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [hospitalId, facilityName],
      payload
    );
  }

  for (const review of hospital.reviews) {
    await upsertChildRow(
      connection,
      'reviews',
      'SELECT id FROM reviews WHERE hospital_id = ? AND comment = ? LIMIT 1',
      [hospitalId, review.comment],
      {
        hospital_id: hospitalId,
        patient_name: review.patient_name,
        rating: review.rating,
        comment: review.comment
      }
    );
  }
}

async function printSummary(connection) {
  const [[hospitalCount]] = await connection.query('SELECT COUNT(*) AS count FROM hospitals');
  const [[doctorCount]] = await connection.query('SELECT COUNT(*) AS count FROM doctors');
  const [[treatmentCount]] = await connection.query('SELECT COUNT(*) AS count FROM treatments');
  const [[facilityCount]] = await connection.query('SELECT COUNT(*) AS count FROM facilities');
  const [[reviewCount]] = await connection.query('SELECT COUNT(*) AS count FROM reviews');
  const [cities] = await connection.query('SELECT DISTINCT city FROM hospitals ORDER BY city');

  console.log('\nDatabase setup complete.');
  console.log(`Hospitals: ${hospitalCount.count}`);
  console.log(`Doctors: ${doctorCount.count}`);
  console.log(`Treatments: ${treatmentCount.count}`);
  console.log(`Facilities: ${facilityCount.count}`);
  console.log(`Reviews: ${reviewCount.count}`);
  console.log(`Cities: ${cities.map((row) => row.city).join(', ')}`);
}

async function main() {
  let connection;

  try {
    console.log('Setting up hospital database...');
    connection = await mysql.createConnection(config);

    await createTables(connection);
    await syncLegacyServices(connection);

    const schemaColumns = {
      hospitals: await getColumns(connection, 'hospitals'),
      doctors: await getColumns(connection, 'doctors'),
      facilities: await getColumns(connection, 'facilities')
    };

    for (const hospital of sampleHospitals) {
      await seedHospital(connection, hospital, schemaColumns);
    }

    await printSummary(connection);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
