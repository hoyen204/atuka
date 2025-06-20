import { PrismaClient } from '@prisma/client';
import { createPrismaMonitor } from './prisma-monitor';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaWithMonitoring> | undefined;
};

function createPrismaWithMonitoring() {
  const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Remove 'query' to avoid duplicate logs
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Only add monitoring in development
  if (process.env.NODE_ENV === 'development') {
    return basePrisma.$extends(createPrismaMonitor());
  }
  
  return basePrisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaWithMonitoring();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnect failed:', error);
  }
}

export default prisma; 