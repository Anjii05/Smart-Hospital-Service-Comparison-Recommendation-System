require('dotenv').config();

const mysql = require('mysql2/promise');

function parseMysqlUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== 'mysql:' && url.protocol !== 'mariadb:') {
      return null;
    }

    const database = url.pathname ? url.pathname.replace(/^\//, '') : '';

    return {
      host: url.hostname || 'localhost',
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username || 'root'),
      password: decodeURIComponent(url.password || ''),
      database: database || 'hospital_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+05:30',
      multipleStatements: true,
    };
  } catch (error) {
    return null;
  }
}

function buildPoolConfig() {
  const urlConfig = parseMysqlUrl(
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.CLEARDB_DATABASE_URL
  );

  if (urlConfig) {
    return urlConfig;
  }

  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'Anjali123',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'hospital_db',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30',
    multipleStatements: true,
  };
}

const pool = mysql.createPool(buildPoolConfig());

async function testConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');
    console.log('✅ MySQL connected successfully');
  } finally {
    connection.release();
  }
}

module.exports = pool;
module.exports.pool = pool;
module.exports.testConnection = testConnection;
