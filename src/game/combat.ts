import { C } from "./config";
import { enemyWidth, enemyHeight, type Input, type Enemy } from "./types";
import type { GameModel } from "./model";

export function stepCombat(
  m: GameModel,
  dt: number,
  input: Input,
  hit: (enemy: Enemy, damage: number, dir: number) => void,
) {
  const p = m.player;
  if (input.jab && p.cooldown <= 0) {
    p.jab = C.jabDuration;
    p.cooldown = C.jabCooldown;
    p.hit.clear();
    p.earned = false;
    m.effects.push({ type: "jab", x: p.x + p.facing * 68, y: p.y - 45 });
  }
  if (p.jab > 0)
    for (const e of [...m.enemies]) {
      const forward = (e.x - p.x) * p.facing;
      if (
        !p.hit.has(e.id) &&
        forward > 0 &&
        forward - enemyWidth(e) < C.jabReach &&
        e.y > p.y - C.playerHeight - 15 &&
        e.y - enemyHeight(e) < p.y - 8
      ) {
        p.hit.add(e.id);
        hit(e, 1, p.facing);
        if (!p.earned) {
          m.charge = Math.min(3, m.charge + 1);
          p.earned = true;
          if (m.charge === 3)
            m.effects.push({ type: "ready", x: p.x, y: p.y - 100 });
        }
      }
    }
  if (input.heavy && m.charge === 3) {
    m.charge = 0;
    p.heavy = 0.22;
    m.projectiles.push({
      id: m.nextId++,
      x: p.x + p.facing * 45,
      y: p.y - 42,
      dir: p.facing,
      age: 0,
      hit: new Set(),
    });
    m.effects.push({ type: "heavy", x: p.x, y: p.y - 42 });
  }
  for (const shot of m.projectiles) {
    const previousX = shot.x;
    shot.age += dt;
    shot.x += shot.dir * C.projectileSpeed * dt;
    for (const e of [...m.enemies]) {
      if (
        !shot.hit.has(e.id) &&
        e.x + enemyWidth(e) >=
          Math.min(previousX, shot.x) - C.projectileWidth / 2 &&
        e.x - enemyWidth(e) <=
          Math.max(previousX, shot.x) + C.projectileWidth / 2 &&
        shot.y + 25 > e.y - enemyHeight(e) &&
        shot.y - 25 < e.y
      ) {
        shot.hit.add(e.id);
        hit(e, 3, shot.dir);
      }
    }
  }
  m.projectiles = m.projectiles.filter(
    (p) => p.age < C.projectileLife && p.x > -100 && p.x < C.worldWidth + 100,
  );
}
