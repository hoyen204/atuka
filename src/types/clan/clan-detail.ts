import { ClanShopExtractedData } from '../shop/clan-shop';

export interface ClanLevel {
  level: number;
  currentBenefits: string[];
  nextBenefits: string[];
  memberLimit: number;
  trialsRange: string;
}

export interface ClanTreasury {
  current: number;
  target: number;
  progressPercentage: number;
}

export interface ClanMember {
  id: string;
  rank: number;
  name: string;
  role: string;
  avatarUrl: string;
  avatarFrame?: string;
  profileUrl: string;
  weeklyPoints: number;
  weeklyTreasury: number;
  totalScore: number;
  isRankHighlighted: boolean;
}

export interface ClanHeader {
  name: string;
  imageUrl: string;
  level: number;
  levelImageUrl: string;
  memberCount: number;
  memberLimit: number;
  treasury: ClanTreasury;
  userContribution: {
    points: number;
    totalContributed: number;
  };
}

export interface ClanShopButton {
  id: string;
  name: string;
  iconClass: string;
  buttonClass: string;
  isExternal?: boolean;
  url?: string;
}

export interface ClanDetail {
  header: ClanHeader;
  level: ClanLevel;
  members: ClanMember[];
  shopButtons: ClanShopButton[];
  shopData?: ClanShopExtractedData;
  points: number;
}

export interface ClanMemberTableSort {
  field: 'weekly_points' | 'weekly_treasury' | 'total_score';
  order: 'asc' | 'desc';
}

export interface ClanDetailExtractedData {
  clanDetail: ClanDetail;
  extractedAt: Date;
}

export interface ClanDetailParser {
  parseClanDetailHtml(html: string): ClanDetailExtractedData;
  extractClanHeader(html: string): ClanHeader;
  extractClanLevel(html: string): ClanLevel;
  extractClanMembers(html: string): ClanMember[];
  extractShopButtons(html: string): ClanShopButton[];
}

export interface ClanDetailExtractor {
  extractClanName(element: any): string;
  extractClanImage(element: any): string;
  extractMemberInfo(element: any): {
    count: number;
    limit: number;
  };
  extractTreasuryInfo(element: any): ClanTreasury;
  extractUserContribution(element: any): {
    points: number;
    totalContributed: number;
  };
  extractMemberFromRow(element: any): ClanMember | null;
}

export type ClanMemberRank = 'bg-top1' | 'bg-top2' | 'bg-top3' | 'normal';

export interface ClanMemberStats {
  totalMembers: number;
  activeMembers: number;
  averageWeeklyPoints: number;
  averageWeeklyTreasury: number;
  topContributor: ClanMember | null;
} 