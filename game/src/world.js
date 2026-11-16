// Prism Breaker — the whole game simulation: paddle, balls, the descending
// prism wall, power-ups, laser bolts, the Nova meter and scoring.
// No rendering and no DOM here; render.js only reads this state, which is what
// lets shots.js stage exact frames by stepping the world a fixed number of
// fixed-length steps.

import { BALL, BRICK, FORMATIONS, KIND, PADDLE, POWERUPS, RULES, WALL } from './config.js';
import { Rng } from './rng.js';
import { sfx } from './audio.js';

const HP = { [KIND.NORMAL]: 1, [KIND.TOUGH]: 2, [KIND.CORE]: 3, [KIND.VAULT]: 1 };
const POINTS = { [KIND.NORMAL]: 50, [KIND.TOUGH]: 90, [KIND.CORE]: 250, [KIND.VAULT]: 120 };
const CHAR_KIND = { n: KIND.NORMAL, t: KIND.TOUGH, c: KIND.CORE, v: KIND.VAULT };

export class World {
  constructor(seed = 7) {
    this.rng = new Rng(seed);
    this.state = 'title'; // title | play | clear | over
    this.score = 0;
    this.best = 0;
    this.lives = RULES.lives;
    this.levelIndex = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.nova = 0;
    this.brokenTotal = 0;
    this.time = 0;
    this.shake = 0;
    this.flash = 0;
    this.banner = '';
    this.bannerT = 0;
    this.paddle = { x: 640, w: PADDLE.w, wideT: 0, laserT: 0, fireCd: 0 };
    this.slowT = 0;
    this.balls = [];
    this.bricks = [];
    this.particles = [];
    this.drops = [];
    this.bolts = [];
    this.floaters = [];
    this.buildLevel(0);
    this.resetBall(true);
  }

  buildLevel(index) {
    const f = FORMATIONS[index % FORMATIONS.length];
    this.formationName = f.name;
    this.descend = f.descend * (1 + 0.12 * Math.floor(index / FORMATIONS.length));
    this.wallY = 0;
    this.bricks = [];
    const gridW = BRICK.cols * BRICK.w + (BRICK.cols - 1) * BRICK.gapX;
    const x0 = (1280 - gridW) / 2;
    f.rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        const kind = CHAR_KIND[ch];
        if (!kind) return;
        this.bricks.push({
          x: x0 + c * (BRICK.w + BRICK.gapX),
          y: WALL.top + r * (BRICK.h + BRICK.gapY),
          row: r,
          kind,
          hp: HP[kind],
          maxHp: HP[kind],
          alive: true,
          wobble: this.rng.range(0, Math.PI * 2),
        });
      });
    });
    this.bricksTotal = this.bricks.length;
  }

  resetBall(stuck = true) {
    this.balls = [{
      x: this.paddle.x, y: PADDLE.y - BALL.r - 2,
      vx: 0, vy: 0, stuck, trail: [],
    }];
  }

  launch() {
    for (const b of this.balls) {
      if (!b.stuck) continue;
      const ang = -Math.PI / 2 + this.rng.range(-0.35, 0.35);
      const sp = BALL.baseSpeed + this.levelIndex * 22;
      b.vx = Math.cos(ang) * sp;
      b.vy = Math.sin(ang) * sp;
      b.stuck = false;
    }
  }

  addScore(base, x, y) {
    const mult = 1 + Math.floor(this.combo / 6);
    const pts = base * mult;
    this.score += pts;
    this.floaters.push({ x, y, text: `+${pts}`, t: 0, life: 0.9, color: '#ffffff' });
  }

  burst(x, y, color, n, speed = 320) {
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const s = this.rng.range(speed * 0.25, speed);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
        t: 0, life: this.rng.range(0.3, 0.75),
        size: this.rng.range(2, 6), color,
      });
    }
  }

  dropPowerup(x, y, forced) {
    const p = forced || this.rng.pick(POWERUPS);
    this.drops.push({ x, y, vy: 150, id: p.id, label: p.label, color: p.color, name: p.name, t: 0 });
  }

  killBrick(brick, cause) {
    if (!brick.alive) return;
    brick.alive = false;
    this.brokenTotal++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.nova = Math.min(RULES.novaMax, this.nova + RULES.novaPerComboHit);
    const cx = brick.x + BRICK.w / 2;
    const cy = brick.y + BRICK.h / 2;
    const colors = ['#ff4d6d', '#ff9f1c', '#ffe93c', '#3ddc68', '#2ec4ff', '#7b6cff', '#e95dff'];
    this.burst(cx, cy, colors[brick.row % colors.length], brick.kind === KIND.CORE ? 30 : 12);
    this.addScore(POINTS[brick.kind], cx, cy);
    if (brick.kind === KIND.VAULT) this.dropPowerup(cx, cy);
    else if (brick.kind !== KIND.CORE && this.rng.chance(0.07)) this.dropPowerup(cx, cy);
    if (brick.kind === KIND.CORE) {
      sfx.core();
      this.shake = Math.max(this.shake, 9);
      // Chain explosion: every brick whose centre is within 150px takes 2 damage.
      for (const other of this.bricks) {
        if (!other.alive || other === brick) continue;
        const ox = other.x + BRICK.w / 2;
        const oy = other.y + BRICK.h / 2;
        if (Math.hypot(ox - cx, oy - cy) <= 150) this.damageBrick(other, 2, 'chain');
      }
    } else if (cause === 'ball') {
      sfx.brick(this.combo);
    }
  }

  damageBrick(brick, dmg, cause) {
    if (!brick.alive) return;
    brick.hp -= dmg;
    if (brick.hp <= 0) this.killBrick(brick, cause);
    else {
      sfx.tough();
      this.burst(brick.x + BRICK.w / 2, brick.y + BRICK.h / 2, '#cfd8ff', 5, 200);
    }
  }

  fireNova() {
    if (this.nova < RULES.novaMax || this.state !== 'play') return;
    this.nova = 0;
    this.flash = 1;
    this.shake = 14;
    sfx.nova();
    // Nova blast: destroys the lowest three rows of the standing wall.
    const alive = this.bricks.filter((b) => b.alive);
    if (!alive.length) return;
    const rows = [...new Set(alive.map((b) => b.row))].sort((a, b) => b - a).slice(0, 3);
    for (const b of alive) if (rows.includes(b.row)) this.killBrick(b, 'nova');
    this.banner = 'NOVA BLAST!';
    this.bannerT = 1.2;
  }

  applyPowerup(d) {
    sfx.power();
    this.banner = d.name.toUpperCase() + '!';
    this.bannerT = 1.1;
    if (d.id === 'wide') { this.paddle.wideT = RULES.wideSeconds; this.paddle.w = PADDLE.wideW; }
    if (d.id === 'slow') this.slowT = RULES.slowSeconds;
    if (d.id === 'laser') this.paddle.laserT = RULES.laserSeconds;
    if (d.id === 'nova') this.nova = Math.min(RULES.novaMax, this.nova + 40);
    if (d.id === 'multi') {
      const src = this.balls.filter((b) => !b.stuck);
      const extra = [];
      for (const b of src) {
        for (const da of [-0.5, 0.5]) {
          const sp = Math.hypot(b.vx, b.vy);
          const a = Math.atan2(b.vy, b.vx) + da;
          extra.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, stuck: false, trail: [] });
        }
      }
      this.balls.push(...extra.slice(0, 4));
    }
  }

  loseBall() {
    this.lives--;
    this.combo = 0;
    sfx.lose();
    this.shake = 10;
    if (this.lives <= 0) {
      this.state = 'over';
      this.best = Math.max(this.best, this.score);
    } else {
      this.resetBall(true);
      this.banner = 'BALL LOST — CLICK TO LAUNCH';
      this.bannerT = 1.4;
    }
  }

  update(dt, input) {
    this.time += dt;
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    for (const p of this.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const f of this.floaters) { f.t += dt; f.y -= 44 * dt; }
    this.floaters = this.floaters.filter((f) => f.t < f.life);
    if (this.state !== 'play') return;

    const timeScale = this.slowT > 0 ? 0.55 : 1;
    if (this.slowT > 0) this.slowT -= dt;
    const sdt = dt * timeScale;

    // Paddle: mouse wins, keys nudge.
    if (input && input.mouseX !== null && input.mouseX !== undefined) this.paddle.x = input.mouseX;
    if (input && input.left) this.paddle.x -= PADDLE.speed * dt;
    if (input && input.right) this.paddle.x += PADDLE.speed * dt;
    const half = this.paddle.w / 2;
    this.paddle.x = Math.max(WALL.left + half, Math.min(WALL.right - half, this.paddle.x));
    if (this.paddle.wideT > 0) { this.paddle.wideT -= dt; if (this.paddle.wideT <= 0) this.paddle.w = PADDLE.w; }
    if (this.paddle.laserT > 0) this.paddle.laserT -= dt;
    if (this.paddle.fireCd > 0) this.paddle.fireCd -= dt;

    // Laser bolts.
    if (input && input.fireHeld && this.paddle.laserT > 0 && this.paddle.fireCd <= 0) {
      this.paddle.fireCd = 0.16;
      sfx.laser();
      this.bolts.push({ x: this.paddle.x - half + 14, y: PADDLE.y - 12, vy: -780 });
      this.bolts.push({ x: this.paddle.x + half - 14, y: PADDLE.y - 12, vy: -780 });
    }
    for (const bolt of this.bolts) {
      bolt.y += bolt.vy * sdt;
      for (const b of this.bricks) {
        if (b.alive && bolt.y > b.y && bolt.y < b.y + BRICK.h && bolt.x > b.x && bolt.x < b.x + BRICK.w) {
          bolt.y = -999;
          this.damageBrick(b, 1, 'laser');
          break;
        }
      }
    }
    this.bolts = this.bolts.filter((b) => b.y > -50);

    // The wall descends, always.
    this.wallY += this.descend * sdt;
    for (const b of this.bricks) if (b.alive) b.y += this.descend * sdt;

    // Danger line breach: lowest brick crosses -> lose a life, wall resets up.
    const lowest = Math.max(...this.bricks.filter((b) => b.alive).map((b) => b.y + BRICK.h), 0);
    if (lowest >= WALL.dangerY) {
      this.lives--;
      this.combo = 0;
      sfx.lose();
      this.shake = 12;
      if (this.lives <= 0) { this.state = 'over'; this.best = Math.max(this.best, this.score); return; }
      const lift = lowest - WALL.top - 190;
      for (const b of this.bricks) b.y -= lift;
      this.banner = 'THE WALL BREACHED THE LINE!';
      this.bannerT = 1.5;
    }

    // Balls.
    for (const ball of this.balls) {
      if (ball.stuck) { ball.x = this.paddle.x; ball.y = PADDLE.y - BALL.r - 2; continue; }
      ball.x += ball.vx * sdt;
      ball.y += ball.vy * sdt;
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 12) ball.trail.shift();
      if (ball.x < WALL.left + BALL.r) { ball.x = WALL.left + BALL.r; ball.vx = Math.abs(ball.vx); sfx.wall(); }
      if (ball.x > WALL.right - BALL.r) { ball.x = WALL.right - BALL.r; ball.vx = -Math.abs(ball.vx); sfx.wall(); }
      if (ball.y < 96 + BALL.r) { ball.y = 96 + BALL.r; ball.vy = Math.abs(ball.vy); sfx.wall(); }
      // Paddle bounce: angle follows where the ball lands on the paddle.
      if (ball.vy > 0 && ball.y + BALL.r >= PADDLE.y && ball.y + BALL.r <= PADDLE.y + PADDLE.h + 14
        && ball.x >= this.paddle.x - half - BALL.r && ball.x <= this.paddle.x + half + BALL.r) {
        const rel = Math.max(-1, Math.min(1, (ball.x - this.paddle.x) / half));
        const ang = -Math.PI / 2 + rel * 1.05;
        const sp = Math.min(BALL.maxSpeed, Math.hypot(ball.vx, ball.vy) * 1.012);
        ball.vx = Math.cos(ang) * sp;
        ball.vy = Math.sin(ang) * sp;
        ball.y = PADDLE.y - BALL.r - 1;
        this.combo = 0;
        sfx.paddle();
      }
      // Brick collisions.
      for (const b of this.bricks) {
        if (!b.alive) continue;
        if (ball.x + BALL.r < b.x || ball.x - BALL.r > b.x + BRICK.w
          || ball.y + BALL.r < b.y || ball.y - BALL.r > b.y + BRICK.h) continue;
        const overlapL = (ball.x + BALL.r) - b.x;
        const overlapR = (b.x + BRICK.w) - (ball.x - BALL.r);
        const overlapT = (ball.y + BALL.r) - b.y;
        const overlapB = (b.y + BRICK.h) - (ball.y - BALL.r);
        const minX = Math.min(overlapL, overlapR);
        const minY = Math.min(overlapT, overlapB);
        if (minX < minY) ball.vx = overlapL < overlapR ? -Math.abs(ball.vx) : Math.abs(ball.vx);
        else ball.vy = overlapT < overlapB ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        this.damageBrick(b, 1, 'ball');
        break;
      }
    }
    this.balls = this.balls.filter((b) => b.y - BALL.r < 820);
    if (this.balls.length === 0) { this.loseBall(); return; }

    // Falling power-ups.
    for (const d of this.drops) {
      d.t += dt;
      d.y += d.vy * dt;
      if (d.y >= PADDLE.y - 8 && d.y <= PADDLE.y + 30
        && d.x >= this.paddle.x - half - 16 && d.x <= this.paddle.x + half + 16) {
        d.y = 9999;
        this.applyPowerup(d);
      }
    }
    this.drops = this.drops.filter((d) => d.y < 810);

    // Level cleared?
    if (this.bricks.every((b) => !b.alive)) {
      this.score += 500 + this.lives * 100;
      sfx.win();
      this.levelIndex++;
      this.buildLevel(this.levelIndex);
      this.resetBall(true);
      this.banner = `LEVEL ${this.levelIndex + 1} — ${this.formationName.toUpperCase()}`;
      this.bannerT = 1.8;
    }
  }
}
