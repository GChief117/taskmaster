import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:password@db:5432/taskmaster";

// Create the database connection pool
export const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Test the connection with retries
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(retries = MAX_RETRIES) {
  while (retries > 0) {
    try {
      await pool.query("SELECT 1"); // Test query
      console.log("✅ PostgreSQL Connected Successfully!");
      return;
    } catch (error) {
      console.error(`❌ PostgreSQL Connection Failed. Retries left: ${retries}`, error);
      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("❌ Could not connect to PostgreSQL after multiple attempts.");
}

// Immediately attempt to connect when the app starts
connectWithRetry();
