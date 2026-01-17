import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL! })),
    // log: ["query", "error", "warn"], // optional
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
