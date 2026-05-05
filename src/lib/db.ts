import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

/** pg v8 maps prefer/require/verify-ca to verify-full; pin to silence the startup warning. */
function databaseUrlForPg(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    const mode = u.searchParams.get("sslmode");
    if (
      mode &&
      (mode === "prefer" || mode === "require" || mode === "verify-ca")
    ) {
      u.searchParams.set("sslmode", "verify-full");
    }
    return u.toString();
  } catch {
    return connectionString;
  }
}

function getOrCreatePool(): pg.Pool {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const connectionString = databaseUrlForPg(rawUrl);
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({ connectionString, max: 10 });
  }
  return globalForPrisma.pool;
}

export function getPgPool(): pg.Pool {
  return getOrCreatePool();
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const adapter = new PrismaPg(getOrCreatePool());
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = prisma;
  return prisma;
}
