import { C } from "./config";
import type { GameModel } from "./model";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const approach = (a: number, b: number, speed: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-speed * dt));

export function stepCamera(m: GameModel, dt: number) {
  const p = m.player;
  const center = m.camera.x + C.width / 2;
  let targetX = m.camera.x;
  const focus = p.x + p.facing * 130;
  if (focus > center + C.deadzone) targetX = focus - C.width / 2 - C.deadzone;
  if (focus < center - C.deadzone) targetX = focus - C.width / 2 + C.deadzone;
  let targetY = (5 - m.floor) * C.band;
  if (m.state === "TRANSITION" && m.transition.kind === "climb") {
    // Compensate for follow lag so Jeremy stays above the lower HUD while climbing.
    targetY = p.y - C.groundOffset - C.band / C.climbDuration / C.cameraSmooth;
  }
  m.camera.x = clamp(
    approach(
      m.camera.x,
      clamp(targetX, 0, C.worldWidth - C.width),
      C.cameraSmooth,
      dt,
    ),
    0,
    C.worldWidth - C.width,
  );
  m.camera.y = clamp(
    approach(m.camera.y, targetY, C.cameraSmooth, dt),
    0,
    C.worldHeight - C.height,
  );
  if (m.transition.kind === "respawn" && m.state === "TRANSITION") {
    m.camera.x = approach(
      m.camera.x,
      clamp(p.x - C.width / 2, 0, C.worldWidth - C.width),
      12,
      dt,
    );
  }
}
