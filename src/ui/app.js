import { GameController } from '../core/game-controller.js';
import { SEATS, SEATS_5, teamOf, partnerSeat, nextSeat, RANK_DISPLAY, SUIT_DISPLAY, VARIANT_CONFIG } from '../core/constants.js';
import { AIPlayer } from '../ai/ai-player.js';
import { CardMemory } from '../ai/memory.js';
import { analyzeHand, rateMove } from '../ai/advisor.js';
import { createLobby } from './lobby.js';
import { createTable, updatePlayerLabels, updateScores, showInfo, clearTrickArea } from './table-renderer.js';
import { renderHand, createPlayedCard } from './card-renderer.js';
import { renderCardBackSmall } from './card-sprites.js';
import { showSignalButtons, hideSignalButtons, showSignalIndicator } from './signal-ui.js';
import { showHandEndOverlay, showGameEndOverlay, showDeclarations, highlightCurrentPlayer } from './hud.js';
import { SEAT_NAMES, MESSAGES, SIGNAL_LABELS } from './locale.js';
import { playCardSound, playTrickWonSound } from './audio.js';
import { cardId } from '../core/card.js';

let game = null;
let aiPlayers = {};
let playerMemory = null;
let skolaEnabled = false;
let prePlayHand = null;

let currentScreen = null;

export function init() {
  wireMenu();
  showLobby();
}

function updateBackButton() {
  const btn = document.getElementById('back-btn');
  if (!btn) return;
  btn.style.display = currentScreen === 'lobby' ? 'none' : 'flex';
}

function wireMenu() {
  const btn = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('menu-drawer');
  const backdrop = document.getElementById('menu-backdrop');
  const backBtn = document.getElementById('back-btn');

  backBtn.addEventListener('click', () => navigateTo('lobby'));

  function toggleMenu() {
    const open = drawer.classList.toggle('open');
    btn.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
  }

  function closeMenu() {
    drawer.classList.remove('open');
    btn.classList.remove('open');
    backdrop.classList.remove('open');
  }

  btn.addEventListener('click', toggleMenu);
  backdrop.addEventListener('click', closeMenu);

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      closeMenu();
      navigateTo(screen);
    });
  });
}

function navigateTo(screen) {
  if (screen === currentScreen) return;
  if (screen === 'lobby') {
    if (game && game.state.phase !== 'game_end') {
      showConfirmDialog('Napustiti igru?', 'Igra je u tijeku. Želiš li se vratiti u izbornik?', () => {
        showLobby();
      });
    } else {
      showLobby();
    }
  } else if (screen === 'pravila') {
    if (game && game.state.phase !== 'game_end') {
      showConfirmDialog('Napustiti igru?', 'Igra je u tijeku. Želiš li se vratiti u izbornik?', () => {
        showPravila();
      });
    } else {
      showPravila();
    }
  } else if (screen === 'about') {
    if (game && game.state.phase !== 'game_end') {
      showConfirmDialog('Napustiti igru?', 'Igra je u tijeku. Želiš li se vratiti u izbornik?', () => {
        showAbout();
      });
    } else {
      showAbout();
    }
  }
}

function clearGame() {
  if (game) {
    game.destroy();
    game = null;
  }
  aiPlayers = {};
  playerMemory = null;
}

function showLobby() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  clearGame();
  currentScreen = 'lobby';
  updateBackButton();
  root.appendChild(createLobby(startGame));
}

function showPravila() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  clearGame();
  currentScreen = 'pravila';
  updateBackButton();

  const page = document.createElement('div');
  page.className = 'page-screen';
  page.innerHTML = `
    <div class="page-content">
      <h1 class="page-title">Pravila</h1>

      <div class="rule-section">
        <h3>Karte</h3>
        <p>Igra se s napolitanskim kartama (40 karata). Četiri boje: bastoni (štapi), kupe, spade (mačevi), dinari (novci). Vrijednosti: A, 2, 3, 4, 5, 6, 7, Fante, Kavaljer, Kralj.</p>
      </div>

      <div class="rule-section">
        <h3>Igrači i timovi</h3>
        <p>Četiri igrača u dva tima. Partneri sjede nasuprot (Ja + Partner vs. Lijevo + Desno).</p>
      </div>

      <div class="rule-section">
        <h3>Dijeljenje</h3>
        <p>Svaki igrač dobije 10 karata. Dijeli igrač desno od prethodnog djelitelja.</p>
      </div>

      <div class="rule-section">
        <h3>Tijek igre</h3>
        <p>Igrač desno od djelitelja otvara. Svaki igrač baca jednu kartu. Mora se pratiti boja ako je moguće. Ruku odnosi najjača karta otvorene boje.</p>
      </div>

      <div class="rule-section">
        <h3>Vrijednosti karata</h3>
        <p>As = 1 ponat, Trojka = 1 bela, Dvojka = 1 bela, Kralj = 1 bela, Kavaljer = 1 bela, Fante = 1 bela. Ostale karte (4-7) nemaju bodovnu vrijednost. Zadnja ruka nosi 1 ponat.</p>
      </div>

      <div class="rule-section">
        <h3>Bodovanje</h3>
        <p>Igra se do 41 ponat. Svake 3 bele su 1 ponat. Ako jedan tim osvoji sve ruke — to je <strong>kaput</strong> (11 ponata).</p>
      </div>

      <div class="rule-section">
        <h3>Zvanja (varijanta sa zvanjima)</h3>
        <p><strong>Napolitana:</strong> A-2-3 iste boje = 3 boda. <strong>Tri iste:</strong> tri karte istog ranga = 3 boda. <strong>Četiri iste:</strong> četiri karte istog ranga = 4 boda.</p>
      </div>

      <div class="rule-section">
        <h3>Signali</h3>
        <p>Partneru se može signalizirati riječima: <strong>tučem</strong> — jak sam u ovoj boji, baci najjaču kartu da pokupim i vratim ti nazad. <strong>Strišo</strong> — imam još karata od ove boje, baci nešto da mi pokažeš u koju boju da dođem. Signali su vidljivi svima.</p>
      </div>
    </div>
  `;
  root.appendChild(page);
}

function showAbout() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  clearGame();
  currentScreen = 'about';
  updateBackButton();

  const page = document.createElement('div');
  page.className = 'page-screen';
  page.innerHTML = `
    <div class="page-content">
      <h1 class="page-title">O igri</h1>
      <p class="about-text">Trešeta (treseta) je tradicionalna kartaška igra popularna u Dalmaciji, posebno u Dubrovniku. Igra se u parovima s napolitanskim kartama.</p>
      <p class="about-text">Ova verzija donosi dubrovačka pravila igre u digitalni format, uključujući škola mod za učenje.</p>
      <div class="about-info">
        <p>Verzija: 1.0</p>
      </div>
    </div>
  `;
  root.appendChild(page);
}

function showConfirmDialog(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay confirm-overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="btn btn-primary" id="confirm-yes">Da</button>
        <button class="btn btn-secondary" id="confirm-no">Ne</button>
      </div>
    </div>
  `;

  document.getElementById('app').appendChild(overlay);
  setTimeout(() => overlay.classList.add('visible'), 50);

  overlay.querySelector('#confirm-yes').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
  overlay.querySelector('#confirm-no').addEventListener('click', () => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  });
}

function startGame({ mode, variant }) {
  const root = document.getElementById('app');
  root.innerHTML = '';

  game = new GameController(variant);
  const config = VARIANT_CONFIG[variant];
  playerMemory = new CardMemory(config.playerCount);
  const seats = config.playerCount === 5 ? SEATS_5 : SEATS;

  const playerTypes = {};
  seats.forEach(seat => {
    playerTypes[seat] = seat === 'south' ? 'human' : 'ai';
  });

  game.configure(playerTypes);

  seats.forEach(seat => {
    if (seat !== 'south') {
      aiPlayers[seat] = new AIPlayer(seat, config.playerCount);
    }
  });

  const table = createTable(config);
  root.appendChild(table);

  currentScreen = 'game';
  updateBackButton();
  document.getElementById('skola-btn').addEventListener('click', toggleSkola);
  document.getElementById('hint-btn').addEventListener('click', requestHint);

  wireEvents();
  game.startGame();
}

function wireEvents() {
  game.on('game-started', (data) => {
    updatePlayerLabels(game.playerTypes, game.state.dealerSeat, game.state.config);
    updateScores(game.state.scores, game.state.config);
    const target = game.state.config.targetScore;
    showInfo(MESSAGES.playTo(target), 3000);
  });

  game.on('hand-started', (data) => {
    clearTrickArea();
    updatePlayerLabels(game.playerTypes, data.dealerSeat, game.state.config);

    Object.values(aiPlayers).forEach(ai => ai.resetHand());
    playerMemory.reset();

    renderAllHands();
    showInfo(MESSAGES.newHand, 1500);
    hideHint();
    hideMoveRating();
  });

  game.on('declarations-made', (data) => {
    showDeclarations([data]);
    updateScores(game.state.scores, game.state.config);
  });

  game.on('turn-changed', (data) => {
    highlightCurrentPlayer(data.seat);

    if (data.isHuman) {
      const signalContainer = document.getElementById('signals-south');
      if (data.isLeading && data.trickNumber > 0) {
        showSignalButtons(signalContainer, (type) => {
          game.makeSignal(data.seat, type);
        });
      } else {
        hideSignalButtons(signalContainer);
      }
      hideMoveRating();
      renderSouthHand(data.legalPlays);
      showInfo(MESSAGES.yourTurn, 0);
    } else {
      const signalContainer = document.getElementById('signals-south');
      hideSignalButtons(signalContainer);

      setTimeout(() => doAITurn(data.seat, data.trickNumber), 600 + Math.random() * 400);
    }
  });

  game.on('signal-made', (signal) => {
    showSignalIndicator(signal.seat, signal.type);

    Object.values(aiPlayers).forEach(ai => ai.recordSignal(signal));
  });

  game.on('card-played', (data) => {
    Object.values(aiPlayers).forEach(ai => {
      ai.recordCard(data.seat, data.card, game.state.ledSuit || data.card.suit);
    });

    if (data.seat === 'south' && skolaEnabled && prePlayHand) {
      const rating = rateMove(data.card, 'south', prePlayHand, game.state, playerMemory);
      if (rating) showMoveRating(rating);
      prePlayHand = null;
    }

    playerMemory.recordPlay(data.seat, data.card, game.state.ledSuit || data.card.suit);

    const area = document.getElementById('trick-area');
    if (data.trickSize === 1) {
      area.innerHTML = '';
    }

    const seatLabel = getSeatName(data.seat);
    const cardEl = createPlayedCard(data.card, data.seat, seatLabel);
    area.appendChild(cardEl);

    playCardSound();

    renderAllHands();
  });

  game.on('trick-won', (data) => {
    const name = getSeatName(data.winner);
    showInfo(MESSAGES.trickWon(name), 1200);
    playTrickWonSound();

    setTimeout(() => clearTrickArea(), 300);
  });

  game.on('hand-ended', (data) => {
    updateScores(data.totalScores, game.state.config);
    showHandEndOverlay(data.handScores, data.totalScores, data.kapotTeam, data.lastTrickWinner, game.state.config);
  });

  game.on('game-ended', (data) => {
    showGameEndOverlay(data, (action) => {
      if (action === 'lobby') {
        showLobby();
      } else {
        const variant = game.state.config.variant;
        game.destroy();
        startGame({ mode: 'solo', variant });
      }
    });
  });

  game.on('cheat-detected', (data) => {
    showInfo(MESSAGES.cheat, 3000);
    updateScores(game.state.scores, game.state.config);
  });
}

function renderAllHands() {
  const state = game.state;

  if (state.config.playerCount === 5) {
    renderHand(document.getElementById('hand-north'), state.hands.north, false);
    renderEWHand('hand-southeast', state.hands.southeast);
    renderEWHand('hand-northeast', state.hands.northeast);
    renderEWHand('hand-west', state.hands.west);
  } else {
    renderHand(document.getElementById('hand-north'), state.hands.north, false);
    renderEWHand('hand-east', state.hands.east);
    renderEWHand('hand-west', state.hands.west);
  }
}

function renderSouthHand(legalPlays = null) {
  const state = game.state;
  const container = document.getElementById('hand-south');
  const hand = state.hands.south;

  let qualityMap = null;
  if (skolaEnabled && legalPlays && legalPlays.length > 1) {
    const analyses = analyzeHand('south', hand, state, playerMemory);
    qualityMap = new Map();
    for (const a of analyses) {
      qualityMap.set(cardId(a.card), a.quality);
    }
  }

  renderHand(container, hand, true, legalPlays, (card) => {
    prePlayHand = [...hand];
    const signalContainer = document.getElementById('signals-south');
    hideSignalButtons(signalContainer);
    hideHint();
    game.playCard('south', card);
  }, qualityMap);
}

function renderEWHand(containerId, cards) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  cards.forEach((_, i) => {
    const el = document.createElement('div');
    el.className = 'card card-back-small';
    el.innerHTML = renderCardBackSmall();
    el.style.top = (i * 14) + 'px';
    container.appendChild(el);
  });
  container.style.height = ((cards.length - 1) * 14 + 44) + 'px';
}

function doAITurn(seat, trickNumber) {
  const ai = aiPlayers[seat];
  if (!ai) return;

  const state = game.state;
  const hand = state.hands[seat];
  if (hand.length === 0) return;

  const isLeading = state.currentTrick.length === 0;

  if (isLeading) {
    const cardToPlay = ai.decidePlay(hand, state);
    const signalType = trickNumber > 0 ? ai.decideSignal(hand, cardToPlay) : null;
    if (signalType) {
      game.makeSignal(seat, signalType);
      setTimeout(() => game.playCard(seat, cardToPlay), 400);
    } else {
      game.playCard(seat, cardToPlay);
    }
  } else {
    const card = ai.decidePlay(hand, state);
    game.playCard(seat, card);
  }
}

export function toggleSkola() {
  skolaEnabled = !skolaEnabled;
  const btn = document.getElementById('skola-btn');
  if (btn) btn.classList.toggle('skola-active', skolaEnabled);
  const hintBtn = document.getElementById('hint-btn');
  if (hintBtn) hintBtn.classList.toggle('visible', skolaEnabled);
  hideHint();
  hideMoveRating();
  if (game && game.state.phase === 'playing' && game.state.currentSeat === 'south') {
    const legalPlays = game.getLegalPlaysForCurrentSeat();
    renderSouthHand(legalPlays);
  }
}

export function requestHint() {
  if (!game || !skolaEnabled) return;
  const state = game.state;
  if (state.currentSeat !== 'south') return;
  showHintPanel();
}

function showHintPanel() {
  const state = game.state;
  const hand = state.hands.south;
  if (hand.length === 0) return;

  const analyses = analyzeHand('south', hand, state, playerMemory);
  if (analyses.length === 0) return;

  const best = analyses[0];

  const panel = document.getElementById('hint-panel');
  if (!panel) return;

  const qualityLabels = { best: 'Najbolji', good: 'Dobar', ok: 'OK', bad: 'Loš' };

  let html = `<div class="hint-title">Preporuka</div>`;
  html += `<div class="hint-card-name">${cardDisplayName(best.card)}</div>`;
  html += `<div class="hint-reason">${best.reason}</div>`;

  if (analyses.length > 1) {
    html += `<div class="hint-others">`;
    for (let i = 1; i < Math.min(analyses.length, 4); i++) {
      const a = analyses[i];
      const ql = qualityLabels[a.quality] || a.quality;
      html += `<div class="hint-other-card hint-q-${a.quality}">
        <span>${cardDisplayName(a.card)}</span>
        <span class="hint-quality">${ql}</span>
      </div>`;
    }
    html += `</div>`;
  }

  panel.innerHTML = html;
  panel.classList.add('visible');
}

function hideHint() {
  const panel = document.getElementById('hint-panel');
  if (panel) {
    panel.classList.remove('visible');
    panel.innerHTML = '';
  }
}

function showMoveRating(rating) {
  const el = document.getElementById('move-rating');
  if (!el) return;

  const labels = { best: 'Odličan potez!', good: 'Dobar potez', ok: 'Prosječan potez', bad: 'Loš potez' };
  const label = labels[rating.quality] || '';

  let html = `<div class="rating-label rating-${rating.quality}">${label}</div>`;
  if (!rating.wasBest) {
    html += `<div class="rating-better">Bolje: ${cardDisplayName(rating.bestCard)}</div>`;
    html += `<div class="rating-why">${rating.bestReason}</div>`;
  }

  el.innerHTML = html;
  el.classList.add('visible');
}

function hideMoveRating() {
  const el = document.getElementById('move-rating');
  if (el) {
    el.classList.remove('visible');
    el.innerHTML = '';
  }
}

function getSeatName(seat) {
  if (game && !game.state.config.teamPlay && seat === 'north') return 'Gore';
  return SEAT_NAMES[seat] || seat;
}

function cardDisplayName(card) {
  return `${RANK_DISPLAY[card.rank]} ${SUIT_DISPLAY[card.suit]}`;
}
