import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const clanId = searchParams.get('clanId') || '';
    const cursor = searchParams.get('cursor');

    const whereClause: any = {
      creatorId: session.user.zalo_id,
      isLogout: false
    };

    if (search) {
      whereClause.OR = [
        { name: { search } },
        { clanName: { search } }
      ];
      if (!isNaN(parseInt(search))) whereClause.OR.push({ id: { equals: parseInt(search) } });
    }

    if (clanId) whereClause.clanId = clanId;

    const total = await prisma.account.count({ where: whereClause });

    const accounts = await prisma.account.findMany({
      where: whereClause,
      take: pageSize,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      skip: cursor ? 1 : undefined,
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
      },
      orderBy: { id: "asc" },
    });

    const nextCursor = accounts.length === pageSize ? accounts[accounts.length - 1].id : null;

    return NextResponse.json({
      accounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      nextCursor
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}