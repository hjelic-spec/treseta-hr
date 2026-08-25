import { CardMemory } from './memory.js';
import { chooseCard } from './strategy.js';
import { shouldSignal, respondToPartnerSignal } from './signal-logic.js';
import { partnerSeat } from '../core/constants.js';
import { detectDeclarations } from '../core/declarations.js';

export class AIPlayer {
  constructor(seat, playerCount = 4) {
    this.seat = seat;
    this.playerCount = playerCount;
    this.memory = new CardMemory(playerCount);
    this.lastPartnerSignal = null;
  }

  resetHand() {
    this.memory.reset();
    this.lastPartnerSignal = null;
  }

  recordCard(seat, card, ledSuit) {
    this.memory.recordPlay(seat, card, ledSuit);
  }

  recordSignal(signal) {
    if (this.playerCount === 4 && signal.seat === partnerSeat(this.seat)) {
      this.lastPartnerSignal = signal;
    }
  }

  decidePlay(hand, gameState) {
    return chooseCard(this.seat, hand, gameState, this.memory, this.lastPartnerSignal);
  }

  decideSignal(hand, cardToPlay) {
    if (!cardToPlay) return null;
    return shouldSignal(hand, cardToPlay);
  }

  decideDeclarations(hand) {
    return detectDeclarations(hand);
  }
}
