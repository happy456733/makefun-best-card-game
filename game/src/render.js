// Ember Duel — the table: every pixel the player sees.
// DOM + CSS only; cards are drawn divs, so they stay legible at thumbnail size.

import { ELEMENTS, ARTS, describeCard, elementIcon } from './cards.js';
import { MAX_HP, effectivePower } from './engine.js';

const $ = (id) => document.getElementById(id);

function esc(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** One card face: cost gem, element art, name, big power, effect line. */
export function cardElement(card, state, opts = {}) {
  const el = ELEMENTS[card.element];
  const { power, chained } = effectivePower(state, card);
  const playable = opts.playable !== false && state.phase === 'player' && state.player.ember >= card.cost;
  const div = document.createElement('div');
  div.className = `card ${card.element}${playable ? ' playable' : ''}${opts.selected ? ' selected' : ''}${opts.dealt ? ' dealt' : ''}`;
  div.dataset.id = card.id;
  div.style.setProperty('--el', el.color);
  div.style.setProperty('--el-dark', el.dark);
  div.style.setProperty('--el-glow', el.glow);
  div.innerHTML = `
    <div class="card-cost" title="Ember cost">${card.cost}</div>
    <div class="card-art">${elementIcon(card.element, 64)}</div>
    <div class="card-name">${esc(card.name)}</div>
    <div class="card-power"><span class="power-num">${power}</span><span class="power-label">${ARTS[card.art].name}</span></div>
    <div class="card-text">${esc(describeCard(card, power))}</div>
    <div class="card-element">${el.name.toUpperCase()}${chained ? ' · CHAIN +2' : ''}</div>`;
  return div;
}

/** Face-down card back for the opponent's hand and the decks. */
function cardBackElement() {
  const div = document.createElement('div');
  div.className = 'card back';
  div.innerHTML = '<div class="back-mark">✦</div><div class="back-word">EMBER</div>';
  return div;
}

function hpBar(side, label) {
  const pct = Math.max(0, (side.hp / side.maxHp) * 100);
  const low = side.hp <= 10 ? ' low' : '';
  return `<div class="hp-row">
    <span class="hp-label">${label}</span>
    <div class="hpbar${low}"><div class="hp-fill" style="width:${pct}%"></div>
    <span class="hp-text">${side.hp} / ${side.maxHp} ♥</span></div>
    ${side.shield > 0 ? `<span class="shield-badge">🛡 ${side.shield} SHIELD</span>` : ''}
  </div>`;
}

function emberRow(side) {
  let gems = '';
  for (let i = 0; i < side.maxEmber; i += 1) {
    gems += `<span class="ember-gem${i < side.ember ? ' lit' : ''}"></span>`;
  }
  return `<div class="ember-row"><span class="ember-label">EMBER ${side.ember}/${side.maxEmber}</span>${gems}</div>`;
}

/** Rebuild the whole table from the state. Cheap at this scale, always correct. */
export function render(state) {
  const app = $('app');
  app.classList.toggle('your-turn', state.phase === 'player' && state.screen === 'duel');
  app.classList.toggle('foe-turn', state.phase === 'ai' && state.screen === 'duel');

  $('turn-badge').textContent = state.screen === 'duel'
    ? (state.phase === 'player' ? `YOUR TURN — TURN ${state.turn}` : `ROOK'S TURN — TURN ${state.turn}`)
    : 'EMBER DUEL';
  $('sound-btn').textContent = state.muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';

  // Foe zone: portrait, life, hand of card backs, intent line.
  $('foe-info').innerHTML = `
    <div class="avatar foe-avatar">R</div>
    <div class="side-info">
      <div class="side-name">ROOK, THE CINDER KNIGHT</div>
      ${hpBar(state.foe, 'LIFE')}
      ${emberRow(state.foe)}
    </div>`;
  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  state.foe.hand.forEach(() => foeHand.appendChild(cardBackElement()));
  $('foe-deck').textContent = `DECK ${state.foe.deck.length}`;
  $('foe-intent').textContent = state.phase === 'ai' && state.aiIntent ? state.aiIntent : 'Rook waits, ember in hand…';

  // Table: last played cards, chain meter, battle log.
  const table = $('played-cards');
  table.innerHTML = '';
  if (state.lastPlayed.length === 0) {
    table.innerHTML = '<div class="table-hint">Play a card from your hand — click it, then click the table.</div>';
  }
  for (const entry of state.lastPlayed) {
    const card = cardElement(entry.card, state, { playable: false });
    card.classList.add(entry.by === 'you' ? 'played-you' : 'played-foe');
    const wrap = document.createElement('div');
    wrap.className = 'played-wrap';
    wrap.innerHTML = `<div class="played-tag">${entry.by === 'you' ? 'YOU PLAYED' : 'ROOK PLAYED'}${entry.chained ? ' · CHAIN +2' : ''}</div>`;
    wrap.appendChild(card);
    table.appendChild(wrap);
  }
  const chain = $('chain-meter');
  if (state.chainElement) {
    const el = ELEMENTS[state.chainElement];
    chain.innerHTML = `⛓ CHAIN: <b style="color:${el.glow}">${el.name.toUpperCase()} ×${state.chainCount}</b> — play another ${el.name} card for <b>+2 power</b>`;
    chain.classList.add('active');
  } else {
    chain.textContent = '⛓ No chain yet — play two cards of the same element in one turn for +2 power.';
    chain.classList.remove('active');
  }
  const log = $('battle-log');
  log.innerHTML = state.log.slice(-6).map((line) => `<div class="log-line">${esc(line)}</div>`).join('')
    || '<div class="log-line">The duel begins. Your move, duelist.</div>';

  // Player zone: life, ember, hand, end-turn button.
  $('player-info').innerHTML = `
    <div class="avatar you-avatar">Y</div>
    <div class="side-info">
      <div class="side-name">YOU — THE EMBER DUELIST</div>
      ${hpBar(state.player, 'LIFE')}
      ${emberRow(state.player)}
    </div>`;
  const hand = $('player-hand');
  hand.innerHTML = '';
  state.player.hand.forEach((card, index) => {
    const el = cardElement(card, state, { selected: state.selectedId === card.id, dealt: true });
    el.style.animationDelay = `${index * 0.06}s`;
    hand.appendChild(el);
  });
  $('player-deck').textContent = `DECK ${state.player.deck.length}`;
  const endBtn = $('end-turn');
  endBtn.disabled = state.phase !== 'player' || state.screen !== 'duel';
  endBtn.textContent = state.phase === 'player' ? 'END TURN ⏎' : 'ROOK IS PLAYING…';

  // Overlays: title and end screens.
  $('title-screen').style.display = state.screen === 'title' ? 'flex' : 'none';
  const end = $('end-screen');
  if (state.screen === 'won' || state.screen === 'lost') {
    end.style.display = 'flex';
    const won = state.screen === 'won';
    $('end-title').textContent = won ? '🏆 VICTORY!' : '💀 DEFEAT';
    $('end-title').className = won ? 'won' : 'lost';
    $('end-sub').textContent = won
      ? 'Rook’s ember is spent. The table is yours.'
      : 'Rook takes the table this time. Shuffle up and go again.';
    $('end-stats').innerHTML = `
      <div class="stat"><span class="stat-num">${state.turn}</span><span class="stat-label">TURNS</span></div>
      <div class="stat"><span class="stat-num">${state.stats.cardsPlayed}</span><span class="stat-label">CARDS PLAYED</span></div>
      <div class="stat"><span class="stat-num">${state.stats.damageDealt}</span><span class="stat-label">DAMAGE DEALT</span></div>
      <div class="stat"><span class="stat-num">${state.stats.chains}</span><span class="stat-label">CHAINS</span></div>`;
  } else {
    end.style.display = 'none';
  }
}

/** Floating combat text over a zone: damage, healing, shield, draw. */
export function floater(zoneId, text, kind) {
  const zone = $(zoneId);
  const span = document.createElement('span');
  span.className = `floater ${kind}`;
  span.textContent = text;
  zone.appendChild(span);
  window.setTimeout(() => span.remove(), 1400);
}

/** Append a line to the battle log (newest last, capped at 40). */
export function logLine(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log = state.log.slice(-40);
}

/** Shake the table on a heavy hit. */
export function shakeTable() {
  const table = $('table-zone');
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}
