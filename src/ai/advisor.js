import { RANK_POWER, CARD_POINTS, teamOf, partnerSeat } from '../core/constants.js';
import { getLegalPlays } from '../core/rules.js';
import { TOP_RANKS, isMaster, getOpponents, findCurrentWinner, cardValue } from './ai-utils.js';
import { RANK_DISPLAY, SUIT_DISPLAY } from '../core/constants.js';

function cName(card) {
  return `${RANK_DISPLAY[card.rank]} ${SUIT_DISPLAY[card.suit]}`;
}

function pointDesc(card) {
  const p = CARD_POINTS[card.rank];
  if (p.ponti > 0) return 'nosi ponat';
  if (p.terzi > 0) return 'nosi belu (3 bele = 1 ponat)';
  return 'ne nosi bodove';
}

export function analyzeHand(seat, hand, gameState, memory) {
  const { currentTrick, ledSuit } = gameState;
  const legalPlays = getLegalPlays(hand, ledSuit);

  if (legalPlays.length <= 1) {
    return legalPlays.map(c => ({ card: c, score: 100, reason: 'Jedina karta koju možeš odigrati.' }));
  }

  const isLeading = currentTrick.length === 0;
  const analyses = [];

  for (const card of legalPlays) {
    const result = isLeading
      ? evaluateLead(card, seat, hand, legalPlays, memory, gameState)
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

function evaluateLead(card, seat, hand, legalPlays, memory, gameState) {
  let score = 50;
  const reasons = [];
  const suit = card.suit;
  const suitName = SUIT_DISPLAY[suit];
  const suitCards = hand.filter(c => c.suit === suit);
  const topInSuit = suitCards.filter(c => TOP_RANKS.includes(c.rank));
  const master = isMaster(card, memory, hand);

  if (master) {
    score += 30;
    reasons.push(`Najjača preostala karta u ${suitName} — sigurno uzima štig`);
    if (CARD_POINTS[card.rank].ponti > 0) {
      score += 10;
      reasons.push('Donosi siguran ponat jer ju nitko ne može prebiti');
    }
  }

  if (topInSuit.length >= 2 && TOP_RANKS.includes(card.rank)) {
    score += 20;
    reasons.push(`Imaš ${topInSuit.length} vrha u ${suitName} — izvlačiš protivniku jake karte`);
  }

  if (suitCards.length >= 3 && !TOP_RANKS.includes(card.rank) && topInSuit.length >= 1) {
    score += 5;
    reasons.push(`Duga boja (${suitCards.length} karata) s vrhom — možeš izvlačiti karte protivniku`);
  }

  if (suitCards.length === 1 && !TOP_RANKS.includes(card.rank)) {
    score -= 10;
    reasons.push('Sama niska karta — lako je prebiju, bolje sačekati');
  }

  if (!TOP_RANKS.includes(card.rank) && !master) {
    const remaining = memory.getRemainingInSuit(suit);
    const higherOut = remaining.filter(c => RANK_POWER[c.rank] > RANK_POWER[card.rank]).length;
    if (higherOut >= 2) {
      score -= 15;
      reasons.push(`Još ${higherOut} jačih karata u igri — velika šansa da gubiš štig`);
    }
  }

  const isTeamPlay = gameState.config.teamPlay;
  const opponents = getOpponents(seat, isTeamPlay, gameState.config.playerCount);
  const allVoid = opponents.every(o => memory.isVoidIn(o, suit));
  if (allVoid && suitCards.length > 0) {
    score -= 20;
    reasons.push(`Protivnici nemaju ${suitName} — baci nešto u njihovoj boji`);
  }

  if (isTeamPlay) {
    const partnerVoid = memory.isVoidIn(partnerSeat(seat), suit);
    if (partnerVoid && !master) {
      score -= 10;
      reasons.push('Partner nema ovu boju pa ti ne može pomoći');
    }
  }

  if (CARD_POINTS[card.rank].ponti > 0 && !master) {
    score -= 10;
    reasons.push('As bez zaštite — riskantan ponat koji lako gubiš');
  }

  if (!TOP_RANKS.includes(card.rank) && CARD_POINTS[card.rank].terzi === 0 && CARD_POINTS[card.rank].ponti === 0) {
    if (suitCards.length === 1) {
      score -= 5;
      reasons.push('Lišo karta (bez bodova) — ne donosi ništa');
    }
  }

  if (reasons.length === 0) {
    reasons.push(`Standardan potez. ${cName(card)} ${pointDesc(card)}`);
  }

  return { score, reason: reasons.join('. ') + '.' };
}

function evaluateFollow(card, seat, hand, gameState, memory) {
  const { currentTrick, ledSuit } = gameState;
  let score = 50;
  const reasons = [];

  const isTeamPlay = gameState.config.teamPlay;
  const trickSize = gameState.config.playerCount;
  const currentWinner = findCurrentWinner(currentTrick, ledSuit);

  const partnerIsWinning = isTeamPlay && teamOf(currentWinner.seat) === teamOf(seat);
  const isLastToPlay = currentTrick.length === trickSize - 1;
  const followingSuit = card.suit === ledSuit;

  const winnerName = cName(currentWinner.card);

  if (partnerIsWinning) {
    if (followingSuit) {
      if (isLastToPlay) {
        const pts = cardValue(card);
        if (pts > 0) {
          score += 20 + pts * 5;
          reasons.push(`Partner drži štig — dodaj mu bodove (${pointDesc(card)})`);
        } else {
          score += 10;
          reasons.push('Partner drži štig, ti si zadnji — slobodno baci nižu kartu');
        }
      }
      if (RANK_POWER[card.rank] < RANK_POWER[currentWinner.card.rank]) {
        score += 10;
        reasons.push('Čuvaj jaču kartu za kasnije — partner već drži štig');
      } else {
        score -= 5;
        reasons.push('Ne troši jaču kartu kad partner već pobjeđuje');
      }
    } else {
      const pts = cardValue(card);
      if (pts === 0) {
        score += 15;
        reasons.push('Nemaš tu boju — baci lišo (kartu bez bodova)');
      } else {
        score -= 10;
        reasons.push(`Nemaš tu boju, ali ova karta ${pointDesc(card)} — partneru ne možeš dodati jer nisi u boji`);
      }
    }
  } else {
    if (followingSuit) {
      const canBeat = RANK_POWER[card.rank] > RANK_POWER[currentWinner.card.rank];
      if (canBeat) {
        score += 25;
        reasons.push(`Jača od ${winnerName} — uzima štig protivniku`);
        if (isMaster(card, memory, hand)) {
          score += 10;
          reasons.push('Najjača preostala u boji — sigurno uzimanje');
        }
        const legalBeaters = getLegalPlays(hand, ledSuit).filter(c =>
          c.suit === ledSuit && RANK_POWER[c.rank] > RANK_POWER[currentWinner.card.rank]
        );
        if (legalBeaters.length > 1) {
          const isLowest = legalBeaters.every(c => RANK_POWER[card.rank] <= RANK_POWER[c.rank]);
          if (isLowest) {
            score += 5;
            reasons.push('Najmanja karta koja pobjeđuje — štedi jaču za kasnije');
          }
        }
      } else {
        if (CARD_POINTS[card.rank].ponti === 0 && CARD_POINTS[card.rank].terzi === 0) {
          score += 10;
          reasons.push(`Slabija od ${winnerName} — baci lišo da ne daruješ bodove`);
        } else if (RANK_POWER[card.rank] <= 4) {
          score += 5;
          reasons.push('Ne možeš prebiti — barem baci nižu kartu');
        } else {
          score -= 15;
          reasons.push(`Ne možeš prebiti ${winnerName}, a ova karta ${pointDesc(card)} — poklanjanje bodova`);
        }
      }
    } else {
      const pts = cardValue(card);
      if (pts === 0) {
        score += 15;
        reasons.push('Nemaš tu boju — baci kartu bez bodova');
      } else {
        score -= 15;
        reasons.push(`Nemaš tu boju, a ova karta ${pointDesc(card)} — pokloniš bodove protivniku`);
      }
    }
  }

  if (reasons.length === 0) {
    reasons.push(`Standardan potez. ${cName(card)} ${pointDesc(card)}`);
  }

  return { score, reason: reasons.join('. ') + '.' };
}
