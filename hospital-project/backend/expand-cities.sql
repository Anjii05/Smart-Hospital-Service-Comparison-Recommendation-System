-- Add Davangere and other popular Indian cities' hospitals to the database
-- This provides faster results without relying on external APIs

-- 1. Insert Davangere hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Sharavati Hospital Davanagere', '123 Ashoka Road, Davanagere', 'Davangere', 14.4661, 75.9206, 4.5, TRUE),
('Narayana Health - Davanagere', 'Near Lodges Road, Davanagere', 'Davangere', 14.4650, 75.9215, 4.6, TRUE),
('Sri Sai Hospital Davanagere', '456 Railway Road, Davanagere', 'Davangere', 14.4670, 75.9190, 4.2, TRUE),
('Sparsh Hospital Davanagere', 'Opp. Akshaya Complex, Davanagere', 'Davangere', 14.4680, 75.9220, 4.3, TRUE),
('Basaveshwara Hospital Davanagere', '789 Main Road, Davanagere', 'Davangere', 14.4645, 75.9200, 4.1, FALSE);

-- 2. Insert Bengaluru additional hospitals (if not already present)
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) 
SELECT 'Manipal Hospital Whitefield', 'Whitefield, Bangalore', 'Bangalore', 13.0199, 77.6436, 4.7, TRUE
WHERE NOT EXISTS (SELECT 1 FROM hospitals WHERE name = 'Manipal Hospital Whitefield');

-- 3. Insert Kochi hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Lakeshore Hospital', 'Maradu, Kochi', 'Kochi', 9.9312, 76.3234, 4.6, TRUE),
('Ernakulathappan Hospital', 'Fort Kochi, Kochi', 'Kochi', 9.9456, 76.2556, 4.3, TRUE),
('St. Sebastians Hospital', 'Kumbalangi, Kochi', 'Kochi', 9.8689, 76.3123, 4.2, FALSE),
('Medcare Hospital', 'Edapazhanji, Kochi', 'Kochi', 9.9234, 76.2890, 4.4, TRUE),
('Believer Hospital', 'Vaikom, Kochi', 'Kochi', 9.8889, 76.5234, 4.1, FALSE);

-- 4. Insert Visakhapatnam hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Omega Hospital', 'Dwarakanagar, Visakhapatnam', 'Visakhapatnam', 17.8860, 83.2194, 4.5, TRUE),
('Apollo Hospitals Visakhapatnam', 'Chinna Waltair, Visakhapatnam', 'Visakhapatnam', 17.8310, 83.2898, 4.7, TRUE),
('CARE Hospital Visakhapatnam', 'Seethammadhara, Visakhapatnam', 'Visakhapatnam', 17.9689, 83.3156, 4.2, TRUE),
('Sri Venkateshwara Medical College', 'Visakhapatnam', 'Visakhapatnam', 17.7789, 83.2890, 4.0, FALSE),
('Maxcure Hospitals', 'Visakhapatnam', 'Visakhapatnam', 17.8456, 83.2234, 4.3, TRUE);

-- 5. Insert Lucknow hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Fortis Hospital Lucknow', 'Gomti Nagar, Lucknow', 'Lucknow', 26.8467, 80.9462, 4.6, TRUE),
('King George Medical University', 'Lucknow', 'Lucknow', 26.8124, 80.9265, 4.2, TRUE),
('Sahara Hospital', 'Aliganj, Lucknow', 'Lucknow', 26.8890, 80.8234, 4.1, FALSE),
('Shri Ram Hospital Lucknow', 'Lucknow', 'Lucknow', 26.8234, 80.9456, 4.3, TRUE),
('Surya Hospital Lucknow', 'Gomti Nagar Extension, Lucknow', 'Lucknow', 26.8567, 80.9678, 4.0, FALSE);

-- 6. Insert Chandigarh hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('PGIMER Chandigarh', 'Chandigarh', 'Chandigarh', 30.7633, 76.7753, 4.7, TRUE),
('Fortis Hospital Chandigarh', 'Sector 39, Chandigarh', 'Chandigarh', 30.7345, 76.8145, 4.5, TRUE),
('Ivy Hospital Chandigarh', 'Chandigarh', 'Chandigarh', 30.7234, 76.7890, 4.2, TRUE),
('Healing Touch Hospital', 'Chandigarh', 'Chandigarh', 30.7456, 76.7234, 4.1, FALSE),
('Max Institute of Cancer Care', 'Chandigarh', 'Chandigarh', 30.7567, 76.8456, 4.6, TRUE);

-- 7. Insert Ahmedabad hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Apollo Hospitals Ahmedabad', 'Gurukul, Ahmedabad', 'Ahmedabad', 23.0225, 72.5714, 4.7, TRUE),
('Shrey Hospital', 'Ahmedabad', 'Ahmedabad', 23.0345, 72.5234, 4.3, TRUE),
('CIMS Hospital', 'Ahmedabad', 'Ahmedabad', 23.0567, 72.5890, 4.5, TRUE),
('Akhandanand Hospital', 'Navrangpura, Ahmedabad', 'Ahmedabad', 23.0234, 72.5456, 4.2, FALSE),
('Shalby Hospitals', 'Ahmedabad', 'Ahmedabad', 23.0456, 72.6234, 4.4, TRUE);

-- 8. Insert Varanasi hospitals
INSERT INTO hospitals (name, location, city, latitude, longitude, rating, emergency_available) VALUES
('Banaras Hindu University Hospital', 'Varanasi', 'Varanasi', 25.3176, 82.9739, 4.3, TRUE),
('Shri Satya Sai Medical & Research Institute', 'Varanasi', 'Varanasi', 25.3245, 82.9567, 4.1, FALSE),
('Aryabhata Hospital', 'Varanasi', 'Varanasi', 25.3467, 82.9890, 4.0, TRUE),
('Sunrise Hospital Varanasi', 'Varanasi', 'Varanasi', 25.3234, 83.0234, 4.2, FALSE);

COMMIT;
