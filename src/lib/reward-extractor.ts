import * as cheerio from 'cheerio';

export interface Reward {
  id: string;
  title: string;
  description: string;
  claimed: boolean;
  canClaim: boolean;
  type: 'normal' | 'anniversary' | 'guild';
}

/**
 * Extracts all nonce values from the page's inline scripts.
 * It identifies nonces associated with specific reward types by parsing jQuery click handlers.
 *
 * @param html The HTML content of the page.
 * @returns A record mapping reward types to their respective nonce values.
 */
export function extractNonces(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const nonces: Record<string, string> = {};
  // Combine all inline scripts into one string for easier regex matching
  const scriptContents = $('script:not([src])').map((_, el) => $(el).html()).get().join('\n');

  // This regex is designed to find a nonce variable declared within a jQuery click handler for a specific class/ID.
  // It looks for $.('.selector').on('click', function() { ... const nonce = 'VALUE'; ... });
  const createNonceRegex = (selector: string) => 
    new RegExp(`\\$\\(['"\`]${selector}['"\`]\\)\\.on\\('click',[^]*?const\\s+nonce\\s*=\\s*['"\`]([a-zA-Z0-9]+)['"\`]`);

  const normalNonceMatch = scriptContents.match(createNonceRegex('\\.claim-reward-btn'));
  if (normalNonceMatch?.[1]) {
    nonces['normal'] = normalNonceMatch[1];
  }

  const anniversaryNonceMatch = scriptContents.match(createNonceRegex('#claim-anniversary-btn'));
  if (anniversaryNonceMatch?.[1]) {
    nonces['anniversary'] = anniversaryNonceMatch[1];
  }

  const guildNonceMatch = scriptContents.match(createNonceRegex('\\.claim-reward-tm-btn'));
  if (guildNonceMatch?.[1]) {
    nonces['guild'] = guildNonceMatch[1];
  }

  // Fallback: If no specific nonces are found, look for any nonce declaration.
  // This is useful for simpler pages or if the structure changes.
  if (Object.keys(nonces).length === 0) {
    const genericNonceMatch = scriptContents.match(/const\s+nonce\s*=\s*['"`]([a-zA-Z0-9]+)['"`]|security:\s*['"`]([a-zA-Z0-9]+)['"`]/);
    if (genericNonceMatch) {
      nonces['default'] = genericNonceMatch[1] || genericNonceMatch[2];
    }
  }

  // Ensure a 'default' nonce is always available if any specific nonce was found.
  // The 'normal' type is the most common, so it's a good default.
  if (!nonces['default']) {
    nonces['default'] = nonces['normal'] || nonces['guild'] || nonces['anniversary'] || '';
  }

  return nonces;
}


/**
 * Extracts all types of rewards from the provided HTML content.
 * This function is designed to be the single source of truth for reward parsing.
 * It precisely identifies reward items, their status, and type, returning a list.
 *
 * @param html The HTML content of the page to parse.
 * @returns A list of all found rewards.
 */
export function extractRewards(html: string): Reward[] {
  const $ = cheerio.load(html);
  const rewards: Reward[] = [];

  const buttonSelector = `
    .claim-reward-btn, 
    .reward-btn, 
    .claim-reward-anniversary-btn, 
    .claim-reward-tm-btn
  `;

  const rewardContainerSelector = `
    .reward-item, 
    .reward-card, 
    .tdbt-reward, 
    .anniversary-reward, 
    .guild-reward
  `;

  $(buttonSelector).each((_, buttonEl) => {
    const $button = $(buttonEl);
    const $container = $button.closest(rewardContainerSelector);

    if ($container.length === 0 || $container.data('processed')) {
      return;
    }
    $container.data('processed', true);

    const $element = $container;

    const rewardId = $button.attr('data-reward-id') || $button.attr('data-id') || '';
    
    const isAnniversaryReward = $button.hasClass('claim-reward-anniversary-btn') ||
                               $element.hasClass('anniversary-reward') ||
                               $element.text().includes('Kỷ Niệm');

    const isGuildReward = $button.hasClass('claim-reward-tm-btn') ||
                         $element.hasClass('guild-reward') ||
                         $element.hasClass('guild-rewards') || // From sample HTML
                         $element.text().includes('Tông Môn');

    // A reward must have an ID or be a special type (anniversary/guild)
    if (!rewardId && !isAnniversaryReward && !isGuildReward) {
      return;
    }

    const title = $element.find('.reward-title, .tdbt-title, .card-title, h3, h4').first().text().trim() ||
                  $element.find('.reward-text').first().text().trim() ||
                  'Phần thưởng';

    const description = $element.find('.reward-description, .tdbt-description, .reward-desc, p').first().text().trim() || 
                        title;

    const isClaimed = $button.hasClass('claimed') ||
                   $button.prop('disabled') === true ||
                   $button.text().includes('Đã Nhận') ||
                   $button.text().includes('Đã nhận');

    const canClaim = !isClaimed;
    
    let type: 'normal' | 'anniversary' | 'guild' = 'normal';
    let finalId = rewardId;

    if (isAnniversaryReward) {
      type = 'anniversary';
      finalId = rewardId || 'anniversary_reward';
    } else if (isGuildReward) {
      type = 'guild';
      finalId = rewardId || 'guild_reward';
    }

    if (!finalId) {
      return; 
    }
    
    rewards.push({
      id: finalId,
      title,
      description,
      claimed: isClaimed,
      canClaim,
      type
    });
  });

  return rewards;
} 