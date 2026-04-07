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
    name: 'SSIMS Hospital',
    city: 'Davangere',
    state: 'Karnataka',
    address: 'Jnanashankara Campus, NH-4 Bypass, Davangere',
    phone: '+91-8192-266307',
    email: 'info@ssimshospital.example',
    latitude: 14.4644,
    longitude: 75.9210,
    rating: 4.5,
    cost: 20000,
    description: 'Multi-speciality hospital with ICU and advanced diagnostics.',
    treatmentTags: ['MRI Scan', 'Heart Surgery', 'Cardiology', 'Neurology'],
    doctors: [
      { name: 'Dr. Ramesh', specialization: 'Cardiologist', availability: 'Available' },
      { name: 'Dr. Priya', specialization: 'Neurologist', availability: 'Busy' }
    ],
    treatments: [
      { name: 'MRI Scan', cost: 5000 },
      { name: 'Heart Surgery', cost: 20000 }
    ],
    facilities: ['ICU', 'Cardiac Unit', '24x7 Pharmacy', 'Ambulance'],
    reviews: [
      { patient_name: 'Anita', rating: 4.5, comment: 'Good service' }
    ]
  },
  {
    name: 'Bapuji Hospital',
    city: 'Davangere',
    state: 'Karnataka',
    address: 'Bapuji Campus, MCC B Block, Davangere',
    phone: '+91-8192-220848',
    email: 'info@bapujihospital.example',
    latitude: 14.4661,
    longitude: 75.9235,
    rating: 4.2,
    cost: 15000,
    description: 'Affordable healthcare services with strong emergency support.',
    treatmentTags: ['X-Ray', 'Orthopedics', 'Emergency Medicine'],
    doctors: [
      { name: 'Dr. Suresh', specialization: 'Orthopedic', availability: 'Available' }
    ],
    treatments: [
      { name: 'X-Ray', cost: 1000 }
    ],
    facilities: ['Emergency Ward', 'X-Ray Unit', 'Pharmacy', 'General Ward'],
    reviews: [
      { patient_name: 'Mahesh', rating: 4.0, comment: 'Affordable and decent' }
    ]
  },
  {
    name: 'Apollo Hospital',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'Bannerghatta Road, Bangalore',
    phone: '+91-80-26304050',
    email: 'care@apollohospital.example',
    latitude: 12.9716,
    longitude: 77.5946,
    rating: 4.7,
    cost: 50000,
    description: 'Top-rated advanced hospital with multi-speciality tertiary care.',
    treatmentTags: ['Cancer Treatment', 'Cardiology', 'Oncology', 'ICU'],
    doctors: [
      { name: 'Dr. Mehta', specialization: 'Cardiologist', availability: 'Available' }
    ],
    treatments: [
      { name: 'Cancer Treatment', cost: 50000 }
    ],
    facilities: ['Advanced Oncology Wing', 'ICU', 'Laboratory', 'Parking'],
    reviews: [
      { patient_name: 'Sonia', rating: 5.0, comment: 'Excellent facilities' }
    ]
  },
  {
    name: 'Manipal Hospital',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'Old Airport Road, Bangalore',
    phone: '+91-80-25024444',
    email: 'care@manipalhospital.example',
    latitude: 12.9352,
    longitude: 77.6245,
    rating: 4.6,
    cost: 45000,
    description: 'Premium healthcare services with strong outpatient and inpatient care.',
    treatmentTags: ['General Checkup', 'General Medicine', 'Diagnostics'],
    doctors: [
      { name: 'Dr. Sharma', specialization: 'General Physician', availability: 'Available' }
    ],
    treatments: [
      { name: 'General Checkup', cost: 2000 }
    ],
    facilities: ['Executive Ward', 'Diagnostics Lab', 'Pharmacy', 'Ambulance'],
    reviews: [
      { patient_name: 'Rahul', rating: 4.6, comment: 'Highly recommended' }
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

  return new Set(rows.map((row) => row.column_name));
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
