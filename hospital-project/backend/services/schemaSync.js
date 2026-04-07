const { pool: db } = require('../config/database');

let initPromise = null;

async function columnExists(tableName, columnName) {
  const [[row]] = await db.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
    `,
    [tableName, columnName]
  );

  return Number(row.count) > 0;
}

async function indexExists(tableName, indexName) {
  const [[row]] = await db.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
    `,
    [tableName, indexName]
  );

  return Number(row.count) > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await db.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`
  );
}

async function ensureIndex(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await db.query(
    `ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${definition}`
  );
}

async function ensureBaseTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      location VARCHAR(200) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NULL,
      latitude DECIMAL(10,8) NULL,
      longitude DECIMAL(11,8) NULL,
      rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
      distance_km DECIMAL(5,2) NULL,
      phone VARCHAR(20) NULL,
      email VARCHAR(100) NULL,
      image_url VARCHAR(300) NULL,
      description TEXT NULL,
      emergency_available TINYINT(1) NULL DEFAULT 1,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      cost INT NULL DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      name VARCHAR(150) NOT NULL,
      specialization VARCHAR(100) NOT NULL,
      experience_years INT NULL,
      consultation_fee INT NULL,
      available TINYINT(1) NULL DEFAULT 1,
      availability VARCHAR(50) NULL DEFAULT 'Available',
      CONSTRAINT fk_doctors_hospital
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS treatments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      cost INT NOT NULL,
      CONSTRAINT fk_treatments_hospital
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS facilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      facility_name VARCHAR(150) NOT NULL,
      name VARCHAR(255) NULL,
      CONSTRAINT fk_facilities_hospital
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hospital_id INT NULL,
      patient_name VARCHAR(100) NULL,
      rating INT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reviews_hospital
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS city_directory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      query_key VARCHAR(120) NOT NULL UNIQUE,
      query_name VARCHAR(120) NOT NULL,
      canonical_city VARCHAR(120) NOT NULL,
      state VARCHAR(120) NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      radius_km DECIMAL(6,2) NOT NULL DEFAULT 20.00,
      min_lat DECIMAL(10,8) NULL,
      max_lat DECIMAL(10,8) NULL,
      min_lon DECIMAL(11,8) NULL,
      max_lon DECIMAL(11,8) NULL,
      source VARCHAR(40) NOT NULL DEFAULT 'seed',
      display_name VARCHAR(255) NULL,
      last_hydrated_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function ensureColumns() {
  await ensureColumn('hospitals', 'state', 'VARCHAR(100) NULL AFTER `city`');
  await ensureColumn('hospitals', 'location', 'VARCHAR(200) NOT NULL DEFAULT \'OpenStreetMap\' AFTER `name`');
  await ensureColumn('hospitals', 'latitude', 'DECIMAL(10,8) NULL AFTER `state`');
  await ensureColumn('hospitals', 'longitude', 'DECIMAL(11,8) NULL AFTER `latitude`');
  await ensureColumn('hospitals', 'distance_km', 'DECIMAL(5,2) NULL AFTER `rating`');
  await ensureColumn('hospitals', 'phone', 'VARCHAR(20) NULL AFTER `distance_km`');
  await ensureColumn('hospitals', 'email', 'VARCHAR(100) NULL AFTER `phone`');
  await ensureColumn('hospitals', 'image_url', 'VARCHAR(300) NULL AFTER `email`');
  await ensureColumn('hospitals', 'description', 'TEXT NULL AFTER `image_url`');
  await ensureColumn('hospitals', 'emergency_available', 'TINYINT(1) NULL DEFAULT 1 AFTER `description`');
  await ensureColumn('hospitals', 'cost', 'INT NULL DEFAULT 0 AFTER `created_at`');

  await ensureColumn('doctors', 'experience_years', 'INT NULL AFTER `specialization`');
  await ensureColumn('doctors', 'consultation_fee', 'INT NULL AFTER `experience_years`');
  await ensureColumn('doctors', 'available', 'TINYINT(1) NULL DEFAULT 1 AFTER `consultation_fee`');
  await ensureColumn('doctors', 'availability', 'VARCHAR(50) NULL DEFAULT \'Available\' AFTER `available`');

  await ensureColumn('facilities', 'name', 'VARCHAR(255) NULL AFTER `facility_name`');
  await ensureColumn('reviews', 'patient_name', 'VARCHAR(100) NULL AFTER `hospital_id`');
}

async function ensureIndexes() {
  await ensureIndex('hospitals', 'idx_hospitals_city', '(`city`)');
  await ensureIndex('hospitals', 'idx_hospitals_coords', '(`latitude`, `longitude`)');
  await ensureIndex('treatments', 'idx_treatments_hospital', '(`hospital_id`)');
  await ensureIndex('doctors', 'idx_doctors_hospital', '(`hospital_id`)');
  await ensureIndex('facilities', 'idx_facilities_hospital', '(`hospital_id`)');
  await ensureIndex('reviews', 'idx_reviews_hospital', '(`hospital_id`)');
  await ensureIndex('city_directory', 'idx_city_directory_canonical', '(`canonical_city`)');
}

async function backfillHospitalState() {
  await db.query(`
    UPDATE hospitals
    SET state = CASE
      WHEN LOWER(city) IN ('bangalore', 'bengaluru', 'bangaluru', 'mysuru', 'mysore', 'davangere', 'davanagere', 'belagavi', 'belgaum', 'dharwad', 'hubballi', 'hubli', 'shivamogga', 'shimoga', 'chitradurga', 'mangaluru', 'mangalore', 'bailhongal')
        THEN 'Karnataka'
      WHEN LOWER(city) IN ('mumbai', 'pune')
        THEN 'Maharashtra'
      WHEN LOWER(city) IN ('delhi', 'new delhi')
        THEN 'Delhi'
      WHEN LOWER(city) IN ('hyderabad')
        THEN 'Telangana'
      WHEN LOWER(city) IN ('chennai', 'vellore')
        THEN 'Tamil Nadu'
      WHEN LOWER(city) IN ('kolkata')
        THEN 'West Bengal'
      WHEN LOWER(city) IN ('ahmedabad')
        THEN 'Gujarat'
      WHEN LOWER(city) IN ('kochi')
        THEN 'Kerala'
      ELSE state
    END
    WHERE state IS NULL OR state = ''
  `);
}

async function backfillDoctorAttributes() {
  await db.query(`
    UPDATE doctors
    SET
      consultation_fee = CASE
        WHEN consultation_fee IS NOT NULL AND consultation_fee > 0 THEN consultation_fee
        WHEN LOWER(specialization) LIKE '%cardio%' THEN 1100 + ((id % 6) * 120)
        WHEN LOWER(specialization) LIKE '%neuro%' THEN 1300 + ((id % 6) * 130)
        WHEN LOWER(specialization) LIKE '%ortho%' THEN 900 + ((id % 6) * 100)
        WHEN LOWER(specialization) LIKE '%onco%' THEN 1400 + ((id % 6) * 150)
        WHEN LOWER(specialization) LIKE '%gastro%' THEN 950 + ((id % 6) * 100)
        WHEN LOWER(specialization) LIKE '%pediatric%' THEN 700 + ((id % 6) * 80)
        WHEN LOWER(specialization) LIKE '%gyne%' THEN 850 + ((id % 6) * 90)
        WHEN LOWER(specialization) LIKE '%derma%' THEN 650 + ((id % 6) * 70)
        ELSE 500 + ((id % 6) * 60)
      END,
      experience_years = COALESCE(experience_years, 4 + (id % 18)),
      availability = CASE
        WHEN COALESCE(available, 0) = 1 THEN 'Available'
        WHEN availability IS NULL OR availability = '' THEN 'Busy'
        ELSE availability
      END
    WHERE consultation_fee IS NULL
       OR consultation_fee = 0
       OR experience_years IS NULL
       OR availability IS NULL
       OR availability = ''
  `);
}

async function normalizeFacilities() {
  await db.query(`
    UPDATE facilities
    SET name = COALESCE(NULLIF(name, ''), facility_name)
    WHERE name IS NULL OR name = ''
  `);
}

async function ensureSmartSchema() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureBaseTables();
      await ensureColumns();
      await ensureIndexes();
      await backfillHospitalState();
      await backfillDoctorAttributes();
      await normalizeFacilities();
    })();
  }

  return initPromise;
}

module.exports = {
  ensureSmartSchema
};
