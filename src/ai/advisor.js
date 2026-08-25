import { RANK_POWER, CARD_POINTS, teamOf, partnerSeat, SUITS } from '../core/constants.js';
import { getLegalPlays } from '../core/rules.js';
import { SUIT_DISPLAY, RANK_DISPLAY } from '../core/constants.js';

const TOP_RANKS = [3, 2, 1];

export function analyzeHand(seat, hand, gameState, memory) {
  const { currentTrick, ledSuit } = gameState;
  const legalPlays = getLegalPlays(hand, ledSuit);

  if (legalPlays.length <= 1) {
    return legalPlays.map(c => ({ card: c, score: 100, reason: 'Jedina legalna karta.' }));
  }

  const isLeading = currentTrick.length === 0;
  const analyses = [];

  for (const card of legalPlays) {
    const result = isLeading
      ? evaluateLead(card, seat, hand, legalPlays, memory)
      : evaluateFollow(card, seat, hand, gameState, memory);
    analyses.push({ card, ...result });
  }

  const maxScore = Math.max(...analyses.map(a => a.score));
  for (const a of analyses) {
    if (a.score === maxScore) a.quality = 'best';
    else if (a.score >= maxScore - 15) a.quality = 'good';
    else if (a.score >= maxScore - 35) a.quality = 'ok';
    else a.quality = 'bad';
  }

  analyses.sort((a, b) => b.score - a.score);
  return analyses;
}

export function getHint(seat, hand, gameState, memory) {
  const analyses = analyzeHand(seat, hand, gameState, memory);
  if (analyses.length === 0) return null;
  return analyses[0];
}

export function rateMove(card, seat, hand, gameState, memory) {
  const analyses = analyzeHand(seat, hand, gameState, memory);
  const played = analyses.find(a => a.card.suit === card.suit && a.card.rank === card.rank);
  if (!played) return null;

  const best = analyses[0];
  return {
    quality: played.quality,
    score: played.score,
    bestScore: best.score,
    reason: played.reason,
    wasBest: played.quality === 'best',
    bestCard: best.card,
    bestReason: best.reason
  };
}

function cardName(card) {
  return `${RANK_DISPLAY[card.rank]} ${SUIT_DISPLAY[card.suit]}`;
}

function isMaster(card, memory, hand) {
  const remaining = memory.getRemainingInSuit(card.suit);
  const myCards = hand.filter(c => c.suit === card.suit);
  const all = new Map();
  for (const c of [...remaining, ...myCards]) {
    all.set(`${c.rank}-${c.suit}`, c);
  }
  const sorted = [...all.values()].sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
  return sorted.length > 0 && sorted[0].rank === card.rank;
}

function evaluateLead(card, seat, hand, legalPlays, memory) {
  let score = 50;
  const reasons = [];
  const suit = card.suit;
  const suitCards = hand.filter(c => c.suit === suit);
  const topInSuit = suitCards.filter(c => TOP_RANKS.includes(c.rank));
  const master = isMaster(card, memory, hand);

  if (master) {
    score += 30;
    reasons.push('Master karta - najjača preostala u boji');
    if (CARD_POINTS[card.rank].ponti > 0) {
      score += 10;
      reasons.push('Donosi ponat kao sigurna karta');
    }
  }

  if (topInSuit.length >= 2 && TOP_RANKS.includes(card.rank)) {
    score += 20;
    reasons.push('Imaš 2+ vrha u ovoj boji - zvanje');
  }

  if (suitCards.length >= 3 && !TOP_RANKS.includes(card.rank) && topInSuit.length >= 1) {
    score += 5;
    reasons.push('Duga boja s vrhom - izvlačenje karata');
  }

  if (suitCards.length === 1 && !TOP_RANKS.includes(card.rank)) {
    score -= 10;
    reasons.push('Sama niska karta - loše za vođenje');
  }

  if (!TOP_RANKS.includes(card.rank) && !master) {
    const remaining = memory.getRemainingInSuit(suit);
    const higherOut = remaining.filter(c => RANK_POWER[c.rank] > RANK_POWER[card.rank]).length;
    if (higherOut >= 2) {
      score -= 15;
      reasons.push('Previše jačih karata vani - rizik gubitka ruke');
    }
  }

  const opponents = getOpponents(seat);
  const bothVoid = opponents.every(o => memory.isVoidIn(o, suit));
  if (bothVoid && suitCards.length > 0) {
    score -= 20;
    reasons.push('Oba protivnika su bez ove boje');
  }

  const partnerVoid = memory.isVoidIn(partnerSeat(seat), suit);
  if (partnerVoid && !master) {
    score -= 10;
    reasons.push('Partner nema ovu boju - ne može pomoći');
  }

  if (CARD_POINTS[card.rank].ponti > 0 && !master) {
    score -= 10;
    reasons.push('Riskantan ponat - nije sigurna karta');
  }

  if (!TOP_RANKS.includes(card.rank) && CARD_POINTS[card.rank].terzi === 0 && CARD_POINTS[card.rank].ponti === 0) {
    if (suitCards.length === 1) {
      score -= 5;
      reasons.push('Lišo karta sama - ništa ne donosi');
    }
  }

  return { score, reason: reasons.join('. ') || 'Standardni potez.' };
}

function evaluateFollow(card, seat, hand, gameState, memory) {
  const { currentTrick, ledSuit } = gameState;
  let score = 50;
  const reasons = [];

  const myTeam = teamOf(seat);
  let currentWinner = currentTrick[0];
  for (const entry of currentTrick) {
    if (entry.card.suit === ledSuit && RANK_POWER[entry.card.rank] > RANK_POWER[currentWinner.card.rank]) {
      currentWinner = entry;
    }
  }

  const partnerIsWinning = teamOf(currentWinner.seat) === myTeam;
  const isLastToPlay = currentTrick.length === 3;
  const followingSuit = card.suit === ledSuit;

  if (partnerIsWinning) {
    if (followingSuit) {
      if (isLastToPlay) {
        const pts = CARD_POINTS[card.rank].ponti * 3 + CARD_POINTS[card.rank].terzi;
        if (pts > 0) {
          score += 20 + pts * 5;
          reasons.push('Daj bodove partneru - sigurna ruka');
        }
      }
      if (RANK_POWER[card.rank] < RANK_POWER[currentWinner.card.rank]) {
        score += 10;
        reasons.push('Čuvaj jače karte - partner drži ruku');
      } else {
        score -= 5;
        reasons.push('Ne troši jaču kartu kad partner već drži');
      }
    } else {
      const pts = CARD_POINTS[card.rank].ponti * 3 + CARD_POINTS[card.rank].terzi;
      if (pts === 0) {
        score += 15;
        reasons.push('Baci lišo - partner drži ruku');
      } else {
        score -= 10;
        reasons.push('Ne bacaj bodove kad nisi u boji');
      }
    }
  } else {
    if (followingSuit) {
      const canBeat = RANK_POWER[card.rank] > RANK_POWER[currentWinner.card.rank];
      if (canBeat) {
        score += 25;
        reasons.push('Prebij protivnika');
        if (isMaster(card, memory, hand)) {
          score += 10;
          reasons.push('Master karta - sigurno uzimanje');
        }
        const legalBeaters = getLegalPlays(hand, ledSuit).filter(c =>
          c.suit === ledSuit && RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank]
        );
        if (legalBeaters.length > 1) {
          const isLowest = legalBeaters.every(c => RANK_POWER[card.rank] <= RANK_POWER[c.rank]);
          if (isLowest) {
            score += 5;
            reasons.push('Najmanja karta koja pobjeđuje - štedi jače');
          }
        }
      } else {
        if (CARD_POINTS[card.rank].ponti === 0 && CARD_POINTS[card.rank].terzi === 0) {
          score += 10;
          reasons.push('Ne možeš prebiti - baci lišo');
        } else if (RANK_POWER[card.rank] <= 4) {
          score += 5;
          reasons.push('Niska karta - minimalan gubitak');
        } else {
          score -= 15;
          reasons.push('Ne bacaj bodove protivniku');
        }
      }
    } else {
      const pts = CARD_POINTS[card.rank].ponti * 3 + CARD_POINTS[card.rank].terzi;
      if (pts === 0) {
        score += 15;
        reasons.push('Baci lišo kad nisi u boji');
      } else {
        score -= 15;
        reasons.push('Ne bacaj bodove protivniku');
      }
    }
  }

  return { score, reason: reasons.join('. ') || 'Standardni potez.' };
}

function getOpponents(seat) {
  const myTeam = teamOf(seat);
  return ['south', 'east', 'north', 'west'].filter(s => teamOf(s) !== myTeam);
}
