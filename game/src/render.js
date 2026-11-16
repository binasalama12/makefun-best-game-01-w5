// Prism Breaker — all drawing. A deep-space forge backdrop (nebula wash,
// starfield, side rails), the prism wall drawn as faceted crystal bricks with
// per-row hue families, a glowing magnet paddle, trailed balls, laser bolts,
// falling power-up capsules and a full HUD: score, combo multiplier, lives,
// level name and the Nova meter. The title and game-over screens are drawn by
// the game itself over live scenes, never as separate artwork.

import { BALL, BRICK, PADDLE, ROW_COLORS, VIEW, WALL } from './config.js';
import { Rng } from './rng.js';

const stars = [];
{
  const r = new Rng(1234);
  for (let i = 0; i < 170; i++) {
    stars.push({ x: r.range(0, VIEW.w), y: r.range(0, VIEW.h), s: r.range(0.6, 2.4), tw: r.range(0, 6.28) });
  }
}

function rr(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(world) {
    const { ctx } = this;
    ctx.save();
    if (world.shake > 0) {
      const s = world.shake;
      ctx.translate((Math.sin(world.time * 91) * s) / 2, (Math.cos(world.time * 113) * s) / 2);
    }
    this.background(world);
    this.rails(world);
    this.bricks(world);
    this.drops(world);
    this.bolts(world);
    this.paddle(world);
    this.balls(world);
    this.particles(world);
    this.floaters(world);
    this.hud(world);
    if (world.flash > 0) {
      ctx.fillStyle = `rgba(255,244,190,${(world.flash * 0.55).toFixed(3)})`;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }
    if (world.bannerT > 0 && world.state === 'play') this.banner(world);
    if (world.state === 'title') this.title(world);
    if (world.state === 'over') this.gameOver(world);
    ctx.restore();
  }

  background(world) {
    const { ctx } = this;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
    g.addColorStop(0, '#0b0620');
    g.addColorStop(0.45, '#160b38');
    g.addColorStop(1, '#05030f');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, VIEW.w + 40, VIEW.h + 40);
    // Nebula washes.
    const neb = (x, y, r, color) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    neb(240, 190, 340, 'rgba(123,108,255,0.20)');
    neb(1060, 300, 380, 'rgba(233,93,255,0.13)');
    neb(660, 700, 420, 'rgba(46,196,255,0.12)');
    neb(430, 470, 260, 'rgba(255,79,109,0.08)');
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(world.time * 0.7 + s.tw));
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  rails(world) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(130,120,255,0.16)';
    ctx.fillRect(WALL.left - 10, 92, 4, 640);
    ctx.fillRect(WALL.right + 6, 92, 4, 640);
    ctx.fillRect(WALL.left - 10, 92, WALL.right - WALL.left + 20, 4);
    // Danger line: pulses red as the wall gets close.
    const alive = world.bricks.filter((b) => b.alive);
    const lowest = alive.length ? Math.max(...alive.map((b) => b.y + BRICK.h)) : 0;
    const danger = Math.max(0, Math.min(1, (lowest - 430) / 200));
    ctx.strokeStyle = `rgba(255,60,80,${0.35 + danger * 0.55})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(WALL.left - 8, WALL.dangerY);
    ctx.lineTo(WALL.right + 8, WALL.dangerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255,90,110,${0.5 + danger * 0.5})`;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DANGER LINE', WALL.left - 4, WALL.dangerY + 20);
  }

  bricks(world) {
    const { ctx } = this;
    for (const b of world.bricks) {
      if (!b.alive) continue;
      const c = ROW_COLORS[b.row % ROW_COLORS.length];
      const pulse = b.kind === 'core' ? 0.5 + 0.5 * Math.sin(world.time * 5 + b.wobble) : 0;
      ctx.save();
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = b.kind === 'core' ? 18 + pulse * 14 : 9;
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK.h);
      g.addColorStop(0, c.glow);
      g.addColorStop(0.45, c.fill);
      g.addColorStop(1, c.dark);
      ctx.fillStyle = g;
      rr(ctx, b.x, b.y, BRICK.w, BRICK.h, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Facet lines — the prism cut.
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + BRICK.w * 0.32, b.y + 3);
      ctx.lineTo(b.x + BRICK.w * 0.5, b.y + BRICK.h - 3);
      ctx.moveTo(b.x + BRICK.w * 0.68, b.y + 3);
      ctx.lineTo(b.x + BRICK.w * 0.5, b.y + BRICK.h - 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.fillRect(b.x + 4, b.y + 3, BRICK.w - 8, 5);
      if (b.kind === 'tough') {
        ctx.strokeStyle = b.hp === 2 ? '#e8ecff' : 'rgba(20,20,40,0.85)';
        ctx.lineWidth = 3;
        rr(ctx, b.x + 2, b.y + 2, BRICK.w - 4, BRICK.h - 4, 6);
        ctx.stroke();
        if (b.hp === 1) {
          ctx.strokeStyle = 'rgba(10,10,25,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + 14, b.y + 5);
          ctx.lineTo(b.x + 44, b.y + 18);
          ctx.lineTo(b.x + 30, b.y + 29);
          ctx.moveTo(b.x + 66, b.y + 4);
          ctx.lineTo(b.x + 84, b.y + 20);
          ctx.stroke();
        }
      }
      if (b.kind === 'core') {
        ctx.fillStyle = `rgba(255,255,255,${0.55 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(b.x + BRICK.w / 2, b.y + BRICK.h / 2, 7 + pulse * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x + BRICK.w / 2, b.y + BRICK.h / 2, 12 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (b.kind === 'vault') {
        ctx.fillStyle = '#10131f';
        ctx.font = 'bold 17px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', b.x + BRICK.w / 2, b.y + 24);
      }
      ctx.restore();
    }
  }

  drops(world) {
    const { ctx } = this;
    for (const d of world.drops) {
      ctx.save();
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = d.color;
      rr(ctx, d.x - 17, d.y - 13, 34, 26, 13);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(ctx, d.x - 17, d.y - 13, 17, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#0b0620';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, d.x, d.y + 6);
      ctx.restore();
    }
  }

  bolts(world) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#ff5d7a';
    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 10;
    for (const b of world.bolts) ctx.fillRect(b.x - 2.5, b.y - 13, 5, 16);
    ctx.restore();
  }

  paddle(world) {
    const { ctx } = this;
    const p = world.paddle;
    const x = p.x - p.w / 2;
    ctx.save();
    ctx.shadowColor = '#2ec4ff';
    ctx.shadowBlur = 20;
    const g = ctx.createLinearGradient(x, PADDLE.y, x, PADDLE.y + PADDLE.h);
    g.addColorStop(0, '#aee9ff');
    g.addColorStop(0.5, '#2ec4ff');
    g.addColorStop(1, '#0d5b80');
    ctx.fillStyle = g;
    rr(ctx, x, PADDLE.y, p.w, PADDLE.h, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x + 8, PADDLE.y + 3, p.w - 16, 4);
    // Magnet core.
    ctx.fillStyle = '#ffe93c';
    ctx.beginPath();
    ctx.arc(p.x, PADDLE.y + PADDLE.h / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    if (p.laserT > 0) {
      ctx.fillStyle = '#ff4d6d';
      rr(ctx, x + 4, PADDLE.y - 10, 12, 12, 3);
      ctx.fill();
      rr(ctx, x + p.w - 16, PADDLE.y - 10, 12, 12, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  balls(world) {
    const { ctx } = this;
    for (const ball of world.balls) {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const a = (i / ball.trail.length) * 0.35;
        ctx.fillStyle = `rgba(120,220,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL.r * (i / ball.trail.length) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.shadowColor = '#aee9ff';
      ctx.shadowBlur = 16;
      const g = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, BALL.r + 1);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#bdefff');
      g.addColorStop(1, '#2ec4ff');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  particles(world) {
    const { ctx } = this;
    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  floaters(world) {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px system-ui, sans-serif';
    for (const f of world.floaters) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  hud(world) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(8,5,24,0.82)';
    ctx.fillRect(0, 0, VIEW.w, 84);
    ctx.fillStyle = 'rgba(130,120,255,0.35)';
    ctx.fillRect(0, 84, VIEW.w, 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8f9bb8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('SCORE', 70, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(String(world.score).padStart(6, '0'), 70, 62);
    ctx.fillStyle = '#8f9bb8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('LEVEL', 330, 26);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${world.levelIndex + 1} · ${world.formationName}`, 330, 60);
    ctx.fillStyle = '#8f9bb8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('COMBO', 700, 26);
    ctx.fillStyle = world.combo >= 12 ? '#ffe93c' : '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`×${1 + Math.floor(world.combo / 6)}  (${world.combo})`, 700, 62);
    // Lives as paddle icons.
    ctx.fillStyle = '#8f9bb8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('HULL', 1064, 26);
    for (let i = 0; i < world.lives; i++) {
      ctx.fillStyle = '#2ec4ff';
      rr(ctx, 1064 + i * 52, 40, 42, 12, 6);
      ctx.fill();
    }
    // Nova meter along the very top.
    ctx.fillStyle = 'rgba(255,233,60,0.18)';
    ctx.fillRect(0, 0, VIEW.w, 7);
    ctx.fillStyle = world.nova >= 100 ? '#ffe93c' : '#ff9f1c';
    ctx.fillRect(0, 0, (VIEW.w * world.nova) / 100, 7);
    if (world.nova >= 100) {
      ctx.fillStyle = '#ffe93c';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('NOVA READY — PRESS X', 1210, 26);
    }
  }

  banner(world) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.bannerT * 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.shadowColor = '#e95dff';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(world.banner, 640, 430);
    ctx.restore();
  }

  panel(world, title, titleColor, alpha = 0.55) {
    const { ctx } = this;
    ctx.fillStyle = `rgba(5,3,16,${alpha})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 34;
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 92px system-ui, sans-serif';
    ctx.fillText(title, 640, 300);
    ctx.restore();
  }

  title(world) {
    this.panel(world, 'PRISM BREAKER', '#7dd7ff', 0.42);
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe93c';
    ctx.font = 'bold 25px system-ui, sans-serif';
    ctx.fillText('Smash the descending prism wall before it crosses the line', 640, 352);
    ctx.fillStyle = '#dfe6ff';
    ctx.font = '21px system-ui, sans-serif';
    ctx.fillText('Mouse or ← → moves the paddle · Click / Space launches and fires lasers', 640, 404);
    ctx.fillText('Catch falling capsules: Wide · Multiball · Lasers · Slow Field · Nova', 640, 438);
    ctx.fillText('Chain brick combos to fill the gold meter, then press X for a Nova Blast', 640, 472);
    ctx.fillStyle = '#3ddc68';
    ctx.font = 'bold 27px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 540);
    ctx.restore();
  }

  gameOver(world) {
    this.panel(world, 'GAME OVER', '#ff5d7a');
    const { ctx } = this;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(`Final score  ${world.score}`, 640, 380);
    ctx.fillStyle = '#dfe6ff';
    ctx.font = '23px system-ui, sans-serif';
    ctx.fillText(`Reached level ${world.levelIndex + 1} · ${world.formationName}`, 640, 428);
    ctx.fillText(`Bricks shattered: ${world.brokenTotal} · Best combo: ${world.maxCombo}`, 640, 464);
    ctx.fillStyle = '#3ddc68';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('PRESS ENTER TO PLAY AGAIN', 640, 540);
    ctx.restore();
  }
}
