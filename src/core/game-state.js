import { SEATS, SEATS_5, PHASES, VARIANT_CONFIG, getSeats } from './constants.js';

export function createInitialState(variant = 'dubrovnik') {
  const config = { ...VARIANT_CONFIG[variant], variant };
  const seats = getSeats(config);
  const hands = {};
  seats.forEach(s => hands[s] = []);

  if (config.teamPlay) {
    return {
      phase: PHASES.LOBBY,
      hands,
      scores: [0, 0],
      handScores: [0, 0],
      currentTrick: [],
      ledSuit: null,
      currentSeat: null,
      dealerSeat: 'south',
      trickNumber: 0,
      tricksWon: [[], []],
      trickCounts: [0, 0],
      declarations: [],
      currentSignal: null,
      config
    };
  }

  const scores = {};
  const handScores = {};
  const tricksWon = {};
  const trickCounts = {};
  seats.forEach(s => {
    scores[s] = 0;
    handScores[s] = 0;
    tricksWon[s] = [];
    trickCounts[s] = 0;
  });

  return {
    phase: PHASES.LOBBY,
    hands,
    scores,
    handScores,
    currentTrick: [],
    ledSuit: null,
    currentSeat: null,
    dealerSeat: 'south',
    trickNumber: 0,
    tricksWon,
    trickCounts,
    declarations: [],
    currentSignal: null,
    config
  };
}

