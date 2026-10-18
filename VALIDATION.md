# Validation and acceptance

Specification: Jeremy’s Odyssey GDD v1.0 and Codex Implementation Brief supplied with the task.

## Checks

The deterministic suite exercises real game logic rather than duplicated test implementations: multi-target charge, misses and facing, aerial jabs, heavy piercing and per-target deduplication, teacher/Principal HP, four timed spawns, safe cue revalidation, teacher sequencing, alternating one-way ladder progression, five unique rewards, nonterminal death, terminal death, jump buffering/variable height, stable vertical camera, complete restart, key release/repeat protection, exact strings, pause clocks, focus loss, Ralf’s telegraph/arc/landing and aerial contact.

Browser integration uses real keyboard events and a rendered Phaser game. The progression test repositions Jeremy for encounter setup to make five-floor coverage repeatable, but uses genuine spawns, damage, Z/X input, life rewards, Space/Up input, ladder transitions, boss states and victory. A separate first-floor test uses no simulation mutation and times real attacks against naturally approaching enemies. This distinguishes integrated coverage from a claim that every encounter was manually completed without assistance.

## Acceptance mapping

| GDD criteria                                            | Implementation / evidence                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1: 1280×720 FIT                                         | Phaser scale configuration; browser canvas and responsive aspect checks                                       |
| 2–3: continuous long school, alternating routes, camera | Shared 2400×4320 world; continuous ladder position interpolation; five-floor integration and camera unit test |
| 4: keyboard / ladder priority                           | Native key edge tracking; browser movement and Space/Up tests                                                 |
| 5: four timed brats, teacher after kills                | Encounter simulation and timing/safe-spawn tests                                                              |
| 6–7: charge / heavy                                     | Combat tests for successful actions, facing, damage, cap, piercing and hit IDs                                |
| 8–9: HP, unique lives, current-floor death              | Reward/death tests and integrated rooftop life count                                                          |
| 10: Ralf arcs and airborne collision                    | Deterministic phase/trajectory tests and browser rooftop combat                                                |
| 11–12: R release, pause, Esc, replay                    | Keyboard browser test and state-machine tests across opening/transitions/end screens                          |
| 13: exact story, golden key, replay                     | Text constants, UI rendering and opening/victory screenshots                                                  |
| 14–15: tests and build                                  | npm scripts; final executed outcomes recorded below                                                           |

## Visual and interaction review

Original pixel character textures contain six frames for each of ten poses. Jeremy wears a blue sports jacket with light trim, dark tousled hair, and pale sneakers. Brats have caps and are about half his height. Female/male teacher silhouettes alternate by floor. Ralf has a broader suited silhouette, crouch and airborne frames. Hallways use lockers, framed windows with evening skyline, doors, paper noticeboards, ceiling lights, trim, tiled floors, alien motes and foreground columns. Rooftop has three skyline layers, a crescent moon, stars and a faint saucer. Heavy shots are enlarged translucent pencil cases with visible zipper/trim. HUD and overlays remain fixed to the logical viewport.

## Limits

- Keyboard desktop game as specified; no touch gamepad is included.
- Audio is opt-in synthesized feedback; no music was required.
- Automated Chromium coverage does not establish Safari/Firefox compatibility or substitute for subjective human difficulty/art review.
- Publication or deployment is not performed by implementation; use the production `dist/` build with any static host.

## Executed outcomes

Validated on 2026-10-18 with Node 24.19, Phaser 3.90.0 and headless Chromium:

- `npm ci --cache /tmp/jeremy-npm-cache --no-audit --no-fund`: passed from the frozen lockfile.
- `npm run typecheck`: passed.
- `npm test`: **27 passed, zero failed/skipped**.
- `npm run build`: passed; production output in `dist/`.
- `npm run test:browser`: **4 passed, zero failed/skipped** (approximately three minutes with software WebGL).
- Separate production-browser smoke: passed opening → gameplay → sound toggle / jump input → restart confirmation; no JavaScript errors; the development simulation handle is absent even with `?test=1`.
- Local development HTTP requests: `/` and `/src/main.ts` both returned HTTP 200 with the expected game content.
- Formosa Quest reference checkout: clean; no source files or assets changed.

The final browser route cleared all five real encounters and ladders, confirmed six lives at rooftop entry, defeated Ralf through three keyboard jabs and one heavy, showed the key/victory screen, and replayed. Floor-position fixtures shortened travel in that integration test; rooftop combat and the separate first-floor encounter used keyboard input without character-state mutations.

Visual review inspected actual browser screenshots of the opening, live hallway, continuous climb, rooftop, restart confirmation, victory and Game Over. The player remains above the lower HUD during climbing; the camera keeps normal jump framing stable. This is screenshot/automated interaction review, not a claim of an independent human completing the whole game.

Generated screenshots: `test-results/opening.png`, `hallway.png`, `climbing.png`, `rooftop.png`, `restart-confirmation.png`, `victory.png`, `game-over.png`, `production.png`. They are intentionally ignored build/test artifacts.

No known mandatory mechanic is left unimplemented. Cross-browser and subjective human difficulty/visual acceptance remain unverified. No deployment or remote Git push was performed.

## Specification interpretation

The statement that two heavy hits defeat a six-HP Principal is a damage equivalence. A natural two-heavy-only roof fight cannot replenish its second charge without successful light hits, because the confirmed rules provide no other charge source and the roof contains no additional enemies. The implementation preserves 6 HP, 3 heavy damage, and light-hit-only charging. The tested empty-charge combination is three light hits followed by one heavy. No automatic recharge or extra rooftop enemy was added.

## Cloud reuse

The complete frozen installation/check script and development startup/readiness instructions were saved in the environment configuration draft (`install_script` and `start_skill`). Snapshot publication remains a user action: review and save the environment settings, then publish the environment to make that setup reusable. Saving the draft did not publish or deploy the game.
