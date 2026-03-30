# 🏥 Smart Hospital Service Comparison & Recommendation System

A full-stack web application to help patients find, compare, and get recommendations for hospitals based on their needs.

---

## 📁 Project Structure

```
hospital-app/
├── backend/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── schema.sql         # DB tables + seed data
│   ├── routes/
│   │   ├── hospitals.js       # Hospital CRUD & compare APIs
│   │   └── recommendations.js # Smart recommendation algorithm
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── HospitalCard.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Hospitals.jsx       # Search & filter
    │   │   ├── HospitalDetail.jsx  # Full detail + reviews
    │   │   ├── Compare.jsx         # Side-by-side comparison
    │   │   └── Recommend.jsx       # Smart recommendations
    │   ├── services/
    │   │   └── api.js             # Axios API calls
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## ⚙️ Prerequisites

- Node.js v16+
- MySQL 8.0+
- npm or yarn

---

## 🚀 Setup & Run

### 1. Database Setup

Open MySQL and run:

```sql
source /path/to/backend/config/schema.sql
```

Or paste the contents of `schema.sql` into MySQL Workbench / phpMyAdmin.

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hospital_db
PORT=5000
```

Start the backend:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

Backend runs at: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/hospitals`              | Get all hospitals (with filters)   |
| GET    | `/api/hospitals/:id`          | Get hospital details by ID         |
| POST   | `/api/hospitals/compare`      | Compare multiple hospitals         |
| POST   | `/api/hospitals/:id/reviews`  | Add a patient review               |
| POST   | `/api/recommendations`        | Get smart recommendations          |

### Filter Parameters for `GET /api/hospitals`

| Param        | Type    | Example         |
|--------------|---------|-----------------|
| `city`       | string  | `Bangalore`     |
| `min_rating` | number  | `4`             |
| `max_cost`   | number  | `50000`         |
| `treatment`  | string  | `MRI`           |
| `emergency`  | boolean | `true`          |

### Recommendation Body (`POST /api/recommendations`)

```json
{
  "treatment": "MRI Scan",
  "max_budget": 100000,
  "location": "Bangalore",
  "priority": "balanced"
}
```

`priority` options: `balanced` | `rating` | `cost` | `distance`

---

## 🧠 Recommendation Algorithm

Each hospital is scored out of 100 based on:

| Factor         | Max Points | Weight (balanced) |
|----------------|------------|-------------------|
| Rating         | 40 pts     | 40%               |
| Cost (inverse) | 30 pts     | 30%               |
| Distance       | 20 pts     | 20%               |
| Available Doctors | 10 pts  | 10%               |

When a priority is selected, the corresponding factor is weighted 2×.

---

## 🛠️ Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React 18, React Router  |
| Styling   | Custom CSS (no UI lib)  |
| Backend   | Node.js, Express.js     |
| Database  | MySQL 8                 |
| HTTP      | Axios                   |

---

## ✨ Features

- 🔍 **Search & Filter** hospitals by city, rating, budget, treatment, emergency
- ⚖️ **Side-by-side Comparison** of up to 3 hospitals
- 🤖 **Smart Recommendations** with a weighted scoring algorithm
- 👨‍⚕️ **Doctor Availability** tracking per hospital
- 💊 **Services & Pricing** listed per hospital
- 🏢 **Facilities** overview
- ⭐ **Patient Reviews** — read and submit
- 📱 Responsive layout

---

## 🗄️ Database Schema

```
hospitals       → id, name, location, city, rating, distance_km, phone, email, emergency_available
doctors         → id, hospital_id, name, specialization, experience_years, available
services        → id, hospital_id, service_name, cost, category
facilities      → id, hospital_id, facility_name
reviews         → id, hospital_id, patient_name, rating, comment, created_at
```
