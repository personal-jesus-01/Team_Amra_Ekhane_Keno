import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// For hosted providers like Neon, SSL rejectUnauthorized may need to be false
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } as any,
});

export default pool;
