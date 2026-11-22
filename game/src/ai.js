// Ember Duel — Rook, the Cinder Knight: the opponent's brain.
// Rook's choices are readable on purpose: it telegraphs an intent line before
// it acts, so the player can read the plan and counter it.

import { effectivePower } from './engine.js';

/** One-line intent Rook shows before its turn, naming what it is about to do. */
export function planIntent(state) {
  const foe = state.foe;
  const affordable = foe.hand.filter((c) => c.cost <= foe.ember);
  if (affordable.length === 0) return 'Rook gathers embers, plotting…';
  const lethal = affordable.find((c) => c.art === 'strike' && effectivePower(state, c).power >= state.player.hp + state.player.shield);
  if (lethal) return 'Rook raises a burning fist — a finishing blow is coming!';
  if (foe.hp <= 10 && affordable.some((c) => c.art === 'mend' || c.art === 'guard')) {
    return 'Rook steadies itself, reaching for shelter…';
  }
  if (affordable.some((c) => c.art === 'strike')) return 'Rook eyes your life total, hand crackling…';
  return 'Rook studies its hand, ember swirling…';
}

function cardValue(state, card) {
  const { power } = effectivePower(state, card);
  const foe = state.foe;
  const player = state.player;
  if (card.art === 'strike') {
    if (power >= player.hp + player.shield) return 100;
    return power * 2 + (player.shield === 0 ? 1 : 0);
  }
  if (card.art === 'drain') return power * 2 + (foe.hp < foe.maxHp ? 2 : 0);
  if (card.art === 'guard') return foe.hp <= 12 ? power * 2 + 3 : power;
  if (card.art === 'mend') {
    return foe.hp <= 12 ? power * 2 + 2 : (foe.maxHp - foe.hp > 0 ? power / 2 : -5);
  }
  if (card.art === 'surge') return foe.hand.length <= 3 ? 6 : 2;
  return power;
}

/**
 * Choose Rook's plays for this turn, in order. It spends its ember on the
 * best-value affordable card, up to three cards, then stops.
 */
export function choosePlays(state) {
  const plays = [];
  let ember = state.foe.ember;
  const hand = [...state.foe.hand];
  for (let n = 0; n < 3; n += 1) {
    const affordable = hand.filter((c) => c.cost <= ember);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => cardValue(state, b) - cardValue(state, a));
    const pick = affordable[0];
    if (cardValue(state, pick) <= 0) break;
    plays.push(pick.id);
    ember -= pick.cost;
    hand.splice(hand.indexOf(pick), 1);
  }
  return plays;
}
