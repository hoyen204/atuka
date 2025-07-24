import * as cheerio from 'cheerio';
import {
  ClanDetailExtractedData,
  ClanDetail,
  ClanHeader,
  ClanLevel,
  ClanMember,
  ClanShopButton,
  ClanTreasury,
  ClanDetailParser,
  ClanDetailExtractor,
  ClanMemberStats
} from '../types/clan/clan-detail';
import { ClanShopParser } from '@/lib/clan-shop-parser'; // Import shop parser

export class ClanDetailParserImpl implements ClanDetailParser, ClanDetailExtractor {
  
  private shopParser: ClanShopParser;

  constructor() {
    this.shopParser = new ClanShopParser();
  }

  parseClanDetailHtml(html: string): ClanDetailExtractedData {
    const clanDetail: ClanDetail = {
      header: this.extractClanHeader(html),
      level: this.extractClanLevel(html),
      members: this.extractClanMembers(html),
      shopButtons: this.extractShopButtons(html),
      shopData: this.shopParser.parseShopHtml(html),
      points: this.extractPoints(html)
    };

    return {
      clanDetail,
      extractedAt: new Date()
    };
  }

  extractClanHeader(html: string): ClanHeader {
    const $ = cheerio.load(html);
    
    const name = this.extractClanName($('.name-tong-mon'));
    const imageUrl = this.extractClanImage($('.tong-mon-img img'));
    const level = this.extractClanLevelFromElement($('.unique-modal-group-level-display'));
    const levelImageUrl = $('.unique-modal-group-level-display img').attr('src') || '';
    
    const memberInfo = this.extractMemberInfo($('.group-members'));
    const treasury = this.extractTreasuryInfo($('.group-treasury-container'));
    const userContribution = this.extractUserContribution($('.user-cong-hien, .tong-kho-dong-gop'));

    return {
      name,
      imageUrl,
      level,
      levelImageUrl,
      memberCount: memberInfo.count,
      memberLimit: memberInfo.limit,
      treasury,
      userContribution
    };
  }

  extractClanLevel(html: string): ClanLevel {
    const $ = cheerio.load(html);
    
    const levelElement = $('.unique-modal-group-level-display');
    const level = parseInt(levelElement.attr('data-tooltip')?.replace('Cấp ', '') || '1');
    
    const currentBenefitsElement = $('.unique-modal-current-benefits');
    const nextBenefitsElement = $('.unique-modal-next-benefits');
    
    const currentBenefits = this.extractBenefitsList(currentBenefitsElement);
    const nextBenefits = this.extractBenefitsList(nextBenefitsElement);
    
    const memberInfo = this.extractMemberInfo($('.group-members'));
    const trialsRange = this.extractTrialsRange(currentBenefitsElement);

    return {
      level,
      currentBenefits,
      nextBenefits,
      memberLimit: memberInfo.limit,
      trialsRange
    };
  }

  extractClanMembers(html: string): ClanMember[] {
    const $ = cheerio.load(html);
    const members: ClanMember[] = [];
    
    $('#member-table-body tr').each((index, element) => {
      const $row = $(element);
      const member = this.extractMemberFromRow($row);
      if (member) {
        members.push(member);
      }
    });

    return members;
  }

  extractShopButtons(html: string): ClanShopButton[] {
    const $ = cheerio.load(html);
    const buttons: ClanShopButton[] = [];

    $('.container.mt-5 button, .container.mt-5 a').each((index, element) => {
      const $element = $(element);
      const isLink = $element.is('a');
      
      const button: ClanShopButton = {
        id: $element.attr('id') || `button-${index}`,
        name: $element.text().trim(),
        iconClass: $element.find('i').attr('class') || '',
        buttonClass: $element.attr('class') || '',
        isExternal: isLink,
        url: isLink ? $element.attr('href') : undefined
      };

      buttons.push(button);
    });

    return buttons;
  }

  extractClanName(element: cheerio.Cheerio): string {
    return element.text().trim();
  }

  extractClanImage(element: cheerio.Cheerio): string {
    return element.attr('src') || element.attr('data-src') || '';
  }

  extractClanLevelFromElement(element: cheerio.Cheerio): number {
    const tooltip = element.attr('data-tooltip') || '';
    const levelMatch = tooltip.match(/Cấp (\d+)/);
    return levelMatch ? parseInt(levelMatch[1]) : 1;
  }

  extractMemberInfo(element: cheerio.Cheerio): { count: number; limit: number } {
    const text = element.text();
    const match = text.match(/(\d+)\/(\d+)/);
    
    if (match) {
      return {
        count: parseInt(match[1]) || 0,
        limit: parseInt(match[2]) || 0
      };
    }
    
    return { count: 0, limit: 0 };
  }

  extractTreasuryInfo(element: cheerio.Cheerio): ClanTreasury {
    const progressBar = element.find('.progress-bar');
    const progressText = progressBar.attr('data-progress') || '0%';
    const progressPercentage = parseFloat(progressText.replace('%', '')) || 0;
    
    const currentElement = element.find('.treasury-current');
    const targetElement = element.find('.treasury-next');
    
    const current = parseInt(currentElement.text().replace(/,/g, '')) || 0;
    const target = parseInt(targetElement.text().replace(/[^\d]/g, '')) || 0;

    return {
      current,
      target,
      progressPercentage
    };
  }

  extractUserContribution(element: cheerio.Cheerio): { points: number; totalContributed: number } {
    const pointsElement = element.filter('.user-cong-hien').find('.cong-hien-points');
    const contributionElement = element.filter('.tong-kho-dong-gop');
    
    const points = parseInt(pointsElement.text()) || 0;
    
    const contributionText = contributionElement.text();
    const contributionMatch = contributionText.match(/(\d+(?:,\d+)*)/);
    const totalContributed = contributionMatch ? (parseInt(contributionMatch[1].replace(/,/g, '')) || 0) : 0;

    return {
      points,
      totalContributed
    };
  }

  extractMemberFromRow(element: cheerio.Cheerio): ClanMember | null {
    const id = element.attr('data-id');
    if (!id) return null;

    const rankElement = element.find('.display-show');
    const rank = parseInt(rankElement.text()) || 0;

    const nameElement = element.find('.name-tooltip');
    const name = nameElement.attr('title') || nameElement.text().trim();

    const roleElement = element.find('.user-role');
    const role = roleElement.text().trim();

    const avatarElement = element.find('.avatar-container img');
    const avatarUrl = avatarElement.attr('data-src') || avatarElement.attr('src') || '';

    const avatarContainer = element.find('.avatar-container');
    const avatarFrame = this.extractAvatarFrame(avatarContainer);

    const profileElement = element.find('.name-avatar a');
    const profileUrl = profileElement.attr('href') || '';

    const pointsElements = element.find('.display-show-point b, .display-show-red b');
    const weeklyPoints = parseInt(pointsElements.eq(0).text().replace(/,/g, '')) || 0;
    const weeklyTreasury = parseInt(pointsElements.eq(1).text().replace(/,/g, '')) || 0;
    const totalScore = parseInt(pointsElements.eq(2).text().replace(/,/g, '')) || 0;

    const isRankHighlighted = element.hasClass('bg-top1') || element.hasClass('bg-top2') || element.hasClass('bg-top3');

    return {
      id,
      rank,
      name,
      role,
      avatarUrl,
      avatarFrame,
      profileUrl,
      weeklyPoints,
      weeklyTreasury,
      totalScore,
      isRankHighlighted
    };
  }

  private extractBenefitsList(element: cheerio.Cheerio): string[] {
    const benefits: string[] = [];
    const text = element.html() || '';
    
    const lines = text.split('<br>');
    lines.forEach(line => {
      const $temp = cheerio.load(`<div>${line}</div>`);
      const cleanLine = $temp('div').text().trim();
      if (cleanLine && cleanLine !== '' && !cleanLine.includes('Phúc lợi')) {
        benefits.push(cleanLine.replace(/^-\s*/, ''));
      }
    });

    return benefits;
  }

  private extractTrialsRange(element: cheerio.Cheerio): string {
    const text = element.length > 0 ? element.text() : '';
    const trialsMatch = text.match(/Thí Luyện\s*:\s*([^-\n]+)/);
    return trialsMatch ? trialsMatch[1].trim() : '';
  }

  private extractAvatarFrame(element: cheerio.Cheerio): string | undefined {
    const classList = element.attr('class') || '';
    const frameClasses = classList.split(' ').filter(cls => 
      cls.includes('khung_') || cls.includes('frame_')
    );
    return frameClasses.length > 0 ? frameClasses[0] : undefined;
  }

  calculateClanStats(members: ClanMember[]): ClanMemberStats {
    const totalMembers = members.length;
    const activeMembers = members.filter(member => member.weeklyPoints > 0).length;
    
    const totalWeeklyPoints = members.reduce((sum, member) => sum + member.weeklyPoints, 0);
    const totalWeeklyTreasury = members.reduce((sum, member) => sum + member.weeklyTreasury, 0);
    
    const averageWeeklyPoints = totalMembers > 0 ? totalWeeklyPoints / totalMembers : 0;
    const averageWeeklyTreasury = totalMembers > 0 ? totalWeeklyTreasury / totalMembers : 0;
    
    const topContributor = members.length > 0 ? 
      members.reduce((prev, current) => 
        current.totalScore > prev.totalScore ? current : prev
      ) : null;

    return {
      totalMembers,
      activeMembers,
      averageWeeklyPoints,
      averageWeeklyTreasury,
      topContributor
    };
  }

  findMemberById(members: ClanMember[], id: string): ClanMember | undefined {
    return members.find(member => member.id === id);
  }

  sortMembers(members: ClanMember[], field: 'weekly_points' | 'weekly_treasury' | 'total_score', order: 'asc' | 'desc' = 'desc'): ClanMember[] {
    const fieldMap = {
      weekly_points: 'weeklyPoints',
      weekly_treasury: 'weeklyTreasury', 
      total_score: 'totalScore'
    };

    const sortField = fieldMap[field] as keyof ClanMember;
    
    return [...members].sort((a, b) => {
      const aValue = a[sortField] as number;
      const bValue = b[sortField] as number;
      
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }

  filterMembersByRole(members: ClanMember[], role: string): ClanMember[] {
    return members.filter(member => member.role === role);
  }

  getMembersByRankRange(members: ClanMember[], startRank: number, endRank: number): ClanMember[] {
    return members.filter(member => member.rank >= startRank && member.rank <= endRank);
  }

  extractPoints(html: string): number {
    const $ = cheerio.load(html);
    const points = $('.user-cong-hien .cong-hien-points').text();
    return parseInt(points) || 0;
  }
}

export const clanDetailParser = new ClanDetailParserImpl(); 