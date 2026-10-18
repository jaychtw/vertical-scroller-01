import { stepPlayer } from "./player";
import { stepCamera } from "./camera";
import { stepEnemies } from "./enemies";
import { stepCombat } from "./combat";
import { stepEncounter, spawn } from "./encounters";
import { C, entryX, floorY, travelDirection } from "./config";

import {
  enemyHeight,
  enemyWidth,
  type State,
  type Input,
  type Enemy,
  type Projectile,
  type Cue,
  type Effect,
  type Player,
} from "./types";
export * from "./types";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Pure deterministic simulation. Phaser owns presentation; no browser timers drive game rules. */
export class GameModel {
  state: State = "OPENING";
  private resumedState: State = "OPENING";
  time = 0;
  opening = 0;
  floor = 0;
  lives = 1;
  charge = 0;
  rewards = new Set<number>();
  player!: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  cues: Cue[] = [];
  effects: Effect[] = [];
  spawned = 0;
  defeated = 0;
  teacherScheduled = false;
  unlocked = false;
  encounterTime = 0;
  nextSpawnAt = 0;
  camera = { x: 0, y: 3600 };
  transition = {
    kind: "arrival" as "arrival" | "climb" | "respawn",
    age: 0,
    from: 0,
  };
  nextId = 1;
  rHeld = false;
  restartArmed = false;
  hint = "";
  damageFlash = 0;
  constructor() {
    this.reset();
  }
  reset() {
    this.state = "OPENING";
    this.resumedState = "OPENING";
    this.time = 0;
    this.opening = 0;
    this.floor = 0;
    this.lives = 1;
    this.charge = 0;
    this.rewards.clear();
    this.enemies = [];
    this.cues = [];
    this.projectiles = [];
    this.effects = [];
    this.spawned = 0;
    this.defeated = 0;
    this.teacherScheduled = false;
    this.unlocked = false;
    this.encounterTime = 0;
    this.nextSpawnAt = 0;
    this.nextId = 1;
    this.damageFlash = 0;
    this.restartArmed = false;
    this.hint = "";
    this.player = this.newPlayer();
    this.camera = { x: 0, y: 3600 };
    this.transition = { kind: "arrival", age: 0, from: 0 };
    // Preserve rHeld until a real keyup: restarting never reinterprets a held R as a new press.
  }
  private newPlayer(): Player {
    return {
      x: entryX(this.floor),
      y: floorY(this.floor),
      vy: 0,
      facing: travelDirection(this.floor),
      grounded: true,
      coyote: 0,
      buffer: 0,
      cooldown: 0,
      jab: 0,
      heavy: 0,
      hit: new Set(),
      earned: false,
    };
  }
  restartKey(down: boolean, repeat = false) {
    if (!down) {
      this.rHeld = false;
      if (this.state === "RESTART_CONFIRM") this.restartArmed = true;
      return;
    }
    if (this.rHeld || repeat) return;
    this.rHeld = true;
    if (this.state === "GAME_OVER" || this.state === "VICTORY") {
      this.reset();
      return;
    }
    if (this.state === "RESTART_CONFIRM") {
      if (this.restartArmed) this.reset();
      return;
    }
    // Opening and transitions receive the same confirmation protection as active play.
    this.resumedState = this.state;
    this.state = "RESTART_CONFIRM";
    this.restartArmed = false;
  }
  cancelRestart() {
    if (this.state === "RESTART_CONFIRM") {
      this.state = this.resumedState;
      this.restartArmed = false;
    }
  }
  focusLost() {
    // Never synthesize R keyup here: a real release is required to arm confirmation.
    if (
      this.state !== "GAME_OVER" &&
      this.state !== "VICTORY" &&
      this.state !== "RESTART_CONFIRM"
    ) {
      this.resumedState = this.state;
      this.state = "RESTART_CONFIRM";
      this.restartArmed = false;
    }
  }
  step(dt: number, input: Input = {}) {
    if (
      this.state === "RESTART_CONFIRM" ||
      this.state === "GAME_OVER" ||
      this.state === "VICTORY"
    )
      return;
    this.time += dt;
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    if (this.state === "OPENING") {
      this.opening += dt;
      if (input.enter) this.opening = this.opening < 4.6 ? 4.6 : 7.5;
      if (this.opening >= 7.5) this.beginArrival();
    } else if (this.state === "TRANSITION") this.stepTransition(dt);
    else {
      stepPlayer(this, dt, input);
      if (this.state === "PLAYING") {
        stepEncounter(this, dt);
        stepEnemies(this, dt);
        stepCombat(this, dt, input, (e, damage, dir) =>
          this.hit(e, damage, dir),
        );
        this.contacts();
      }
    }
    stepCamera(this, dt);
  }
  private beginArrival(kind: "arrival" | "respawn" = "arrival") {
    this.state = "TRANSITION";
    this.transition = { kind, age: 0, from: this.floor };
  }
  private stepTransition(dt: number) {
    const t = this.transition;
    t.age += dt;
    if (t.kind === "climb") {
      const p = clamp(t.age / C.climbDuration, 0, 1);
      this.player.y = floorY(t.from) - C.band * p;
      if (p >= 1) {
        this.floor++;
        this.player = this.newPlayer();
        this.clearEncounter();
        this.beginArrival();
      }
    } else if (t.age >= C.arrival) {
      this.state = "PLAYING";
      if (this.floor === 5 && this.enemies.length === 0)
        spawn(this, "principal", 1600);
    }
  }
  private hit(e: Enemy, damage: number, dir: number) {
    e.hp = Math.max(0, e.hp - damage);
    e.hurt = 0.18;
    this.effects.push({
      type: "hit",
      x: e.x,
      y: e.y - enemyHeight(e) * 0.55,
      text: `−${damage}`,
    });
    if (e.kind !== "principal")
      e.x = clamp(e.x + dir * 42, 40, C.worldWidth - 40);
    if (e.hp) return;
    this.enemies = this.enemies.filter((other) => other.id !== e.id);
    this.effects.push({ type: "defeat", x: e.x, y: e.y - 30 });
    if (e.kind === "brat") this.defeated++;
    if (e.kind === "teacher") {
      this.unlocked = true;
      if (!this.rewards.has(this.floor)) {
        this.rewards.add(this.floor);
        this.lives++;
        this.effects.push({
          type: "reward",
          x: this.player.x,
          y: this.player.y - 110,
          text: "+1 LIFE · LADDER UNLOCKED",
        });
      }
    }
    if (e.kind === "principal") {
      this.state = "VICTORY";
      this.projectiles = [];
      this.cues = [];
      this.player.jab = 0;
      this.effects.push({ type: "victory", x: e.x, y: e.y - 60 });
    }
  }
  private contacts() {
    const p = this.player;
    for (const e of this.enemies) {
      if (
        Math.abs(e.x - p.x) < C.playerHalfWidth + enemyWidth(e) &&
        e.y > p.y - C.playerHeight + 8 &&
        e.y - enemyHeight(e) < p.y - 5
      ) {
        this.loseLife();
        return;
      }
    }
  }
  private loseLife() {
    this.lives--;
    this.damageFlash = 0.6;
    this.effects.push({
      type: "damage",
      x: this.player.x,
      y: this.player.y - 40,
    });
    if (this.lives <= 0) {
      this.state = "GAME_OVER";
      return;
    }
    this.clearEncounter();
    this.player = this.newPlayer();
    this.beginArrival("respawn");
  }
  private clearEncounter() {
    this.enemies = [];
    this.cues = [];
    this.projectiles = [];
    this.spawned = 0;
    this.defeated = 0;
    this.teacherScheduled = false;
    this.unlocked = false;
    this.encounterTime = 0;
    this.nextSpawnAt = 0;
    this.hint = "";
  }
}
