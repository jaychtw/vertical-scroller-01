import Phaser from "phaser";
import { C, floorY } from "./config";
import { createTextures, SchoolArt } from "./art";
import { GameModel, type Input, type Effect, enemyHeight } from "./model";
import { GameUI } from "./ui";
import { GameAudio } from "./audio";
import { StoryLanguage } from "./story";

interface Visual {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
}
interface FX extends Effect {
  born: number;
  seed: number;
}
export class OdysseyScene extends Phaser.Scene {
  model = new GameModel();
  audio = new GameAudio();
  readonly story = new StoryLanguage();
  private school!: SchoolArt;
  private ui!: GameUI;
  private player!: Visual;
  private enemies = new Map<number, Visual>();
  private shots = new Map<number, Phaser.GameObjects.Image>();
  private fx!: Phaser.GameObjects.Graphics;
  private effects: FX[] = [];
  private floating: {
    text: Phaser.GameObjects.Text;
    born: number;
    y: number;
  }[] = [];
  private held = new Set<string>();
  private pressed = new Set<string>();
  private accumulator = 0;
  private previousTime = 0;
  private ladderStatus = "";
  constructor() {
    super("Odyssey");
  }
  create() {
    createTextures(this);
    this.school = new SchoolArt(this);
    this.cameras.main
      .setBounds(0, 0, C.worldWidth, C.worldHeight)
      .setBackgroundColor(0x142439)
      .setRoundPixels(true);
    this.player = this.visual("jeremy-idle-0", 0.76);
    this.fx = this.add.graphics().setDepth(30);
    this.ui = new GameUI(this, this.story);
    const gameElement = document.getElementById("game")!;
    const down = (event: KeyboardEvent) => {
      if (
        !gameElement.contains(document.activeElement) &&
        document.activeElement !== gameElement
      )
        return;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Space",
          "KeyZ",
          "KeyX",
          "KeyR",
          "Escape",
          "Enter",
        ].includes(event.code)
      )
        event.preventDefault();
      if (event.code === "KeyR") {
        this.model.restartKey(true, event.repeat);
        this.pressed.clear();
        return;
      }
      if (event.code === "Escape") {
        this.model.cancelRestart();
        this.pressed.clear();
        return;
      }
      if (!this.held.has(event.code) && !event.repeat)
        this.pressed.add(event.code);
      this.held.add(event.code);
    };
    const up = (event: KeyboardEvent) => {
      this.held.delete(event.code);
      if (event.code === "KeyR") this.model.restartKey(false);
    };
    const blur = () => {
      this.held.clear();
      this.pressed.clear();
      this.accumulator = 0;
      this.model.focusLost();
    };
    const focus = () => gameElement.focus({ preventScroll: true });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    gameElement.addEventListener("pointerdown", focus);
    const soundButton = document.getElementById("sound")!;
    const sound = () => {
      const on = this.audio.toggle();
      soundButton.textContent = on ? "SOUND ON" : "SOUND OFF";
      soundButton.setAttribute("aria-pressed", String(on));
      focus();
    };
    soundButton.addEventListener("click", sound);
    const languageButton = document.getElementById("story-language")!;
    const showLanguage = () => {
      const chinese = this.story.locale === "zh-TW";
      languageButton.setAttribute("aria-pressed", String(chinese));
      languageButton.setAttribute(
        "aria-label",
        `Story language: ${chinese ? "繁體中文" : "English"}. Switch to ${chinese ? "English" : "繁體中文"}.`,
      );
      for (const option of Array.from(
        languageButton.querySelectorAll<HTMLElement>("[lang]"),
      )) {
        option.classList.toggle(
          "is-current",
          option.lang === this.story.locale,
        );
      }
    };
    const changeLanguage = () => {
      this.story.toggle();
      showLanguage();
      focus();
    };
    showLanguage();
    languageButton.addEventListener("click", changeLanguage);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      gameElement.removeEventListener("pointerdown", focus);
      soundButton.removeEventListener("click", sound);
      languageButton.removeEventListener("click", changeLanguage);
    });
    focus();
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("test")
    ) {
      (window as unknown as { __odyssey: OdysseyScene }).__odyssey = this;
    }
  }
  private visual(texture: string, scale: number): Visual {
    const shadow = this.add
      .ellipse(0, 0, 53 * scale, 11 * scale, 0x0b1524, 0.5)
      .setDepth(5);
    const sprite = this.add
      .image(0, 0, texture)
      .setOrigin(0.5, 132 / 144)
      .setScale(scale)
      .setDepth(12);
    return { sprite, shadow };
  }
  update(_time: number, delta: number) {
    this.accumulator += Math.min(delta / 1000, 0.05);
    let first = true;
    while (this.accumulator >= 1 / 120) {
      const input: Input = {
        left: this.held.has("ArrowLeft"),
        right: this.held.has("ArrowRight"),
        jumpHeld: this.held.has("ArrowUp") || this.held.has("Space"),
        up: first && this.pressed.has("ArrowUp"),
        jump: first && this.pressed.has("Space"),
        jab: first && this.pressed.has("KeyZ"),
        heavy: first && this.pressed.has("KeyX"),
        enter: first && this.pressed.has("Enter"),
      };
      this.model.step(1 / 120, input);
      this.accumulator -= 1 / 120;
      if (first) this.pressed.clear();
      first = false;
    }
    this.draw();
  }
  private draw() {
    const m = this.model,
      p = m.player;
    if (m.time < this.previousTime) {
      this.effects = [];
      this.floating.forEach((f) => f.text.destroy());
      this.floating = [];
      for (const v of this.enemies.values()) {
        v.sprite.destroy();
        v.shadow.destroy();
      }
      this.enemies.clear();
    }
    this.previousTime = m.time;
    const frame = Math.floor(m.time * 11) % 6;
    const pose =
      m.state === "VICTORY"
        ? "victory"
        : m.state === "GAME_OVER" || m.damageFlash > 0
          ? "hurt"
          : m.state === "TRANSITION" && m.transition.kind === "climb"
            ? "climb"
            : p.heavy > 0
              ? "heavy"
              : p.jab > 0
                ? "jab"
                : !p.grounded
                  ? "air"
                  : this.held.has("ArrowLeft") || this.held.has("ArrowRight")
                    ? "walk"
                    : "idle";
    this.player.sprite
      .setTexture(`jeremy-${pose}-${frame}`)
      .setPosition(p.x, p.y)
      .setFlipX(p.facing < 0);
    if (m.damageFlash > 0) {
      this.player.sprite
        .setTint(0xf6b8a5)
        .setAlpha(Math.sin(m.time * 40) > 0 ? 0.5 : 1);
    } else {
      this.player.sprite.setAlpha(1);
      if (m.charge === 3) this.player.sprite.setTint(0xe3ffdb);
      else this.player.sprite.clearTint();
    }
    this.player.shadow
      .setPosition(p.x, floorY(m.floor) - 2)
      .setAlpha(p.grounded ? 0.42 : 0.22)
      .setVisible(!(m.state === "TRANSITION" && m.transition.kind === "climb"));
    for (const [id, v] of this.enemies)
      if (!m.enemies.some((e) => e.id === id)) {
        v.sprite.destroy();
        v.shadow.destroy();
        this.enemies.delete(id);
      }
    for (const e of m.enemies) {
      const who =
        e.kind === "brat"
          ? "brat"
          : e.kind === "principal"
            ? "ralf"
            : m.floor % 2 === 0
              ? "female"
              : "male";
      const pose =
        e.kind !== "principal"
          ? "walk"
          : e.phase === "telegraph"
            ? "crouch"
            : e.phase === "airborne"
              ? "air"
              : e.phase === "landing"
                ? "landing"
                : "idle";
      let visual = this.enemies.get(e.id);
      if (!visual) {
        visual = this.visual(
          `${who}-idle-0`,
          e.kind === "brat" ? 0.48 : e.kind === "principal" ? 1.16 : 0.98,
        );
        this.enemies.set(e.id, visual);
      }
      visual.sprite
        .setTexture(`${who}-${pose}-${frame}`)
        .setPosition(e.x, e.y)
        .setFlipX(e.facing < 0);
      visual.sprite.setTint(e.hurt > 0 ? 0xffdfae : 0xffffff);
      visual.shadow
        .setPosition(e.x, floorY(m.floor) - 2)
        .setScale(e.kind === "principal" ? 1.5 : 1);
    }
    for (const [id, v] of this.shots)
      if (!m.projectiles.some((p) => p.id === id)) {
        v.destroy();
        this.shots.delete(id);
      }
    for (const shot of m.projectiles) {
      let v = this.shots.get(shot.id);
      if (!v) {
        v = this.add.image(shot.x, shot.y, "case").setAlpha(0.65).setDepth(15);
        this.shots.set(shot.id, v);
      }
      v.setPosition(shot.x, shot.y).setFlipX(shot.dir < 0);
    }
    const status = `${m.floor}-${m.unlocked}`;
    if (status !== this.ladderStatus) {
      for (let f = 0; f < 5; f++)
        this.school.drawLadder(
          this.school.ladders[f],
          f,
          m.rewards.has(f) && (f < m.floor || m.unlocked),
        );
      this.ladderStatus = status;
    }
    for (const event of m.effects) {
      this.effects.push({ ...event, born: m.time, seed: Math.random() });
      this.audio.play(event.type);
      if (event.text) {
        const text = this.add
          .text(event.x, event.y, event.text, {
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: event.type === "reward" ? 15 : 19,
            color: event.type === "reward" ? "#d5efb9" : "#ffe0a0",
            stroke: "#17283b",
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(35);
        this.floating.push({ text, born: m.time, y: event.y });
      }
    }
    this.floating = this.floating.filter((f) => {
      const age = m.time - f.born;
      if (age > 1.3) {
        f.text.destroy();
        return false;
      }
      f.text.setY(f.y - age * 37).setAlpha(Math.min(1, (1.3 - age) * 3));
      return true;
    });
    m.effects = [];
    this.drawFX();
    this.cameras.main.setScroll(m.camera.x, m.camera.y);
    this.ui.update(m);
    const canvas = this.game.canvas;
    canvas.setAttribute(
      "aria-label",
      `${m.state}. ${m.floor === 5 ? "Rooftop" : `Floor ${m.floor + 1}`}. ${m.lives} lives. Charge ${m.charge} of 3.`,
    );
  }
  private drawFX() {
    const g = this.fx,
      m = this.model;
    g.clear();
    for (const cue of m.cues) {
      const y = floorY(m.floor),
        pulse = 0.45 + Math.sin(cue.age * 28) * 0.2;
      g.fillStyle(cue.kind === "brat" ? 0x9ee9bc : 0xf1c59c, pulse);
      g.fillEllipse(cue.x, y - 3, 64, 14);
      g.lineStyle(2, 0xb7edce, pulse);
      g.strokeEllipse(cue.x, y - 5, 70, 22);
      g.lineBetween(cue.x, y - 68, cue.x, y - 40);
      g.fillRect(cue.x - 2, y - 33, 4, 5);
    }
    for (const shot of m.projectiles) {
      for (let i = 1; i <= 4; i++) {
        g.fillStyle(0xd9d29a, 0.12 * (1 - i / 5));
        g.fillRect(shot.x - shot.dir * i * 24 - 37, shot.y - 13, 74, 26);
      }
    }
    const boss = m.enemies.find((e) => e.kind === "principal");
    if (boss && boss.phase === "telegraph") {
      const target = boss.to,
        y = floorY(5);
      g.lineStyle(3, 0xe9ba88, 0.5 + Math.sin(m.time * 28) * 0.3);
      g.strokeEllipse(target, y - 3, 125, 22);
      g.lineStyle(2, 0xe9ba88, 0.6);
      g.lineBetween(target - 20, y - 52, target, y - 31);
      g.lineBetween(target, y - 31, target + 20, y - 52);
    }
    if (
      boss &&
      (boss.x < m.camera.x + 40 || boss.x > m.camera.x + C.width - 40)
    ) {
      const x =
          boss.x < m.camera.x + 40
            ? m.camera.x + 40
            : m.camera.x + C.width - 40,
        y = floorY(5) - 100;
      g.fillStyle(0xf1ca8e, 0.8);
      const dir = boss.x < x ? -1 : 1;
      g.fillTriangle(x + dir * 12, y, x - dir * 6, y - 9, x - dir * 6, y + 9);
    }
    this.effects = this.effects.filter((e) => m.time - e.born < 0.85);
    for (const e of this.effects) {
      const age = m.time - e.born,
        alpha = Math.max(0, 1 - age / 0.7);
      if (e.type === "jab") {
        if (age > 0.16) continue;
        g.lineStyle(4, 0xffe1a6, 1 - age / 0.16);
        g.beginPath();
        g.arc(e.x, e.y, 35, -1.2, 1.2);
        g.strokePath();
        g.lineStyle(2, 0x9bdcce, 0.6);
        g.beginPath();
        g.arc(e.x, e.y, 43, -1, 1);
        g.strokePath();
      } else if (
        e.type === "hit" ||
        e.type === "defeat" ||
        e.type === "damage" ||
        e.type === "land" ||
        e.type === "jump"
      ) {
        const color =
          e.type === "damage"
            ? 0xe89a94
            : e.type === "defeat"
              ? 0xa9e4be
              : e.type === "land"
                ? 0xabbabc
                : 0xffd28b;
        for (let i = 0; i < (e.type === "land" ? 16 : 10); i++) {
          const angle = (i / 10) * Math.PI * 2 + e.seed * 2,
            dist = age * (e.type === "defeat" ? 150 : 100);
          g.fillStyle(color, alpha);
          g.fillRect(
            e.x + Math.cos(angle) * dist,
            e.y + Math.sin(angle) * dist + age * age * 100,
            3 + (i % 3),
            3 + (i % 2),
          );
        }
      } else if (
        e.type === "ready" ||
        e.type === "reward" ||
        e.type === "victory"
      ) {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          g.fillStyle(0xe7d79c, alpha);
          g.fillRect(
            e.x + Math.cos(a) * age * 130,
            e.y + Math.sin(a) * age * 100,
            4,
            4,
          );
        }
      }
      if (e.text && e.type === "reward") {
        // Reward text is short-lived, so it never becomes a persistent instruction paragraph.
        const width = 160;
        g.fillStyle(0x9ed9b6, alpha * 0.25);
        g.fillRect(e.x - width / 2, e.y - age * 45, width, 4);
      }
    }
    if (m.damageFlash > 0) {
      g.fillStyle(0xe8a19c, m.damageFlash * 0.14);
      g.fillRect(m.camera.x, m.camera.y, C.width, C.height);
    }
  }
}
