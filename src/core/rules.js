import { RANK_POWER } from './constants.js';

export function getLegalPlays(hand, ledSuit) {
  if (!ledSuit) return [...hand];
  const suitCards = hand.filter(c => c.suit === ledSuit);
  return suitCards.length > 0 ? suitCards : [...hand];
}

export function determineTrickWinner(trick) {
  const ledSuit = trick[0].card.suit;
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    const entry = trick[i];
    if (entry.card.suit === ledSuit && RANK_POWER[entry.card.rank] > RANK_POWER[winner.card.rank]) {
      winner = entry;
    }
  }
  return winner.seat;
}

export function canSignal(currentTrick) {
  return currentTrick.length === 0;
}
