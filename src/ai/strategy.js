import { RANK_POWER, CARD_POINTS, teamOf, partnerSeat, SUITS } from '../core/constants.js';
import { getLegalPlays } from '../core/rules.js';
import { TOP_RANKS, isMaster, getOpponents, pickLowestValue, findCurrentWinner } from './ai-utils.js';

export function chooseCard(seat, hand, gameState, memory, partnerSignal) {
  const { currentTrick, ledSuit } = gameState;
  const legalPlays = getLegalPlays(hand, ledSuit);

  if (legalPlays.length === 1) return legalPlays[0];

  const isTeamPlay = gameState.config.teamPlay;

  if (gameState.config.uManje) {
    if (currentTrick.length === 0) {
      return chooseLeadUManje(seat, legalPlays, hand, memory, gameState);
    }
    return chooseFollowUManje(seat, legalPlays, gameState, memory);
  }

  if (currentTrick.length === 0) {
    return chooseLead(seat, legalPlays, hand, memory, isTeamPlay ? partnerSignal : null, gameState);
  }

  return chooseFollow(seat, legalPlays, gameState, memory, isTeamPlay ? partnerSignal : null);
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
    const bestRank = Math.max(...suitCards.map(c => RANK_POWER[c.rank]));
    const higherOutCount = remaining.filter(c => RANK_POWER[c.rank] > bestRank).length;

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
  const currentWinner = findCurrentWinner(currentTrick, ledSuit);

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

      const masterBeaters = legalPlays.filter(c =>
        RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank] && isMaster(c, memory, gameState.hands[seat])
      );
      if (masterBeaters.length > 0) {
        return masterBeaters.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
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

function pickHighestValue(cards) {
  return cards.sort((a, b) => {
    const va = cardValue(a);
    const vb = cardValue(b);
    if (va !== vb) return vb - va;
    return RANK_POWER[b.rank] - RANK_POWER[a.rank];
  })[0];
}

function cardValue(card) {
  if (card.rank === 1 && card.suit === 'bate') return 33;
  return CARD_POINTS[card.rank].ponti * 3 + CARD_POINTS[card.rank].terzi;
}

function chooseLeadUManje(seat, legalPlays, hand, memory, gameState) {
  const suitGroups = {};
  for (const c of legalPlays) {
    if (!suitGroups[c.suit]) suitGroups[c.suit] = [];
    suitGroups[c.suit].push(c);
  }

  let bestSuit = null;
  let bestScore = -Infinity;

  for (const suit of Object.keys(suitGroups)) {
    const cards = suitGroups[suit];
    const remaining = memory.getRemainingInSuit(suit);
    const topRank = Math.max(...cards.map(c => RANK_POWER[c.rank]));
    const higherOut = remaining.filter(c => RANK_POWER[c.rank] > topRank).length;
    const topCard = cards.find(c => RANK_POWER[c.rank] === topRank);

    const score = higherOut * 10 - cards.length * 3 - (isMaster(topCard, memory, hand) ? 20 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestSuit = suit;
    }
  }

  if (bestSuit) {
    const suitCards = suitGroups[bestSuit];
    return suitCards.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
  }

  return legalPlays.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
}

function chooseFollowUManje(seat, legalPlays, gameState, memory) {
  const { currentTrick, ledSuit } = gameState;
  const currentWinner = findCurrentWinner(currentTrick, ledSuit);

  const followingSuit = legalPlays[0]?.suit === ledSuit;

  if (!followingSuit) {
    return pickHighestValue(legalPlays);
  }

  const underCards = legalPlays.filter(c =>
    RANK_POWER[c.rank] < RANK_POWER[currentWinner.card.rank]
  );

  if (underCards.length > 0) {
    return pickHighestValue(underCards);
  }

  return legalPlays.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
}
