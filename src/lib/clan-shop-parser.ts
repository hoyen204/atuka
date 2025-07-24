import * as cheerio from 'cheerio';
import {
  ClanShopExtractedData,
  TongMonItem,
  PhapBaoItem,
  DanDuocItem,
  ShopItemParser,
  ShopItemExtractor
} from '../types/shop/clan-shop';

export class ClanShopParser implements ShopItemParser, ShopItemExtractor {
  
  parseShopHtml(html: string): ClanShopExtractedData {
    return {
      tongMonItems: this.extractTongMonItems(html),
      phapBaoItems: this.extractPhapBaoItems(html),
      danDuocItems: this.extractDanDuocItems(html)
    };
  }

  extractTongMonItems(html: string): TongMonItem[] {
    const $ = cheerio.load(html);
    const tongMonTab = $('#tab-tong-mon');
    if (tongMonTab.length === 0) return [];

    const items: TongMonItem[] = [];
    const shopItems = tongMonTab.find('.shop-item');

    shopItems.each((index, element) => {
      const $item = $(element);
      const button = $item.find('button');
      const actionType = button.hasClass('sell-item-tong-mon') ? 'sell' : 'buy';
      
      const name = this.extractItemName($item);
      const levelMatch = name.match(/Cấp (\d+)/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 1;

      const tongMonItem: TongMonItem = {
        id: this.extractItemId($item),
        name: name,
        description: this.extractItemDescription($item),
        imageUrl: this.extractItemImage($item),
        price: this.extractItemPrice($item),
        priceType: 'tong-kho',
        category: 'tong-mon',
        level: level,
        congHienBonus: this.extractCongHienBonus($item),
        actionType: actionType,
        isEligible: this.checkEligibility($item),
        eligibilityReason: this.extractEligibilityReason($item)
      };

      items.push(tongMonItem);
    });

    return items;
  }

  extractPhapBaoItems(html: string): PhapBaoItem[] {
    const $ = cheerio.load(html);
    const phapBaoTab = $('#tab-phap-bao');
    if (phapBaoTab.length === 0) return [];

    const items: PhapBaoItem[] = [];
    const shopItems = phapBaoTab.find('.shop-item');

    shopItems.each((index, element) => {
      const $item = $(element);
      const name = this.extractItemName($item);
      const tuViBonus = this.extractTuViBonus(name);

      const phapBaoItem: PhapBaoItem = {
        id: this.extractItemId($item),
        name: name,
        imageUrl: this.extractItemImage($item),
        price: this.extractItemPrice($item),
        priceType: 'cong-hien',
        category: 'phap-bao',
        tuViBonus: tuViBonus,
        isEligible: this.checkEligibility($item),
        eligibilityReason: this.extractEligibilityReason($item)
      };

      items.push(phapBaoItem);
    });

    return items;
  }

  extractDanDuocItems(html: string): DanDuocItem[] {
    const $ = cheerio.load(html);
    const danDuocTab = $('#tab-dan-duoc');
    if (danDuocTab.length === 0) return [];

    const items: DanDuocItem[] = [];
    const shopItems = danDuocTab.find('.dan-duoc-item');

    shopItems.each((index, element) => {
      const $item = $(element);
      const name = this.extractItemName($item);
      const tuViBonus = this.extractTuViBonus(name);
      const usageInfo = this.extractUsageInfo($item);
      const contributionRequirement = this.extractContributionRequirement($item);

      const danDuocItem: DanDuocItem = {
        id: this.extractItemId($item),
        name: name,
        description: this.extractItemDescription($item),
        imageUrl: this.extractItemImage($item),
        price: this.extractItemPrice($item),
        priceType: 'cong-hien',
        category: 'dan-duoc',
        tuViBonus: tuViBonus,
        usageLimit: usageInfo.limit,
        usedCount: usageInfo.used,
        contributionRequirement: contributionRequirement,
        refreshPeriod: 'monthly',
        isEligible: this.checkEligibility($item),
        eligibilityReason: this.extractEligibilityReason($item)
      };

      items.push(danDuocItem);
    });

    return items;
  }

  extractItemId(element: cheerio.Cheerio): string {
    const button = element.find('button[data-item-id]');
    return button.attr('data-item-id') || '';
  }

  extractItemName(element: cheerio.Cheerio): string {
    const h3 = element.find('h3');
    return h3.text().trim();
  }

  extractItemDescription(element: cheerio.Cheerio): string {
    const description = element.find('.item-description, .dan-duoc-description');
    return description.text().trim();
  }

  extractItemImage(element: cheerio.Cheerio): string {
    const img = element.find('.shop-item-image');
    return img.attr('data-src') || img.attr('src') || '';
  }

  extractItemPrice(element: cheerio.Cheerio): number {
    const priceTextElement = element.find('.price-text');
    if (priceTextElement.length === 0) return 0;

    const priceText = priceTextElement
      .contents()
      .filter(function(this: cheerio.Element) {
        return this.type === 'text';
      })
      .text()
      .trim();
    
    if (priceText) {
      return parseInt(priceText.replace(/,/g, '')) || 0;
    }

    return 0;
  }

  extractTuViBonus(text: string): number {
    const tuViMatch = text.match(/\+\s*(\d+(?:,\d+)*)\s*Tu\s*Vi/i);
    if (tuViMatch) {
      return parseInt(tuViMatch[1].replace(/,/g, ''));
    }
    return 0;
  }

  extractUsageInfo(element: cheerio.Cheerio): { used: number; limit: number } {
    const usageText = element.find('.dan-duoc-uses');
    if (usageText.length === 0) return { used: 0, limit: 0 };
    
    const text = usageText.text();
    const match = text.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        used: parseInt(match[1]),
        limit: parseInt(match[2])
      };
    }
    return { used: 0, limit: 0 };
  }

  extractContributionRequirement(element: cheerio.Cheerio): number {
    const conditionText = element.find('.dieu-kien-mua');
    if (conditionText.length === 0) return 0;
    
    const text = conditionText.text();
    const match = text.match(/(\d+(?:,\d+)*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  checkEligibility(element: cheerio.Cheerio): boolean {
    const notEligible = element.find('.not-eligible');
    return notEligible.length === 0;
  }

  private extractEligibilityReason(element: cheerio.Cheerio): string | undefined {
    const notEligible = element.find('.not-eligible');
    return notEligible.length > 0 ? notEligible.text().trim() : undefined;
  }

  private extractCongHienBonus(element: cheerio.Cheerio): string {
    const congHienElement = element.find('.tang-cong-hien');
    return congHienElement.text().trim();
  }
}

export const clanShopParser = new ClanShopParser(); 