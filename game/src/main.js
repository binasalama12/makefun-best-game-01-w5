// Prism Breaker — entry point: canvas, game loop and state transitions.
// Title -> play -> game over -> restart, all driven from the Input class.
// When the URL carries ?shot=<scene>&seed=<n> the world is staged by
// shots.js and drawn once, deterministically, for the dossier screenshots.

import { World } from './world.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';
import { initAudio } from './audio.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const renderer = new Renderer(ctx);
const input = new Input(canvas);

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const shot = params.get('shot');

let world = new World(seed);

function announce() {
  if (!status) return;
  status.textContent = world.state === 'title'
    ? 'Prism Breaker. Press Enter or click to play.'
    : world.state === 'over'
      ? `Game over. Final score ${world.score}. Press Enter to play again.`
      : `Score ${world.score}. Level ${world.levelIndex + 1}. ${world.lives} hull left.`;
}

if (shot) {
  stageShot(world, shot);
  renderer.draw(world);
  announce();
  window.__prismReady = true;
} else {
  let last = performance.now();
  let wasState = world.state;
  let paused = false;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (input.consume('pausePressed') && world.state === 'play') paused = !paused;
    if (paused) {
      renderer.draw(world);
      ctx.save();
      ctx.fillStyle = 'rgba(5,3,16,0.5)';
      ctx.fillRect(0, 0, 1280, 800);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED — PRESS P TO RESUME', 640, 420);
      ctx.restore();
      requestAnimationFrame(frame);
      return;
    }
    if (world.state === 'title' && input.consume('startPressed')) {
      initAudio();
      world.state = 'play';
    } else if (world.state === 'over' && input.consume('startPressed')) {
      initAudio();
      world = new World(seed);
      world.state = 'play';
    } else if (world.state === 'play') {
      if (input.consume('launchPressed')) {
        initAudio();
        world.launch();
      }
      if (input.consume('novaPressed')) world.fireNova();
    }
    input.consume('launchPressed');
    input.consume('startPressed');

    world.update(dt, input);
    renderer.draw(world);
    if (world.state !== wasState) {
      wasState = world.state;
      announce();
    }
    requestAnimationFrame(frame);
  }
  announce();
  requestAnimationFrame(frame);
}
