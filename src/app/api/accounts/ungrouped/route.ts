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

    const whereClause: any = {
      creatorId: session.user.zalo_id,
      isLogout: false,
      accountGroups: {
        none: {}
      }
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { clanName: { contains: search } }
      ];
      if (!isNaN(parseInt(search))) {
        whereClause.OR.push({ id: { equals: parseInt(search) } });
      }
    }

    const total = await prisma.account.count({ where: whereClause });

    const accounts = await prisma.account.findMany({
      where: whereClause,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        name: true,
        cultivation: true,
        gem: true,
        fairyGem: true,
        coin: true,
        lockCoin: true,
        clanName: true,
        clanRole: true,
        toggle: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      accounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching ungrouped accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch ungrouped accounts' }, { status: 500 });
  }
}
