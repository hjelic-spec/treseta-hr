import { RANK_POWER, partnerSeat } from '../core/constants.js';

const TOP_RANKS = [3, 2, 1];

export function shouldSignal(hand, ledCard) {
  const suit = ledCard.suit;
  const suitCards = hand.filter(c => c.suit === suit);

  const topInHand = suitCards.filter(c => TOP_RANKS.includes(c.rank));
  const lowInHand = suitCards.filter(c => !TOP_RANKS.includes(c.rank));

  if (topInHand.length >= 2) {
    if (lowInHand.length > 0) return 'striso_tucem';
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

  if (signal.type === 'tucem' || signal.type === 'striso_tucem') {
    return suitCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
  }

  return null;
}
