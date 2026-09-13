import { RANK_POWER, CARD_POINTS, teamOf, getNextSeat, getSeats } from '../core/constants.js';
import { getLegalPlays } from '../core/rules.js';
import { countTrickPoints } from '../core/scoring.js';

const MAX_NODES = 2_000_000;

export function perfectChooseCard(seat, allHands, gameState) {
  const config = gameState.config;
  const legalPlays = getLegalPlays(allHands[seat], gameState.ledSuit);
  if (legalPlays.length === 1) return legalPlays[0];

  if (config.uManje) {
    return chooseUManje(seat, allHands, gameState, legalPlays);
  }
  return chooseTeam(seat, allHands, gameState, legalPlays);
}

function chooseTeam(seat, allHands, gameState, legalPlays) {
  const config = gameState.config;
  const isMax = teamOf(seat) === 0;
  const hands = cloneHands(allHands, config);
  const acc = buildAcc(gameState);
  const trick = gameState.currentTrick.map(e => ({ seat: e.seat, card: e.card }));
  const counter = { n: 0 };

  const ordered = sortMoves(legalPlays, isMax);
  let bestCard = ordered[0];
  let bestVal = isMax ? -100 : 100;
  let alpha = -100, beta = 100;

  for (const card of ordered) {
    const idx = rmCard(hands[seat], card);
    trick.push({ seat, card });
    const led = trick.length === 1 ? card.suit : gameState.ledSuit;

    let val;
    if (trick.length === config.playerCount) {
      val = solveTrick(hands, trick, gameState.trickNumber, config, acc, alpha, beta, counter);
    } else {
      val = ab(hands, trick, led, getNextSeat(seat, config), gameState.trickNumber, config, acc, alpha, beta, counter);
    }

    trick.pop();
    hands[seat].splice(idx, 0, card);

    if (isMax) {
      if (val > bestVal) { bestVal = val; bestCard = card; }
      if (val > alpha) alpha = val;
    } else {
      if (val < bestVal) { bestVal = val; bestCard = card; }
      if (val < beta) beta = val;
    }
    if (counter.n > MAX_NODES) break;
  }

  return bestCard;
}

function ab(hands, trick, ledSuit, seat, trickNum, config, acc, alpha, beta, counter) {
  if (++counter.n > MAX_NODES) return qEval(acc);

  const legal = getLegalPlays(hands[seat], ledSuit);
  const isMax = teamOf(seat) === 0;
  const isLeading = trick.length === 0;
  const moves = isLeading && legal.length > 2 ? sortMoves(legal, isMax) : legal;

  let best = isMax ? -100 : 100;

  for (const card of moves) {
    const idx = rmCard(hands[seat], card);
    trick.push({ seat, card });
    const led = trick.length === 1 ? card.suit : ledSuit;

    let val;
    if (trick.length === config.playerCount) {
      val = solveTrick(hands, trick, trickNum, config, acc, alpha, beta, counter);
    } else {
      val = ab(hands, trick, led, getNextSeat(seat, config), trickNum, config, acc, alpha, beta, counter);
    }

    trick.pop();
    hands[seat].splice(idx, 0, card);

    if (counter.n > MAX_NODES) return best === (isMax ? -100 : 100) ? val : best;

    if (isMax) {
      if (val > best) best = val;
      if (val > alpha) alpha = val;
    } else {
      if (val < best) best = val;
      if (val < beta) beta = val;
    }
    if (alpha >= beta) break;
  }

  return best;
}

function solveTrick(hands, trick, trickNum, config, acc, alpha, beta, counter) {
  const winner = winnerOf(trick);
  const pts = countTrickPoints(trick.map(e => e.card), false);
  const tm = teamOf(winner);

  acc.p[tm] += pts.ponti;
  acc.t[tm] += pts.terzi;
  acc.tc[tm]++;

  const next = trickNum + 1;
  let val;

  if (next >= 10) {
    val = fEval(acc, winner);
  } else {
    const saved = trick.splice(0);
    val = ab(hands, trick, null, winner, next, config, acc, alpha, beta, counter);
    trick.push(...saved);
  }

  acc.p[tm] -= pts.ponti;
  acc.t[tm] -= pts.terzi;
  acc.tc[tm]--;

  return val;
}

function fEval(acc, lastWinner) {
  const lt = teamOf(lastWinner);
  const s0 = acc.p[0] + Math.floor(acc.t[0] / 3) + (lt === 0 ? 1 : 0);
  const s1 = acc.p[1] + Math.floor(acc.t[1] / 3) + (lt === 1 ? 1 : 0);
  return s0 - s1;
}

function qEval(acc) {
  return (acc.p[0] + Math.floor(acc.t[0] / 3)) - (acc.p[1] + Math.floor(acc.t[1] / 3));
}

// --- U manje: greedy with full information ---

function chooseUManje(seat, allHands, gameState, legalPlays) {
  const config = gameState.config;
  const { currentTrick, ledSuit } = gameState;

  let bestCard = legalPlays[0];
  let bestScore = Infinity;

  for (const card of legalPlays) {
    const simTrick = [...currentTrick, { seat, card }];
    const simLed = currentTrick.length === 0 ? card.suit : ledSuit;

    const tmp = cloneHands(allHands, config);
    rmCard(tmp[seat], card);

    let next = getNextSeat(seat, config);
    while (simTrick.length < config.playerCount) {
      const plays = getLegalPlays(tmp[next], simLed);
      const pick = greedyUM(plays, simTrick, simLed);
      rmCard(tmp[next], pick);
      simTrick.push({ seat: next, card: pick });
      next = getNextSeat(next, config);
    }

    const winner = winnerOf(simTrick);
    let score = 0;
    if (winner === seat) {
      const pts = countTrickPoints(simTrick.map(e => e.card), true);
      score = pts.ponti * 3 + pts.terzi;
    }

    if (score < bestScore || (score === bestScore && cVal(card) < cVal(bestCard))) {
      bestScore = score;
      bestCard = card;
    }
  }

  return bestCard;
}

function greedyUM(legalPlays, trick, ledSuit) {
  if (legalPlays.length === 1) return legalPlays[0];

  const follow = legalPlays[0].suit === ledSuit;
  if (!follow) {
    return legalPlays.reduce((a, b) => cVal(a) > cVal(b) ? a : b);
  }

  const w = winnerEntry(trick);
  const losers = legalPlays.filter(c => RANK_POWER[c.rank] < RANK_POWER[w.card.rank]);
  if (losers.length > 0) {
    return losers.reduce((a, b) => cVal(a) > cVal(b) ? a : b);
  }
  return legalPlays.reduce((a, b) => RANK_POWER[a.rank] < RANK_POWER[b.rank] ? a : b);
}

// --- Helpers ---

function winnerOf(trick) {
  return winnerEntry(trick).seat;
}

function winnerEntry(trick) {
  const led = trick[0].card.suit;
  let w = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (trick[i].card.suit === led && RANK_POWER[trick[i].card.rank] > RANK_POWER[w.card.rank]) {
      w = trick[i];
    }
  }
  return w;
}

function cloneHands(hands, config) {
  const h = {};
  for (const s of getSeats(config)) h[s] = [...hands[s]];
  return h;
}

function buildAcc(gs) {
  const acc = { p: { 0: 0, 1: 0 }, t: { 0: 0, 1: 0 }, tc: { 0: 0, 1: 0 } };
  for (let tm = 0; tm < 2; tm++) {
    acc.tc[tm] = gs.trickCounts[tm] || 0;
    if (gs.tricksWon[tm]) {
      for (const cards of gs.tricksWon[tm]) {
        const pts = countTrickPoints(cards, false);
        acc.p[tm] += pts.ponti;
        acc.t[tm] += pts.terzi;
      }
    }
  }
  return acc;
}

function rmCard(hand, card) {
  const i = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
  if (i >= 0) hand.splice(i, 1);
  return i;
}

function cVal(card) {
  const p = CARD_POINTS[card.rank];
  return p.ponti * 3 + p.terzi;
}

function sortMoves(plays, isMax) {
  return [...plays].sort((a, b) => {
    const d = cVal(b) - cVal(a);
    if (d !== 0) return isMax ? d : -d;
    return isMax ? RANK_POWER[b.rank] - RANK_POWER[a.rank] : RANK_POWER[a.rank] - RANK_POWER[b.rank];
  });
}
