import { describe, expect, it } from "vitest";
import { C, entryX, exitX, floorY, TEXT } from "./config";
import { GameModel, type Enemy, type Input, type Kind } from "./model";

function advance(m: GameModel, seconds: number, input: Input = {}) {
  for (let t = 0; t < seconds - 1e-8; t += 1 / 120) m.step(1 / 120, input);
}
function playing(floor = 0) {
  const m = new GameModel();
  m.state = "PLAYING";
  m.floor = floor;
  m.player.x = entryX(floor);
  m.player.y = floorY(floor);
  return m;
}
function enemy(
  m: GameModel,
  kind: Kind = "brat",
  dx = 75,
  hp = kind === "brat" ? 1 : kind === "teacher" ? 2 : 6,
): Enemy {
  const e: Enemy = {
    id: m.nextId++,
    kind,
    x: m.player.x + dx,
    y: m.player.y,
    hp,
    maxHp: hp,
    facing: -1,
    hurt: 0,
    phase: "grounded",
    cycle: 0,
    from: 0,
    to: 0,
    jumpCount: 0,
  };
  m.enemies.push(e);
  return e;
}
function jab(m: GameModel) {
  m.player.cooldown = 0;
  m.step(1 / 120, { jab: true });
}
function snapshot(m: GameModel) {
  return JSON.stringify(m, (_, value) =>
    value instanceof Set ? [...value] : value,
  );
}

describe("combat and charge", () => {
  it("misses do not charge; hits and killing blows charge once per action", () => {
    const m = playing();
    jab(m);
    expect(m.charge).toBe(0);
    enemy(m);
    enemy(m, "brat", 85);
    enemy(m, "teacher", 90);
    jab(m);
    expect(m.charge).toBe(1);
    expect(m.defeated).toBe(2);
    expect(m.enemies[0].hp).toBe(1);
    advance(m, 0.1);
    expect(m.charge).toBe(1);
    expect(m.enemies[0].hp).toBe(1);
  });
  it("respects facing, reach and vertical overlap", () => {
    const m = playing();
    const behind = enemy(m, "brat", -65),
      far = enemy(m, "brat", 190),
      air = enemy(m, "brat", 50);
    air.y -= 190;
    jab(m);
    expect(m.charge).toBe(0);
    expect([behind.hp, far.hp, air.hp]).toEqual([1, 1, 1]);
    m.player.facing = -1;
    jab(m);
    expect(m.charge).toBe(1);
    expect(m.enemies).not.toContain(behind);
  });
  it("can jab while airborne and its reach exceeds the contact hazard", () => {
    const m = playing();
    m.player.y -= 80;
    m.player.grounded = false;
    enemy(m, "teacher", 85);
    jab(m);
    expect(m.charge).toBe(1);
    expect(m.lives).toBe(1);
    expect(C.jabReach).toBeGreaterThan(C.playerHalfWidth + 37);
  });
  it("caps charge at three and heavy is single use", () => {
    const m = playing();
    m.spawned = 4;
    m.defeated = 0;
    for (let i = 0; i < 5; i++) {
      enemy(m);
      jab(m);
    }
    expect(m.charge).toBe(3);
    m.step(1 / 120, { heavy: true });
    expect(m.charge).toBe(0);
    expect(m.projectiles).toHaveLength(1);
    m.step(1 / 120, { heavy: true });
    expect(m.projectiles).toHaveLength(1);
  });
  it("heavy pierces, kills teachers, does three boss damage, and never re-hits a target", () => {
    const m = playing();
    m.charge = 3;
    const a = enemy(m, "teacher", 140);
    const b = enemy(m, "principal", 225);
    enemy(m, "brat", 320);
    m.step(1 / 120, { heavy: true });
    advance(m, 0.4);
    expect(a.hp).toBe(0);
    expect(b.hp).toBe(3);
    expect(m.defeated).toBe(1);
    expect(m.charge).toBe(0);
    advance(m, 0.2);
    expect(b.hp).toBe(3);
  });
  it("principal accepts six jabs or a three-jab / heavy combination", () => {
    for (const heavy of [false, true]) {
      const m = playing(5),
        boss = enemy(m, "principal", 90);
      for (let i = 0; i < (heavy ? 3 : 6); i++) jab(m);
      if (heavy) {
        expect(m.charge).toBe(3);
        m.step(1 / 120, { heavy: true });
        advance(m, 0.1);
      }
      expect(boss.hp).toBe(0);
      expect(m.state).toBe("VICTORY");
    }
  });
});

describe("encounter lifecycle and safe spawning", () => {
  it("spawns exactly four brats one second apart after their cue, then waits for all deaths", () => {
    const m = playing();
    const times: number[] = [];
    let last = 0;
    for (let i = 0; i < 490; i++) {
      m.step(1 / 120);
      if (m.enemies.length > last) {
        times.push(m.time);
        last = m.enemies.length;
      }
    }
    expect(m.spawned).toBe(4);
    expect(times).toHaveLength(4);
    for (let i = 1; i < times.length; i++)
      expect(times[i] - times[i - 1]).toBeCloseTo(1, 1);
    expect(m.enemies.every((e) => e.kind === "brat")).toBe(true);
    expect(m.teacherScheduled).toBe(false);
    m.enemies = [];
    m.defeated = 4;
    m.step(1 / 120);
    expect(m.teacherScheduled).toBe(true);
    advance(m, 0.6);
    expect(m.enemies.map((e) => e.kind)).toEqual(["teacher"]);
  });
  it("delays unsafe edge spawns and rechecks a cue if Jeremy runs into it", () => {
    const m = playing();
    m.player.x = 2320;
    advance(m, 0.8);
    expect(m.enemies).toHaveLength(0);
    expect(m.cues).toHaveLength(0);
    expect(m.hint).toContain("STEP BACK");
    m.player.x = 1800;
    m.step(0.01);
    expect(m.cues).toHaveLength(1);
    m.player.x = m.cues[0].x;
    advance(m, 0.7);
    expect(m.enemies).toHaveLength(0);
    m.player.x = 1600;
    advance(m, 0.7);
    expect(m.enemies.length).toBeGreaterThan(0);
  });
  it("preserves one-second spacing after a long unsafe spawn delay", () => {
    const m = playing();
    m.player.x = 2320;
    advance(m, 5);
    expect(m.spawned).toBe(0);
    m.player.x = 1600;
    const times: number[] = [];
    let last = 0;
    for (let i = 0; i < 540; i++) {
      m.step(1 / 120);
      if (m.enemies.length > last) {
        times.push(m.time);
        last = m.enemies.length;
      }
    }
    expect(times).toHaveLength(4);
    for (let i = 1; i < times.length; i++)
      expect(times[i] - times[i - 1]).toBeCloseTo(1, 1);
  });
  it("spawns ahead in both traversal directions", () => {
    for (let f = 0; f < 5; f++) {
      const m = playing(f);
      advance(m, 0.6);
      expect(m.enemies).toHaveLength(1);
      expect((m.enemies[0].x - m.player.x) * (f % 2 ? -1 : 1)).toBeGreaterThan(
        300,
      );
    }
  });
  it("does not activate any encounter during opening, climbing or arrival", () => {
    const m = new GameModel();
    advance(m, 7.4);
    expect(m.spawned).toBe(0);
    advance(m, 0.6);
    expect(m.state).toBe("TRANSITION");
    expect(m.spawned).toBe(0);
    advance(m, 0.3);
    expect(m.state).toBe("PLAYING");
    m.enemies = [];
    m.cues = [];
    m.unlocked = true;
    const before = m.spawned;
    m.player.x = exitX(0);
    m.step(0.01, { up: true });
    advance(m, 1);
    expect(m.state).toBe("TRANSITION");
    expect(m.spawned).toBe(before);
  });
});

describe("floors, rewards, deaths and camera", () => {
  it("alternates five 2400-wide floors and climbs continuously into the roof with six lives", () => {
    const m = playing();
    m.charge = 2;
    for (let f = 0; f < 5; f++) {
      m.player.x = 1200;
      m.player.facing = 1;
      enemy(m, "teacher", 80, 1);
      jab(m);
      expect(m.unlocked).toBe(true);
      expect(m.lives).toBe(f + 2);
      expect(m.rewards.size).toBe(f + 1);
      m.player.x = exitX(f);
      m.step(0.01, { up: true });
      expect(m.state).toBe("TRANSITION");
      const oldY = m.player.y;
      advance(m, 1);
      expect(m.player.y).toBeLessThan(oldY);
      expect(m.player.y).toBeGreaterThan(floorY(f + 1));
      advance(m, 1.9);
      expect(m.floor).toBe(f + 1);
      expect(m.player.x).toBe(entryX(f + 1));
      expect(m.state).toBe("PLAYING");
    }
    expect(m.lives).toBe(6);
    expect(m.enemies.map((e) => e.kind)).toEqual(["principal"]);
    expect(m.camera.y).toBeLessThan(2);
  });
  it("only Up climbs an unlocked ladder; Space jumps beside it", () => {
    const m = playing();
    m.player.x = exitX(0);
    m.step(0.01, { up: true, jumpHeld: true });
    expect(m.state).toBe("PLAYING");
    expect(m.player.vy).toBeLessThan(0);
    advance(m, 1);
    m.unlocked = true;
    m.step(0.01, { jump: true, jumpHeld: true });
    expect(m.state).toBe("PLAYING");
    advance(m, 1);
    m.step(0.01, { up: true });
    expect(m.transition.kind).toBe("climb");
  });
  it("restarts only the current floor on nonterminal contact and preserves charge and previous completion", () => {
    const m = playing(2);
    m.lives = 3;
    m.charge = 2;
    m.rewards.add(0);
    m.rewards.add(1);
    enemy(m, "brat", 0);
    m.step(0.01);
    expect(m.lives).toBe(2);
    expect(m.floor).toBe(2);
    expect(m.charge).toBe(2);
    expect([...m.rewards]).toEqual([0, 1]);
    expect(m.player.x).toBe(entryX(2));
    expect(m.enemies).toHaveLength(0);
    expect(m.state).toBe("TRANSITION");
  });
  it("never farms a teacher reward after dying on an already completed current floor", () => {
    const m = playing();
    enemy(m, "teacher", 75, 1);
    jab(m);
    expect(m.lives).toBe(2);
    m.player.jab = 0;
    enemy(m, "brat", 0);
    m.step(0.01);
    expect(m.lives).toBe(1);
    advance(m, 0.8);
    m.player.x = 500;
    enemy(m, "teacher", 75, 1);
    jab(m);
    expect(m.unlocked).toBe(true);
    expect(m.lives).toBe(1);
    expect(m.rewards.size).toBe(1);
  });
  it("terminal death freezes the run until R", () => {
    const m = playing();
    enemy(m, "brat", 0);
    m.step(0.01);
    expect(m.state).toBe("GAME_OVER");
    const before = snapshot(m);
    advance(m, 5);
    expect(snapshot(m)).toBe(before);
  });
  it("walking camera moves horizontally; jumping leaves its vertical framing stable", () => {
    const m = playing();
    m.unlocked = true;
    advance(m, 4, { right: true });
    expect(m.camera.x).toBeGreaterThan(450);
    const y = m.camera.y;
    m.step(0.01, { jump: true, jumpHeld: true });
    advance(m, 0.4, { jumpHeld: true });
    expect(m.player.y).toBeLessThan(floorY(0) - 50);
    expect(m.camera.y).toBe(y);
    expect(m.camera.x).toBeGreaterThanOrEqual(0);
    expect(m.camera.x).toBeLessThanOrEqual(1120);
  });
  it("supports jump buffering and variable jump height", () => {
    const a = playing(),
      b = playing();
    a.unlocked = b.unlocked = true;
    a.step(0.01, { jump: true, jumpHeld: true });
    b.step(0.01, { jump: true, jumpHeld: true });
    advance(a, 0.2, { jumpHeld: true });
    advance(b, 0.2);
    expect(a.player.y).toBeLessThan(b.player.y - 35);
    const c = playing();
    c.unlocked = true;
    c.player.y -= 5;
    c.player.vy = 120;
    c.player.grounded = false;
    c.player.coyote = -1;
    c.step(0.01, { jump: true, jumpHeld: true });
    advance(c, 0.05, { jumpHeld: true });
    expect(c.player.vy).toBeLessThan(0);
  });
});

describe("restart and pause state machine", () => {
  it("first R pauses all simulation and a held or repeated R never confirms", () => {
    const m = playing(5);
    advance(m, 3.6);
    m.projectiles.push({
      id: 99,
      x: 100,
      y: 550,
      dir: 1,
      age: 0,
      hit: new Set(),
    });
    m.restartKey(true);
    expect(m.state).toBe("RESTART_CONFIRM");
    const before = snapshot(m);
    advance(m, 15, { right: true, jab: true, heavy: true });
    expect(snapshot(m)).toBe(before);
    m.restartKey(true, true);
    m.restartKey(true);
    expect(m.state).toBe("RESTART_CONFIRM");
    m.restartKey(false);
    m.restartKey(true, true);
    expect(m.state).toBe("RESTART_CONFIRM");
    m.restartKey(true);
    expect(m.state).toBe("OPENING");
    expect(m.floor).toBe(0);
    expect(m.lives).toBe(1);
    expect(m.charge).toBe(0);
    expect(m.projectiles).toHaveLength(0);
    expect(m.rewards.size).toBe(0);
  });
  it("Esc resumes exactly the previous state without advancing any clock", () => {
    const m = playing();
    advance(m, 1);
    const t = m.time,
      x = m.player.x,
      cueAge = m.cues[0]?.age;
    m.restartKey(true);
    advance(m, 10);
    m.cancelRestart();
    expect(m.state).toBe("PLAYING");
    expect(m.time).toBe(t);
    expect(m.player.x).toBe(x);
    expect(m.cues[0]?.age).toBe(cueAge);
  });
  it.each(["GAME_OVER", "VICTORY"] as const)("one R restarts %s", (state) => {
    const m = playing(5);
    m.state = state;
    m.lives = 4;
    m.charge = 3;
    m.restartKey(true);
    expect(m.state).toBe("OPENING");
    expect(m.lives).toBe(1);
    expect(m.charge).toBe(0);
    expect(m.time).toBe(0);
  });
  it("protects opening and transitions, and repeated full restarts do not retain timers", () => {
    const m = new GameModel();
    for (let i = 0; i < 8; i++) {
      advance(m, 0.2);
      m.restartKey(false);
      m.restartKey(true);
      expect(m.state).toBe("RESTART_CONFIRM");
      m.restartKey(false);
      m.restartKey(true);
      expect(m.time).toBe(0);
      expect(m.enemies).toHaveLength(0);
    }
    m.restartKey(false);
    m.state = "TRANSITION";
    m.restartKey(true);
    m.restartKey(false);
    m.cancelRestart();
    expect(m.state).toBe("TRANSITION");
  });
  it("focus loss pauses instead of leaving movement held or advancing an unattended run", () => {
    const m = playing();
    m.focusLost();
    expect(m.state).toBe("RESTART_CONFIRM");
    const t = m.time;
    advance(m, 3);
    expect(m.time).toBe(t);
    m.cancelRestart();
    expect(m.state).toBe("PLAYING");
  });
  it("keeps all mandatory story and menu strings exact", () => {
    expect(TEXT.confirm).toBe(
      "Pressing R restarts the game. Press R again if you're sure.",
    );
    expect(TEXT.victory).toBe("You got the key. Now, you can go home, Jeremy.");
    expect(TEXT.over).toBe("Jeremy couldn't escape the school.");
    expect(TEXT.opening).toHaveLength(2);
  });
});

describe("Ralf timing and aerial contact", () => {
  it("telegraphs every three seconds, follows a real arc, and lands at the opposite end", () => {
    const m = playing(5);
    m.state = "TRANSITION";
    advance(m, 0.71);
    const boss = m.enemies[0];
    expect(boss.hp).toBe(6);
    advance(m, 2.9);
    expect(boss.phase).toBe("grounded");
    advance(m, 0.2);
    expect(boss.phase).toBe("telegraph");
    advance(m, 0.5);
    expect(boss.phase).toBe("airborne");
    advance(m, 0.6);
    expect(boss.y).toBeLessThan(floorY(5) - 200);
    advance(m, 1.2);
    expect(boss.phase).toBe("landing");
    expect(boss.x).toBe(C.roofMargin);
    expect(boss.y).toBe(floorY(5));
    advance(m, 0.7);
    expect(boss.phase).toBe("telegraph");
    expect(boss.jumpCount).toBe(2);
    expect(boss.to).toBe(C.worldWidth - C.roofMargin);
  });
  it("principal contact remains hazardous in the air", () => {
    const m = playing(5);
    m.state = "TRANSITION";
    advance(m, 0.71);
    advance(m, 3.9);
    const boss = m.enemies[0];
    expect(boss.phase).toBe("airborne");
    m.player.x = boss.x;
    m.player.y = boss.y;
    m.player.grounded = false;
    m.step(1 / 120);
    expect(m.state).toBe("GAME_OVER");
  });
});
