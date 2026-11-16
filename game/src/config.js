// Prism Breaker — tuning constants, palette and level formations.
// One place for every number the world and the renderer share, so the staged
// screenshot scenes and live play can never drift apart.

export const VIEW = { w: 1280, h: 800 };

export const WALL = {
  left: 70,
  right: 1210,
  top: 118,
  dangerY: 648, // a brick crossing this line costs a life
};

export const PADDLE = {
  y: 716,
  w: 168,
  wideW: 248,
  h: 20,
  speed: 980,
};

export const BALL = { r: 10, baseSpeed: 560, maxSpeed: 940 };

export const BRICK = { w: 104, h: 34, gapX: 8, gapY: 8, cols: 10 };

// Saturated prism palette — one hue family per brick row so a full wall reads
// as a rainbow crystal lattice in a single still frame.
export const ROW_COLORS = [
  { fill: '#ff4d6d', glow: '#ff8fa8', dark: '#8f1d33' },
  { fill: '#ff9f1c', glow: '#ffc46b', dark: '#8f5a08' },
  { fill: '#ffe93c', glow: '#fff38a', dark: '#8f810a' },
  { fill: '#3ddc68', glow: '#86f2a6', dark: '#14662e' },
  { fill: '#2ec4ff', glow: '#82dcff', dark: '#0d5b80' },
  { fill: '#7b6cff', glow: '#b3aaff', dark: '#372a8f' },
  { fill: '#e95dff', glow: '#f79aff', dark: '#7d147f' },
];

export const KIND = {
  NORMAL: 'normal', // 1 hit
  TOUGH: 'tough', //   2 hits, armoured shell
  CORE: 'core', //     3 hits, explodes its neighbours when it dies
  VAULT: 'vault', //   1 hit, always drops a power-up
};

// Four hand-authored formations. Rows are strings, one char per cell:
// '.' empty, 'n' normal, 't' tough, 'c' prism core, 'v' vault.
export const FORMATIONS = [
  {
    name: 'Prism Diamond',
    descend: 3.2,
    rows: [
      '....cc....',
      '...nttn...',
      '..nvttvn..',
      '.nttccttn.',
      '..nvttvn..',
      '...nttn...',
      '....cc....',
    ],
  },
  {
    name: 'Chevron Siege',
    descend: 3.8,
    rows: [
      'v........v',
      'nn......nn',
      'tnn....nnt',
      '.tnnccnnt.',
      '..tnttnt..',
      '...nccn...',
      '....tt....',
    ],
  },
  {
    name: 'Crystal Ring',
    descend: 4.4,
    rows: [
      '..nnttnn..',
      '.n......n.',
      'nt..cc..tn',
      't...vv...t',
      'nt..cc..tn',
      '.n......n.',
      '..nnttnn..',
      '.v.nnnn.v.',
    ],
  },
  {
    name: 'The Forge Heart',
    descend: 5.2,
    rows: [
      'ttnnccnntt',
      'tnvttttvnt',
      'nn.tcct.nn',
      'n..tcct..n',
      'nn.tcct.nn',
      'tnvttttvnt',
      'ttnnccnntt',
      '.v.nnvv.n.',
    ],
  },
];

export const POWERUPS = [
  { id: 'wide', label: 'W', color: '#2ec4ff', name: 'Wide Paddle' },
  { id: 'multi', label: 'M', color: '#e95dff', name: 'Multiball' },
  { id: 'laser', label: 'L', color: '#ff4d6d', name: 'Laser Paddle' },
  { id: 'slow', label: 'S', color: '#3ddc68', name: 'Slow Field' },
  { id: 'nova', label: 'N', color: '#ffe93c', name: 'Nova Charge' },
];

export const RULES = {
  lives: 3,
  novaMax: 100,
  novaPerComboHit: 4,
  laserSeconds: 9,
  wideSeconds: 12,
  slowSeconds: 7,
};
