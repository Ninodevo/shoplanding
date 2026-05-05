import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon poolers (`-pooler` host) often time out on Prisma's migration advisory lock
    // (P1002). Set PRISMA_MIGRATE_DATABASE_URL to Neon's direct (non-pooler) URL for
    // `migrate deploy` / `migrate dev` only; keep DATABASE_URL pooled for the app.
    url:
      process.env["PRISMA_MIGRATE_DATABASE_URL"]?.trim() ||
      process.env["DATABASE_URL"],
  },
});
