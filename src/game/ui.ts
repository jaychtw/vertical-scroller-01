import Phaser from "phaser";
import { C, TEXT, travelDirection } from "./config";
import { GameModel } from "./model";

const FAMILY = '"Space Grotesk", "Trebuchet MS", sans-serif';
const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
export class GameUI {
  private hud: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Container;
  private bars: Phaser.GameObjects.Graphics;
  private veil: Phaser.GameObjects.Graphics;
  private floor: Phaser.GameObjects.Text;
  private life: Phaser.GameObjects.Text;
  private charge: Phaser.GameObjects.Text;
  private objective: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private enemy: Phaser.GameObjects.Text;
  private eyebrow: Phaser.GameObjects.Text;
  private heading: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private key: Phaser.GameObjects.Image;
  private gate: Phaser.GameObjects.Graphics;
  private previous = "";
  constructor(private s: Phaser.Scene) {
    this.hud = s.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const panel = s.add.graphics();
    panel.fillStyle(0x101e30, 0.96);
    panel.fillRect(24, 22, 1232, 74);
    panel.lineStyle(1, 0xa4b8ba, 0.25);
    panel.strokeRect(24.5, 22.5, 1231, 73);
    panel.fillStyle(0xe7bd79);
    panel.fillRect(24, 22, 3, 74);
    for (const x of [181, 342, 653, 1056]) {
      panel.lineStyle(1, 0x849ba8, 0.22);
      panel.lineBetween(x, 38, x, 80);
    }
    this.hud.add(panel);
    this.text(44, 34, "CURRENT FLOOR", 9, "#859dad");
    this.floor = this.text(44, 48, "1F", 32, "#f4d496", DISPLAY);
    this.text(203, 34, "LIVES", 9, "#859dad");
    this.text(203, 51, "♥", 24, "#d9a68e");
    this.life = this.text(238, 48, "01", 32, "#e7e7d6", DISPLAY);
    this.text(367, 34, "PENCIL CASE", 9, "#859dad");
    this.charge = this.text(540, 34, "0 / 3", 10, "#b9c9c9");
    this.text(679, 34, "THE WAY HOME", 9, "#859dad");
    this.enemy = this.text(1080, 34, "HALLWAY 01", 11, "#c4cfcb");
    this.bars = s.add.graphics();
    this.hud.add(this.bars);
    this.objective = this.text(40, 644, "BREAK THE SIGNAL", 14, "#f2d499");
    this.sub = this.text(40, 669, "", 11, "#9bb4bc");
    this.text(1236, 660, "JEREMY  /  AFTER HOURS", 9, "#7f9aa7").setOrigin(
      1,
      0,
    );
    this.overlay = s.add.container(0, 0).setScrollFactor(0).setDepth(200);
    this.veil = s.add.graphics();
    this.overlay.add(this.veil);
    this.gate = s.add.graphics();
    this.overlay.add(this.gate);
    this.eyebrow = this.overlayText(640, 149, "", 12, "#9ac9c4");
    this.heading = this.overlayText(640, 195, "", 76, "#f3dbad", DISPLAY);
    this.body = this.overlayText(640, 365, "", 23, "#e7e6dc")
      .setWordWrapWidth(800)
      .setLineSpacing(10);
    this.prompt = this.overlayText(640, 541, "", 13, "#c5cfc5");
    this.key = s.add.image(640, 292, "key").setScale(1.65).setVisible(false);
    this.overlay.add(this.key);
  }
  private text(
    x: number,
    y: number,
    t: string,
    size: number,
    color: string,
    family = FAMILY,
  ) {
    const obj = this.s.add.text(x, y, t, {
      fontFamily: family,
      fontSize: size,
      color,
      letterSpacing: 1.5,
    });
    this.hud.add(obj);
    return obj;
  }
  private overlayText(
    x: number,
    y: number,
    t: string,
    size: number,
    color: string,
    family = FAMILY,
  ) {
    const obj = this.s.add
      .text(x, y, t, {
        fontFamily: family,
        fontSize: size,
        color,
        align: "center",
        letterSpacing: 1,
      })
      .setOrigin(0.5, 0);
    this.overlay.add(obj);
    return obj;
  }
  update(m: GameModel) {
    const roof = m.floor === 5;
    this.floor.setText(roof ? "ROOF" : `${m.floor + 1}F`);
    this.life.setText(String(m.lives).padStart(2, "0"));
    this.charge
      .setText(m.charge === 3 ? "READY · X" : `${m.charge} / 3`)
      .setColor(m.charge === 3 ? "#c8efb8" : "#b9c9c9");
    this.bars.clear();
    for (let i = 0; i < 3; i++) {
      this.bars.fillStyle(
        i < m.charge ? (m.charge === 3 ? 0xbce5b4 : 0xf0c47d) : 0x334758,
      );
      this.bars.fillRect(367 + i * 84, 57, 75, 17);
      this.bars.fillStyle(0xffffff, 0.12);
      if (i < m.charge) this.bars.fillRect(367 + i * 84, 57, 75, 3);
    }
    this.bars.lineStyle(1, 0x56717d);
    this.bars.lineBetween(690, 68, 1020, 68);
    for (let i = 0; i < 6; i++) {
      const x = 690 + i * 65;
      this.bars.fillStyle(
        i === m.floor ? 0xf3cc87 : m.rewards.has(i) ? 0x9ecbb7 : 0x314a5c,
      );
      this.bars.fillRect(x - 5, 63, 10, 10);
      if (i === m.floor) {
        this.bars.lineStyle(1, 0xf3cc87, 0.6);
        this.bars.strokeRect(x - 8, 60, 16, 16);
      }
    }
    const boss = m.enemies.find((e) => e.kind !== "brat");
    this.enemy.setText(
      boss
        ? boss.kind === "principal"
          ? "PRINCIPAL RALF"
          : "TEACHER"
        : m.unlocked
          ? "HALLWAY CLEAR"
          : `${m.defeated} / 4 BRATS`,
    );
    if (boss) {
      for (let i = 0; i < boss.maxHp; i++) {
        this.bars.fillStyle(i < boss.hp ? 0xe2ac91 : 0x354857);
        this.bars.fillRect(1080 + i * 23, 62, 17, 9);
      }
    } else {
      this.bars.fillStyle(m.unlocked ? 0xa2cfa9 : 0x89a6b0);
      this.bars.fillRect(1080, 63, 145 * (m.unlocked ? 1 : m.defeated / 4), 5);
    }
    let objective = roof
      ? "GET THE GOLDEN KEY"
      : m.unlocked
        ? "THE WAY UP IS OPEN"
        : boss
          ? "BREAK THE TEACHER’S SIGNAL"
          : "BREAK THE SIGNAL";
    let sub = roof
      ? "Watch Ralf’s crouch. Jump or move clear of his landing."
      : m.unlocked
        ? `${travelDirection(m.floor) > 0 ? "→" : "←"} Reach the ladder. Press ↑ to climb.`
        : boss
          ? "Two light hits. Or one charged pencil case."
          : `Clear four school brats. Then face the teacher.  ${travelDirection(m.floor) > 0 ? "→" : "←"}`;
    if (m.hint) sub = m.hint;
    if (m.state === "TRANSITION") {
      objective =
        m.transition.kind === "climb"
          ? "ONWARD & UPWARD"
          : m.transition.kind === "respawn"
            ? "BACK ON YOUR FEET"
            : "A NEW FLOOR";
      sub =
        m.transition.kind === "respawn"
          ? "Charge preserved. This floor’s encounter has reset."
          : "The next signal is coming into range.";
    }
    this.objective.setText(objective);
    this.sub.setText(sub);
    const show = [
      "OPENING",
      "RESTART_CONFIRM",
      "GAME_OVER",
      "VICTORY",
    ].includes(m.state);
    this.overlay.setVisible(show);
    this.hud.setVisible(m.state !== "OPENING");
    if (!show) {
      this.previous = "";
      return;
    }
    this.veil.clear();
    this.gate.clear();
    this.key.setVisible(m.state === "VICTORY");
    this.body.setY(365).setFontSize(23);
    this.heading.setFontSize(76).setY(195);
    this.prompt.setY(541);
    this.eyebrow.setY(149);
    this.veil.fillStyle(0x0c1829, m.state === "RESTART_CONFIRM" ? 0.86 : 0.93);
    this.veil.fillRect(0, 0, C.width, C.height);
    this.veil.lineStyle(1, 0xb9a680, 0.2);
    this.veil.strokeRect(75.5, 52.5, 1129, 615);
    for (const x of [75, 1185])
      for (const y of [52, 647]) {
        this.veil.fillStyle(0xe6bf7b);
        this.veil.fillRect(x, y, 20, 2);
        this.veil.fillRect(x, y, 2, 20);
      }
    if (m.state === "OPENING") {
      const page = m.opening < 4.6 ? 0 : 1;
      this.eyebrow.setText("AFTER HOURS  /  PROLOGUE");
      this.heading.setText("THE LOCKED GATE").setY(185).setFontSize(65);
      this.body.setText(TEXT.opening[page]).setY(428).setFontSize(21);
      this.prompt
        .setText(
          page === 0
            ? "01 / 02     ·     ENTER TO CONTINUE"
            : "02 / 02     ·     ENTER TO BEGIN",
        )
        .setY(592);
      const g = this.gate;
      g.fillStyle(0x253e4f);
      g.fillRect(424, 278, 432, 113);
      g.lineStyle(3, 0x74959c);
      for (let x = 437; x < 852; x += 24) g.lineBetween(x, 268, x, 398);
      g.lineStyle(3, 0xb7bda2);
      g.lineBetween(420, 284, 860, 284);
      g.lineBetween(420, 377, 860, 377);
      g.fillStyle(0x172c40);
      g.fillRect(620, 316, 40, 42);
      g.lineStyle(4, 0xe8c47e);
      g.strokeCircle(640, 326, 10);
      g.fillStyle(0xe8c47e);
      g.fillRect(627, 327, 26, 21);
      g.fillStyle(0x27394b);
      g.fillRect(638, 333, 4, 10);
      for (const x of [414, 854]) {
        g.fillStyle(0x7b8d92);
        g.fillRect(x, 266, 12, 135);
        g.fillStyle(0xb7bba8);
        g.fillRect(x - 3, 261, 18, 8);
      }
      const fade =
        m.opening > 7
          ? Math.max(0, (7.5 - m.opening) / 0.5)
          : Math.min(1, m.opening / 0.35);
      this.overlay.setAlpha(fade);
    } else {
      this.overlay.setAlpha(1);
      if (m.state === "RESTART_CONFIRM") {
        this.eyebrow.setText("RUN PAUSED  /  NO TIME LOST");
        this.heading.setText("START OVER?").setY(210);
        this.body.setText(TEXT.confirm).setY(356);
        this.prompt.setText(
          "ESC TO CANCEL  ·  RELEASE R, THEN PRESS R TO CONFIRM",
        );
      } else if (m.state === "GAME_OVER") {
        this.eyebrow.setText("THE SIGNAL PREVAILS");
        this.heading.setText("GAME OVER");
        this.body.setText(TEXT.over);
        this.prompt.setText("Press R to try again.");
      } else {
        this.eyebrow.setText("THE SIGNAL IS BROKEN");
        this.heading.setText("HOME IS CALLING").setY(192).setFontSize(64);
        this.body.setText(TEXT.victory).setY(424);
        this.prompt.setText("Press R to play again.");
        this.key.setY(343 + Math.sin(m.time * 2) * 4);
      }
    }
    this.previous = m.state;
  }
}
