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
    const userId = session.user.id;

    // Get all mines
    const mines = await prisma.mine.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isPeaceful: true
      },
      orderBy: { name: 'asc' }
    });

    // Get user's favorite mines
    const favorites = await prisma.userFavoriteMine.findMany({
      where: { userId },
      select: { mineId: true }
    });

    const favoriteMineIds = new Set(favorites.map(fav => fav.mineId));

    // Add isFavorited field to each mine
    const minesWithFavorites = mines.map(mine => ({
      ...mine,
      isFavorited: favoriteMineIds.has(mine.id)
    }));

    return NextResponse.json({ mines: minesWithFavorites });
  } catch (error) {
    console.error('Error fetching mines:', error);
    return NextResponse.json({ error: 'Failed to fetch mines' }, { status: 500 });
  }
}