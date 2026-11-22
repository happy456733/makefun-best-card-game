// Ember Duel — bootstrap: wire the engine, the table, the input and the AI.
// The game is a static page: no network, no build, no dependencies.

import { newGame, startDuel as engineStartDuel, playCard, startTurn, canPlay } from './engine.js';
import { choosePlays, planIntent } from './ai.js';
import { render, logLine, floater, shakeTable } from './render.js';
import { wireInput } from './input.js';
import { applyShot } from './shots.js';
import { sound } from './sound.js';

const params = new URLSearchParams(window.location.search);
let state = newGame(Number(params.get('seed') || 7));
let shotMode = false;

if (params.get('shot')) {
  shotMode = true;
  document.body.classList.add('shot');
  state = applyShot(state, params.get('shot'));
}

function getState() {
  return state;
}

/** Turn engine events into sound, floating text and log lines, then re-render. */
function applyEvents(events) {
  if (!events) return;
  for (const event of events) {
    if (event.kind === 'play') {
      if (event.chained) sound.chain();
      else sound.playCard();
      logLine(state, `${event.by === 'you' ? 'You play' : 'Rook plays'} ${event.card.name} (${event.power} power${event.chained ? ', chained +2' : ''}).`);
    } else if (event.kind === 'damage') {
      sound.strike();
      floater(event.target === 'you' ? 'player-zone' : 'foe-zone', `-${event.amount}`, 'damage');
      if (event.absorbed > 0) {
        logLine(state, `${event.amount} damage lands${event.absorbed > 0 ? ` (${event.absorbed} soaked by shield)` : ''} on ${event.target === 'you' ? 'you' : 'Rook'}.`);
      } else {
        logLine(state, `${event.amount} damage hits ${event.target === 'you' ? 'you' : 'Rook'}.`);
      }
      if (event.amount >= 5) shakeTable();
    } else if (event.kind === 'shield') {
      sound.guard();
      floater(event.target === 'you' ? 'player-zone' : 'foe-zone', `+${event.amount} SHIELD`, 'shield');
      logLine(state, `${event.target === 'you' ? 'You gain' : 'Rook gains'} ${event.amount} shield.`);
    } else if (event.kind === 'heal') {
      if (event.amount > 0) {
        sound.heal();
        floater(event.target === 'you' ? 'player-zone' : 'foe-zone', `+${event.amount} LIFE`, 'heal');
        logLine(state, `${event.target === 'you' ? 'You restore' : 'Rook restores'} ${event.amount} life.`);
      }
    } else if (event.kind === 'draw') {
      sound.draw();
      logLine(state, `${event.target === 'you' ? 'You draw' : 'Rook draws'} ${event.amount} card${event.amount === 1 ? '' : 's'}.`);
    }
  }
  if (state.screen === 'won') {
    sound.win();
    logLine(state, 'Rook falls. Victory is yours!');
  } else if (state.screen === 'lost') {
    sound.lose();
    logLine(state, 'Your ember gutters out. Defeat.');
  }
  render(state);
}

function playSelectedCard() {
  if (state.selectedId === null) return;
  const card = state.player.hand.find((c) => c.id === state.selectedId);
  if (!card) return;
  if (!canPlay(state, state.player, card)) {
    logLine(state, `Not enough ember for ${card.name} (needs ${card.cost}).`);
    render(state);
    return;
  }
  sound.unlock();
  applyEvents(playCard(state, state.player, card.id));
}

function clickCard(id) {
  if (state.screen !== 'duel' || state.phase !== 'player') return;
  const card = state.player.hand.find((c) => c.id === id);
  if (!card) return;
  if (state.selectedId === id) {
    playSelectedCard();
    return;
  }
  if (state.player.ember < card.cost) {
    logLine(state, `${card.name} needs ${card.cost} ember — you have ${state.player.ember}.`);
    state.selectedId = id;
    render(state);
    return;
  }
  state.selectedId = id;
  render(state);
}

function endTurn() {
  if (shotMode) return;
  if (state.screen !== 'duel' || state.phase !== 'player') return;
  state.phase = 'ai';
  state.selectedId = null;
  startTurn(state, state.foe);
  state.aiIntent = planIntent(state);
  logLine(state, `— Turn ${state.turn} ends. Rook takes the table. —`);
  render(state);
  const plays = choosePlays(state);
  let index = 0;
  const step = () => {
    if (state.screen !== 'duel') return;
    if (index < plays.length) {
      applyEvents(playCard(state, state.foe, plays[index]));
      index += 1;
      window.setTimeout(step, 950);
    } else {
      window.setTimeout(() => {
        if (state.screen !== 'duel') return;
        state.turn += 1;
        state.stats.turns = state.turn;
        startTurn(state, state.player);
        state.phase = 'player';
        state.aiIntent = '';
        logLine(state, `Turn ${state.turn}: you gain 1 ember and draw a card.`);
        sound.turn();
        render(state);
      }, 750);
    }
  };
  window.setTimeout(step, 950);
}

function startDuel() {
  sound.unlock();
  state = engineStartDuel(state);
  logLine(state, 'A new duel begins. Rook shuffles its deck…');
  render(state);
}

function toggleMute() {
  state.muted = !state.muted;
  render(state);
}

wireInput({
  getState,
  clickCard,
  playSelected: playSelectedCard,
  clickFoe: playSelectedCard,
  clickTable: () => { state.selectedId = null; render(state); },
  deselect: () => { state.selectedId = null; render(state); },
  endTurn,
  startDuel,
  toggleMute,
});

render(state);
