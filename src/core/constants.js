export const SUITS = ['kupe', 'bate', 'spade', 'dinari'];

export const SUIT_DISPLAY = {
  kupe: 'Kupe',
  bate: 'Bate',
  spade: 'Špade',
  dinari: 'Dinari'
};

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

export const RANK_DISPLAY = {
  1: 'As',
  2: 'Duja',
  3: 'Trica',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  11: 'Fanat',
  12: 'Konj',
  13: 'Kralj'
};

export const RANK_POWER = {
  3: 10,
  2: 9,
  1: 8,
  13: 7,
  12: 6,
  11: 5,
  7: 4,
  6: 3,
  5: 2,
  4: 1
};

export const CARD_POINTS = {
  1: { ponti: 1, terzi: 0 },
  2: { ponti: 0, terzi: 1 },
  3: { ponti: 0, terzi: 1 },
  11: { ponti: 0, terzi: 1 },
  12: { ponti: 0, terzi: 1 },
  13: { ponti: 0, terzi: 1 },
  4: { ponti: 0, terzi: 0 },
  5: { ponti: 0, terzi: 0 },
  6: { ponti: 0, terzi: 0 },
  7: { ponti: 0, terzi: 0 }
};

export const SEATS = ['south', 'east', 'north', 'west'];
export const SEATS_5 = ['south', 'southeast', 'northeast', 'north', 'west'];

export const TEAMS = {
  0: ['south', 'north'],
  1: ['east', 'west']
};

export const SIGNAL_TYPES = ['tucem', 'striso', 'striso_tucem'];

export const PHASES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  DECLARATIONS: 'declarations',
  PLAYING: 'playing',
  TRICK_RESOLVE: 'trick_resolve',
  HAND_END: 'hand_end',
  GAME_END: 'game_end'
};

export const VARIANTS = {
  DUBROVNIK: 'dubrovnik',
  SA_ZVANJIMA: 'sa_zvanjima',
  U_MANJE: 'u_manje'
};

export const VARIANT_CONFIG = {
  dubrovnik: { declarationsEnabled: false, targetScore: 41, playerCount: 4, teamPlay: true, uManje: false },
  sa_zvanjima: { declarationsEnabled: true, targetScore: 41, playerCount: 4, teamPlay: true, uManje: false },
  u_manje: { declarationsEnabled: false, targetScore: 101, playerCount: 5, teamPlay: false, uManje: true }
};

export function teamOf(seat) {
  return TEAMS[0].includes(seat) ? 0 : 1;
}

export function partnerSeat(seat) {
  const idx = SEATS.indexOf(seat);
  return SEATS[(idx + 2) % 4];
}

export function nextSeat(seat) {
  const idx = SEATS.indexOf(seat);
  return SEATS[(idx + 3) % 4];
}

export function nextSeat5(seat) {
  const idx = SEATS_5.indexOf(seat);
  return SEATS_5[(idx + 4) % 5];
}

export function getSeats(config) {
  return config.playerCount === 5 ? SEATS_5 : SEATS;
}

export function getNextSeat(seat, config) {
  return config.playerCount === 5 ? nextSeat5(seat) : nextSeat(seat);
}
