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

export function renderHand(container, cards, faceUp = true, legalPlays = null, onCardClick = null, qualityMap = null) {
  container.innerHTML = '';

  const legalIds = legalPlays ? new Set(legalPlays.map(c => cardId(c))) : null;

  cards.forEach((card, i) => {
    const isLegal = !legalIds || legalIds.has(cardId(card));
    const el = createCardElement(card, faceUp, faceUp && isLegal && !!onCardClick);

    if (!isLegal && faceUp) {
      el.classList.add('card-disabled');
    }

    if (qualityMap && isLegal) {
      const q = qualityMap.get(cardId(card));
      if (q) el.classList.add(`card-q-${q}`);
    }

    if (onCardClick && isLegal && faceUp) {
      el.addEventListener('click', () => onCardClick(card));
    }

    const offset = faceUp ? Math.min(i * 58, 520) : i * 18;
    el.style.left = offset + 'px';

    if (faceUp && cards.length > 1) {
      const mid = (cards.length - 1) / 2;
      const angle = (i - mid) * 2.5;
      const lift = -Math.abs(i - mid) * 2;
      el.style.transform = `rotate(${angle}deg) translateY(${lift}px)`;
    }

    container.appendChild(el);
  });

  if (faceUp) {
    container.style.width = (Math.min((cards.length - 1) * 58, 520) + 70) + 'px';
  } else {
    container.style.width = ((cards.length - 1) * 18 + 70) + 'px';
  }
}

export function createPlayedCard(card, seat, seatLabel) {
  const wrapper = document.createElement('div');
  wrapper.className = `played-card played-${seat}`;

  const cardHtml = renderCardSVG(card, 60, 108);
  const label = document.createElement('div');
  label.className = 'played-label';
  label.textContent = seatLabel || seat;

  wrapper.innerHTML = cardHtml;
  wrapper.appendChild(label);
  return wrapper;
}
