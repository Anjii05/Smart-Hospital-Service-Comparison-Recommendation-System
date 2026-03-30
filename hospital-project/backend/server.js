const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

console.log("🚀 Starting server...");

// ✅ MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Anjali123", // 👉 put your MySQL password if you have one
  database: "hospital_service"
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Server working");
});

// ✅ CREATE (Add hospital)
app.post("/add-hospital", (req, res) => {
  const { name, location, contact, description } = req.body;

  const sql = `
    INSERT INTO hospitals (name, location, contact, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, location, contact, description], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error inserting data");
    } else {
      res.send("✅ Hospital added successfully");
    }
  });
});

// ✅ READ (Get all hospitals)
app.get("/hospitals", (req, res) => {
  const sql = "SELECT * FROM hospitals";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error fetching data");
    } else {
      res.json(result);
    }
  });
});

// 🚀 Start server
app.listen(5000, () => {
  console.log("🔥 Server running on port 5000");
});