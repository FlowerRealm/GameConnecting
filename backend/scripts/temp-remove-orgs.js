import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env.development') });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const queries = [
  `DROP FUNCTION IF EXISTS get_users_with_details(p_page INTEGER, p_limit INTEGER);`
];

async function executeQueries() {
  await client.connect();
  try {
    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
      console.log('Success.');
    }
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await client.end();
  }
}

executeQueries();