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
    const clans = await prisma.account.findMany({
      where: {
        creatorId: session.user.zalo_id,
        clanId: {
          not: null
        },
        clanName: {
          not: null
        }
      },
      select: {
        clanId: true,
        clanName: true
      },
      distinct: ['clanId']
    });

    const uniqueClans = clans
      .filter(clan => clan.clanId && clan.clanName)
      .map(clan => ({
        clanId: clan.clanId!,
        clanName: clan.clanName!
      }))
      .sort((a, b) => a.clanName.localeCompare(b.clanName));

    return NextResponse.json({ clans: uniqueClans });
  } catch (error) {
    console.error('Error fetching clans:', error);
    return NextResponse.json({ error: 'Failed to fetch clans' }, { status: 500 });
  }
} 