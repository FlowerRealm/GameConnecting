// backend/migrate-pg-config.js
require('dotenv').config({ path: '.env.development' }); // Or your relevant .env file

module.exports = {
  databaseUrl: process.env.LOCAL_DB_URL, // e.g., postgresql://gameconnecting:YOUR_PASSWORD@localhost:5432/gameconnecting
  // OR individual parameters (node-pg-migrate prefers databaseUrl if present)
  // host: process.env.LOCAL_DB_HOST || 'localhost',
  // port: parseInt(process.env.LOCAL_DB_PORT) || 5432,
  // database: process.env.LOCAL_DB_NAME || 'gameconnecting',
  // user: process.env.LOCAL_DB_USER || 'gameconnecting', // This should be the user that owns the tables/schema
  // password: process.env.LOCAL_DB_PASSWORD, // Password for LOCAL_DB_USER

  // User for creating/dropping database (if needed by specific migration operations, usually not for schema changes)
  // Used by node-pg-migrate for actions like create/drop database if you use those specific commands.
  // For schema migrations (up/down), the 'user' above is used.
  // adminUser: process.env.LOCAL_DB_ADMIN_USER || 'postgres',
  // adminPassword: process.env.LOCAL_DB_ADMIN_PASSWORD,

  migrationsTable: 'pgmigrations', // Table to store migration history
  dir: 'migrations',               // Directory for migration files
  direction: 'up',                 // Default direction
  count: Infinity,                 // How many migrations to run by default (all)
  checkOrder: true,                // Check order of migrations
};
