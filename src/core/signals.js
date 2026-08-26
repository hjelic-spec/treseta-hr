import { SIGNAL_TYPES } from './constants.js';

export function createSignal(type, seat, suit) {
  if (!SIGNAL_TYPES.includes(type)) {
    throw new Error(`Invalid signal type: ${type}`);
  }
  return Object.freeze({ type, seat, suit });
}

export const SIGNAL_DISPLAY = {
  tucem: 'Tučem!',
  striso: 'Strišo!',
  striso_tucem: 'Strišo tučem!'
};
