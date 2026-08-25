import { SUITS, RANKS, SEATS, SEATS_5, nextSeat, nextSeat5 } from './constants.js';
import { createCard } from './card.js';

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(suit, rank));
    }
  }
  return deck;
}

export function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function deal(dealerSeat, playerCount = 4) {
  const deck = shuffle(createDeck());
  const seats = playerCount === 5 ? SEATS_5 : SEATS;
  const nextFn = playerCount === 5 ? nextSeat5 : nextSeat;
  const hands = {};
  seats.forEach(s => hands[s] = []);

  let cardIdx = 0;
  if (playerCount === 5) {
    let seat = nextFn(dealerSeat);
    for (let p = 0; p < 5; p++) {
      for (let c = 0; c < 8; c++) {
        hands[seat].push(deck[cardIdx++]);
      }
      seat = nextFn(seat);
    }
  } else {
    let seat = nextSeat(dealerSeat);
    for (let round = 0; round < 2; round++) {
      seat = nextSeat(dealerSeat);
      for (let p = 0; p < 4; p++) {
        for (let c = 0; c < 5; c++) {
          hands[seat].push(deck[cardIdx++]);
        }
        seat = nextSeat(seat);
      }
    }
  }

  return hands;
}
