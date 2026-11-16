// Prism Breaker — tiny WebAudio synth. No audio files: every blip is an
// oscillator envelope created on the fly. The context is only created after
// the first user gesture, and every call is safe when audio is unavailable
// (for example in the headless screenshot runs).

let ctx = null;

export function initAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || ctx.state === 'suspended') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  paddle() { tone(220, 0.06, 'square', 0.05); },
  wall() { tone(160, 0.05, 'square', 0.04); },
  brick(combo) { tone(340 + Math.min(combo, 12) * 36, 0.09, 'triangle', 0.09, 90); },
  tough() { tone(140, 0.08, 'sawtooth', 0.07); },
  core() { tone(90, 0.35, 'sawtooth', 0.14, 620); },
  power() { tone(520, 0.16, 'sine', 0.1, 1040); },
  laser() { tone(880, 0.07, 'square', 0.05, 220); },
  nova() { tone(70, 0.5, 'sawtooth', 0.16, 980); },
  lose() { tone(300, 0.4, 'triangle', 0.1, 60); },
  win() { tone(440, 0.3, 'sine', 0.1, 880); },
};
