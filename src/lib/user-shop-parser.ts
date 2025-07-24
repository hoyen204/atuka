import * as cheerio from 'cheerio';
import { UserShopExtractedData, PhapBaoItem, DongHanhItem, BonMenhItem, DanDuocItem, NangCapItem } from '../types/shop/user-shop';

export class UserShopParser implements UserShopParser {
  parseUserShopHtml(html: string): UserShopExtractedData {
    return {
      phapBaoItems: this.extractPhapBaoItems(html),
      dongHanhItems: this.extractDongHanhItems(html),
      bonMenhItems: this.extractBonMenhItems(html),
      danDuocItems: this.extractDanDuocItems(html),
      nangCapItems: this.extractNangCapItems(html)
    };
  }

  private extractPhapBaoItems(html: string): PhapBaoItem[] {
    const $ = cheerio.load(html);
    const items: PhapBaoItem[] = [];
    $('#phapbao-items .col-lg-4').each((_, el) => {
      const $item = $(el);
      const $card = $item.find('.card');
      const imageUrl = this.extractImageUrl($card.find('img'));
      const titleText = $card.find('.card-title').text().trim();
      const [name, tuViStr] = titleText.split(/\s*<br>\s*/);
      const tuViBonus = this.extractTuViBonus(tuViStr || '');
      const price = this.extractItemPrice($card.find('.price-text').text());
      
      const $buyButton = $card.find('.buyBadgeBtn');
      const $sellButton = $card.find('.sellBadgeBtn');
      
      let id = '';
      let actionType: 'buy' | 'sell' | undefined = undefined;
      let isEligible = false;
      let eligibilityReason: string | undefined;
      
      if ($buyButton.length > 0) {
        id = $buyButton.attr('data-item-id') || '';
        actionType = 'buy';
        isEligible = true;
      } else if ($sellButton.length > 0) {
        id = $sellButton.attr('data-item-id') || '';
        actionType = 'sell';
        isEligible = true;
      } else {
        eligibilityReason = $card.find('.badge_has_user').text().trim();
      }
      
      items.push({ id, name: name?.trim() || '', tuViBonus, price, imageUrl, isEligible, eligibilityReason, category: 'phapbao', actionType });
    });
    return items;
  }

  private extractDongHanhItems(html: string): DongHanhItem[] {
    const $ = cheerio.load(html);
    const items: DongHanhItem[] = [];
    $('#donghanh-items .col-lg-4').each((_, el) => {
      const $item = $(el);
      const $card = $item.find('.card');
      const imageUrl = this.extractImageUrl($card.find('img'));
      const titleText = $card.find('.card-title').text().trim();
      const [name, tuViStr] = titleText.split(/\s*<br>\s*/);
      const tuViBonus = this.extractTuViBonus(tuViStr || '');
      const price = this.extractItemPrice($card.find('.price-text').text());
      
      const $buyButton = $card.find('.buydonghanhBtn');
      const $sellButton = $card.find('.selldonghanhBtn');
      
      let id = '';
      let actionType: 'buy' | 'sell' | undefined = undefined;
      let isEligible = false;
      let eligibilityReason: string | undefined;
      
      if ($buyButton.length > 0) {
        id = $buyButton.attr('data-item-id') || '';
        actionType = 'buy';
        isEligible = true;
      } else if ($sellButton.length > 0) {
        id = $sellButton.attr('data-item-id') || '';
        actionType = 'sell';
        isEligible = true;
      } else {
        eligibilityReason = $card.find('.badge_has_user').text().trim();
      }
      
      items.push({ id, name: name?.trim() || '', tuViBonus, price, imageUrl, isEligible, eligibilityReason, category: 'donghanh', actionType });
    });
    return items;
  }

  private extractBonMenhItems(html: string): BonMenhItem[] {
    const $ = cheerio.load(html);
    const items: BonMenhItem[] = [];
    $('#bonmenh-items .col-lg-4').each((_, el) => {
      const $item = $(el);
      const $card = $item.find('.card');
      const imageUrl = this.extractImageUrl($card.find('img'));
      const titleText = $card.find('.card-title').text().trim();
      const [name, tuViStr] = titleText.split(/\s*<br>\s*/);
      const tuViBonus = this.extractTuViBonus(tuViStr || '');
      const price = this.extractItemPrice($card.find('.price-text').text());
      
      const $buyButton = $card.find('.buybonmenhBtn');
      const $sellButton = $card.find('.sellbonmenhBtn');
      
      let id = '';
      let actionType: 'buy' | 'sell' | undefined = undefined;
      let isEligible = false;
      let eligibilityReason: string | undefined;
      
      if ($buyButton.length > 0) {
        id = $buyButton.attr('data-item-id') || '';
        actionType = 'buy';
        isEligible = true;
      } else if ($sellButton.length > 0) {
        id = $sellButton.attr('data-item-id') || '';
        actionType = 'sell';
        isEligible = true;
      } else {
        eligibilityReason = $card.find('.badge_has_user').text().trim();
      }
      
      items.push({ id, name: name?.trim() || '', tuViBonus, price, imageUrl, isEligible, eligibilityReason, category: 'bonmenh', actionType });
    });
    return items;
  }

  private extractDanDuocItems(html: string): DanDuocItem[] {
    const $ = cheerio.load(html);
    const items: DanDuocItem[] = [];
    $('#danduoc-items .col-lg-4').each((_, el) => {
      const $item = $(el);
      const $card = $item.find('.card');
      const imageUrl = this.extractImageUrl($card.find('img'));
      const titleText = $card.find('.card-title').text().trim();
      const [name, tuViStr] = titleText.split(/\s*<br>\s*/);
      const tuViBonus = this.extractTuViBonus(tuViStr || '');
      const description = $card.find('.info-danduoc').text().trim();
      const usesText = $card.find('.card-text').eq(0).text().trim();
      const usedMatch = usesText.match(/Số lần dùng còn lại: (\d+)/);
      const usedCount = usedMatch ? parseInt(usedMatch[1]) : 0;
      const price = this.extractItemPrice($card.find('.price-text').text());
      
      const $buyButton = $card.find('.buyDanDuocBtn');
      const $sellButton = $card.find('.sellDanDuocBtn'); // Assuming class name
      
      let id = '';
      let actionType: 'buy' | 'sell' | undefined = undefined;
      let isEligible = false;
      let eligibilityReason: string | undefined;
      
      if ($buyButton.length > 0) {
        id = $buyButton.attr('data-dan-duoc-id') || '';
        actionType = 'buy';
        isEligible = true;
      } else if ($sellButton.length > 0) {
        id = $sellButton.attr('data-dan-duoc-id') || '';
        actionType = 'sell';
        isEligible = true;
      } else {
        eligibilityReason = $card.find('.badge_has_user').text().trim();
      }
      
      const usageLimit = $buyButton.length ? parseInt($buyButton.attr('data-max-uses') || '0') : ($sellButton.length ? parseInt($sellButton.attr('data-max-uses') || '0') : 0);
      const tuViRange = description.match(/Tu Vi Sử Dụng : (.+)/)?.[1] || '';
      
      items.push({ id, name: name?.trim() || '', tuViBonus, price, imageUrl, isEligible, eligibilityReason, category: 'danduoc', description, usageLimit, usedCount, tuViRange, actionType });
    });
    return items;
  }

  private extractNangCapItems(html: string): NangCapItem[] {
    const $ = cheerio.load(html);
    const items: NangCapItem[] = [];
    $('#nangcappb-items .col-lg-4').each((_, el) => {
      const $item = $(el);
      const $card = $item.find('.card');
      const imageUrl = this.extractImageUrl($card.find('img'));
      const titleText = $card.find('.card-title').text().trim();
      const [name, tuViStr] = titleText.split(/\s*<br>\s*/);
      const tuViBonus = this.extractTuViBonus(tuViStr || '');
      const price = this.extractItemPrice($card.find('.price-text').text());
      
      const $buyButton = $card.find('.buyNangCapBtn'); // Adjust class if needed
      const $sellButton = $card.find('.sellNangCapBtn'); // Assuming class name
      
      let id = '';
      let actionType: 'buy' | 'sell' | undefined = undefined;
      let isEligible = false;
      let eligibilityReason: string | undefined;
      
      if ($buyButton.length > 0) {
        id = $buyButton.attr('data-item-id') || '';
        actionType = 'buy';
        isEligible = true;
      } else if ($sellButton.length > 0) {
        id = $sellButton.attr('data-item-id') || '';
        actionType = 'sell';
        isEligible = true;
      } else {
        eligibilityReason = $card.find('.badge_has_user').text().trim();
      }
      
      const isLimited = $card.find('.limited-badge').length > 0;
      
      items.push({ id, name: name?.trim() || '', tuViBonus, price, imageUrl, isEligible, eligibilityReason, category: 'nangcappb', isLimited, actionType });
    });
    return items;
  }

  private extractTuViBonus(text: string): number {
    const match = text.match(/\+(\d+) Tu Vi/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractItemPrice(text: string): number {
    const cleaned = text.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  }

  private extractImageUrl($img: cheerio.Cheerio): string {
    return $img.attr('data-src') || $img.attr('src') || '';
  }
}

export const userShopParser = new UserShopParser(); 