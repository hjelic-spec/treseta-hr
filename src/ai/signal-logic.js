import { TOP_RANKS } from './ai-utils.js';

export function shouldSignal(hand, ledCard) {
  const suit = ledCard.suit;
  const suitCards = hand.filter(c => c.suit === suit);

  const topInHand = suitCards.filter(c => TOP_RANKS.includes(c.rank));
  const lowInHand = suitCards.filter(c => !TOP_RANKS.includes(c.rank));

  if (topInHand.length >= 2) {
    return 'tucem';
  }

  if (suitCards.length >= 3 && lowInHand.length >= 2) {
    return 'striso';
  }

  return null;
}
