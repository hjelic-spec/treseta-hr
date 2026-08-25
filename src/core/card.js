import { RANK_POWER, CARD_POINTS, SUITS, RANK_DISPLAY, SUIT_DISPLAY } from './constants.js';

export function createCard(suit, rank) {
  return Object.freeze({ suit, rank });
}

export function cardId(card) {
  return `${card.rank}-${card.suit}`;
}

export function cardPower(card) {
  return RANK_POWER[card.rank];
}

export function cardPoints(card) {
  return CARD_POINTS[card.rank];
}

export function compareCards(a, b, ledSuit) {
  const aMatch = a.suit === ledSuit;
  const bMatch = b.suit === ledSuit;
  if (aMatch && !bMatch) return -1;
  if (!aMatch && bMatch) return 1;
  if (!aMatch && !bMatch) return 0;
  return RANK_POWER[b.rank] - RANK_POWER[a.rank];
}

export function sortHand(cards) {
  const suitOrder = {};
  SUITS.forEach((s, i) => suitOrder[s] = i);
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return RANK_POWER[b.rank] - RANK_POWER[a.rank];
  });
}

export function cardDisplayName(card) {
  return `${RANK_DISPLAY[card.rank]} ${SUIT_DISPLAY[card.suit]}`;
}
