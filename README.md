# Jeremy’s Odyssey

An original browser arcade adventure: a fifth grader, an oversized pencil case, and five alien-controlled school floors between him and the golden gate key.

This is a separate game in `jaychtw/vertical-scroller-01`. Formosa Quest was inspected as a read-only technical reference; its repository and artwork were not changed or incorporated.

## Play

Node.js **20.19+** (or 22.12+) and npm are required. This environment was verified with Node 24.19.

```sh
npm ci
npm run dev
```

Vite serves the game on port 5173 and binds to `0.0.0.0` for cloud development. Click the game to focus its keyboard controls. The opening advances automatically; Enter advances each story card. Sound is opt-in through the SOUND button. Fonts are bundled locally; gameplay needs no accounts, keys, database, or remote assets.

| Key   | Action                                                               |
| ----- | -------------------------------------------------------------------- |
| ← / → | Walk                                                                 |
| ↑     | Jump, or climb when grounded beside an unlocked ladder               |
| Space | Jump, including beside ladders                                       |
| Z     | Light pencil-case jab; successful actions add one charge             |
| X     | Fire a piercing pencil case when READY                               |
| R     | Pause and request a full restart; release and press again to confirm |
| Esc   | Cancel restart and resume                                            |

At Game Over or Victory, one fresh R press restarts. Opening and floor transitions receive the same two-press protection as gameplay. Focus loss releases movement inputs and pauses into restart confirmation; Esc resumes. Keyboard auto-repeat cannot confirm a restart.

## Rules

Four brats arrive one second apart after visible spawn cues. Clear them to summon a two-HP teacher. A teacher defeat grants one life once per floor and unlocks its ladder. Jeremy starts with one life; five clean floors yield six lives on the roof. Contact consumes one life; surviving resets only the current floor encounter, preserving charge and prior rewards. Ralf has six HP and telegraphs a leap every three seconds.

Jabs deal one damage, outrange contact, and only hit in the facing direction. A successful jab action earns one charge even when it hits multiple enemies. Three charges store one heavy attack. The translucent enlarged pencil-case projectile pierces, deals three damage, cannot hit the same enemy twice, and never builds charge.

## Architecture

- `src/game/config.ts`: geometry and all gameplay tuning.
- `src/game/model.ts`: fixed-step lifecycle, rewards, deaths, transitions and restart states.
- `src/game/player.ts`, `combat.ts`, `encounters.ts`, `enemies.ts`, `camera.ts`: movement/jumps, jabs/projectiles, timed waves, Ralf AI and smooth camera; all use the same deterministic clock.
- `src/game/types.ts`: shared state and entity definitions.
- `src/game/art.ts`: original integer-drawn pixel character frames and layered school / skyline textures.
- `src/game/scene.ts`: Phaser rendering, keyboard lifecycle, camera application and visual feedback. No scene recreation is needed for restarts.
- `src/game/ui.ts`: screen-fixed HUD, opening gate, exact confirmation and end screens.
- `src/game/audio.ts`: original synthesized effects, enabled by a user gesture.
- `src/game/model.test.ts`: deterministic game-rule acceptance tests.
- `tests/game.spec.ts`: Chromium keyboard, scaling and full-progression integration tests.

The logical viewport is **1280×720**, FIT-scaled at 16:9. The continuous world is **2400×4320** with six 720-pixel bands. Five alternating 2160-pixel entry-to-exit routes provide 10,800 pixels of actual horizontal traversal inside the approximately 12,000 pixels of hallway geometry. There are no pits, raised platforms or environmental obstacles. The floor surface sits at 602 pixels within each band, leaving 118 pixels for foreground depth and lower HUD framing. Jump height is approximately 109 pixels with a held jump. Ladders cover one full 720-pixel band in 2.1 seconds; a 0.7-second arrival period lets the camera settle before the encounter starts. Normal jumps do not move vertical camera framing.

## Deliberate edge-case policies

- New spawns remain ahead in the floor's traversal direction. When Jeremy reaches the far wall before an outstanding wave can arrive safely, the spawn waits and a HUD prompt asks him to step back. A cue is rechecked before materializing; moving through it cannot cause unavoidable contact.
- Ralf’s three-second period is measured from telegraph start to telegraph start (0.5 seconds crouch, 1.85 seconds flight, 0.65 seconds landing). The first telegraph starts three seconds after rooftop combat begins. Landing is marked before takeoff. A direction marker identifies Ralf when he is beyond the horizontal viewport.
- Death on an already cleared current floor resets its enemies and ladder but never grants its life reward again. Previously left floors remain inaccessible.
- Physics and gameplay timers use a 120 Hz fixed simulation step; no `setTimeout`, physics-world clock, or scene timer can run behind the confirmation overlay.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
```

The browser suite uses installed Chromium in this cloud machine. On another machine, install the Playwright Chromium browser (`npx playwright install chromium`) before running it. Browser results and screenshots are generated into ignored `test-results/`. The `?test=1` simulation handle is available only in Vite development mode, never in production builds.

The original supplied specification is preserved in [docs/GDD-v1.md](docs/GDD-v1.md).

See [VALIDATION.md](VALIDATION.md) for the acceptance checklist, playtest scope, and known limitations.
