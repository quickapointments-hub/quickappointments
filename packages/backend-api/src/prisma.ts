import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.startsWith('file:') || !databaseUrl) {
  console.warn(
    '[Quick Appointments Single-DB Policy] Direct Prisma PostgreSQL DATABASE_URL is not set or points to SQLite. Authoritative persistence uses remote Supabase PostgreSQL via SupabaseDb.'
  );
}

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
