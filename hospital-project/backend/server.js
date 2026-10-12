const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check route (important for testing)
app.get("/", (req, res) => {
  res.send("Hospital API running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Hospital Finder API is running",
    time: new Date(),
  });
});

// ✅ Routes (make sure this file exists)
try {
  const hospitalRoutes = require("./routes/hospitals");
  app.use("/api/hospitals", hospitalRoutes);
} catch (err) {
  console.log("⚠️ Hospital routes not found, skipping...");
}

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ PORT (VERY IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});