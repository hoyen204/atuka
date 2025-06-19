import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mines = await prisma.mine.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isPeaceful: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ mines });
  } catch (error) {
    console.error('Error fetching mines:', error);
    return NextResponse.json({ error: 'Failed to fetch mines' }, { status: 500 });
  }
} 