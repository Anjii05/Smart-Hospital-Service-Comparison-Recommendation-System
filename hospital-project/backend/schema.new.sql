CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS treatments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS hospitals;

CREATE TABLE hospitals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  rating FLOAT DEFAULT 0,
  cost INT DEFAULT 0,
  description TEXT
);

CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  availability VARCHAR(50) DEFAULT 'Available',
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE treatments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  cost INT NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE facilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  patient_name VARCHAR(255),
  rating FLOAT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

INSERT INTO hospitals (name, city, latitude, longitude, rating, cost, description) VALUES
('SSIMS Hospital', 'Davangere', 14.4644, 75.9210, 4.5, 20000, 'Multi-speciality hospital with ICU'),
('Bapuji Hospital', 'Davangere', 14.4661, 75.9235, 4.2, 15000, 'Affordable healthcare services'),
('Apollo Hospital', 'Bangalore', 12.9716, 77.5946, 4.7, 50000, 'Top-rated advanced hospital'),
('Manipal Hospital', 'Bangalore', 12.9352, 77.6245, 4.6, 45000, 'Premium healthcare services');

INSERT INTO doctors (hospital_id, name, specialization, availability) VALUES
(1, 'Dr. Ramesh', 'Cardiologist', 'Available'),
(1, 'Dr. Priya', 'Neurologist', 'Busy'),
(2, 'Dr. Suresh', 'Orthopedic', 'Available'),
(3, 'Dr. Mehta', 'Cardiologist', 'Available'),
(4, 'Dr. Sharma', 'General Physician', 'Available');

INSERT INTO treatments (hospital_id, name, cost) VALUES
(1, 'MRI Scan', 5000),
(1, 'Heart Surgery', 20000),
(2, 'X-Ray', 1000),
(3, 'Cancer Treatment', 50000),
(4, 'General Checkup', 2000);

INSERT INTO facilities (hospital_id, name) VALUES
(1, 'ICU'),
(1, 'Cardiac Unit'),
(1, '24x7 Pharmacy'),
(2, 'Emergency Ward'),
(2, 'X-Ray Unit'),
(2, 'Pharmacy'),
(3, 'Advanced Oncology Wing'),
(3, 'ICU'),
(3, 'Laboratory'),
(4, 'Executive Ward'),
(4, 'Diagnostics Lab'),
(4, 'Ambulance');

INSERT INTO reviews (hospital_id, patient_name, rating, comment) VALUES
(1, 'Anita', 4.5, 'Good service'),
(2, 'Mahesh', 4.0, 'Affordable and decent'),
(3, 'Sonia', 5.0, 'Excellent facilities'),
(4, 'Rahul', 4.6, 'Highly recommended');
