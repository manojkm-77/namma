// =============================================================================
// @namma/db — single Prisma client + typed re-exports.
// Importing this file gives app code a process-wide singleton.
// =============================================================================
import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { Prisma };
export * from '@prisma/client';
export * from './spatial';
export * from './seed';
