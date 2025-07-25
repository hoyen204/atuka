// doi-he-thong-parser.ts
import * as cheerio from 'cheerio';

interface System {
  value: string;
  label: string;
  isCurrent: boolean;
}

interface UnclaimedReward {
  system: string;
  level: string;
}

interface DoiHeThongData {
  currentSystem: string;
  systems: System[];
  availableChanges: number;
  unclaimedRewards: UnclaimedReward[];
}

export function parseDoiHeThong(html: string): DoiHeThongData {
  const $ = cheerio.load(html);
  // Extract systems
  const systems: System[] = [];
  $('.system-option').each((_, el) => {
    const value = $(el).find('input').val() as string;
    const label = $(el).find('label').text().trim();
    const isCurrent = $(el).hasClass('selected');
    systems.push({ value, label, isCurrent });
  });

  const currentSystem = systems.find(s => s.isCurrent)?.value || '';

  // Extract available changes
  const availableChanges = parseInt($('#remaining-changes').attr('data-remaining-changes') || '0', 10);

  // Extract unclaimed rewards
  const unclaimedRewards: UnclaimedReward[] = [];
  $('.reward-card').each((_, el) => {
    const text = $(el).find('.reward-text').text().trim();
    const match = text.match(/Chưa nhận thưởng Độ Kiếp (.+) trong hệ thống (.+)/);
    if (match) {
      unclaimedRewards.push({
        level: match[1],
        system: match[2]
      });
    }
  });

  return {
    currentSystem,
    systems,
    availableChanges,
    unclaimedRewards
  };
} 