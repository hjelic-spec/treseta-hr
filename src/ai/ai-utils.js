import { RANK_POWER, CARD_POINTS, teamOf, SEATS, SEATS_5 } from '../core/constants.js';

export const TOP_RANKS = [3, 2, 1];

export function isMaster(card, memory, hand) {
  const remaining = memory.getRemainingInSuit(card.suit);
  const myCards = hand.filter(c => c.suit === card.suit);
  const seen = new Set();
  const unique = [];
  for (const c of [...remaining, ...myCards]) {
    const key = `${c.rank}-${c.suit}`;
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
  }
  unique.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
  return unique.length > 0 && unique[0].rank === card.rank;
}

export function getOpponents(seat, isTeamPlay, playerCount) {
  if (isTeamPlay) {
    const myTeam = teamOf(seat);
    return SEATS.filter(s => teamOf(s) !== myTeam);
  }
  const seats = playerCount === 5 ? SEATS_5 : SEATS;
  return seats.filter(s => s !== seat);
}

export function findCurrentWinner(currentTrick, ledSuit) {
  let winner = currentTrick[0];
  for (const entry of currentTrick) {
    if (entry.card.suit === ledSuit && RANK_POWER[entry.card.rank] > RANK_POWER[winner.card.rank]) {
      winner = entry;
    }
  }
  return winner;
}

export function pickLowestValue(cards) {
  return cards.sort((a, b) => {
    const va = CARD_POINTS[a.rank].ponti * 3 + CARD_POINTS[a.rank].terzi;
    const vb = CARD_POINTS[b.rank].ponti * 3 + CARD_POINTS[b.rank].terzi;
    if (va !== vb) return va - vb;
    return RANK_POWER[a.rank] - RANK_POWER[b.rank];
  })[0];
}
