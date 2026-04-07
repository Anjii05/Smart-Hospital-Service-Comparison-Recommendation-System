-- ============================================================
-- UNIFIED Hospital Database Schema - Smart Hospital System
-- ============================================================
-- Run: mysql -u root -p < schema-unified.sql

DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- ────────────────────────────────────────────────────────────
-- 1. HOSPITALS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE hospitals (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL UNIQUE,
  city                VARCHAR(100) NOT NULL,
  state               VARCHAR(100),
  address             TEXT,
  phone               VARCHAR(20),
  email               VARCHAR(100),
  
  -- Ratings & Reviews
  rating              DECIMAL(2,1) DEFAULT 0.0 COMMENT 'Average rating 0-5',
  total_reviews       INT DEFAULT 0,
  
  -- Location & Distance
  latitude            DECIMAL(10,8),
  longitude           DECIMAL(11,8),
  distance_km         DECIMAL(5,2),
  
  -- Services & Facilities
  treatments          TEXT COMMENT 'Comma-separated: Cardiology,Neurology,etc',
  emergency_available BOOLEAN DEFAULT FALSE,
  image_url           VARCHAR(500),
  description         TEXT,
  
  -- Timestamps
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_city (city),
  INDEX idx_rating (rating),
  INDEX idx_coordinates (latitude, longitude)
);

-- ────────────────────────────────────────────────────────────
-- 2. DOCTORS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE doctors (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id         INT NOT NULL,
  name                VARCHAR(150) NOT NULL,
  specialization      VARCHAR(100) NOT NULL,
  experience_years    INT,
  available           BOOLEAN DEFAULT TRUE,
  phone               VARCHAR(20),
  email               VARCHAR(100),
  
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital (hospital_id),
  INDEX idx_specialization (specialization)
);

-- ────────────────────────────────────────────────────────────
-- 3. SERVICES TABLE (Treatment Costs)
-- ────────────────────────────────────────────────────────────
CREATE TABLE services (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id         INT NOT NULL,
  service_name        VARCHAR(150) NOT NULL,
  cost                DECIMAL(10,2) NOT NULL,
  category            VARCHAR(100),
  description         TEXT,
  
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital (hospital_id),
  INDEX idx_cost (cost)
);

-- ────────────────────────────────────────────────────────────
-- 4. FACILITIES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE facilities (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id         INT NOT NULL,
  facility_name       VARCHAR(150) NOT NULL,
  
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital (hospital_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. REVIEWS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id         INT NOT NULL,
  patient_name        VARCHAR(100),
  rating              INT CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT,
  
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  INDEX idx_hospital (hospital_id),
  INDEX idx_created_at (created_at)
);

-- ────────────────────────────────────────────────────────────
-- 6. API KEYS TABLE (Authentication)
-- ────────────────────────────────────────────────────────────
CREATE TABLE api_keys (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  api_key             VARCHAR(255) UNIQUE NOT NULL,
  app_name            VARCHAR(100) NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          VARCHAR(100),
  
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key)
);

-- ============================================================
-- SEED DATA: Hospitals Across Major Indian Cities
-- ============================================================

-- BANGALORE (7 hospitals)
INSERT INTO hospitals 
  (name, city, state, address, phone, email, rating, latitude, longitude, treatments, emergency_available, image_url, description)
VALUES
  ('Apollo Hospitals Bangalore', 'Bangalore', 'Karnataka', 'Bannerghatta Road, Bangalore', '+91-80-26304050', 'apollo@example.com', 4.8, 12.9352, 77.6245, 'Cardiology,Neurology,Orthopedics,Oncology,Pediatrics', 1, 'https://via.placeholder.com/300x200?text=Apollo+Bangalore', 'Leading multi-specialty hospital with world-class healthcare'),
  ('Manipal Hospital Bangalore', 'Bangalore', 'Karnataka', 'Old Airport Road, Bangalore', '+91-80-25024444', 'manipal@example.com', 4.6, 13.0011, 77.5821, 'Cardiology,Orthopedics,Neurology,Gastroenterology', 1, 'https://via.placeholder.com/300x200?text=Manipal+Bangalore', 'Leading healthcare group with advanced treatments'),
  ('Fortis Hospital Bangalore', 'Bangalore', 'Karnataka', 'Cunningham Road, Bangalore', '+91-80-66214444', 'fortis@example.com', 4.5, 13.0046, 77.5916, 'Cardiology,Orthopedics,Gynecology,Dermatology', 1, 'https://via.placeholder.com/300x200?text=Fortis+Bangalore', 'Premium healthcare with state-of-the-art technology'),
  ('Narayana Health Bangalore', 'Bangalore', 'Karnataka', 'Bommasandra, Bangalore', '+91-80-71222222', 'narayana@example.com', 4.7, 12.7589, 77.5982, 'Cardiology,Cardiac Surgery,Orthopedics', 1, 'https://via.placeholder.com/300x200?text=Narayana+Bangalore', 'Affordable high-quality cardiac and multi-specialty care'),
  ('Sakra World Hospital', 'Bangalore', 'Karnataka', 'Devarabeesanahalli, Bangalore', '+91-80-49694969', 'sakra@example.com', 4.4, 12.9789, 77.7123, 'Cardiology,Oncology,Pediatrics,ENT', 1, 'https://via.placeholder.com/300x200?text=Sakra+Bangalore', 'Modern hospital with Japanese standards of care'),
  ('BGS Gleneagles Hospital', 'Bangalore', 'Karnataka', 'Kengeri, Bangalore', '+91-80-26730000', 'bgs@example.com', 4.3, 12.8456, 77.4567, 'Organ Transplant,Cardiology,Orthopedics', 1, 'https://via.placeholder.com/300x200?text=BGS+Bangalore', 'Renowned for organ transplants and multi-specialty care'),
  ('Aster CMI Hospital', 'Bangalore', 'Karnataka', 'Whitefield, Bangalore', '+91-80-40305050', 'aster@example.com', 4.6, 12.9698, 77.7499, 'Cardiology,Neurology,Orthopedics,Oncology', 1, 'https://via.placeholder.com/300x200?text=Aster+Bangalore', 'Integrated healthcare with advanced diagnostic facilities'),

-- DELHI (4 hospitals)
  ('Max Healthcare Delhi', 'Delhi', 'Delhi', 'Saket, Delhi', '+91-11-43551111', 'max@example.com', 4.7, 28.5244, 77.1855, 'Cardiology,Oncology,Neurology,Orthopedics', 1, 'https://via.placeholder.com/300x200?text=Max+Delhi', 'Top-tier multi-specialty with advanced diagnostics'),
  ('AIIMS Delhi', 'Delhi', 'Delhi', 'Ansari Nagar, Delhi', '+91-11-26588500', 'aiims@example.com', 4.6, 28.5694, 77.2069, 'Cardiology,Neurology,Orthopedics,General', 1, 'https://via.placeholder.com/300x200?text=AIIMS+Delhi', 'Premier government medical institute'),
  ('Apollo Delhi', 'Delhi', 'Delhi', 'Sarita Vihar, Delhi', '+91-11-43331111', 'apollo.delhi@example.com', 4.8, 28.5555, 77.2455, 'Cardiology,Oncology,Pediatrics,Gynecology', 1, 'https://via.placeholder.com/300x200?text=Apollo+Delhi', 'World-class facility with latest technology'),
  ('Indraprastha Apollo', 'Delhi', 'Delhi', 'New Delhi, Delhi', '+91-11-29871234', 'indraprastha@example.com', 4.7, 28.5921, 77.2499, 'Cardiology,Neurology,Orthopedics,ENT', 1, 'https://via.placeholder.com/300x200?text=Indraprastha+Delhi', 'Multi-specialty with comprehensive care services'),

-- MUMBAI (4 hospitals)
  ('Lilavati Hospital', 'Mumbai', 'Maharashtra', 'Bandra, Mumbai', '+91-22-56092000', 'lilavati@example.com', 4.8, 19.0596, 72.8295, 'Cardiology,Oncology,Pediatrics', 1, 'https://via.placeholder.com/300x200?text=Lilavati+Mumbai', 'Premium multi-specialty known for cardiac care'),
  ('Fortis Hospitals Mumbai', 'Mumbai', 'Maharashtra', 'Vashi, Mumbai', '+91-22-33604000', 'fortis.mumbai@example.com', 4.6, 19.0822, 72.9999, 'Cardiology,Orthopedics,Neurology,Oncology', 1, 'https://via.placeholder.com/300x200?text=Fortis+Mumbai', 'State-of-the-art facility with expert doctors'),
  ('Apollo Hospitals Mumbai', 'Mumbai', 'Maharashtra', 'Navi Mumbai', '+91-22-66800000', 'apollo.mumbai@example.com', 4.7, 19.0330, 73.0297, 'Cardiology,Oncology,Pediatrics,General Surgery', 1, 'https://via.placeholder.com/300x200?text=Apollo+Mumbai', 'World-class tertiary care center'),
  ('HCG Hospitals Mumbai', 'Mumbai', 'Maharashtra', 'Powai, Mumbai', '+91-22-40808000', 'hcg@example.com', 4.5, 19.1136, 72.9027, 'Oncology,Cardiology,Orthopedics', 1, 'https://via.placeholder.com/300x200?text=HCG+Mumbai', 'Specialized oncology and multi-specialty'),

-- HYDERABAD (3 hospitals)
  ('Yashoda Hospitals', 'Hyderabad', 'Telangana', 'Hyderabad', '+91-40-66999999', 'yashoda@example.com', 4.7, 17.3850, 78.4867, 'Cardiology,Orthopedics,Neurology', 1, 'https://via.placeholder.com/300x200?text=Yashoda+Hyderabad', 'Multi-specialty with comprehensive services'),
  ('Apollo Hospitals Hyderabad', 'Hyderabad', 'Telangana', 'Jubilee Hills, Hyderabad', '+91-40-40805500', 'apollo.hyderabad@example.com', 4.8, 17.3689, 78.4430, 'Cardiology,Oncology,Pediatrics,Neurology', 1, 'https://via.placeholder.com/300x200?text=Apollo+Hyderabad', 'Leading healthcare provider'),
  ('Care Hospitals Hyderabad', 'Hyderabad', 'Telangana', 'Hyderabad', '+91-40-40229999', 'care@example.com', 4.6, 17.3841, 78.4733, 'Cardiology,Orthopedics,Gynecology', 1, 'https://via.placeholder.com/300x200?text=Care+Hyderabad', 'Multi-specialty with advanced facilities'),

-- PUNE (3 hospitals)
  ('Deenanath Mangeshkar Hospital', 'Pune', 'Maharashtra', 'Pune', '+91-20-66000555', 'deenanath@example.com', 4.6, 18.5204, 73.8567, 'Cardiology,Orthopedics,Neurology', 1, 'https://via.placeholder.com/300x200?text=Deenanath+Pune', 'Multi-specialty with excellent patient care'),
  ('Jehangir Hospital', 'Pune', 'Maharashtra', 'Pune', '+91-20-26054454', 'jehangir@example.com', 4.7, 18.5349, 73.8711, 'Cardiology,Pediatrics,Gynecology,Orthopedics', 1, 'https://via.placeholder.com/300x200?text=Jehangir+Pune', 'Historic hospital with modern facilities'),
  ('Apollo Hospitals Pune', 'Pune', 'Maharashtra', 'Pune', '+91-20-26606666', 'apollo.pune@example.com', 4.7, 18.4800, 73.9000, 'Cardiology,Oncology,Pediatrics,Neurology', 1, 'https://via.placeholder.com/300x200?text=Apollo+Pune', 'Comprehensive healthcare services');

-- ────────────────────────────────────────────────────────────
-- DOCTORS (Sample Data - 2-3 per hospital)
-- ────────────────────────────────────────────────────────────
INSERT INTO doctors 
  (hospital_id, name, specialization, experience_years, available)
VALUES
  (1, 'Dr. Ramesh Kumar', 'Cardiology', 18, 1),
  (1, 'Dr. Priya Sharma', 'Neurology', 12, 1),
  (2, 'Dr. Sunita Rao', 'Cardiology', 20, 1),
  (2, 'Dr. Vikram Singh', 'Orthopedics', 15, 1),
  (3, 'Dr. Meena Patel', 'Gynecology', 14, 1),
  (3, 'Dr. Suresh Iyer', 'Dermatology', 8, 1),
  (4, 'Dr. Kiran Reddy', 'Cardiology', 22, 1),
  (4, 'Dr. Anjali Nair', 'Oncology', 11, 1),
  (5, 'Dr. Rajiv Bose', 'Orthopedics', 16, 1),
  (5, 'Dr. Lakshmi Menon', 'ENT', 9, 1),
  (6, 'Dr. Deepak Verma', 'Cardiology', 13, 1),
  (7, 'Dr. Arjun Singh', 'Cardiology', 20, 1),
  (8, 'Dr. Nisha Gupta', 'Neurology', 15, 1),
  (8, 'Dr. Rajesh Kumar', 'Orthopedics', 17, 1),
  (9, 'Dr. Vikram Patel', 'Cardiology', 19, 1),
  (9, 'Dr. Shruti Sharma', 'Pediatrics', 11, 1),
  (10, 'Dr. Sameer Khan', 'Orthopedics', 14, 1),
  (10, 'Dr. Pooja Singh', 'Gynecology', 13, 1),
  (11, 'Dr. Rohan Desai', 'Cardiology', 21, 1),
  (11, 'Dr. Seema Gupta', 'Oncology', 16, 1),
  (12, 'Dr. Nitin Sharma', 'Cardiology', 12, 1),
  (12, 'Dr. Kavya Patel', 'ENT', 10, 1),
  (13, 'Dr. Adarsh Reddy', 'Orthopedics', 19, 1),
  (13, 'Dr. Sneha Kumar', 'Neurology', 14, 1),
  (14, 'Dr. Sanjay Singh', 'Cardiology', 17, 1),
  (14, 'Dr. Priya Nair', 'Pediatrics', 12, 1),
  (15, 'Dr. Ravi Patel', 'Cardiology', 20, 1),
  (15, 'Dr. Neha Singh', 'Oncology', 15, 1),
  (16, 'Dr. Ajay Gupta', 'Cardiology', 21, 1),
  (16, 'Dr. Divya Sharma', 'Neurology', 13, 1),
  (17, 'Dr. Vikram Kumar', 'Orthopedics', 18, 1),
  (17, 'Dr. Siti Nair', 'Pediatrics', 11, 1),
  (18, 'Dr. Ashok Singh', 'Cardiology', 19, 1),
  (18, 'Dr. Pooja Desai', 'Gynecology', 14, 1),
  (19, 'Dr. Rajesh Rao', 'Cardiology', 20, 1),
  (19, 'Dr. Sneha Patel', 'Oncology', 16, 1);

-- ────────────────────────────────────────────────────────────
-- SERVICES (Treatment Costs)
-- ────────────────────────────────────────────────────────────
INSERT INTO services 
  (hospital_id, service_name, cost, category)
VALUES
  (1, 'General Checkup', 500, 'General'),
  (1, 'Cardiac Surgery', 250000, 'Cardiology'),
  (1, 'MRI Scan', 5000, 'Diagnostics'),
  (1, 'Blood Test', 1000, 'Lab'),
  (2, 'General Checkup', 600, 'General'),
  (2, 'Orthopedic Surgery', 150000, 'Orthopedics'),
  (2, 'CT Scan', 6000, 'Diagnostics'),
  (3, 'General Checkup', 700, 'General'),
  (3, 'Gynecology Consultation', 1500, 'Gynecology'),
  (3, 'Ultrasound', 2500, 'Diagnostics'),
  (4, 'General Checkup', 800, 'General'),
  (4, 'Cardiac Consultation', 2000, 'Cardiology'),
  (4, 'ECG', 1500, 'Diagnostics'),
  (5, 'General Checkup', 900, 'General'),
  (5, 'ENT Consultation', 1800, 'ENT'),
  (5, 'Endoscopy', 8000, 'Procedures'),
  (6, 'General Checkup', 500, 'General'),
  (6, 'Organ Transplant Evaluation', 50000, 'Surgery'),
  (6, 'Pathology Test', 2000, 'Lab'),
  (7, 'General Checkup', 750, 'General'),
  (7, 'Vaccination', 300, 'Preventive'),
  (7, 'X-Ray', 500, 'Diagnostics'),
  (8, 'General Checkup', 600, 'General'),
  (8, 'Cardiology Consultation', 1800, 'Cardiology'),
  (8, 'Stress Test', 5000, 'Diagnostics'),
  (9, 'General Checkup', 500, 'General'),
  (9, 'Neurology Consultation', 2000, 'Neurology'),
  (9, 'EEG', 3000, 'Diagnostics'),
  (10, 'General Checkup', 700, 'General'),
  (10, 'Orthopedic Consultation', 1500, 'Orthopedics'),
  (10, 'X-Ray', 500, 'Diagnostics'),
  (11, 'General Checkup', 800, 'General'),
  (11, 'Oncology Consultation', 2500, 'Oncology'),
  (11, 'Biopsy', 15000, 'Procedures'),
  (12, 'General Checkup', 600, 'General'),
  (12, 'Cardiology Consultation', 1800, 'Cardiology'),
  (12, 'Angiography', 50000, 'Procedures'),
  (13, 'General Checkup', 700, 'General'),
  (13, 'Orthopedic Surgery', 200000, 'Orthopedics'),
  (13, 'CT Scan', 6000, 'Diagnostics'),
  (14, 'General Checkup', 500, 'General'),
  (14, 'Oncology Consultation', 2500, 'Oncology'),
  (14, 'CT Scan', 6000, 'Diagnostics'),
  (15, 'General Checkup', 800, 'General'),
  (15, 'Cardiology Consultation', 1800, 'Cardiology'),
  (15, 'ECG', 1500, 'Diagnostics'),
  (16, 'General Checkup', 700, 'General'),
  (16, 'Oncology Consultation', 2500, 'Oncology'),
  (16, 'MRI Scan', 5000, 'Diagnostics'),
  (17, 'General Checkup', 600, 'General'),
  (17, 'Cardiology Consultation', 1800, 'Cardiology'),
  (17, 'Angiography', 50000, 'Procedures'),
  (18, 'General Checkup', 500, 'General'),
  (18, 'Gynecology Consultation', 1500, 'Gynecology'),
  (18, 'Ultrasound', 2500, 'Diagnostics'),
  (19, 'General Checkup', 700, 'General'),
  (19, 'Cardiology Consultation', 1800, 'Cardiology'),
  (19, 'Stress Test', 5000, 'Diagnostics');

-- ────────────────────────────────────────────────────────────
-- FACILITIES
-- ────────────────────────────────────────────────────────────
INSERT INTO facilities 
  (hospital_id, facility_name)
VALUES
  (1, 'Emergency Department'),
  (1, 'Intensive Care Unit'),
  (1, 'Surgery Theater'),
  (1, 'Pharmacy'),
  (2, 'Emergency Department'),
  (2, 'Intensive Care Unit'),
  (2, 'Laboratory'),
  (3, 'Emergency Department'),
  (3, 'Pediatric Ward'),
  (3, 'Maternity Ward'),
  (4, 'Emergency Department'),
  (4, 'Cardiac ICU'),
  (5, 'Emergency Department'),
  (5, 'Surgery Theater'),
  (6, 'Emergency Department'),
  (6, 'Organ Transplant Unit'),
  (7, 'Emergency Department'),
  (7, 'Intensive Care Unit'),
  (8, 'Emergency Department'),
  (8, 'Cardiac Care Unit'),
  (9, 'Emergency Department'),
  (9, 'Neuro Ward'),
  (10, 'Emergency Department'),
  (10, 'Orthopedic Ward'),
  (11, 'Emergency Department'),
  (11, 'Oncology Ward'),
  (12, 'Emergency Department'),
  (12, 'Cardiac ICU'),
  (13, 'Emergency Department'),
  (13, 'Orthopedic Ward'),
  (14, 'Emergency Department'),
  (14, 'Oncology Ward'),
  (15, 'Emergency Department'),
  (15, 'Cardiac Care Unit'),
  (16, 'Emergency Department'),
  (16, 'Oncology Ward'),
  (17, 'Emergency Department'),
  (17, 'Cardiac ICU'),
  (18, 'Emergency Department'),
  (18, 'Maternity Ward'),
  (19, 'Emergency Department'),
  (19, 'Cardiac Care Unit');

-- ────────────────────────────────────────────────────────────
-- REVIEWS (Sample Reviews)
-- ────────────────────────────────────────────────────────────
INSERT INTO reviews 
  (hospital_id, patient_name, rating, comment)
VALUES
  (1, 'Rajesh Kumar', 5, 'Excellent cardiac care and professional staff'),
  (1, 'Priya Singh', 5, 'Very satisfied with the treatment'),
  (1, 'Amit Patel', 4, 'Good hospital, facilities are great'),
  (2, 'Sunita Rao', 5, 'Best orthopedic surgery experience'),
  (2, 'Vikram Desai', 4, 'Professional doctors and good care'),
  (3, 'Meena Gupta', 4, 'Happy with gynecology care'),
  (4, 'Anil Kumar', 5, 'Excellent cardiac treatment'),
  (5, 'Diwya Singh', 4, 'Good hospital with caring staff'),
  (6, 'Ravi Patel', 5, 'Expert organ transplant team'),
  (7, 'Sneha Nair', 4, 'Very good patient care'),
  (8, 'Arjun Kumar', 5, 'Excellent cardiac facilities'),
  (9, 'Neha Singh', 4, 'Good neurology care'),
  (10, 'Sameer Khan', 4, 'Professional orthopedic surgeons'),
  (11, 'Rohan Desai', 5, 'Best oncology treatment in Delhi'),
  (12, 'Nitin Sharma', 4, 'Good cardiac care facility'),
  (13, 'Adarsh Reddy', 5, 'Excellent orthopedic hospital'),
  (14, 'Sneha Kumar', 4, 'Good oncology care'),
  (15, 'Ravi Patel', 5, 'Best cardiac hospital in Hyderabad'),
  (16, 'Ajay Gupta', 4, 'Professional oncology center'),
  (17, 'Vikram Kumar', 4, 'Good cardiac care'),
  (18, 'Ashok Singh', 5, 'Excellent maternity care'),
  (19, 'Rajesh Rao', 4, 'Good cardiac facilities');

-- ────────────────────────────────────────────────────────────
-- API KEYS (for testing)
-- ────────────────────────────────────────────────────────────
INSERT INTO api_keys 
  (api_key, app_name, created_by)
VALUES
  ('hospital-api-key-prod-2024', 'Hospital Frontend App', 'admin'),
  ('hospital-api-key-dev-2024', 'Mobile App', 'admin'),
  ('hospital-api-key-mobile-2024', 'Admin Dashboard', 'admin');

-- ============================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================
-- SELECT COUNT(*) as hospital_count FROM hospitals;
-- SELECT COUNT(*) as doctor_count FROM doctors;
-- SELECT COUNT(*) as service_count FROM services;
-- SELECT DISTINCT city FROM hospitals ORDER BY city;
-- SELECT * FROM hospitals LIMIT 3;
