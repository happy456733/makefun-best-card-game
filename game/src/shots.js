// Ember Duel — deterministic screenshot states.
// ?shot=title|play|win|loss with a seed builds the same table every time,
// so the screenshots in screenshots/ are reproducible renders of the game.

import { newGame, playCard, startTurn } from './engine.js';
import { logLine } from './render.js';

function midGame(seed) {
  const state = newGame(seed);
  state.screen = 'duel';
  state.turn = 5;
  state.stats.turns = 5;
  // A lively mid-duel: both duelists hurt, shields up, ember to spend.
  state.player.hp = 21;
  state.player.shield = 4;
  state.player.ember = 6;
  state.foe.hp = 17;
  state.foe.shield = 2;
  state.foe.ember = 3;
  state.chainElement = 'flame';
  state.chainCount = 1;
  // Play two real cards through the engine so the table shows genuine plays.
  const strike = state.player.hand.find((c) => c.art === 'strike');
  if (strike) playCard(state, state.player, strike.id);
  const guard = state.foe.hand.find((c) => c.art === 'guard');
  if (guard) playCard(state, state.foe, guard.id);
  state.player.hp = 21;
  state.player.shield = 4;
  state.foe.hp = 17;
  state.foe.shield = 2;
  state.player.ember = 6;
  state.chainElement = 'flame';
  state.chainCount = 1;
  logLine(state, 'Turn 4: Rook played Granite Shell and gained 7 shield.');
  logLine(state, 'You played Cinder Slash for 3 damage.');
  logLine(state, 'Turn 5: you gain 1 ember and draw a card.');
  logLine(state, 'Chain is live — a Flame card now hits +2.');
  return state;
}

export function applyShot(state, name) {
  const seed = state.seed || 7;
  if (name === 'title') {
    const title = newGame(seed);
    title.screen = 'title';
    return title;
  }
  if (name === 'play') return midGame(seed);
  if (name === 'win') {
    const won = midGame(seed);
    won.foe.hp = 0;
    won.foe.shield = 0;
    won.screen = 'won';
    won.stats.cardsPlayed = 14;
    won.stats.damageDealt = 34;
    won.stats.chains = 3;
    won.turn = 7;
    logLine(won, 'You played Wildfire for 8 damage. Rook falls!');
    return won;
  }
  if (name === 'loss') {
    const lost = midGame(seed);
    lost.player.hp = 0;
    lost.player.shield = 0;
    lost.foe.hp = 9;
    lost.screen = 'lost';
    lost.stats.cardsPlayed = 11;
    lost.stats.damageDealt = 21;
    lost.stats.chains = 1;
    lost.turn = 8;
    logLine(lost, 'Rook played Wildfire for 8 damage. You fall!');
    return lost;
  }
  return state;
}
