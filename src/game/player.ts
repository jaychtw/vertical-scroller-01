import { C, exitX, floorY } from "./config";
import type { Input } from "./types";
import type { GameModel } from "./model";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function stepPlayer(m: GameModel, dt: number, input: Input) {
  const p = m.player;
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.jab = Math.max(0, p.jab - dt);
  p.heavy = Math.max(0, p.heavy - dt);
  const direction = Number(!!input.right) - Number(!!input.left);
  if (direction) p.facing = direction as -1 | 1;
  p.x = clamp(p.x + direction * C.playerSpeed * dt, 50, C.worldWidth - 50);
  if (
    input.up &&
    m.unlocked &&
    p.grounded &&
    Math.abs(p.x - exitX(m.floor)) < 62
  ) {
    m.state = "TRANSITION";
    m.transition = { kind: "climb", age: 0, from: m.floor };
    p.x = exitX(m.floor);
    p.vy = 0;
    p.jab = 0;
    m.projectiles = [];
    m.effects.push({ type: "climb", x: p.x, y: p.y });
    return;
  }
  if (p.grounded) p.coyote = C.coyote;
  else p.coyote -= dt;
  p.buffer -= dt;
  if (input.jump || input.up) p.buffer = C.jumpBuffer;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -C.jumpSpeed;
    p.grounded = false;
    p.coyote = 0;
    p.buffer = 0;
    m.effects.push({ type: "jump", x: p.x, y: p.y });
  }
  if (!input.jumpHeld && p.vy < -C.jumpCut) p.vy = -C.jumpCut;
  p.vy += C.gravity * dt;
  p.y += p.vy * dt;
  if (p.y >= floorY(m.floor)) {
    p.y = floorY(m.floor);
    p.vy = 0;
    p.grounded = true;
  }
}
