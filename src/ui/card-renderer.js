import { renderCardSVG, renderCardBack, renderCardBackSmall } from './card-sprites.js';
import { cardId, cardDisplayName } from '../core/card.js';

export function createCardElement(card, faceUp = true, clickable = false) {
  const el = document.createElement('div');
  el.className = 'card' + (clickable ? ' card-clickable' : '');
  el.dataset.cardId = cardId(card);
  el.dataset.suit = card.suit;
  el.dataset.rank = card.rank;
  el.title = faceUp ? cardDisplayName(card) : '';

  if (faceUp) {
    el.innerHTML = renderCardSVG(card);
  } else {
    el.innerHTML = renderCardBack();
  }

  return el;
}

export function getCardMetrics() {
  const w = window.innerWidth;
  if (w <= 480) return { cardW: 84, cardH: 152, backSpacing: 20 };
  if (w <= 768) return { cardW: 100, cardH: 180, backSpacing: 26 };
  return { cardW: 140, cardH: 252, backSpacing: 36 };
}

export function renderHand(container, cards, faceUp = true, legalPlays = null, onCardClick = null, qualityMap = null) {
  container.innerHTML = '';

  const legalIds = legalPlays ? new Set(legalPlays.map(c => cardId(c))) : null;
  const m = getCardMetrics();

  if (faceUp) {
    const n = cards.length;
    const fanRadius = m.cardW <= 84 ? 350 : m.cardW <= 100 ? 500 : 650;
    const totalAngle = Math.min(n * 5, 55);
    const angleStep = n > 1 ? totalAngle / (n - 1) : 0;
    const startAngle = -totalAngle / 2;

    cards.forEach((card, i) => {
      const isLegal = !legalIds || legalIds.has(cardId(card));
      const el = createCardElement(card, true, isLegal && !!onCardClick);
      if (!isLegal) el.classList.add('card-disabled');
      if (qualityMap && isLegal) {
        const q = qualityMap.get(cardId(card));
        if (q) el.classList.add(`card-q-${q}`);
      }
      if (onCardClick && isLegal) {
        el.addEventListener('click', () => onCardClick(card));
      }

      const angle = startAngle + i * angleStep;
      el.style.left = '50%';
      el.style.transformOrigin = `50% ${fanRadius}px`;
      el.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      el.style.zIndex = i;

      container.appendChild(el);
    });

    const edgeRad = (totalAngle / 2) * Math.PI / 180;
    const visualHalfW = Math.sin(edgeRad) * fanRadius + m.cardW / 2;
    container.style.width = Math.round(visualHalfW * 2) + 'px';
  } else {
    cards.forEach((card, i) => {
      const el = createCardElement(card, false, false);
      el.style.left = (i * m.backSpacing) + 'px';
      container.appendChild(el);
    });
    container.style.width = ((cards.length - 1) * m.backSpacing + m.cardW) + 'px';
  }
}

export function createPlayedCard(card, seat, seatLabel) {
  const wrapper = document.createElement('div');
  wrapper.className = `played-card played-${seat}`;

  const w = window.innerWidth;
  const pw = w <= 480 ? 70 : w <= 768 ? 84 : 110;
  const ph = Math.round(pw * 1.8);
  const cardHtml = renderCardSVG(card, pw, ph);
  const label = document.createElement('div');
  label.className = 'played-label';
  label.textContent = seatLabel || seat;

  wrapper.innerHTML = cardHtml;
  wrapper.appendChild(label);
  return wrapper;
}
