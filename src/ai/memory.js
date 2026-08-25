import { SUITS, RANKS, RANK_POWER, SEATS, SEATS_5 } from '../core/constants.js';
import { createCard } from '../core/card.js';

export class CardMemory {
  constructor(playerCount = 4) {
    this.playerCount = playerCount;
    this.reset();
  }

  reset() {
    this.played = [];
    this.playedSet = new Set();
    const seats = this.playerCount === 5 ? SEATS_5 : SEATS;
    this.seatVoids = {};
    for (const seat of seats) {
      this.seatVoids[seat] = new Set();
    }
  }

  recordPlay(seat, card, ledSuit) {
    const key = `${card.rank}-${card.suit}`;
    this.played.push({ seat, card });
    this.playedSet.add(key);

    if (card.suit !== ledSuit && ledSuit !== null) {
      this.seatVoids[seat].add(ledSuit);
    }
  }

  isPlayed(card) {
    return this.playedSet.has(`${card.rank}-${card.suit}`);
  }

  getPlayedInSuit(suit) {
    return this.played.filter(p => p.card.suit === suit).map(p => p.card);
  }

  getRemainingInSuit(suit) {
    const remaining = [];
    for (const rank of RANKS) {
      const card = createCard(suit, rank);
      if (!this.isPlayed(card)) {
        remaining.push(card);
      }
    }
    return remaining;
  }

  isVoidIn(seat, suit) {
    return this.seatVoids[seat].has(suit);
  }

  getHighestRemainingInSuit(suit) {
    const remaining = this.getRemainingInSuit(suit);
    if (remaining.length === 0) return null;
    return remaining.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
  }
}
