import { SIGNAL_LABELS } from './locale.js';
import { SIGNAL_DISPLAY } from '../core/signals.js';

export function showSignalButtons(container, onSignal) {
  container.innerHTML = '';
  container.classList.add('visible');

  const types = ['tucem', 'striso'];
  types.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'signal-btn signal-' + type;
    btn.textContent = SIGNAL_LABELS[type];
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSignal(type);
    });
    container.appendChild(btn);
  });
}

export function hideSignalButtons(container) {
  if (!container) return;
  container.innerHTML = '';
  container.classList.remove('visible');
}

export function showSignalIndicator(seat, signalType) {
  const display = document.getElementById('signal-display');
  if (!display) return;

  const indicator = document.createElement('div');
  indicator.className = 'signal-indicator signal-indicator-' + seat;
  indicator.textContent = SIGNAL_DISPLAY[signalType];

  display.innerHTML = '';
  display.appendChild(indicator);

  setTimeout(() => {
    indicator.classList.add('fade-out');
    setTimeout(() => display.innerHTML = '', 500);
  }, 2000);
}
