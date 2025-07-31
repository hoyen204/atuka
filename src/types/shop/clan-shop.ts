export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  priceType: 'tong-kho' | 'cong-hien';
  category: ShopCategory;
  level?: number;
  tuViBonus?: number;
  isEligible?: boolean;
  eligibilityReason?: string;
}

export interface TongMonItem extends ShopItem {
  category: 'tong-mon';
  priceType: 'tong-kho';
  level: number;
  congHienBonus: string;
  actionType: 'buy' | 'sell';
}

export interface PhapBaoItem extends ShopItem {
  category: 'phap-bao';
  priceType: 'cong-hien';
  actionType: 'buy' | 'sell';
  tuViBonus: number;
}

export interface DanDuocItem extends ShopItem {
  category: 'dan-duoc';
  priceType: 'cong-hien';
  tuViBonus: number;
  usageLimit: number;
  usedCount: number;
  contributionRequirement: number;
  refreshPeriod: 'monthly';
}

export type ShopCategory = 'tong-mon' | 'phap-bao' | 'dan-duoc';

export interface ShopTab {
  id: string;
  name: string;
  category: ShopCategory;
  isActive: boolean;
}

export interface ClanShop {
  tabs: ShopTab[];
  items: {
    tongMon: TongMonItem[];
    phapBao: PhapBaoItem[];
    danDuoc: DanDuocItem[];
  };
  isVisible: boolean;
}

export interface ShopItemAction {
  type: 'buy' | 'sell';
  itemId: string;
  category: ShopCategory;
}

export interface ClanShopExtractedData {
  tongMonItems: TongMonItem[];
  phapBaoItems: PhapBaoItem[];
  danDuocItems: DanDuocItem[];
}

export interface ShopItemParser {
  parseShopHtml(html: string): ClanShopExtractedData;
  extractTongMonItems(html: string): TongMonItem[];
  extractPhapBaoItems(html: string): PhapBaoItem[];
  extractDanDuocItems(html: string): DanDuocItem[];
}

export interface ShopItemExtractor {
  extractItemId(element: any): string;
  extractItemName(element: any): string;
  extractItemDescription(element: any): string;
  extractItemImage(element: any): string;
  extractItemPrice(element: any): number;
  extractTuViBonus(text: string): number;
  extractUsageInfo(element: any): { used: number; limit: number };
  extractContributionRequirement(element: any): number;
  checkEligibility(element: any): boolean;
}
