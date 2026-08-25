import { SEAT_NAMES } from './locale.js';

export function createTable(config = null) {
  const table = document.createElement('div');
  table.id = 'game-table';

  const is5 = config && config.playerCount === 5;

  if (is5) {
    table.classList.add('five-players');
    table.innerHTML = `
      <div class="table-felt">
        <div class="player-zone player-south">
          <div class="player-label" id="label-south"></div>
          <div class="hand-container" id="hand-south"></div>
          <div class="signal-buttons" id="signals-south"></div>
        </div>
        <div class="player-zone player-north">
          <div class="player-label" id="label-north"></div>
          <div class="hand-container" id="hand-north"></div>
        </div>
        <div class="player-zone player-southeast">
          <div class="player-label" id="label-southeast"></div>
          <div class="hand-container hand-vertical" id="hand-southeast"></div>
        </div>
        <div class="player-zone player-northeast">
          <div class="player-label" id="label-northeast"></div>
          <div class="hand-container hand-vertical" id="hand-northeast"></div>
        </div>
        <div class="player-zone player-west">
          <div class="player-label" id="label-west"></div>
          <div class="hand-container hand-vertical" id="hand-west"></div>
        </div>
        <div class="trick-area" id="trick-area"></div>
        <div class="dealer-indicator" id="dealer-indicator"></div>
        <div class="signal-display" id="signal-display"></div>
      </div>
      <div class="score-panel score-panel-individual" id="score-panel"></div>
      <div class="info-bar" id="info-bar"></div>
      <button class="skola-btn" id="skola-btn" title="Škola - savjeti za igru">Škola</button>
      <button class="hint-btn" id="hint-btn" title="Pokaži hint">?</button>
      <div class="hint-panel" id="hint-panel"></div>
      <div class="move-rating" id="move-rating"></div>
    `;
  } else {
    table.innerHTML = `
      <div class="table-felt">
        <div class="player-zone player-south">
          <div class="player-label" id="label-south"></div>
          <div class="hand-container" id="hand-south"></div>
          <div class="signal-buttons" id="signals-south"></div>
        </div>
        <div class="player-zone player-north">
          <div class="player-label" id="label-north"></div>
          <div class="hand-container" id="hand-north"></div>
        </div>
        <div class="player-zone player-east">
          <div class="player-label" id="label-east"></div>
          <div class="hand-container hand-vertical" id="hand-east"></div>
        </div>
        <div class="player-zone player-west">
          <div class="player-label" id="label-west"></div>
          <div class="hand-container hand-vertical" id="hand-west"></div>
        </div>
        <div class="trick-area" id="trick-area"></div>
        <div class="dealer-indicator" id="dealer-indicator"></div>
        <div class="signal-display" id="signal-display"></div>
      </div>
      <div class="score-panel" id="score-panel">
        <div class="score-team">Mi: <span id="score-0">0</span></div>
        <div class="score-team">Vi: <span id="score-1">0</span></div>
      </div>
      <div class="info-bar" id="info-bar"></div>
      <button class="skola-btn" id="skola-btn" title="Škola - savjeti za igru">Škola</button>
      <button class="hint-btn" id="hint-btn" title="Pokaži hint">?</button>
      <div class="hint-panel" id="hint-panel"></div>
      <div class="move-rating" id="move-rating"></div>
    `;
  }
  return table;
}

export function updatePlayerLabels(playerTypes, dealerSeat, config = null) {
  const isTeam = !config || config.teamPlay;
  Object.keys(playerTypes).forEach(seat => {
    const label = document.getElementById(`label-${seat}`);
    if (!label) return;
    let name = SEAT_NAMES[seat] || seat;
    if (!isTeam && seat === 'north') name = 'Gore';
    const isDealer = seat === dealerSeat;
    const typeLabel = playerTypes[seat] === 'human' ? '' : ' 🤖';
    label.textContent = name + typeLabel + (isDealer ? ' 🃏' : '');
  });
}

export function updateScores(scores, config = null) {
  if (Array.isArray(scores)) {
    const s0 = document.getElementById('score-0');
    const s1 = document.getElementById('score-1');
    if (s0) s0.textContent = scores[0];
    if (s1) s1.textContent = scores[1];
  } else {
    const panel = document.getElementById('score-panel');
    if (!panel) return;
    const isTeam = config && config.teamPlay;
    const entries = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    panel.innerHTML = entries.map(([seat, score]) => {
      let name = SEAT_NAMES[seat] || seat;
      if (!isTeam && seat === 'north') name = 'Gore';
      return `<div class="score-individual"><span class="score-name">${name}</span><span class="score-value">${score}</span></div>`;
    }).join('');
  }
}

export function showInfo(text, duration = 2000) {
  const bar = document.getElementById('info-bar');
  if (!bar) return;
  bar.textContent = text;
  bar.classList.add('visible');
  if (duration > 0) {
    setTimeout(() => bar.classList.remove('visible'), duration);
  }
}

export function clearTrickArea() {
  const area = document.getElementById('trick-area');
  if (!area) return;
  const cards = area.querySelectorAll('.played-card');
  if (cards.length === 0) { area.innerHTML = ''; return; }
  cards.forEach(c => c.classList.add('trick-collect'));
  setTimeout(() => { area.innerHTML = ''; }, 300);
}
