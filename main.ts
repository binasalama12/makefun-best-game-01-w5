// Prism Breaker — a make.fun best-game-01 entry (Node 22, standard library only).
// The game itself lives in game/ as plain static files: game/index.html plus its ES modules
// under game/src/, no external library and no network request, playable offline in a desktop
// browser. A magnet paddle bounces a plasma ball into a descending wall of prism bricks —
// tough bricks crack, prism cores explode in chains, vault bricks drop power-up capsules
// (wide paddle, multiball, lasers, slow field, nova charge), and a full gold meter fires a
// Nova Blast before the wall crosses the danger line.
// This program is only the hand-in step: it copies game/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there with the vendored make.fun
// library, using exactly the scorer's caps so a local run fails wherever the scorer would.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
