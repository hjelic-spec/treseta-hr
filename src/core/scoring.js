import { CARD_POINTS } from './constants.js';

export function countTrickPoints(trickCards, uManje = false) {
  let ponti = 0;
  let terzi = 0;
  for (const card of trickCards) {
    if (uManje && card.rank === 1 && card.suit === 'bate') {
      ponti += 11;
    } else {
      const pts = CARD_POINTS[card.rank];
      ponti += pts.ponti;
      terzi += pts.terzi;
    }
  }
  return { ponti, terzi };
}

export function countHandScore(wonTricks, isLastTrickWinner, uManje = false) {
  let totalPonti = 0;
  let totalTerzi = 0;

  for (const trick of wonTricks) {
    const pts = countTrickPoints(trick, uManje);
    totalPonti += pts.ponti;
    totalTerzi += pts.terzi;
  }

  if (isLastTrickWinner) {
    totalPonti += 1;
  }

  totalPonti += Math.floor(totalTerzi / 3);

  return totalPonti;
}

export function checkKapot(trickCounts) {
  if (trickCounts[0] === 10) return 0;
  if (trickCounts[1] === 10) return 1;
  return -1;
}
