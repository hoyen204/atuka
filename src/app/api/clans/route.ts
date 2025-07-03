import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { withDBMonitoring } from '@/lib/db-monitor';

async function getClanHandler(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  try {
    const startTime = Date.now();
    const skip = (page - 1) * pageSize;
    
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { leader: { contains: search } }
          ]
        }
      : {};

    // Get clans and total count
    const [clans, total] = await Promise.all([
      prisma.clan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order }
      }),
      prisma.clan.count({ where })
    ]);

    // If no clans, return early
    if (clans.length === 0) {
      return NextResponse.json({
        clans: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    }

    // Get clan IDs for the active members query
    const clanIds = clans.map(clan => clan.id.toString());
    
    // Query active members count for all clans in one go
    const activeMembersData = await prisma.account.groupBy({
      by: ['clanId'],
      where: {
        toggle: true,
        clanId: {
          in: clanIds
        }
      },
      _count: {
        id: true
      }
    });

    // Create a lookup map for O(1) access
    const activeMembersMap = activeMembersData.reduce((acc: Record<string, number>, item: { clanId: string; _count: { id: number } }) => {
      acc[item.clanId || ''] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Enrich clans with active members count
    const enrichedClans = clans.map(clan => ({
      ...clan,
      activeMembers: activeMembersMap[clan.id.toString()] || 0
    }));

    const endTime = Date.now();
    console.log(`✅ Clans API optimized: ${endTime - startTime}ms for ${clans.length} clans (was N+1, now 3 queries)`);

    return NextResponse.json({
      clans: enrichedClans,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching clans:', error);
    return NextResponse.json({ error: 'Failed to fetch clans' }, { status: 500 });
  }
}

export const GET = withDBMonitoring(getClanHandler, 'GET /api/clans'); 