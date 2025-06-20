import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const clanId = searchParams.get('clanId') || '';
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      creatorId: session.user.zalo_id,
      isLogout: false
    };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { clanName: { contains: search } },
        { id: { equals: parseInt(search) || 0 } },
      ];
    }

    if (clanId) {
      whereClause.clanId = clanId;
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          cookie: true,
          mineId: true,
          mineTimeRange: true,
          mineType: true,
          availableBuffAmount: true,
          clanId: true,
          clanName: true,
          toggle: true,
          cultivation: true,
          bootleNeckCultivation: true,
          gem: true,
          fairyGem: true,
          coin: true,
          lockCoin: true,
          creatorId: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { id: 'asc' }
      }),
      prisma.account.count({ where: whereClause })
    ]);

    return NextResponse.json({
      accounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
} 