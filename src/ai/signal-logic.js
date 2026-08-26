import { RANK_POWER } from '../core/constants.js';
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

export function respondToPartnerSignal(signal, hand, ledSuit) {
  if (!signal) return null;

  const suitCards = hand.filter(c => c.suit === ledSuit);
  if (suitCards.length === 0) return null;

  if (signal.type === 'tucem') {
    return suitCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
  }

  return null;
}
