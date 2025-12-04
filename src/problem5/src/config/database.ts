import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
