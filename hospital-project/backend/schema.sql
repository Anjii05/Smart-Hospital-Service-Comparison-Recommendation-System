-- ============================================================
--  hospital_db — MySQL Schema + Sample Data
--  Run this once to set up your database
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ─── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hospitals (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(200) NOT NULL,
  city      VARCHAR(100) NOT NULL,
  address   VARCHAR(300),
  phone     VARCHAR(20),
  rating    DECIMAL(2,1) DEFAULT 0.0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatments (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  treatment_name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hospital_treatments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  treatment_id INT NOT NULL,
  cost        DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (hospital_id)  REFERENCES hospitals(id)  ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_hosp_treat (hospital_id, treatment_id)
);

-- ─── Treatments Master List ───────────────────────────────────

INSERT IGNORE INTO treatments (treatment_name) VALUES
  ('CT Scan'),
  ('MRI Scan'),
  ('X-Ray'),
  ('ECG'),
  ('Echocardiogram'),
  ('Ultrasound'),
  ('Dialysis'),
  ('ICU'),
  ('Knee Replacement'),
  ('Hip Replacement'),
  ('Bypass Surgery'),
  ('Open Heart Surgery'),
  ('Angioplasty'),
  ('Endoscopy'),
  ('Colonoscopy'),
  ('Chemotherapy'),
  ('Radiation Therapy'),
  ('Physiotherapy'),
  ('Cataract Surgery'),
  ('Appendectomy');

-- ─── Sample Hospitals ─────────────────────────────────────────

INSERT INTO hospitals (name, city, address, phone, rating) VALUES
  ('Apollo Hospitals',          'Bangalore',  'Bannerghatta Road',       '080-26304050', 4.7),
  ('Manipal Hospital',          'Bangalore',  'Old Airport Road',        '080-25024444', 4.6),
  ('Fortis Hospital',           'Mumbai',     'Mulund West',             '022-67971000', 4.5),
  ('Kokilaben Hospital',        'Mumbai',     'Andheri West',            '022-30999999', 4.8),
  ('AIIMS',                     'Delhi',      'Ansari Nagar',            '011-26588500', 4.9),
  ('Max Super Speciality',      'Delhi',      'Saket',                   '011-26515050', 4.6),
  ('Narayana Health',           'Mysuru',     'Bannimantap',             '0821-4000000', 4.4),
  ('Columbia Asia',             'Mysuru',     'Vijayanagar',             '0821-3989898', 4.3),
  ('KIMS Hospital',             'Hubli',      'Vidyanagar',              '0836-2272777', 4.2),
  ('SDM Hospital',              'Dharwad',    'Manjushree Nagar',        '0836-2447777', 4.1),
  ('District Hospital',         'Bailhongal', 'Main Road',               '08288-262100', 3.9),
  ('Shree Hospital',            'Bailhongal', 'Bus Stand Road',          '08288-262200', 3.7),
  ('NIMHANS',                   'Bangalore',  'Hosur Road',              '080-46110007', 4.8),
  ('Jayadeva Institute',        'Bangalore',  'Bannerghatta Road',       '080-22977777', 4.7),
  ('Wockhardt Hospital',        'Mumbai',     'South Mumbai',            '022-61781000', 4.4),
  ('Christian Medical College', 'Vellore',    'Ida Scudder Road',        '0416-2281000', 4.9),
  ('Kasturba Hospital',         'Manipal',    'Madhav Nagar',            '0820-2922340', 4.5),
  ('KMC Hospital',              'Mangalore',  'Lighthouse Hill Road',    '0824-2445858', 4.3),
  ('Sparsh Hospital',           'Bangalore',  'Infantry Road',           '080-41500000', 4.5),
  ('BGS Global Hospital',       'Bangalore',  'Kengeri',                 '080-26763839', 4.4);

-- ─── Hospital → Treatment + Cost Mapping ─────────────────────

-- Apollo Bangalore
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'CT Scan'       AS tname, 3500  AS cost_val UNION ALL
  SELECT 'MRI Scan',     8000  UNION ALL
  SELECT 'X-Ray',        500   UNION ALL
  SELECT 'ECG',          400   UNION ALL
  SELECT 'Dialysis',     2500  UNION ALL
  SELECT 'Bypass Surgery', 250000
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'Apollo Hospitals' AND h.city = 'Bangalore'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- Manipal Bangalore
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'CT Scan',       3000  AS cost_val UNION ALL
  SELECT 'MRI Scan',      7500  UNION ALL
  SELECT 'Knee Replacement', 180000 UNION ALL
  SELECT 'Angioplasty',   95000 UNION ALL
  SELECT 'ICU',           15000
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'Manipal Hospital' AND h.city = 'Bangalore'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- Fortis Mumbai
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'CT Scan',       4000  AS cost_val UNION ALL
  SELECT 'MRI Scan',      9000  UNION ALL
  SELECT 'Dialysis',      3000  UNION ALL
  SELECT 'Chemotherapy',  30000 UNION ALL
  SELECT 'ICU',           18000
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'Fortis Hospital' AND h.city = 'Mumbai'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- AIIMS Delhi
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'CT Scan',       800   AS cost_val UNION ALL
  SELECT 'MRI Scan',      1500  UNION ALL
  SELECT 'X-Ray',         200   UNION ALL
  SELECT 'ECG',           100   UNION ALL
  SELECT 'Bypass Surgery', 120000 UNION ALL
  SELECT 'Chemotherapy',  15000
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'AIIMS' AND h.city = 'Delhi'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- Narayana Mysuru
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'CT Scan',       2500  AS cost_val UNION ALL
  SELECT 'MRI Scan',      6000  UNION ALL
  SELECT 'Dialysis',      2000  UNION ALL
  SELECT 'ECG',           350   UNION ALL
  SELECT 'Angioplasty',   75000
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'Narayana Health' AND h.city = 'Mysuru'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- District Hospital Bailhongal (low-cost)
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'X-Ray',         150   AS cost_val UNION ALL
  SELECT 'ECG',           100   UNION ALL
  SELECT 'Ultrasound',    500   UNION ALL
  SELECT 'Physiotherapy', 300
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'District Hospital' AND h.city = 'Bailhongal'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- Shree Hospital Bailhongal
INSERT INTO hospital_treatments (hospital_id, treatment_id, cost)
SELECT h.id, t.id, cost_val
FROM hospitals h, (
  SELECT 'X-Ray',         200   AS cost_val UNION ALL
  SELECT 'ECG',           150   UNION ALL
  SELECT 'CT Scan',       2000  UNION ALL
  SELECT 'Ultrasound',    600
) vals
JOIN treatments t ON t.treatment_name = vals.tname
WHERE h.name = 'Shree Hospital' AND h.city = 'Bailhongal'
ON DUPLICATE KEY UPDATE cost = VALUES(cost);

-- ─── Verify ───────────────────────────────────────────────────
SELECT
  h.name, h.city, h.rating,
  t.treatment_name, ht.cost
FROM hospitals h
JOIN hospital_treatments ht ON h.id = ht.hospital_id
JOIN treatments t ON ht.treatment_id = t.id
ORDER BY h.city, h.name
LIMIT 20;