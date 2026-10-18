# Jeremy's Odyssey — Game Design Document v1.0 and Codex Implementation Brief

Status: Approved creative direction; implementation-ready baseline with explicitly identified tuning assumptions.

## 1. Vision and quality bar

Build an original browser-based, side-view arcade action game, *Jeremy's Odyssey*. Jeremy is a fifth grader trapped in a school after an alien UFO brainwashes the occupants. He fights upward through five school floors, defeats Principal Ralf on the roof, and retrieves the golden gate key.

Inspirations: Donkey Kong's ladder-based vertical progression, Kung-Fu Master's straightforward horizontal combat, and the readable silhouette and energy of classic console platformers. Do not copy protected artwork, sprites, audio, or character designs.

**Non-regression requirement:** The game must not look or feel inferior to the existing project `https://github.com/jaychtw/side-scroller-01` (Formosa Quest). Use that repository as a read-only technical and qualitative reference. It uses Phaser 3, TypeScript, Vite, a 1280×720 viewport, a 5240-pixel-wide horizontal world, responsive jumping, and game-rule tests. Jeremy's Odyssey must preserve or improve its viewport, visual polish, movement responsiveness, browser scaling, and automated test discipline. Do not shrink the viewport to 960×540 or replace the engine with a rudimentary Canvas-only implementation. The continuous multi-floor game's total traversal should be substantial; do not confuse its individual floor width with Formosa Quest's single horizontal route length.

## 2. Story and presentation

Opening scene: a locked school gate. Show sequentially:

1. “The gate is locked. You need the key to get out. Principal Ralf got the key, and he's on the rooftop.”
2. “Go, Jeremy. Go get the key, and go home.”

Gate and text fade, then gameplay starts.

Victory: defeat Principal Ralf; a large golden key appears in the center. Show exactly:

“You got the key. Now, you can go home, Jeremy.”

Add “Press R to play again.” Do not add an escape scene. Game Over screen: “GAME OVER”, “Jeremy couldn't escape the school.”, and “Press R to try again.”

## 3. World and level structure

- One **continuous, vertically connected** school world, with five long, flat hallways (1F–5F) and a rooftop. No raised platforms, pits, or environmental obstacles in v1.
- Logical viewport: **1280×720**, 16:9, responsive FIT scaling without distortion. Proposed world: **2400 pixels wide × 4320 pixels high**; treat these as initial tuning constants, not license to reduce play area or visual quality. Each hallway is approximately 2400 pixels of world width, with meaningful horizontal camera movement. Cumulative traversal over five floors is approximately 12,000 horizontal pixels, not counting climbing and rooftop movement.
- Floors are stacked vertically in one world. The camera should not cut to unrelated scenes at floor changes; transitions should follow Jeremy's climb and smoothly settle on the next floor.
- Jeremy enters 1F at the **left**; the exit ladder is at the **right**. On 2F he arrives at the right and travels **left** to its ladder. Alternate: 3F left→right; 4F right→left; 5F left→right; rooftop entered from the right. Ladders physically connect corresponding endpoints of neighboring floors.
- The floor's exit ladder unlocks only after its teacher is defeated. Progression is **one-way upward** in v1; Jeremy cannot revisit completed floors.
- Use a floor-state system to prevent encounters on neighboring visible floors from activating early. Floor-entry and floor-completion transitions must be deterministic.
- Geometry must ensure that floor bands, walkable surfaces, camera bounds, ladder endpoints, jump clearance, and rooftop fit without clipping. The 4320 height and 720-pixel bands are proposals; floor-to-floor ladder length should feel reasonable. If these constraints conflict, retain 1280×720 viewport and gameplay quality, and adjust world height/spacing with a documented rationale rather than silently compressing play space.

## 4. Camera

- Smooth horizontal tracking, keeping Jeremy in a comfortable region with forward visibility. Initial horizontal dead zone: ~15–20% of viewport width, adjustable.
- During walking, camera vertical position remains stable. Normal jumping should not cause aggressive vertical bobbing.
- During ladder ascent, smoothly follow vertically and settle into the next floor's framing (initial target ~0.5–0.8 seconds, adjustable).
- Respect world bounds. Avoid abrupt camera snaps, exposing empty space, or losing sight of the player during attacks.
- On rooftop arrival, reveal the skyline, Principal Ralf, and a barely visible UFO; maintain enough view to read his jumping arc.
- At all times, keep gameplay action legible; HUD remains screen-fixed, not world-fixed.

## 5. Characters and visual design

- Art direction: **16-bit-inspired pixel art**, slightly exaggerated arcade proportions, with original designs and polished readable animations. This is an aesthetic direction, not a restriction to tiny low-detail assets. The finished game should meet or exceed Formosa Quest's presentation quality.
- Jeremy: ordinary fifth-grade boy, dark tousled hair, blue sports jacket, sneakers, sturdy and determined. Oversized pencil case used as a sword. Not muscular, armored, or superpowered.
- Evil School Brats: half Jeremy's height, caps, mischievous/brainwashed look, simple marching animation.
- Female teachers (1F, 3F, 5F): generic professional attire, shoulder-length hair; subtle alien influence.
- Male teachers (2F, 4F): generic shirt/tie/trousers, distinct silhouette.
- Principal Ralf: bulky suited man with imposing outline; readable crouch, jump, and landing animations.
- School: recognizable hallways with doors, lockers, windows, noticeboards, and restrained signs of alien corruption. Rooftop: twilight skyline and faint UFO in background. Layer backgrounds and foregrounds for depth without obstructing hitboxes.
- Distinct animation/feedback for walking, jumping, jabbing, heavy shot, successful hits, charge-ready, enemy defeat, player damage, ladder climb, Principal telegraph/jump/landing, victory, and Game Over.
- Heavy projectile must look like a translucent enlarged **pencil case**, not a generic fireball.

## 6. Controls (keyboard)

- Left Arrow: walk left.
- Right Arrow: walk right.
- Up Arrow: jump; when in the interaction zone of an **unlocked** ladder, climb instead.
- Space: jump, including beside a ladder.
- Z: light pencil-case jab.
- X: heavy piercing pencil-case projectile (only if fully charged).
- R: full game restart, with context-sensitive confirmation rules below.
- Esc: cancel restart confirmation and resume gameplay.
- No requirement for WASD or alternate attack bindings in v1.
- Prevent browser scrolling from gameplay keys while the game has focus. Handle key releases and window focus loss robustly.

## 7. Combat and charge

- Light jab: **1 damage**, short cooldown, clear visible reach advantage over enemy contact. Hits only targets in Jeremy's facing direction and within the attack hitbox. Attack can be used while grounded or airborne.
- Every **successful light attack action** increases charge by **one** (not one per enemy hit), to a maximum of three. Missing entirely earns no charge. A hit that kills the target counts. Successful light hits on brats, teachers, or Principal count. One light action that overlaps multiple enemies still counts as one charge.
- At three charge points, **one heavy strike is stored**; additional light hits do not accumulate another. Using X fires a horizontally traveling, visually enlarged translucent pencil case in the facing direction and resets charge to zero.
- Heavy strike pierces targets, may strike multiple enemies along its route, and must not repeatedly damage the same target from one projectile. It does **3 damage** to bosses, sufficient to defeat a 2-HP teacher and deal half of Principal's 6 HP. Brats die in one hit. Heavy strikes **do not** build charge.
- Charge persists between floors and through non-terminal deaths/floor restarts. Full restart clears charge. Charge meter always indicates 0/3, 1/3, 2/3, or READY.
- Teacher: 2 HP; Principal: 6 HP. This permits Principal defeat with six light hits, two heavy hits, or three light hits followed by a heavy (assuming charge begins empty).
- Collision with a hostile enemy or Principal costs one life. Jeremy's light-attack reach must be greater than the enemy's contact hazard reach, allowing skillful no-damage play. Do not make enemy spawning cause unavoidable contact.

## 8. Encounters and progression

For each ordinary floor:
1. Jeremy arrives; begin the floor encounter only after arrival and camera transition are ready.
2. Spawn **four** Evil School Brats, **one second apart**, in a safe zone ahead of Jeremy in the direction of traversal. They approach Jeremy and have 1 HP each. Provide a brief spawn cue. Avoid spawning directly on the player or behind the player.
3. After all four are defeated, spawn the floor's teacher ahead of Jeremy at a safe distance. Teacher walks toward Jeremy, has 2 HP, and has no special ranged attack in v1.
4. Defeating the teacher awards **+1 life exactly once** for that floor and unlocks the exit ladder.
5. Jeremy crosses to the ladder, presses Up, and climbs to the next floor.

- Starts with **1 life**; completing all five floors without dying yields **6 lives** on rooftop entry.
- On enemy contact: deduct one life. If lives remain, reset the **current floor** encounter and teacher health, reposition Jeremy at that floor's safe entry point, preserve charge, and reframe camera. Previous floors remain completed. Avoid granting another completion reward from a previously completed floor.
- If no lives remain, show Game Over. Do not auto-restart.
- The current floor restart should not be confused with the player's full restart command.

## 9. Rooftop boss

- Principal Ralf: **6 HP**; a large suited boss.
- Every **3 seconds**, Principal initiates a visible jump toward the opposite end of the rooftop. Use a readable crouch/telegraph, airborne arc, and landing. The timing reference should be consistent and configurable; avoid overlapping jumps or teleportation.
- Contact with Principal is hazardous while grounded **and** airborne. Jeremy can damage him while grounded or airborne.
- Ensure Principal's trajectory is visible, reasonably avoidable, and accessible to Jeremy's melee/projectile attacks; avoid an unfair uninterruptible collision trap.
- On defeat, stop combat, display the golden key and original victory message, and allow R to play again.

## 10. Restart state machine — mandatory

States: `PLAYING`, `RESTART_CONFIRM`, `GAME_OVER`, `VICTORY` (plus opening/transition states as needed).

**During active gameplay**:
- First **new** R keydown enters `RESTART_CONFIRM`, pauses all simulation (movement, physics, timers, spawns, projectiles, damage, boss behavior), and displays exactly:
  **“Pressing R restarts the game. Press R again if you're sure.”**
- Require a **keyup followed by a fresh R keydown** to confirm. Holding R or keyboard auto-repeat must never confirm.
- Press Esc to cancel and resume the same gameplay state without advancing game time while paused.
- The overlay must be readable and must not hide whether restart is pending.

**At GAME_OVER or VICTORY**: a new R press immediately starts a completely fresh run; no confirmation needed because the current run has already ended.

**Full restart** resets all progress: Jeremy at 1F left, one life, zero charge, all encounters and bosses reset, camera reset, timers reset, overlays cleared, and opening/start flow restored. Avoid duplicate timers/listeners after multiple restarts.

**During the opening or floor transitions**: use a safe, deterministic policy; do not permit accidental immediate loss of an active run. Suggested: apply the same two-step confirmation when progress exists, otherwise restart the opening. Document chosen policy in code/tests.

## 11. HUD and menus

- HUD: current floor, remaining lives, charge meter (0–3 / READY), optionally a compact boss HP indicator during encounters. Screen-fixed and legible against backgrounds.
- Opening story appears sequentially and fades; do not clutter active play with persistent instruction paragraphs.
- Victory: large golden key centered, original victory line, and “Press R to play again.”
- Game Over: “GAME OVER”, “Jeremy couldn't escape the school.”, and “Press R to try again.”
- Restart confirmation: exact required text, plus optional secondary “Esc to cancel.”

## 12. Technical requirements and implementation plan for Codex

- Create a **separate new project/repository**, not an overwrite of Formosa Quest. Read `https://github.com/jaychtw/side-scroller-01` as a reference for architecture, quality, responsive jumping, rendering, and testing.
- Prefer Phaser 3 + TypeScript + Vite + Vitest, consistent with the reference. Reuse principles and compatible patterns, not copyrighted third-party assets.
- Modularize configuration/constants, player, enemies, combat/projectiles, floor encounter state, boss AI, camera, HUD, overlays, and restart state machine. Avoid hard-coded timing scattered across scene files.
- Implement in verifiable milestones: (1) continuous school and camera + movement/ladder, (2) combat/charge/enemy waves, (3) teacher/floor/lives, (4) rooftop boss, (5) story/HUD/menus/visual polish, (6) automated tests and production build.
- If tradeoffs arise, prioritize correctness, playability, camera legibility, and visual quality over speculative extra features. **Do not silently reduce viewport, world traversal, animation quality, or movement responsiveness.** Flag any proposed deviation from the baseline for approval.
- Keep parameters for speed, attack range, cooldown, spawn distance, jump timing, boss jump period, and camera smoothing in named configuration values. Tune through playtesting.

## 13. Acceptance tests

1. Game renders at a logical 1280×720 with responsive 16:9 scaling; no cropped controls or stretched sprites.
2. Continuous world: 1F left→right, 2F right→left, 3F left→right, 4F right→left, 5F left→right; roof accessible from 5F ladder; no discontinuous stage cuts.
3. Long flat hallways, substantial horizontal camera travel, and smooth vertical tracking on ladders.
4. Left/Right, Up/Space, Z, X work exactly as mapped. Up climbs only at unlocked ladder; Space jumps beside it.
5. Each floor spawns four brats at one-second intervals, safely ahead; teacher appears only after all four die.
6. Light attack deals one damage and increments charge only on successful actions; miss earns zero; overlapping hits earn at most one per action.
7. Charge caps at three, heavy is single-use and pierces without duplicate damage per target; heavy deals three boss damage.
8. Teachers have two HP; Principal has six; five unique floor-completion rewards of +1 life; no reward farming.
9. Losing a life restarts only the current floor, preserves charge, and does not restore previously consumed lives or reaward prior rewards.
10. Principal jumps in visible arcs about every three seconds, causes contact damage in air, and can be hit in air.
11. During active play, first R shows exact confirmation and pauses simulation. Holding R never confirms; release and second press restarts; Esc cancels and resumes unchanged state.
12. On Game Over or Victory, one R starts a new game. Full restart clears all states and timers even after repeated restarts.
13. Opening and victory texts match specification. Victory includes golden key and replay prompt.
14. Automated tests cover charge, damage, enemy sequence, life reward uniqueness, death/restart state, R confirmation and key repeat, and boss timing/state.
15. `npm run typecheck`, `npm test`, and `npm run build` pass. Document manual playtest results and any deviations.

## 14. Deliberate tuning assumptions (not new creative decisions)

The exact player/enemy sprite dimensions, collision hitbox sizes, movement speeds, projectile speed/range, jump height, ladder climb speed, enemy walking speed, and spawn-safe-distance must be calibrated during implementation against Formosa Quest's feel and the 1280×720 viewport. Do not invent these as irreversible requirements. Preserve testable relative properties: Jeremy's jab outranges contact, jump is responsive, all spawns are fair, Principal jump is avoidable, and camera keeps action visible.

**Open question to resolve through first playable prototype:** whether the proposed 2400×4320 world and floor spacing provide the intended traversal and comfortable climb duration. Adjust geometry only with documented rationale and without violating the non-regression quality bar.

---

# Copy-ready Codex instruction

Implement **Jeremy's Odyssey** as a new Phaser 3 / TypeScript / Vite browser game using the preceding GDD v1.0 as the authoritative specification. Before coding, inspect `https://github.com/jaychtw/side-scroller-01` (Formosa Quest) as a **read-only** quality/technical baseline. Match or exceed its 1280×720 presentation, smooth movement, browser scaling, visual polish, and automated test discipline. Build a substantial **continuous vertical school** with five long flat scrolling hallways and a rooftop; do not collapse the experience into small static screens. Follow the confirmed controls and all encounter, charge, life, boss, and restart rules precisely. In particular, while actively playing, pressing R must pause the game and display “Pressing R restarts the game. Press R again if you're sure.” A distinct second R press after key release confirms; Esc cancels. On Game Over/Victory, R restarts immediately. Implement modularly with configurable tuning values, test the core rules, run typecheck/tests/build, and report the results and any proposed deviation from the quality baseline. Do not overwrite the existing Formosa Quest project.
