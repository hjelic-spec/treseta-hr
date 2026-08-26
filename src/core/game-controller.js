import { SEATS, SEATS_5, PHASES, teamOf, nextSeat, getSeats, getNextSeat } from './constants.js';
import { cardId, sortHand } from './card.js';
import { deal } from './deck.js';
import { getLegalPlays, determineTrickWinner, canSignal } from './rules.js';
import { countHandScore, checkKapot } from './scoring.js';
import { detectDeclarations, totalDeclarationPoints } from './declarations.js';
import { createSignal } from './signals.js';
import { createInitialState } from './game-state.js';
import { EventBus } from './event-bus.js';

export class GameController {
  constructor(variant = 'dubrovnik') {
    this.bus = new EventBus();
    this.state = createInitialState(variant);
    this.playerTypes = {};
    this._trickResolveTimer = null;
    this._aiTimers = [];
  }

  on(event, fn) {
    return this.bus.on(event, fn);
  }

  configure(playerTypes) {
    this.playerTypes = { ...playerTypes };
  }

  get seats() {
    return getSeats(this.state.config);
  }

  get isTeamPlay() {
    return this.state.config.teamPlay;
  }

  _nextSeat(seat) {
    return getNextSeat(seat, this.state.config);
  }

  startGame() {
    const s = this.state;
    if (this.isTeamPlay) {
      s.scores = [0, 0];
    } else {
      this.seats.forEach(seat => s.scores[seat] = 0);
    }
    this._startNewHand();
    this.bus.emit('game-started', { config: s.config, playerTypes: this.playerTypes });
  }

  _startNewHand() {
    const s = this.state;
    s.hands = deal(s.dealerSeat, s.config.playerCount);

    this.seats.forEach(seat => {
      s.hands[seat] = sortHand(s.hands[seat]);
    });

    s.trickNumber = 0;
    s.currentTrick = [];
    s.ledSuit = null;
    s.currentSignal = null;
    s.declarations = [];

    if (this.isTeamPlay) {
      s.handScores = [0, 0];
      s.tricksWon = [[], []];
      s.trickCounts = [0, 0];
    } else {
      this.seats.forEach(seat => {
        s.handScores[seat] = 0;
        s.tricksWon[seat] = [];
        s.trickCounts[seat] = 0;
      });
    }

    const firstPlayer = this._nextSeat(s.dealerSeat);
    s.currentSeat = firstPlayer;

    if (s.config.declarationsEnabled) {
      s.phase = PHASES.DECLARATIONS;
      this._processDeclarations();
    } else {
      s.phase = PHASES.PLAYING;
    }

    this.bus.emit('hand-started', {
      dealerSeat: s.dealerSeat,
      hands: { ...s.hands },
      firstPlayer
    });

    if (s.phase === PHASES.PLAYING) {
      this._emitTurnChanged();
    }
  }

  _processDeclarations() {
    const s = this.state;
    for (const seat of this.seats) {
      const decls = detectDeclarations(s.hands[seat]);
      if (decls.length > 0) {
        const points = totalDeclarationPoints(decls);
        if (this.isTeamPlay) {
          const team = teamOf(seat);
          s.scores[team] += points;
        } else {
          s.scores[seat] += points;
        }
        s.declarations.push({ seat, declarations: decls, points });
        this.bus.emit('declarations-made', { seat, declarations: decls, points });
      }
    }

    s.phase = PHASES.PLAYING;
    this._emitTurnChanged();
  }

  _emitTurnChanged() {
    const s = this.state;
    const legalPlays = getLegalPlays(s.hands[s.currentSeat], s.ledSuit);
    const isLeading = s.currentTrick.length === 0;

    this.bus.emit('turn-changed', {
      seat: s.currentSeat,
      legalPlays,
      isLeading,
      isHuman: this.playerTypes[s.currentSeat] === 'human',
      trickNumber: s.trickNumber
    });
  }

  makeSignal(seat, signalType) {
    const s = this.state;
    if (!s.config.teamPlay) return false;
    if (seat !== s.currentSeat) return false;
    if (!canSignal(seat, s.currentTrick)) return false;
    if (s.trickNumber === 0) return false;

    const suit = s.ledSuit || (s.currentTrick.length > 0 ? s.currentTrick[0].card.suit : null);
    s.currentSignal = createSignal(signalType, seat, suit);
    this.bus.emit('signal-made', s.currentSignal);
    return true;
  }

  playCard(seat, card) {
    const s = this.state;
    if (s.phase !== PHASES.PLAYING) return false;
    if (seat !== s.currentSeat) return false;

    const hand = s.hands[seat];
    const cardIndex = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
    if (cardIndex === -1) return false;

    if (s.currentTrick.length === 0) {
      s.ledSuit = card.suit;
    }

    const legalPlays = getLegalPlays(hand, s.ledSuit);
    const isLegal = legalPlays.some(c => c.suit === card.suit && c.rank === card.rank);
    if (!isLegal) return false;

    hand.splice(cardIndex, 1);
    s.currentTrick.push({ seat, card });

    this.bus.emit('card-played', { seat, card, trickSize: s.currentTrick.length });

    const trickSize = s.config.playerCount;
    if (s.currentTrick.length === trickSize) {
      this._scheduleTrickResolve();
    } else {
      s.currentSeat = this._nextSeat(s.currentSeat);
      this._emitTurnChanged();
    }

    return true;
  }

  _scheduleTrickResolve() {
    this.state.phase = PHASES.TRICK_RESOLVE;
    this._trickResolveTimer = setTimeout(() => this._resolveTrick(), 800);
  }

  _resolveTrick() {
    const s = this.state;
    const winner = determineTrickWinner(s.currentTrick);
    const trickCards = s.currentTrick.map(e => e.card);

    if (this.isTeamPlay) {
      const team = teamOf(winner);
      s.tricksWon[team].push(trickCards);
      s.trickCounts[team]++;
    } else {
      s.tricksWon[winner].push(trickCards);
      s.trickCounts[winner]++;
    }
    s.trickNumber++;

    this.bus.emit('trick-won', {
      winner,
      team: this.isTeamPlay ? teamOf(winner) : null,
      trickCards,
      trickNumber: s.trickNumber
    });

    s.currentTrick = [];
    s.ledSuit = null;
    s.currentSignal = null;

    const totalTricks = s.config.playerCount === 5 ? 8 : 10;
    if (s.trickNumber === totalTricks) {
      this._endHand(winner);
    } else {
      s.currentSeat = winner;
      s.phase = PHASES.PLAYING;
      this._aiTimers.push(setTimeout(() => {
        this._aiTimers = [];
        this._emitTurnChanged();
      }, 800));
    }
  }

  _endHand(lastTrickWinner) {
    const s = this.state;
    s.phase = PHASES.HAND_END;
    const uManje = s.config.uManje;

    if (this.isTeamPlay) {
      const lastTeam = teamOf(lastTrickWinner);
      for (let t = 0; t < 2; t++) {
        s.handScores[t] = countHandScore(s.tricksWon[t], t === lastTeam, uManje);
      }
      const kapotTeam = checkKapot(s.trickCounts);
      s.scores[0] += s.handScores[0];
      s.scores[1] += s.handScores[1];

      this.bus.emit('hand-ended', {
        handScores: [...s.handScores],
        totalScores: [...s.scores],
        kapotTeam,
        trickCounts: [...s.trickCounts],
        lastTrickWinner
      });
    } else {
      this.seats.forEach(seat => {
        const isLast = seat === lastTrickWinner;
        s.handScores[seat] = countHandScore(s.tricksWon[seat], isLast, uManje);
        s.scores[seat] += s.handScores[seat];
      });

      this.bus.emit('hand-ended', {
        handScores: { ...s.handScores },
        totalScores: { ...s.scores },
        kapotTeam: -1,
        trickCounts: { ...s.trickCounts },
        lastTrickWinner
      });
    }

    if (this._checkGameEnd()) return;

    s.dealerSeat = this._nextSeat(s.dealerSeat);
    setTimeout(() => this._startNewHand(), 1500);
  }

  _checkGameEnd() {
    const s = this.state;
    const target = s.config.targetScore;

    if (this.isTeamPlay) {
      if (s.scores[0] >= target || s.scores[1] >= target) {
        s.phase = PHASES.GAME_END;
        const winner = s.scores[0] >= target ? 0 : 1;
        this.bus.emit('game-ended', {
          winnerTeam: winner,
          finalScores: [...s.scores]
        });
        return true;
      }
    } else {
      const anyOver = this.seats.some(seat => s.scores[seat] >= target);
      if (anyOver) {
        s.phase = PHASES.GAME_END;
        let bestSeat = this.seats[0];
        for (const seat of this.seats) {
          if (s.scores[seat] < s.scores[bestSeat]) bestSeat = seat;
        }
        this.bus.emit('game-ended', {
          winnerSeat: bestSeat,
          finalScores: { ...s.scores },
          config: s.config
        });
        return true;
      }
    }
    return false;
  }

  _handleCheat(seat) {
    if (this.isTeamPlay) {
      const team = teamOf(seat);
      const otherTeam = 1 - team;
      this.state.scores[otherTeam] += 11;
    } else {
      this.state.scores[seat] += 11;
    }
    this.bus.emit('cheat-detected', { seat });

    if (this._checkGameEnd()) return;
  }

  getLegalPlaysForCurrentSeat() {
    const s = this.state;
    if (!s.currentSeat) return [];
    return getLegalPlays(s.hands[s.currentSeat], s.ledSuit);
  }

  getState() {
    return this.state;
  }

  destroy() {
    if (this._trickResolveTimer) clearTimeout(this._trickResolveTimer);
    this._aiTimers.forEach(t => clearTimeout(t));
  }
}
