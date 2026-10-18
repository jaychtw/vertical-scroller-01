import { C, floorY } from "./config";
import type { GameModel } from "./model";

export function stepEnemies(m: GameModel, dt: number) {
  for (const e of m.enemies) {
    e.hurt = Math.max(0, e.hurt - dt);
    e.facing = m.player.x < e.x ? -1 : 1;
    if (e.kind !== "principal") {
      if (e.hurt <= 0)
        e.x +=
          e.facing * (e.kind === "brat" ? C.bratSpeed : C.teacherSpeed) * dt;
      continue;
    }
    const oldPhase = e.phase;
    e.cycle += dt;
    if (e.cycle >= C.bossPeriod) {
      e.cycle -= C.bossPeriod;
      e.jumpCount++;
    }
    if (e.jumpCount === 0) {
      e.phase = "grounded";
      continue;
    }
    const age = e.cycle;
    if (age < C.bossTelegraph) {
      if (oldPhase !== "telegraph") {
        e.from = e.x;
        e.to =
          e.x < C.worldWidth / 2 ? C.worldWidth - C.roofMargin : C.roofMargin;
      }
      e.phase = "telegraph";
    } else if (age < C.bossTelegraph + C.bossFlight) {
      e.phase = "airborne";
      const t = (age - C.bossTelegraph) / C.bossFlight;
      e.x = e.from + (e.to - e.from) * t;
      e.y = floorY(5) - 4 * C.bossHeight * t * (1 - t);
    } else {
      e.phase = "landing";
      e.x = e.to;
      e.y = floorY(5);
      if (oldPhase !== "landing")
        m.effects.push({ type: "land", x: e.x, y: e.y });
    }
  }
}
