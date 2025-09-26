import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupOldPayments() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  try {
    const result = await prisma.payment.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: oneHourAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old pending payments.`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up old payments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// For running manually or in a script
if (require.main === module) {
  cleanupOldPayments().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
