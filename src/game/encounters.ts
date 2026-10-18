import { C, floorY, travelDirection } from "./config";
import type { Kind } from "./types";
import type { GameModel } from "./model";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function safeSpawnX(m: GameModel): number | null {
  const dir = travelDirection(m.floor);
  const x = clamp(m.player.x + dir * C.spawnDistance, 64, C.worldWidth - 64);
  // Keep a cue ahead of Jeremy, never silently place a hostile behind him or on top of him.
  return (x - m.player.x) * dir >= C.spawnMin ? x : null;
}
export function stepEncounter(m: GameModel, dt: number) {
  if (m.floor === 5 || m.unlocked) return;
  m.encounterTime += dt;
  m.hint = "";
  if (
    m.spawned < 4 &&
    !m.cues.some((cue) => cue.kind === "brat") &&
    m.encounterTime >= m.nextSpawnAt
  ) {
    const x = safeSpawnX(m);
    if (x !== null) {
      m.cues.push({ x, age: 0, kind: "brat" });
      m.spawned++;
    } else m.hint = "STEP BACK TO GIVE THE INCOMING SIGNAL ROOM";
  }
  if (m.spawned === 4 && m.defeated === 4 && !m.teacherScheduled) {
    const x = safeSpawnX(m);
    if (x !== null) {
      m.cues.push({ x, age: 0, kind: "teacher" });
      m.teacherScheduled = true;
    } else m.hint = "STEP BACK — THE TEACHER IS APPROACHING";
  }
  m.cues = m.cues.filter((cue) => {
    cue.age += dt;
    if (cue.age < C.spawnCue) return true;
    const dir = travelDirection(m.floor);
    if ((cue.x - m.player.x) * dir < 150) {
      const safe = safeSpawnX(m);
      if (safe === null) {
        m.hint = "STEP BACK — KEEP THE SIGNAL AHEAD OF YOU";
        return true;
      }
      cue.x = safe;
      cue.age = 0;
      return true;
    }
    spawn(m, cue.kind, cue.x);
    if (cue.kind === "brat")
      m.nextSpawnAt = m.encounterTime + C.spawnInterval - C.spawnCue;
    return false;
  });
}
export function spawn(m: GameModel, kind: Kind, x: number) {
  const hp = kind === "brat" ? 1 : kind === "teacher" ? 2 : 6;
  m.enemies.push({
    id: m.nextId++,
    kind,
    x,
    y: floorY(m.floor),
    hp,
    maxHp: hp,
    facing: -travelDirection(m.floor) as -1 | 1,
    hurt: 0,
    phase: "grounded",
    cycle: 0,
    from: x,
    to: C.worldWidth - C.roofMargin,
    jumpCount: 0,
  });
  m.effects.push({
    type: "spawn",
    x,
    y: floorY(m.floor),
    text: kind === "teacher" ? "THE TEACHER" : undefined,
  });
}
