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

    const favorites = await prisma.userFavoriteMine.findMany({
      where: { userId },
      include: {
        mine: {
          select: {
            id: true,
            name: true,
            type: true,
            isPeaceful: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const favoriteMines = favorites.map(fav => ({
      id: fav.mine.id,
      name: fav.mine.name,
      type: fav.mine.type,
      isPeaceful: fav.mine.isPeaceful,
      favoritedAt: fav.createdAt
    }));

    return NextResponse.json({ favorites: favoriteMines });
  } catch (error) {
    console.error('Error fetching favorite mines:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite mines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mineId } = await request.json();

    if (!mineId || typeof mineId !== 'number') {
      return NextResponse.json({ error: 'Invalid mine ID' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if mine exists
    const mine = await prisma.mine.findUnique({
      where: { id: mineId }
    });

    if (!mine) {
      return NextResponse.json({ error: 'Mine not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.userFavoriteMine.findUnique({
      where: {
        userId_mineId: {
          userId,
          mineId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Mine already favorited' }, { status: 409 });
    }

    // Create favorite
    const favorite = await prisma.userFavoriteMine.create({
      data: {
        userId,
        mineId
      },
      include: {
        mine: {
          select: {
            id: true,
            name: true,
            type: true,
            isPeaceful: true
          }
        }
      }
    });

    return NextResponse.json({
      favorite: {
        id: favorite.mine.id,
        name: favorite.mine.name,
        type: favorite.mine.type,
        isPeaceful: favorite.mine.isPeaceful,
        favoritedAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding favorite mine:', error);
    return NextResponse.json({ error: 'Failed to add favorite mine' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mineId = searchParams.get('mineId');

    if (!mineId || isNaN(Number(mineId))) {
      return NextResponse.json({ error: 'Invalid mine ID' }, { status: 400 });
    }

    const userId = session.user.id;
    const mineIdNum = Number(mineId);

    // Check if favorite exists
    const existingFavorite = await prisma.userFavoriteMine.findUnique({
      where: {
        userId_mineId: {
          userId,
          mineId: mineIdNum
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Delete favorite
    await prisma.userFavoriteMine.delete({
      where: {
        userId_mineId: {
          userId,
          mineId: mineIdNum
        }
      }
    });

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite mine:', error);
    return NextResponse.json({ error: 'Failed to remove favorite mine' }, { status: 500 });
  }
}