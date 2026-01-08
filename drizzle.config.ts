import { defineConfig } from "drizzle-kit";

// DATABASE_URL is optional - if not provided, using mock data instead
const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost/placeholder";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
