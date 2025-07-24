export interface UserShopItem {
  id: string;
  name: string;
  tuViBonus: number;
  price: number;
  imageUrl: string;
  isEligible: boolean;
  eligibilityReason?: string;
}

export interface PhapBaoItem extends UserShopItem {
  category: 'phapbao';
  actionType?: 'buy' | 'sell' | undefined;
}

export interface DongHanhItem extends UserShopItem {
  category: 'donghanh';
  actionType?: 'buy' | 'sell' | undefined;
}

export interface BonMenhItem extends UserShopItem {
  category: 'bonmenh';
  actionType?: 'buy' | 'sell' | undefined;
}

export interface DanDuocItem extends UserShopItem {
  category: 'danduoc';
  description?: string;
  usageLimit?: number;
  usedCount?: number;
  tuViRange?: string;
  actionType?: 'buy' | 'sell' | undefined;
}

export interface NangCapItem extends UserShopItem {
  category: 'nangcappb';
  isLimited?: boolean;
  actionType?: 'buy' | 'sell' | undefined;
}

export interface UserShopExtractedData {
  phapBaoItems: PhapBaoItem[];
  dongHanhItems: DongHanhItem[];
  bonMenhItems: BonMenhItem[];
  danDuocItems: DanDuocItem[];
  nangCapItems: NangCapItem[];
}

export interface UserShopParser {
  parseUserShopHtml(html: string): UserShopExtractedData;
} 