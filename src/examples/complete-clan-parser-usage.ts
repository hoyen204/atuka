import { clanShopParser } from '../lib/clan-shop-parser';
import { clanDetailParser } from '../lib/clan-detail-parser';
import { 
  ClanDetailExtractedData, 
  ClanMember, 
  ClanMemberStats 
} from '../types/clan/clan-detail';
import { 
  ClanShopExtractedData,
  TongMonItem,
  PhapBaoItem,
  DanDuocItem
} from '../types/shop/clan-shop';

export class CompleteClanParser {
  
  async parseCompleteClanData(clanDetailHtml: string, shopHtml?: string) {
    const clanData = clanDetailParser.parseClanDetailHtml(clanDetailHtml);
    
    let shopData: ClanShopExtractedData | null = null;
    if (shopHtml) {
      shopData = clanShopParser.parseShopHtml(shopHtml);
      clanData.clanDetail.shopData = shopData;
    }

    return {
      clanDetail: clanData,
      shopData,
      stats: this.generateClanAnalytics(clanData),
      recommendations: this.generateRecommendations(clanData, shopData)
    };
  }

  generateClanAnalytics(clanData: ClanDetailExtractedData) {
    const { members, header } = clanData.clanDetail;
    
    const stats = clanDetailParser.calculateClanStats(members);
    
    const roleDistribution = this.analyzeMemberRoles(members);
    const treasuryAnalysis = this.analyzeTreasuryProgress(header.treasury);
    const memberActivity = this.analyzeMemberActivity(members);
    
    return {
      ...stats,
      roleDistribution,
      treasuryAnalysis,
      memberActivity,
      clanEfficiency: this.calculateClanEfficiency(stats, header)
    };
  }

  generateRecommendations(clanData: ClanDetailExtractedData, shopData: ClanShopExtractedData | null) {
    const recommendations = [];
    const { members, header, level } = clanData.clanDetail;
    
    // Treasury recommendations
    if (header.treasury.progressPercentage < 50) {
      recommendations.push({
        type: 'treasury',
        priority: 'high',
        message: 'Tông Khố thấp - cần tăng cường đóng góp để nâng cấp',
        action: 'encourage_treasury_contributions'
      });
    }

    // Member activity recommendations
    const inactiveMembers = members.filter(m => m.weeklyPoints === 0);
    if (inactiveMembers.length > members.length * 0.3) {
      recommendations.push({
        type: 'activity',
        priority: 'medium',
        message: `${inactiveMembers.length} thành viên không hoạt động tuần này`,
        action: 'check_inactive_members'
      });
    }

    // Shop recommendations
    if (shopData) {
      const affordableItems = this.findAffordableShopItems(shopData, header.userContribution.points);
      if (affordableItems.length > 0) {
        recommendations.push({
          type: 'shop',
          priority: 'low',
          message: `Có ${affordableItems.length} vật phẩm có thể mua`,
          action: 'review_shop_items',
          data: affordableItems
        });
      }
    }

    return recommendations;
  }

  private analyzeMemberRoles(members: ClanMember[]) {
    const roles = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      roles,
      totalRoles: Object.keys(roles).length,
      leadershipCount: members.filter(m => 
        m.role.includes('Tông Chủ') || m.role.includes('Phó') || m.role.includes('Trưởng')
      ).length
    };
  }

  private analyzeTreasuryProgress(treasury: any) {
    const remainingAmount = treasury.target - treasury.current;
    const estimatedDaysToComplete = remainingAmount > 0 ? 
      Math.ceil(remainingAmount / (treasury.current * 0.1)) : 0;

    return {
      remainingAmount,
      estimatedDaysToComplete,
      isOnTrack: treasury.progressPercentage > 50,
      urgencyLevel: treasury.progressPercentage < 25 ? 'high' : 
                   treasury.progressPercentage < 50 ? 'medium' : 'low'
    };
  }

  private analyzeMemberActivity(members: ClanMember[]) {
    const activeMembers = members.filter(m => m.weeklyPoints > 0);
    const averageActivity = activeMembers.length / members.length;
    
    const topPerformers = members
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      .slice(0, 5);

    return {
      activityRate: averageActivity,
      activeCount: activeMembers.length,
      inactiveCount: members.length - activeMembers.length,
      topPerformers,
      averageWeeklyContribution: activeMembers.reduce((sum, m) => sum + m.weeklyPoints, 0) / activeMembers.length
    };
  }

  private calculateClanEfficiency(stats: ClanMemberStats, header: any) {
    const memberUtilization = stats.activeMembers / stats.totalMembers;
    const treasuryEfficiency = header.treasury.progressPercentage / 100;
    const avgContribution = stats.averageWeeklyPoints;
    
    const efficiency = (memberUtilization * 0.4) + (treasuryEfficiency * 0.3) + 
                      (Math.min(avgContribution / 1000, 1) * 0.3);

    return {
      overall: efficiency,
      memberUtilization,
      treasuryEfficiency,
      contributionRate: avgContribution,
      grade: efficiency > 0.8 ? 'A' : efficiency > 0.6 ? 'B' : efficiency > 0.4 ? 'C' : 'D'
    };
  }

  private findAffordableShopItems(shopData: ClanShopExtractedData, userPoints: number): Array<any> {
    const affordable: Array<any> = [];
    
    // Check Phap Bao items
    shopData.phapBaoItems.forEach(item => {
      if (item.price <= userPoints && item.isEligible) {
        affordable.push({
          ...item,
          category: 'phap-bao',
          valueRatio: item.tuViBonus / item.price
        });
      }
    });

    // Check Dan Duoc items
    shopData.danDuocItems.forEach(item => {
      if (item.price <= userPoints && item.isEligible && item.usedCount < item.usageLimit) {
        affordable.push({
          ...item,
          category: 'dan-duoc',
          valueRatio: item.tuViBonus / item.price
        });
      }
    });

    return affordable.sort((a, b) => b.valueRatio - a.valueRatio);
  }

  // Utility methods for data filtering and analysis
  filterTopMembers(members: ClanMember[], count: number = 10): ClanMember[] {
    return clanDetailParser.sortMembers(members, 'total_score', 'desc').slice(0, count);
  }

  findMembersByRole(members: ClanMember[], role: string): ClanMember[] {
    return clanDetailParser.filterMembersByRole(members, role);
  }

  getWeeklyLeaderboard(members: ClanMember[]): {
    points: ClanMember[];
    treasury: ClanMember[];
  } {
    return {
      points: clanDetailParser.sortMembers(members, 'weekly_points', 'desc').slice(0, 10),
      treasury: clanDetailParser.sortMembers(members, 'weekly_treasury', 'desc').slice(0, 10)
    };
  }

  exportClanReport(data: any): string {
    const report = {
      timestamp: new Date().toISOString(),
      clanName: data.clanDetail.clanDetail.header.name,
      level: data.clanDetail.clanDetail.header.level,
      memberCount: data.clanDetail.clanDetail.header.memberCount,
      treasuryStatus: data.clanDetail.clanDetail.header.treasury,
      analytics: data.stats,
      recommendations: data.recommendations,
      topMembers: this.filterTopMembers(data.clanDetail.clanDetail.members, 5)
    };

    return JSON.stringify(report, null, 2);
  }
}

// Usage example
export async function demonstrateParser() {
  const parser = new CompleteClanParser();
  
  // Example usage (would use real HTML content)
  const clanDetailHtml = '<html>...</html>'; // Your clan detail HTML
  const shopHtml = '<html>...</html>'; // Your shop HTML
  
  try {
    const result = await parser.parseCompleteClanData(clanDetailHtml, shopHtml);
    
    console.log('=== CLAN ANALYSIS REPORT ===');
    console.log(`Clan: ${result.clanDetail.clanDetail.header.name}`);
    console.log(`Level: ${result.clanDetail.clanDetail.header.level}`);
    console.log(`Members: ${result.clanDetail.clanDetail.header.memberCount}/${result.clanDetail.clanDetail.header.memberLimit}`);
    console.log(`Treasury: ${result.clanDetail.clanDetail.header.treasury.current}/${result.clanDetail.clanDetail.header.treasury.target}`);
    console.log(`Efficiency Grade: ${result.stats.clanEfficiency.grade}`);
    
    console.log('\n=== TOP CONTRIBUTORS ===');
    const topMembers = parser.filterTopMembers(result.clanDetail.clanDetail.members, 3);
    topMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.totalScore} điểm`);
    });
    
    console.log('\n=== RECOMMENDATIONS ===');
    result.recommendations.forEach(rec => {
      console.log(`[${rec.priority.toUpperCase()}] ${rec.message}`);
    });
    
    // Export detailed report
    const report = parser.exportClanReport(result);
    console.log('\n=== DETAILED REPORT ===');
    console.log(report);
    
    return result;
    
  } catch (error) {
    console.error('Error parsing clan data:', error);
    throw error;
  }
}

export const completeClanParser = new CompleteClanParser(); 