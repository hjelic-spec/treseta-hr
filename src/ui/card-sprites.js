const CARD_BASE_PATH = 'assets/cards';

export function renderCardSVG(card, width = 70, height = 126) {
  const src = `${CARD_BASE_PATH}/${card.suit}_${card.rank}.png`;
  return `<img src="${src}" width="${width}" height="${height}" alt="${card.suit} ${card.rank}" draggable="false" style="border-radius:4px;">`;
}

export function renderCardBack(width = 70, height = 126) {
  return `<svg viewBox="0 0 70 126" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="68" height="124" rx="4" fill="#1a4a8a" stroke="#0e3366" stroke-width="1.2"/>
    <rect x="4" y="4" width="62" height="118" rx="3" fill="none" stroke="#c9a84c" stroke-width="0.6" opacity="0.5"/>
    <rect x="6" y="6" width="58" height="114" rx="2" fill="#152d5a"/>
    <pattern id="p-back" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,6 L6,0 L12,6 L6,12 Z" fill="none" stroke="#c9a84c" stroke-width="0.4" opacity="0.3"/>
    </pattern>
    <rect x="6" y="6" width="58" height="114" rx="2" fill="url(#p-back)"/>
    <rect x="16" y="35" width="38" height="56" rx="2" fill="none" stroke="#c9a84c" stroke-width="0.6" opacity="0.4"/>
    <text x="35" y="58" text-anchor="middle" font-size="12" fill="#c9a84c" opacity="0.6" font-family="Georgia, serif" font-weight="bold">M</text>
    <text x="35" y="74" text-anchor="middle" font-size="6" fill="#c9a84c" opacity="0.5" font-family="Georgia, serif" letter-spacing="1.5">TRIESTE</text>
  </svg>`;
}

export function renderCardBackSmall(width = 50, height = 44) {
  return `<svg viewBox="0 0 50 44" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="48" height="42" rx="4" fill="#1a4a8a" stroke="#0e3366" stroke-width="1"/>
    <rect x="3" y="3" width="44" height="38" rx="3" fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.6"/>
    <pattern id="ps-back" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="none" stroke="#c9a84c" stroke-width="0.4" opacity="0.25"/>
    </pattern>
    <rect x="3" y="3" width="44" height="38" rx="3" fill="url(#ps-back)"/>
  </svg>`;
}
