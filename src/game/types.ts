export type State =
  | "OPENING"
  | "TRANSITION"
  | "PLAYING"
  | "RESTART_CONFIRM"
  | "GAME_OVER"
  | "VICTORY";
export type Kind = "brat" | "teacher" | "principal";
export interface Input {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  jumpHeld?: boolean;
  up?: boolean;
  jab?: boolean;
  heavy?: boolean;
  enter?: boolean;
}
export interface Enemy {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  facing: -1 | 1;
  hurt: number;
  phase: "grounded" | "telegraph" | "airborne" | "landing";
  cycle: number;
  from: number;
  to: number;
  jumpCount: number;
}
export interface Projectile {
  id: number;
  x: number;
  y: number;
  dir: number;
  age: number;
  hit: Set<number>;
}
export interface Cue {
  x: number;
  age: number;
  kind: Kind;
}
export interface Effect {
  type:
    | "hit"
    | "defeat"
    | "jab"
    | "heavy"
    | "damage"
    | "reward"
    | "jump"
    | "land"
    | "climb"
    | "ready"
    | "spawn"
    | "victory";
  x: number;
  y: number;
  text?: string;
}
export interface Player {
  x: number;
  y: number;
  vy: number;
  facing: -1 | 1;
  grounded: boolean;
  coyote: number;
  buffer: number;
  cooldown: number;
  jab: number;
  heavy: number;
  hit: Set<number>;
  earned: boolean;
}
export const enemyHeight = (e: Enemy) =>
  e.kind === "brat" ? 38 : e.kind === "teacher" ? 98 : 124;
export const enemyWidth = (e: Enemy) =>
  e.kind === "brat" ? 15 : e.kind === "teacher" ? 22 : 37;
