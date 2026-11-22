// Ember Duel — the card catalogue.
// Every card is an original design: four elements, five arts, one deck.
// A card's art decides what it does; its element decides what it chains with.

export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e8491d', dark: '#8f1d0b', glow: '#ff8a3d', icon: 'flame' },
  tide: { name: 'Tide', color: '#1d7fe8', dark: '#0b3d8f', glow: '#5db4ff', icon: 'drop' },
  leaf: { name: 'Leaf', color: '#3da53d', dark: '#14591f', glow: '#7ed957', icon: 'leaf' },
  stone: { name: 'Stone', color: '#c98f2e', dark: '#6e4a08', glow: '#f2c14e', icon: 'rock' },
};

export const ARTS = {
  strike: { name: 'Strike', verb: 'Deal', target: 'foe' },
  guard: { name: 'Guard', verb: 'Gain', target: 'self' },
  mend: { name: 'Mend', verb: 'Restore', target: 'self' },
  drain: { name: 'Drain', verb: 'Deal and restore', target: 'both' },
  surge: { name: 'Surge', verb: 'Draw', target: 'self' },
};

// Twelve unique cards. A deck holds two copies of each: 24 cards.
const CATALOGUE = [
  { name: 'Cinder Slash', element: 'flame', art: 'strike', cost: 1, power: 3 },
  { name: 'Wildfire', element: 'flame', art: 'strike', cost: 3, power: 6 },
  { name: 'Ember Guard', element: 'flame', art: 'guard', cost: 2, power: 5 },
  { name: 'Tide Lash', element: 'tide', art: 'strike', cost: 2, power: 4 },
  { name: 'Deep Current', element: 'tide', art: 'drain', cost: 3, power: 4 },
  { name: 'Still Waters', element: 'tide', art: 'mend', cost: 2, power: 5 },
  { name: 'Thorn Whip', element: 'leaf', art: 'strike', cost: 1, power: 3 },
  { name: 'Root Wall', element: 'leaf', art: 'guard', cost: 1, power: 4 },
  { name: 'Bloom', element: 'leaf', art: 'mend', cost: 3, power: 7 },
  { name: 'Stone Fist', element: 'stone', art: 'strike', cost: 2, power: 5 },
  { name: 'Granite Shell', element: 'stone', art: 'guard', cost: 3, power: 7 },
  { name: 'Quarry Song', element: 'stone', art: 'surge', cost: 2, power: 2 },
];

let nextCardId = 1;

/** Human-readable effect line for a card, given its (possibly chained) power. */
export function describeCard(card, power = card.power) {
  switch (card.art) {
    case 'strike': return `Deal ${power} damage.`;
    case 'guard': return `Gain ${power} shield.`;
    case 'mend': return `Restore ${power} life.`;
    case 'drain': return `Deal ${power} damage, restore ${Math.floor(power / 2)} life.`;
    case 'surge': return `Draw ${power} cards.`;
    default: return '';
  }
}

/** Build a fresh 24-card deck, shuffled with the given random function. */
export function buildDeck(random) {
  const deck = [];
  for (const template of CATALOGUE) {
    for (let copy = 0; copy < 2; copy += 1) {
      deck.push({ ...template, id: nextCardId += 1 });
    }
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Small deterministic random source (mulberry32) so screenshot states repeat. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Element glyphs as inline SVG, drawn with the element's own colours. */
export function elementIcon(element, size = 44) {
  const el = ELEMENTS[element];
  const paths = {
    flame: 'M22 3 C26 11 34 13 34 24 A12 12 0 1 1 10 24 C10 17 15 15 17 9 C19 13 20 14 22 14 C21 10 21 7 22 3 Z',
    drop: 'M22 3 C22 3 8 20 8 29 A14 14 0 0 0 36 29 C36 20 22 3 22 3 Z',
    leaf: 'M36 6 C18 6 6 18 6 36 C24 36 36 24 36 6 Z M10 34 C16 24 24 16 32 10',
    rock: 'M10 30 L16 12 L30 8 L38 20 L32 34 L14 36 Z',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" aria-hidden="true">`
    + `<path d="${paths[el.icon]}" fill="${el.glow}" stroke="${el.dark}" stroke-width="2" stroke-linejoin="round"/>`
    + `</svg>`;
}
