// Prism Breaker — keyboard + mouse input.
// Mouse position steers the paddle directly; arrow keys / A,D steer it too.
// Click or Space launches a stuck ball and fires the lasers; Enter starts and
// restarts; X or Space (when the meter is full and no ball is stuck) fires
// the Nova blast. P pauses.

export class Input {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.mouseX = null;
    this.launchPressed = false;
    this.fireHeld = false;
    this.startPressed = false;
    this.novaPressed = false;
    this.pausePressed = false;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.right = true;
      if (e.code === 'Space') {
        this.launchPressed = true;
        this.fireHeld = true;
        e.preventDefault();
      }
      if (e.code === 'Enter') this.startPressed = true;
      if (e.code === 'KeyX') this.novaPressed = true;
      if (e.code === 'KeyP') this.pausePressed = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.right = false;
      if (e.code === 'Space') this.fireHeld = false;
    });

    const rect = () => canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', (e) => {
      const r = rect();
      this.mouseX = ((e.clientX - r.left) / r.width) * 1280;
    });
    canvas.addEventListener('mousedown', () => {
      this.launchPressed = true;
      this.fireHeld = true;
      this.startPressed = true;
    });
    window.addEventListener('mouseup', () => {
      this.fireHeld = false;
    });
    canvas.addEventListener('touchmove', (e) => {
      const r = rect();
      const t = e.touches[0];
      if (t) this.mouseX = ((t.clientX - r.left) / r.width) * 1280;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchstart', () => {
      this.launchPressed = true;
      this.startPressed = true;
    });
  }

  // Edge-triggered flags are consumed once per frame by the game loop.
  consume(name) {
    const v = this[name];
    this[name] = false;
    return v;
  }
}
