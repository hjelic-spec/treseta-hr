export const SEAT_NAMES = {
  south: 'Ja',
  east: 'Desno',
  north: 'Partner',
  west: 'Lijevo',
  southeast: 'Desno 1',
  northeast: 'Desno 2'
};

export const TEAM_NAMES = ['Mi', 'Vi'];

export const SIGNAL_LABELS = {
  tucem: 'Tučem',
  striso: 'Strišo'
};

export function getSeatName(seat, config) {
  if (config && !config.teamPlay && seat === 'north') return 'Gore';
  return SEAT_NAMES[seat] || seat;
}

export const MESSAGES = {
  yourTurn: 'Tvoj potez',
  dealing: 'Dijeljenje...',
  gameOver: 'Kraj igre!',
  weWin: 'Mi smo pobijedili!',
  theyWin: 'Oni su pobijedili!',
  kapot: 'KAPUT!',
  newHand: 'Nova ruka',
  cheat: 'Varanje! +11 ponata kazne',
  lastTrick: 'Ultima! +1 ponat',
  trickWon: (name) => `${name} uzima ruku`,
  score: (mi, vi) => `Mi: ${mi} | Vi: ${vi}`,
  handScore: (mi, vi) => `Ova ruka: Mi ${mi} - Vi ${vi} ponata`,
  playTo: (n) => `Igra se do ${n} ponata`,
  declarations: 'Zvanja',
  napolitana: (suit) => `Napolitana u ${suit}`,
  threeOfKind: (rank) => `Tri ${rank}`,
  fourOfKind: (rank) => `Četiri ${rank}`
};
