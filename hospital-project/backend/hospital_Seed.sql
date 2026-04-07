-- ============================================================
--  MediFind  –  Hospital Database Setup & Seed Data
--  Run this file in MySQL:  source hospital_seed.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ────────────────────────────────────────────────────────────
-- TABLE: hospitals
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)   NOT NULL,
  city            VARCHAR(100)   NOT NULL,
  address         TEXT,
  phone           VARCHAR(20),
  email           VARCHAR(100),
  rating          DECIMAL(2,1)   DEFAULT 0.0,
  budget_per_day  DECIMAL(10,2)  DEFAULT 0.00,
  treatments      TEXT           COMMENT 'Comma-separated list of treatments',
  emergency       TINYINT(1)     DEFAULT 0  COMMENT '1 = Yes, 0 = No',
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  image_url       VARCHAR(500),
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- SEED DATA  (Belagavi + nearby cities)
-- ────────────────────────────────────────────────────────────
INSERT INTO hospitals
  (name, city, address, phone, email, rating, budget_per_day, treatments, emergency, latitude, longitude)
VALUES

-- ── Belagavi ──────────────────────────────────────────────
('KLE Hospital & MRC',
 'Belagavi',
 'Nehru Nagar, Belagavi, Karnataka 590010',
 '0831-2470000', 'info@klehospital.org',
 4.5, 3500,
 'General,Cardiology,Neurology,Orthopedics,Oncology,Pediatrics,Gynecology',
 1, 15.8497, 74.4977),

('KIMS Belagavi',
 'Belagavi',
 'Udyambag, Belagavi, Karnataka 590006',
 '0831-2405555', 'kims@belagavi.com',
 4.2, 2800,
 'General,Cardiology,Orthopedics,Dermatology,ENT,Urology',
 1, 15.8569, 74.5089),

('District Hospital Belagavi',
 'Belagavi',
 'Club Road, Belagavi, Karnataka 590001',
 '0831-2421234', 'dh.belagavi@karnataka.gov.in',
 3.8, 500,
 'General,Emergency,Pediatrics,Gynecology,Surgery',
 1, 15.8626, 74.5042),

('Shree Hospital',
 'Belagavi',
 'Ram Nagar, Belagavi, Karnataka 590002',
 '0831-2467890', 'shree@hospital.com',
 4.0, 1800,
 'General,Orthopedics,Neurology,Urology,Gastroenterology',
 1, 15.8510, 74.5021),

('Susheela Hospital',
 'Belagavi',
 'Tilakwadi, Belagavi, Karnataka 590006',
 '0831-2430000', 'susheela@hospital.com',
 3.9, 1500,
 'General,Gynecology,Pediatrics,Dermatology',
 0, 15.8398, 74.4969),

('Udgiri Hospital',
 'Belagavi',
 'College Road, Belagavi, Karnataka 590001',
 '0831-2412345', 'udgiri@hospital.com',
 3.7, 1200,
 'General,ENT,Ophthalmology,Dermatology',
 0, 15.8641, 74.5058),

('City Care Hospital',
 'Belagavi',
 'Shahapur, Belagavi, Karnataka 590001',
 '0831-2498765', 'citycare@hospital.com',
 4.1, 2200,
 'General,Cardiology,Orthopedics,Emergency',
 1, 15.8455, 74.5110),

-- ── Hubballi ──────────────────────────────────────────────
('KIMS Hubballi',
 'Hubballi',
 'Vidyanagar, Hubballi, Karnataka 580031',
 '0836-2372777', 'kims@hubballi.com',
 4.4, 3000,
 'General,Cardiology,Neurology,Orthopedics,Oncology',
 1, 15.3647, 75.1240),

('SDM Hospital Hubballi',
 'Hubballi',
 'Manjunath Nagar, Hubballi 580030',
 '0836-2369000', 'sdm@hubballi.com',
 4.3, 2500,
 'General,Surgery,Pediatrics,Gynecology,Urology',
 1, 15.3580, 75.1350),

('District Hospital Hubballi',
 'Hubballi',
 'Koppikar Road, Hubballi 580020',
 '0836-2365000', 'dh.hubballi@karnataka.gov.in',
 3.5, 500,
 'General,Emergency,Gynecology,Pediatrics',
 1, 15.3603, 75.1240),

-- ── Dharwad ───────────────────────────────────────────────
('SDMCMS Hospital Dharwad',
 'Dharwad',
 'Sattur, Dharwad, Karnataka 580009',
 '0836-2447400', 'sdmcms@dharwad.com',
 4.5, 3200,
 'General,Cardiology,Neurology,Oncology,Orthopedics',
 1, 15.4589, 75.0078),

('District Hospital Dharwad',
 'Dharwad',
 'PB Road, Dharwad, Karnataka 580001',
 '0836-2744000', 'dh.dharwad@karnataka.gov.in',
 3.6, 400,
 'General,Emergency,Surgery,Gynecology',
 1, 15.4588, 75.0120),

-- ── Vijayapura (Bijapur) ──────────────────────────────────
('Basaveshwara Hospital Vijayapura',
 'Vijayapura',
 'Station Road, Vijayapura, Karnataka 586101',
 '08352-250000', 'bh@vijayapura.com',
 4.0, 2000,
 'General,Cardiology,Orthopedics,Pediatrics',
 1, 16.8302, 75.7100),

('District Hospital Vijayapura',
 'Vijayapura',
 'MG Road, Vijayapura 586101',
 '08352-255000', 'dh.vijayapura@karnataka.gov.in',
 3.4, 400,
 'General,Emergency,Gynecology,Surgery',
 1, 16.8360, 75.7170),

-- ── Pune ──────────────────────────────────────────────────
('Ruby Hall Clinic Pune',
 'Pune',
 'Sassoon Road, Pune, Maharashtra 411001',
 '020-26163391', 'info@rubyhall.com',
 4.6, 8000,
 'General,Cardiology,Neurology,Oncology,Transplant,Orthopedics',
 1, 18.5204, 73.8567),

('Jehangir Hospital Pune',
 'Pune',
 'Sassoon Road, Pune, Maharashtra 411001',
 '020-66814444', 'info@jehangirhospital.com',
 4.5, 7500,
 'General,Orthopedics,Gynecology,Pediatrics,Cardiology',
 1, 18.5308, 73.8762),

-- ── Bengaluru ─────────────────────────────────────────────
('Manipal Hospital Bengaluru',
 'Bengaluru',
 'Old Airport Road, Bengaluru, Karnataka 560017',
 '080-25024444', 'info@manipal.edu',
 4.7, 10000,
 'General,Cardiology,Neurology,Oncology,Transplant,Orthopedics,Pediatrics',
 1, 12.9716, 77.5946),

('Narayana Health Bengaluru',
 'Bengaluru',
 'Bommasandra, Bengaluru, Karnataka 560099',
 '080-71222222', 'info@narayanahealth.org',
 4.6, 9000,
 'General,Cardiology,Neurology,Pediatrics,Oncology',
 1, 12.8074, 77.6870),

-- ── Mumbai ────────────────────────────────────────────────
('Lilavati Hospital Mumbai',
 'Mumbai',
 'Bandra West, Mumbai, Maharashtra 400050',
 '022-26751000', 'info@lilavatihospital.com',
 4.6, 12000,
 'General,Cardiology,Neurology,Oncology,Orthopedics',
 1, 19.0760, 72.8777),

-- ── Kolhapur ──────────────────────────────────────────────
('CPR Hospital Kolhapur',
 'Kolhapur',
 'Rajarampuri, Kolhapur, Maharashtra 416008',
 '0231-2651000', 'cpr@kolhapur.gov.in',
 3.9, 900,
 'General,Emergency,Surgery,Gynecology,Pediatrics',
 1, 16.7050, 74.2433),

('Sahyadri Hospital Kolhapur',
 'Kolhapur',
 'E Ward, Kolhapur, Maharashtra 416003',
 '0231-2521000', 'sahyadri@kolhapur.com',
 4.2, 2500,
 'General,Cardiology,Orthopedics,Neurology',
 1, 16.7060, 74.2440);


-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────
SELECT city, COUNT(*) AS hospital_count
FROM   hospitals
GROUP  BY city
ORDER  BY city;