import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || '';

  try {
    const skip = (page - 1) * pageSize;
    
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { leader: { contains: search } }
          ]
        }
      : {};

    const [clans, total] = await Promise.all([
      prisma.clan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' }
      }),
      prisma.clan.count({ where })
    ]);

    const enrichedClans = await Promise.all(
      clans.map(async (clan) => {
        const activeMembers = await prisma.account.count({
          where: {
            clanId: clan.id.toString(),
            toggle: true
          }
        });

        return {
          ...clan,
          activeMembers
        };
      })
    );

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