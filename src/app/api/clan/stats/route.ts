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

    // Get clan info from configs or hardcoded for now
    const clanConfigs = await prisma.config.findMany({
      where: {
        key: {
          in: ['clan_name', 'clan_level', 'clan_treasury_current', 'clan_treasury_target']
        }
      }
    });

    const configMap = clanConfigs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Get member count
    const memberCount = await prisma.account.count({
      where: {
        clanId: { not: null }
      }
    });

    // Get weekly activity
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weeklyActivities = await prisma.accountDailyActivity.findMany({
      where: {
        createdAt: {
          gte: weekStart
        }
      },
      include: {
        account: {
          select: {
            clanId: true
          }
        }
      }
    });

    const totalWeeklyPoints = weeklyActivities.reduce((sum, activity) => 
      sum + (activity.progress || 0), 0);

    const totalWeeklyTreasury = weeklyActivities.reduce((sum, activity) => 
      sum + (activity.totalGem || 0), 0);

    // Calculate activity rate
    const activeMembers = new Set(
      weeklyActivities
        .filter(activity => (activity.progress || 0) > 0)
        .map(activity => activity.accountId)
    ).size;

    const activityRate = memberCount > 0 ? (activeMembers / memberCount) * 100 : 0;

    // Get top contributors
    const topContributors = await prisma.account.findMany({
      where: {
        clanId: { not: null }
      },
      select: {
        id: true,
        name: true,
        cultivation: true,
        clanRole: true,
        creatorId: true
      },
      orderBy: {
        cultivation: 'desc'
      },
      take: 10
    });

    // Calculate clan efficiency
    const treasuryCurrent = parseInt(configMap.clan_treasury_current || '0');
    const treasuryTarget = parseInt(configMap.clan_treasury_target || '300000');
    const treasuryProgress = treasuryTarget > 0 ? (treasuryCurrent / treasuryTarget) * 100 : 0;

    const memberUtilization = activityRate / 100;
    const treasuryEfficiency = treasuryProgress / 100;
    const avgContribution = activeMembers > 0 ? totalWeeklyPoints / activeMembers : 0;
    
    const efficiency = (memberUtilization * 0.4) + (treasuryEfficiency * 0.3) + 
                      (Math.min(avgContribution / 1000, 1) * 0.3);

    const efficiencyGrade = efficiency > 0.8 ? 'A' : 
                           efficiency > 0.6 ? 'B' : 
                           efficiency > 0.4 ? 'C' : 'D';

    // Role distribution
    const roleStats = await prisma.account.groupBy({
      by: ['clanRole'],
      where: {
        clanId: { not: null },
        clanRole: { not: null }
      },
      _count: {
        clanRole: true
      }
    });

    const roleDistribution = roleStats.reduce((acc, stat) => {
      acc[stat.clanRole || 'Unknown'] = stat._count.clanRole;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      clanInfo: {
        name: configMap.clan_name || 'VIỄN CỔ MINH TỘC',
        level: parseInt(configMap.clan_level || '4'),
        memberCount,
        memberLimit: 115, // This could be dynamic based on level
        treasury: {
          current: treasuryCurrent,
          target: treasuryTarget,
          progressPercentage: treasuryProgress
        }
      },
      statistics: {
        totalWeeklyPoints,
        totalWeeklyTreasury,
        activityRate,
        activeMembers,
        efficiency: {
          grade: efficiencyGrade,
          percentage: efficiency * 100
        }
      },
      topContributors: topContributors.map(member => ({
        id: member.id,
        name: member.name,
        role: member.clanRole,
        totalScore: member.cultivation,
        avatarUrl: `/api/avatar/${member.creatorId}`
      })),
      roleDistribution,
      analytics: {
        memberUtilization,
        treasuryEfficiency,
        contributionRate: avgContribution,
        recommendations: generateRecommendations(
          activityRate, 
          treasuryProgress, 
          memberCount,
          activeMembers
        )
      }
    });

  } catch (error) {
    console.error('Error fetching clan stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  activityRate: number,
  treasuryProgress: number,
  memberCount: number,
  activeMembers: number
) {
  const recommendations = [];

  if (treasuryProgress < 50) {
    recommendations.push({
      type: 'treasury',
      priority: 'high',
      message: 'Tông Khố thấp - cần tăng cường đóng góp để nâng cấp',
      action: 'encourage_treasury_contributions'
    });
  }

  if (activityRate < 70) {
    recommendations.push({
      type: 'activity',
      priority: 'medium',
      message: `Tỷ lệ hoạt động thấp (${activityRate.toFixed(1)}%) - cần khuyến khích thành viên tham gia`,
      action: 'boost_member_activity'
    });
  }

  const inactiveCount = memberCount - activeMembers;
  if (inactiveCount > memberCount * 0.3) {
    recommendations.push({
      type: 'members',
      priority: 'medium',
      message: `${inactiveCount} thành viên không hoạt động tuần này`,
      action: 'check_inactive_members'
    });
  }

  if (memberCount < 100) {
    recommendations.push({
      type: 'recruitment',
      priority: 'low',
      message: 'Có thể tuyển thêm thành viên để tăng sức mạnh tông môn',
      action: 'recruit_members'
    });
  }

  return recommendations;
} 