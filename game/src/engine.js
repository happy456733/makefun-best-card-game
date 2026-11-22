// Ember Duel — the rules engine: turns, ember, chains, damage, victory.
// Pure state transitions only; rendering and input live in their own files.

import { buildDeck, seededRandom } from './cards.js';

export const MAX_HP = 30;
export const MAX_EMBER = 10;
export const HAND_LIMIT = 7;
export const CHAIN_BONUS = 2;

function makeSide(random) {
  return {
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    ember: 3,
    maxEmber: MAX_EMBER,
    deck: buildDeck(random),
    hand: [],
    discard: [],
  };
}

export function newGame(seed = 1) {
  const random = seededRandom(seed);
  const state = {
    screen: 'title',
    turn: 1,
    phase: 'player',
    player: makeSide(random),
    foe: makeSide(random),
    chainElement: null,
    chainCount: 0,
    lastPlayed: [],
    log: [],
    selectedId: null,
    aiIntent: '',
    stats: { cardsPlayed: 0, damageDealt: 0, chains: 0, turns: 1 },
    muted: false,
    seed,
  };
  drawCards(state.player, 4);
  drawCards(state.foe, 4);
  return state;
}

export function drawCards(side, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (side.hand.length >= HAND_LIMIT) break;
    if (side.deck.length === 0) {
      side.deck = side.discard.splice(0);
      shuffle(side.deck);
    }
    if (side.deck.length === 0) break;
    drawn.push(side.deck.pop());
  }
  side.hand.push(...drawn);
  return drawn;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

/** Power of a card right now: +2 when it chains off the previous card's element. */
export function effectivePower(state, card) {
  const chained = state.chainElement === card.element && state.chainCount > 0;
  return { power: card.power + (chained ? CHAIN_BONUS : 0), chained };
}

/** Can this side afford and play this card right now? */
export function canPlay(state, side, card) {
  return state.phase === 'player' && side.ember >= card.cost;
}

function dealDamage(target, amount) {
  let remaining = amount;
  const absorbed = Math.min(target.shield, remaining);
  target.shield -= absorbed;
  remaining -= absorbed;
  target.hp = Math.max(0, target.hp - remaining);
  return { dealt: remaining, absorbed };
}

/**
 * Play a card from a side's hand. Returns the events the table should show:
 * one entry per effect plus the chain flag. The caller renders and sounds them.
 */
export function playCard(state, side, cardId) {
  const handIndex = side.hand.findIndex((c) => c.id === cardId);
  if (handIndex < 0) return null;
  const card = side.hand[handIndex];
  if (side.ember < card.cost) return null;
  const other = side === state.player ? state.foe : state.player;
  const { power, chained } = effectivePower(state, card);

  side.ember -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);
  state.selectedId = null;
  state.stats.cardsPlayed += 1;
  if (chained) state.stats.chains += 1;

  const events = [{ kind: 'play', card, power, chained, by: side === state.player ? 'you' : 'foe' }];
  if (card.art === 'strike') {
    const hit = dealDamage(other, power);
    events.push({ kind: 'damage', amount: hit.dealt, absorbed: hit.absorbed, target: other === state.player ? 'you' : 'foe' });
    if (side === state.player) state.stats.damageDealt += hit.dealt;
  } else if (card.art === 'guard') {
    side.shield += power;
    events.push({ kind: 'shield', amount: power, target: side === state.player ? 'you' : 'foe' });
  } else if (card.art === 'mend') {
    const healed = Math.min(power, side.maxHp - side.hp);
    side.hp += healed;
    events.push({ kind: 'heal', amount: healed, target: side === state.player ? 'you' : 'foe' });
  } else if (card.art === 'drain') {
    const hit = dealDamage(other, power);
    const healed = Math.min(Math.floor(power / 2), side.maxHp - side.hp);
    side.hp += healed;
    events.push({ kind: 'damage', amount: hit.dealt, absorbed: hit.absorbed, target: other === state.player ? 'you' : 'foe' });
    events.push({ kind: 'heal', amount: healed, target: side === state.player ? 'you' : 'foe' });
    if (side === state.player) state.stats.damageDealt += hit.dealt;
  } else if (card.art === 'surge') {
    const drawn = drawCards(side, power);
    events.push({ kind: 'draw', amount: drawn.length, target: side === state.player ? 'you' : 'foe' });
  }

  state.chainElement = card.element;
  state.chainCount += 1;
  state.lastPlayed.unshift({ card, power, chained, by: side === state.player ? 'you' : 'foe' });
  state.lastPlayed = state.lastPlayed.slice(0, 4);
  checkEnd(state);
  return events;
}

/** Start a side's turn: +1 ember, draw a card, reset the chain. */
export function startTurn(state, side) {
  side.ember = Math.min(side.maxEmber, side.ember + 1);
  drawCards(side, 1);
  state.chainElement = null;
  state.chainCount = 0;
}

export function checkEnd(state) {
  if (state.foe.hp <= 0 && state.screen === 'duel') {
    state.screen = 'won';
  } else if (state.player.hp <= 0 && state.screen === 'duel') {
    state.screen = 'lost';
  }
}

/** Begin a fresh duel from the title screen. */
export function startDuel(state) {
  const fresh = newGame(state.seed + state.stats.turns);
  fresh.screen = 'duel';
  fresh.muted = state.muted;
  return fresh;
}
