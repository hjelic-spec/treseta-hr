import { MESSAGES, SEAT_NAMES } from './locale.js';
import { SUIT_DISPLAY, RANK_DISPLAY } from '../core/constants.js';

function seatName(seat, config) {
  if (config && !config.teamPlay && seat === 'north') return 'Gore';
  return SEAT_NAMES[seat] || seat;
}

export function showHandEndOverlay(handScores, totalScores, kapotTeam, lastTrickWinner, config = null) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay hand-end-overlay';

  let kapotText = '';
  if (kapotTeam >= 0) {
    kapotText = `<div class="kapot-banner">${MESSAGES.kapot}</div>`;
  }

  let scoreHtml;
  if (Array.isArray(handScores)) {
    scoreHtml = `
      ${kapotText}
      <h2>${MESSAGES.handScore(handScores[0], handScores[1])}</h2>
      <p>${MESSAGES.score(totalScores[0], totalScores[1])}</p>
    `;
  } else {
    const entries = Object.entries(handScores).sort((a, b) => a[1] - b[1]);
    scoreHtml = `
      <h2>Rezultat ruke</h2>
      <div class="individual-scores">
        ${entries.map(([seat, pts]) => {
          const name = seatName(seat, config);
          const total = totalScores[seat];
          return `<div class="ind-score-row"><span>${name}</span><span>+${pts} (${total})</span></div>`;
        }).join('')}
      </div>
    `;
  }

  overlay.innerHTML = `<div class="overlay-content">${scoreHtml}</div>`;

  document.getElementById('game-table').appendChild(overlay);
  setTimeout(() => overlay.classList.add('visible'), 50);
  setTimeout(() => {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }, 2500);
}

export function showGameEndOverlay(data, onPlayAgain) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay game-end-overlay';

  let contentHtml;

  if (data.winnerTeam !== undefined) {
    const msg = data.winnerTeam === 0 ? MESSAGES.weWin : MESSAGES.theyWin;
    contentHtml = `
      <h1>${MESSAGES.gameOver}</h1>
      <h2>${msg}</h2>
      <p class="final-score">${MESSAGES.score(data.finalScores[0], data.finalScores[1])}</p>
    `;
  } else {
    const winnerName = seatName(data.winnerSeat, data.config);
    const isMe = data.winnerSeat === 'south';
    const msg = isMe ? 'Pobijedio si!' : `${winnerName} je pobijedio!`;
    const entries = Object.entries(data.finalScores).sort((a, b) => a[1] - b[1]);

    contentHtml = `
      <h1>${MESSAGES.gameOver}</h1>
      <h2>${msg}</h2>
      <div class="individual-scores final-individual">
        ${entries.map(([seat, score], i) => {
          const name = seatName(seat, data.config);
          const cls = i === 0 ? 'ind-winner' : '';
          return `<div class="ind-score-row ${cls}"><span>${i + 1}. ${name}</span><span>${score}</span></div>`;
        }).join('')}
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="overlay-content">
      ${contentHtml}
      <button class="btn btn-primary" id="btn-play-again">Igraj ponovo</button>
      <button class="btn btn-secondary" id="btn-back-lobby">Novi izbor</button>
    </div>
  `;

  document.getElementById('game-table').appendChild(overlay);
  setTimeout(() => overlay.classList.add('visible'), 50);

  overlay.querySelector('#btn-play-again').addEventListener('click', () => {
    overlay.remove();
    onPlayAgain('restart');
  });
  overlay.querySelector('#btn-back-lobby').addEventListener('click', () => {
    overlay.remove();
    onPlayAgain('lobby');
  });
}

export function showDeclarations(declarations) {
  const bar = document.getElementById('info-bar');
  if (!bar) return;

  const texts = declarations.map(d => {
    const seatName = SEAT_NAMES[d.seat];
    const declTexts = d.declarations.map(decl => {
      if (decl.type === 'napolitana') {
        return MESSAGES.napolitana(SUIT_DISPLAY[decl.suit]);
      } else if (decl.type === 'three_of_kind') {
        return MESSAGES.threeOfKind(RANK_DISPLAY[decl.rank]);
      } else {
        return MESSAGES.fourOfKind(RANK_DISPLAY[decl.rank]);
      }
    });
    return `${seatName}: ${declTexts.join(', ')} (+${d.points})`;
  });

  if (texts.length > 0) {
    bar.textContent = texts.join(' | ');
    bar.classList.add('visible');
    setTimeout(() => bar.classList.remove('visible'), 4000);
  }
}

export function highlightCurrentPlayer(seat) {
  document.querySelectorAll('.player-zone').forEach(el => el.classList.remove('active-turn'));
  const zone = document.querySelector(`.player-${seat}`);
  if (zone) zone.classList.add('active-turn');
}
