import { TOP_RANKS } from './ai-utils.js';

export function shouldSignal(hand, cardToPlay) {
  const suit = cardToPlay.suit;
  const remaining = hand.filter(c => c.suit === suit && !(c.suit === cardToPlay.suit && c.rank === cardToPlay.rank));

  const topInRemaining = remaining.filter(c => TOP_RANKS.includes(c.rank));

  if (topInRemaining.length >= 2) {
    return 'tucem';
  }

  if (remaining.length === 0) {
    return 'striso';
  }

  return null;
}
