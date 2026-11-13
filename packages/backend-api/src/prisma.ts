import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl.startsWith('file:')) {
  throw new Error(
    '[Single-DB Policy] SQLite (file:...) is disabled. Use remote Supabase PostgreSQL via SupabaseDb or a PostgreSQL DATABASE_URL.'
  );
}

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
