// Prism Breaker — deterministic screenshot staging.
// The dossier screenshots are real renders of this code in a browser, staged
// through the ?shot= scenes below. Every scene starts from the same seeded
// world and advances it by fixed steps of exactly 1/60s, so two runs of the
// dossier produce byte-identical frames.

import { PADDLE } from './config.js';

const STEP = 1 / 60;
const idleInput = { mouseX: null, left: false, right: false, fireHeld: false };

function step(world, n, input = idleInput) {
  for (let i = 0; i < n; i++) world.update(STEP, input);
}

function breakBrickAt(world, row, col) {
  const gridW = 10 * 104 + 9 * 8;
  const x0 = (1280 - gridW) / 2;
  const cx = x0 + col * (104 + 8) + 52;
  const target = world.bricks.find(
    (b) => b.alive && Math.abs(b.x + 52 - cx) < 4 && b.row === row,
  );
  if (target) world.damageBrick(target, 99, 'ball');
}

export function stageShot(world, name) {
  if (name === 'title') {
    world.state = 'title';
    step(world, 30);
    return;
  }
  if (name === 'play') {
    world.state = 'play';
    world.paddle.x = 505;
    world.launch();
    step(world, 55, { ...idleInput, mouseX: 505 });
    // A lively mid-rally frame: a bite taken out of the wall, one capsule
    // falling, combo already warm.
    breakBrickAt(world, 3, 4);
    breakBrickAt(world, 3, 5);
    breakBrickAt(world, 2, 5);
    breakBrickAt(world, 4, 3);
    world.combo = 9;
    world.score = 1450;
    world.dropPowerup(760, 330);
    step(world, 26, { ...idleInput, mouseX: 560 });
    world.paddle.x = 560;
    return;
  }
  if (name === 'feature') {
    world.state = 'play';
    world.paddle.x = 640;
    world.paddle.laserT = 8;
    world.launch();
    step(world, 40, { ...idleInput, mouseX: 640 });
    // Multiball + lasers + a prism core chain explosion + Nova letting go:
    // the richest single frame the game can produce.
    world.applyPowerup({ id: 'multi', name: 'Multiball' });
    world.combo = 17;
    world.score = 4870;
    world.bolts.push({ x: 640 - PADDLE.w / 2 + 14, y: 560, vy: -780 });
    world.bolts.push({ x: 640 + PADDLE.w / 2 - 14, y: 470, vy: -780 });
    world.bolts.push({ x: 640 - PADDLE.w / 2 + 14, y: 380, vy: -780 });
    breakBrickAt(world, 3, 4); // the core — chains into its neighbours
    world.dropPowerup(915, 300);
    world.nova = 100;
    world.fireNova();
    step(world, 7, { ...idleInput, mouseX: 640, fireHeld: true });
    return;
  }
  // end
  world.state = 'play';
  world.paddle.x = 700;
  world.launch();
  step(world, 70, { ...idleInput, mouseX: 700 });
  breakBrickAt(world, 0, 0);
  breakBrickAt(world, 1, 2);
  breakBrickAt(world, 2, 7);
  breakBrickAt(world, 5, 8);
  breakBrickAt(world, 6, 4);
  world.score = 6320;
  world.brokenTotal = 23;
  world.maxCombo = 19;
  world.lives = 0;
  world.state = 'over';
  step(world, 12, { ...idleInput, mouseX: 700 });
}
