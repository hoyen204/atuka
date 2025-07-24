import { clanShopParser } from '../lib/clan-shop-parser';
import { ClanShopExtractedData, TongMonItem, PhapBaoItem, DanDuocItem } from '../types/shop/clan-shop';

export async function extractClanShopData(htmlContent: string): Promise<ClanShopExtractedData> {
  try {
    const extractedData = clanShopParser.parseShopHtml(htmlContent);
    
    console.log('Clan Shop Data Extracted:');
    console.log(`- Tông Môn Items: ${extractedData.tongMonItems.length}`);
    console.log(`- Pháp Bảo Items: ${extractedData.phapBaoItems.length}`);
    console.log(`- Đan Dược Items: ${extractedData.danDuocItems.length}`);
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting clan shop data:', error);
    throw error;
  }
}

export function filterEligibleItems(data: ClanShopExtractedData) {
  const eligibleTongMon = data.tongMonItems.filter(item => item.isEligible);
  const eligiblePhapBao = data.phapBaoItems.filter(item => item.isEligible);
  const eligibleDanDuoc = data.danDuocItems.filter(item => item.isEligible);
  
  return {
    tongMon: eligibleTongMon,
    phapBao: eligiblePhapBao,
    danDuoc: eligibleDanDuoc
  };
}

export function findBestValueItems(data: ClanShopExtractedData) {
  const phapBaoByValue = data.phapBaoItems
    .filter(item => item.isEligible && item.tuViBonus > 0)
    .sort((a, b) => (b.tuViBonus / b.price) - (a.tuViBonus / a.price));
    
  const danDuocByValue = data.danDuocItems
    .filter(item => item.isEligible && item.usedCount < item.usageLimit)
    .sort((a, b) => (b.tuViBonus / b.price) - (a.tuViBonus / a.price));
    
  return {
    bestPhapBao: phapBaoByValue[0],
    bestDanDuoc: danDuocByValue[0]
  };
}

export function getAvailableDanDuoc(items: DanDuocItem[]): DanDuocItem[] {
  return items.filter(item => 
    item.isEligible && 
    item.usedCount < item.usageLimit
  );
}

export function getTongMonFlags(items: TongMonItem[]): { buyable: TongMonItem[], sellable: TongMonItem[] } {
  const buyable = items.filter(item => item.actionType === 'buy' && item.isEligible);
  const sellable = items.filter(item => item.actionType === 'sell');
  
  return { buyable, sellable };
}

export function calculateTotalTuViFromItems(items: (PhapBaoItem | DanDuocItem)[]): number {
  return items.reduce((total, item) => total + (item.tuViBonus || 0), 0);
}

export function groupItemsByPriceRange(items: (TongMonItem | PhapBaoItem | DanDuocItem)[]) {
  const ranges = {
    low: items.filter(item => item.price <= 1000),
    medium: items.filter(item => item.price > 1000 && item.price <= 5000),
    high: items.filter(item => item.price > 5000)
  };
  
  return ranges;
} 