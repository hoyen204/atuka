import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'totalScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get clan members (assuming we have a way to determine clan)
    const accounts = await prisma.account.findMany({
      where: {
        ...whereClause,
        ...(role && { clanRole: role })
      },
      select: {
        id: true,
        name: true,
        clanRole: true,
        cultivation: true,
        gem: true,
        fairyGem: true,
        coin: true,
        clanId: true,
        clanName: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        creator: {
          select: {
            name: true,
            zaloId: true
          }
        },
        dailyActivities: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          },
          select: {
            progress: true,
            totalCultivation: true,
            totalGem: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        [sortBy === 'weeklyPoints' ? 'cultivation' : 
         sortBy === 'totalScore' ? 'cultivation' : 
         sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip,
      take: limit
    });

    // Calculate weekly stats for each member
    const membersWithStats = accounts.map((account, index) => {
      const weeklyActivities = account.dailyActivities || [];
      const weeklyPoints = weeklyActivities.reduce((sum, activity) => 
        sum + (activity.progress || 0), 0);
      const weeklyTreasury = weeklyActivities.reduce((sum, activity) => 
        sum + (activity.totalGem || 0), 0);

      return {
        id: account.id.toString(),
        rank: skip + index + 1,
        name: account.name,
        role: account.clanRole || 'Ngoại Môn',
        avatarUrl: `/api/avatar/${account.creatorId}`,
        weeklyPoints,
        weeklyTreasury,
        totalScore: account.cultivation || 0,
        isOnline: Math.random() > 0.5, // Mock online status
        lastActivity: new Date(account.updatedAt).toLocaleString('vi-VN'),
        joinDate: new Date(account.createdAt).toLocaleDateString('vi-VN'),
        cultivation: account.cultivation,
        gem: account.gem,
        fairyGem: account.fairyGem,
        coin: account.coin,
        creatorName: account.creator.name
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.account.count({
      where: whereClause
    });

    return NextResponse.json({
      members: membersWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching clan members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, memberId, data } = body;

    switch (action) {
      case 'promote':
        await prisma.account.update({
          where: { id: parseInt(memberId) },
          data: { clanRole: data.newRole }
        });
        break;

      case 'kick':
        await prisma.account.update({
          where: { id: parseInt(memberId) },
          data: { 
            clanId: null,
            clanName: null,
            clanRole: null
          }
        });
        break;

      case 'updateRole':
        await prisma.account.update({
          where: { id: parseInt(memberId) },
          data: { clanRole: data.role }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error managing clan member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 