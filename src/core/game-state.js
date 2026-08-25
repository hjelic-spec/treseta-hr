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

export function cloneState(state) {
  return {
    ...state,
    hands: Object.fromEntries(
      Object.entries(state.hands).map(([k, v]) => [k, [...v]])
    ),
    scores: Array.isArray(state.scores) ? [...state.scores] : { ...state.scores },
    handScores: Array.isArray(state.handScores) ? [...state.handScores] : { ...state.handScores },
    currentTrick: state.currentTrick.map(e => ({ ...e, card: { ...e.card } })),
    tricksWon: Array.isArray(state.tricksWon)
      ? [state.tricksWon[0].map(t => [...t]), state.tricksWon[1].map(t => [...t])]
      : Object.fromEntries(Object.entries(state.tricksWon).map(([k, v]) => [k, v.map(t => [...t])])),
    trickCounts: Array.isArray(state.trickCounts) ? [...state.trickCounts] : { ...state.trickCounts },
    declarations: [...state.declarations]
  };
}
