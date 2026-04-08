require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

// ✅ DB connection
const { testConnection } = require('./config/database');
const { ensureSmartSchema } = require('./services/schemaSync');

// ✅ Routes (make sure this file exists)
const hospitalRoutes = require('./routes/hospitals-complete');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ─── SECURITY ─────────────────────────
// app.use(helmet()); // Disabled for local development connectivity issues

// ─── CORS ─────────────────────────
app.use(cors({
  origin: true, // Allow any requester in development
  credentials: true,
}));

// ─── BODY PARSER ─────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── RATE LIMIT ─────────────────────────
// const limiter = rateLimit({ ... });
// app.use('/api/', limiter); // Disabled for local development to avoid 429s

// ─── HEALTH CHECK ─────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Finder API is running',
    time: new Date()
  });
});

// ─── MAIN ROUTES ─────────────────────────
app.use('/api/hospitals', hospitalRoutes);

// ─── CHAT API ─────────────────────────
const { chat } = require('./chatController');
app.post('/api/chat', chat);

// ─── 404 HANDLER ─────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── ERROR HANDLER ─────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ─── START SERVER ─────────────────────────
function handleServerError(error) {
  if (error.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${PORT} is already in use.`);
    console.warn(`   Another backend may already be running at http://localhost:${PORT}`);
    process.exit(0);
  }

  console.error('❌ Server failed to start:', error);
  process.exit(1);
}

async function startServer() {
  try {
    await testConnection();
    
    console.log('⏳ Ensuring database schema is up to date...');
    await ensureSmartSchema();
    console.log('✅ Schema synchronized');

    const server = http.createServer(app);

    server.once('error', handleServerError);

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
      console.log(`🏥 Hospitals API: http://localhost:${PORT}/api/hospitals`);
      console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
