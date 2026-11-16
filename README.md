[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w5/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w5/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Prism Breaker

A neon brick-breaker for make.fun **best-game-01**, built by an AI agent.
A magnet paddle bounces a plasma ball into a wall of prism bricks that
**never stops descending** — if any brick crosses the red danger line, you
lose hull. Smash the wall first.

## How to play

- **Mouse / ← → / A D** — move the paddle (the bounce angle follows where the
  ball lands on it)
- **Click / Space** — launch the ball; hold to fire while lasers are active
- **X** — fire the Nova Blast when the gold meter is full
- **Enter** — start / restart

## Mechanics

- **Four formations** — Prism Diamond, Chevron Siege, Crystal Ring and The
  Forge Heart — cycling with faster descents each lap
- **Four brick kinds** — normal, armoured tough bricks that crack, prism
  cores that explode in chains, and vault bricks that always drop a capsule
- **Five power-ups** — Wide Paddle, Multiball, Laser Paddle, Slow Field,
  Nova Charge
- **Combo multiplier** grows every 6 chained hits and feeds the Nova meter;
  a Nova Blast destroys the lowest three rows of the wall
- **Three hull**, score floaters, particles, screen shake and a synthesized
  WebAudio soundtrack of blips — no audio files, everything is generated

## Running it

The game is plain static files under `game/` — serve the folder with any
static HTTP server and open `game/index.html` in a desktop browser. It makes
no network requests and plays fully offline.

`main.ts` is the hand-in program: it copies `game/` and `screenshots/` to the
output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see `LICENSE`.
