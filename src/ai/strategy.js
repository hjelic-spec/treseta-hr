import { RANK_POWER, CARD_POINTS, teamOf, partnerSeat, SUITS, SEATS, SEATS_5 } from '../core/constants.js';
import { cardPower } from '../core/card.js';
import { getLegalPlays } from '../core/rules.js';

const TOP_RANKS = [3, 2, 1];

export function chooseCard(seat, hand, gameState, memory, partnerSignal) {
  const { currentTrick, ledSuit } = gameState;
  const legalPlays = getLegalPlays(hand, ledSuit);

  if (legalPlays.length === 1) return legalPlays[0];

  const isTeamPlay = gameState.config.teamPlay;

  if (currentTrick.length === 0) {
    return chooseLead(seat, legalPlays, hand, memory, isTeamPlay ? partnerSignal : null, gameState);
  }

  return chooseFollow(seat, legalPlays, gameState, memory, isTeamPlay ? partnerSignal : null);
}

function isMaster(card, memory, hand) {
  const remaining = memory.getRemainingInSuit(card.suit);
  const allCards = [...remaining, ...hand.filter(c => c.suit === card.suit)];
  const unique = [];
  const seen = new Set();
  for (const c of allCards) {
    const key = `${c.rank}-${c.suit}`;
    if (!seen.has(key)) { seen.add(key); unique.push(c); }
  }
  unique.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
  return unique.length > 0 && unique[0].rank === card.rank;
}

function chooseLead(seat, legalPlays, hand, memory, partnerSignal, gameState) {
  if (partnerSignal && (partnerSignal.type === 'tucem' || partnerSignal.type === 'striso_tucem')) {
    const returnCards = legalPlays.filter(c => c.suit === partnerSignal.suit);
    if (returnCards.length > 0) {
      return returnCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
    }
  }

  const masters = legalPlays.filter(c => isMaster(c, memory, hand));
  if (masters.length > 0) {
    const pointMasters = masters.filter(c => CARD_POINTS[c.rank].ponti > 0 || CARD_POINTS[c.rank].terzi > 0);
    if (pointMasters.length > 0) {
      return pointMasters.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
    }
    return masters.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
  }

  const isTeamPlay = gameState.config.teamPlay;
  const opponents = getOpponents(seat, isTeamPlay, gameState.config.playerCount);

  const suitAnalysis = [];
  for (const suit of SUITS) {
    const suitCards = hand.filter(c => c.suit === suit);
    if (suitCards.length === 0) continue;

    const topCount = suitCards.filter(c => TOP_RANKS.includes(c.rank)).length;
    const remaining = memory.getRemainingInSuit(suit);
    const higherOutCount = remaining.filter(c =>
      RANK_POWER[c.rank] > RANK_POWER[suitCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0].rank]
    ).length;

    let opponentVoid = false;
    if (opponents.length >= 2) {
      opponentVoid = memory.isVoidIn(opponents[0], suit) && memory.isVoidIn(opponents[1], suit);
    }

    suitAnalysis.push({
      suit,
      cards: suitCards,
      topCount,
      length: suitCards.length,
      higherOut: higherOutCount,
      opponentVoid,
      score: topCount * 15 + suitCards.length * 3 - higherOutCount * 5 + (opponentVoid ? -20 : 0)
    });
  }

  suitAnalysis.sort((a, b) => b.score - a.score);

  if (suitAnalysis.length > 0) {
    const best = suitAnalysis[0];
    const suitCards = legalPlays.filter(c => c.suit === best.suit);
    if (suitCards.length > 0) {
      if (best.topCount >= 2) {
        return suitCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
      }
      if (best.topCount === 1 && best.length >= 3) {
        return suitCards.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
      }
      return suitCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
    }
  }

  return legalPlays.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
}

function chooseFollow(seat, legalPlays, gameState, memory, partnerSignal) {
  const { currentTrick, ledSuit } = gameState;
  const isTeamPlay = gameState.config.teamPlay;

  let currentWinner = currentTrick[0];
  for (const entry of currentTrick) {
    if (entry.card.suit === ledSuit && RANK_POWER[entry.card.rank] > RANK_POWER[currentWinner.card.rank]) {
      currentWinner = entry;
    }
  }

  const partnerIsWinning = isTeamPlay && teamOf(currentWinner.seat) === teamOf(seat);
  const trickSize = gameState.config.playerCount;
  const isLastToPlay = currentTrick.length === trickSize - 1;
  const followingSuit = legalPlays[0]?.suit === ledSuit;

  if (isTeamPlay && partnerSignal && (partnerSignal.type === 'tucem' || partnerSignal.type === 'striso_tucem') &&
      partnerSignal.seat === partnerSeat(seat) && followingSuit) {
    return legalPlays.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
  }

  if (partnerIsWinning) {
    if (followingSuit) {
      if (isLastToPlay) {
        const pointCards = legalPlays.filter(c => {
          const pts = CARD_POINTS[c.rank];
          return pts.ponti > 0 || pts.terzi > 0;
        });
        if (pointCards.length > 0) {
          return pointCards.sort((a, b) => {
            const pa = CARD_POINTS[a.rank].ponti * 3 + CARD_POINTS[a.rank].terzi;
            const pb = CARD_POINTS[b.rank].ponti * 3 + CARD_POINTS[b.rank].terzi;
            return pb - pa;
          })[0];
        }
      }

      const canWinHigher = legalPlays.some(c =>
        RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank] && isMaster(c, memory, gameState.hands[seat])
      );
      if (canWinHigher) {
        const master = legalPlays.filter(c =>
          RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank] && isMaster(c, memory, gameState.hands[seat])
        ).sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
        return master;
      }

      return legalPlays.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
    }

    return pickLowestValue(legalPlays);
  }

  if (followingSuit) {
    const beaters = legalPlays.filter(c =>
      RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank]
    );

    if (beaters.length > 0) {
      if (isLastToPlay) {
        return beaters.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
      }

      const masterBeaters = beaters.filter(c => isMaster(c, memory, gameState.hands[seat]));
      if (masterBeaters.length > 0) {
        return masterBeaters.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
      }

      return beaters.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
    }

    return legalPlays.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
  }

  return pickLowestValue(legalPlays);
}

function getOpponents(seat, isTeamPlay, playerCount) {
  if (isTeamPlay) {
    const myTeam = teamOf(seat);
    return SEATS.filter(s => teamOf(s) !== myTeam);
  }
  const seats = playerCount === 5 ? SEATS_5 : SEATS;
  return seats.filter(s => s !== seat);
}

function pickLowestValue(cards) {
  return cards.sort((a, b) => {
    const va = CARD_POINTS[a.rank].ponti * 3 + CARD_POINTS[a.rank].terzi;
    const vb = CARD_POINTS[b.rank].ponti * 3 + CARD_POINTS[b.rank].terzi;
    if (va !== vb) return va - vb;
    return RANK_POWER[a.rank] - RANK_POWER[b.rank];
  })[0];
}
