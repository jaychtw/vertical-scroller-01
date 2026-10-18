import Phaser from "phaser";
import { C, floorY, exitX } from "./config";

export const PALETTE = {
  ink: 0x111d30,
  cream: 0xf7deab,
  gold: 0xf8c66e,
  mint: 0x9ce4cb,
  blue: 0x5796bb,
  muted: 0x7794a4,
};
const font = '"Space Grotesk", "Trebuchet MS", sans-serif';
export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 16,
  color = "#e1decf",
) {
  return scene.add
    .text(x, y, text, {
      fontFamily: font,
      fontSize: size,
      color,
      letterSpacing: 2,
    })
    .setDepth(1);
}

/** Original pixel assets: authored in integer rectangles, never sampled from the reference game. */
export function createTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const r = (x: number, y: number, w: number, h: number, c: number, a = 1) => {
    g.fillStyle(c, a);
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  for (const who of ["jeremy", "brat", "female", "male", "ralf"]) {
    for (const pose of [
      "idle",
      "walk",
      "air",
      "jab",
      "heavy",
      "climb",
      "hurt",
      "crouch",
      "landing",
      "victory",
    ]) {
      for (let frame = 0; frame < 6; frame++) {
        g.clear();
        const wave = Math.sin((frame / 6) * Math.PI * 2);
        const walk = pose === "walk" || pose === "climb";
        const leg = walk ? Math.round(wave * 7) : pose === "air" ? -7 : 0;
        const crouch = pose === "crouch" || pose === "landing" ? 12 : 0;
        const bob = walk ? Math.round(Math.abs(wave) * 2) : 0;
        const y = crouch - bob;
        const skin = who === "brat" ? 0xe3b18d : 0xefc29c;
        const shade = 0xb77f71;
        const isRalf = who === "ralf",
          isBrat = who === "brat",
          teacher = who === "male" || who === "female";
        const wide = isRalf ? 12 : isBrat ? -3 : 0;
        const top = isRalf ? 10 : isBrat ? 52 : 25;
        const headY = top + y;
        const torsoY = headY + (isBrat ? 25 : 29);
        const feet = 132;
        const jacket =
          who === "jeremy"
            ? 0x4488b3
            : who === "female"
              ? 0x9c769c
              : who === "male"
                ? 0xbac2b1
                : who === "ralf"
                  ? 0x414e70
                  : 0xb96360;
        const jacketLight =
          who === "jeremy"
            ? 0x68b5d2
            : who === "female"
              ? 0xc4a1b4
              : who === "male"
                ? 0xdee0cb
                : who === "ralf"
                  ? 0x617291
                  : 0xe19573;
        // Shoe and trouser silhouettes.
        r(60 - wide, torsoY + 27, 18 + wide, feet - torsoY - 32, 0x16263b);
        r(82, torsoY + 27, 17 + wide, feet - torsoY - 32, 0x16263b);
        r(62 - wide + leg, feet - 27, 13 + wide, 22, 0x253b56);
        r(84 - leg, feet - 27, 13 + wide, 22, 0x334866);
        if (who === "female") {
          r(58, torsoY + 26, 44, 23, 0x3b344f);
          r(61, feet - 26, 11, 17, shade);
          r(86, feet - 26, 11, 17, skin);
        }
        r(57 - wide + leg, feet - 10, 23 + wide, 10, PALETTE.ink);
        r(81 - leg, feet - 10, 25 + wide, 10, PALETTE.ink);
        r(
          59 - wide + leg,
          feet - 7,
          21 + wide,
          5,
          who === "jeremy" ? 0xe8d9b7 : 0x777f91,
        );
        r(
          83 - leg,
          feet - 7,
          23 + wide,
          5,
          who === "jeremy" ? 0xe8d9b7 : 0x777f91,
        );
        r(59 - wide + leg, feet - 3, 21 + wide, 3, 0xa0b6bd);
        r(83 - leg, feet - 3, 23 + wide, 3, 0xa0b6bd);
        // Body, jacket seams, shirt and cuffs.
        r(54 - wide, torsoY - 3, 49 + wide * 2, 40, PALETTE.ink);
        r(58 - wide, torsoY, 41 + wide * 2, 32, jacket);
        r(58 - wide, torsoY, 10, 29, jacketLight);
        r(76, torsoY, 12, 27, who === "jeremy" ? 0xeee1bf : 0xe2d6c4);
        r(78, torsoY + 4, 4, 26, who === "jeremy" ? 0x344d63 : 0xaa7169);
        r(
          58 - wide,
          torsoY + 28,
          41 + wide * 2,
          4,
          who === "jeremy" ? 0xa9d3ce : 0x6b687b,
        );
        r(89 + wide, torsoY + 10, 5, 10, jacketLight);
        if (isRalf) {
          r(55 - wide, torsoY, 15, 35, 0x2f3b59);
          r(92, torsoY, 16, 35, 0x526381);
          r(76, torsoY + 5, 7, 25, 0xb58d62);
          r(93, torsoY + 15, 5, 3, 0xedd7ac);
        }
        const arm = walk ? -leg : pose === "air" ? -11 : 0;
        r(48 - wide, torsoY + 4 + arm, 10, 25, jacket);
        r(48 - wide, torsoY + 25 + arm, 10, 10, skin);
        if (pose === "jab" || pose === "heavy") {
          r(97 + wide, torsoY + 6, 26, 12, PALETTE.ink);
          r(97 + wide, torsoY + 8, 23, 8, jacketLight);
          r(119, torsoY + 7, 10, 11, skin);
          pencil(g, 134, torsoY + 10, 1, pose === "heavy" ? 0.7 : 1);
        } else {
          r(98 + wide, torsoY + 5 - arm, 11, 24, jacketLight);
          r(98 + wide, torsoY + 26 - arm, 10, 9, skin);
          if (who === "jeremy") pencil(g, 112, torsoY + 33 - arm, 0.55);
        }
        // Head silhouette, side hair and warm face planes.
        if (who === "female") {
          r(56, headY - 7, 48, 48, 0x3b2b41);
          r(51, headY + 15, 10, 33, 0x3b2b41);
          r(98, headY + 8, 8, 39, 0x55405a);
        }
        r(60 - wide / 2, headY - 3, 36 + wide, 34, PALETTE.ink);
        r(63 - wide / 2, headY + 1, 31 + wide, 27, skin);
        r(63 - wide / 2, headY + 10, 7, 16, shade);
        r(92 + wide / 2, headY + 13, 7, 8, skin);
        r(80, headY + 24, 13, 4, shade);
        r(57 - wide / 2, headY - 7, 39 + wide, 12, 0x263043);
        r(62 - wide / 2, headY - 12, 13, 9, 0x263043);
        r(77, headY - 10, 15 + wide, 9, 0x263043);
        r(60 - wide / 2, headY + 2, 8, 13, 0x263043);
        r(67, headY - 5, 13, 5, 0x485064);
        r(83 + wide / 2, headY + 9, 8, 3, PALETTE.ink);
        r(87 + wide / 2, headY + 13, 4, 6, PALETTE.ink);
        r(89 + wide / 2, headY + 13, 2, 2, 0xf2e4c7);
        if (teacher || isRalf) {
          r(85 + wide / 2, headY + 13, 5, 3, 0xb5ffcc);
          r(85 + wide / 2, headY + 19, 7, 2, shade);
        }
        if (who === "male") {
          r(69, headY + 11, 24, 3, 0x43495c);
          r(73, headY + 11, 8, 9, 0x43495c);
          r(86, headY + 11, 9, 9, 0x43495c);
          r(75, headY + 13, 4, 4, 0xabcab8);
        }
        if (isBrat) {
          r(56, headY - 8, 43, 10, 0x659f95);
          r(61, headY - 13, 31, 6, 0x80b9a3);
          r(91, headY - 2, 17, 5, 0xe6bc71);
          r(87, headY + 12, 5, 5, 0xb9ee8c);
        }
        if (isRalf) {
          r(61, headY - 7, 8, 18, 0x8b7b87);
          r(68, headY + 28, 28, 5, 0x9c6d6b);
          r(80, headY + 24, 12, 3, PALETTE.ink);
        }
        if (pose === "hurt") {
          r(64, headY + 5, 5, 4, 0xffe9c7);
        }
        if (pose === "victory") {
          r(46, torsoY - 22, 11, 34, jacketLight);
          r(46, torsoY - 29, 11, 12, skin);
        }
        g.generateTexture(`${who}-${pose}-${frame}`, 160, 144);
      }
    }
  }
  g.clear();
  pencil(g, 64, 32, 2);
  g.generateTexture("case", 128, 64);
  g.clear();
  r(25, 18, 20, 42, 0x865b36);
  r(29, 16, 12, 47, PALETTE.gold);
  r(33, 20, 5, 43, 0xffe8a6);
  r(39, 50, 14, 7, PALETTE.gold);
  r(45, 50, 8, 14, PALETTE.gold);
  g.lineStyle(9, 0xa9783e);
  g.strokeCircle(35, 17, 13);
  g.lineStyle(6, PALETTE.gold);
  g.strokeCircle(35, 16, 13);
  r(28, 3, 12, 4, 0xffedba);
  g.generateTexture("key", 72, 80);
  g.destroy();
}
function pencil(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  alpha = 1,
) {
  const rect = (dx: number, dy: number, w: number, h: number, c: number) => {
    g.fillStyle(c, alpha);
    g.fillRect(
      Math.round(x + dx * scale),
      Math.round(y + dy * scale),
      Math.max(1, w * scale),
      Math.max(1, h * scale),
    );
  };
  rect(-23, -9, 46, 18, 0x132b3e);
  rect(-21, -7, 42, 14, 0xe5b96d);
  rect(-19, -6, 38, 5, 0xffe4a1);
  rect(-19, 1, 38, 5, 0xc28c4f);
  rect(-21, -3, 42, 2, 0x6e9d9d);
  rect(13, -5, 4, 6, 0x286b7d);
  rect(-25, -3, 4, 8, 0xaccbc1);
}

export class SchoolArt {
  ladders: Phaser.GameObjects.Graphics[] = [];
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }
  private build() {
    const s = this.scene;
    const g = s.add.graphics().setDepth(-20);
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      c: number,
      a = 1,
    ) => {
      g.fillStyle(c, a);
      g.fillRect(x, y, w, h);
    };
    for (let f = 0; f < 6; f++) {
      const top = (5 - f) * C.band,
        ground = floorY(f);
      g.save();
      g.translateCanvas(0, -top);
      if (f === 5) {
        this.roof(g, top, ground);
        g.restore();
        g.generateTexture("roof-backdrop", 2400, 720);
        g.clear();
        s.add.image(0, top, "roof-backdrop").setOrigin(0).setDepth(-20);
        continue;
      }
      const wall = [0x354d61, 0x3c4e64, 0x3c5664, 0x4c4c65, 0x40576b][f];
      rect(0, top, C.worldWidth, C.band, 0x1a283a);
      // Inset ceiling, warm wall planes, wainscoting and perspective tiled floor.
      rect(0, top + 72, C.worldWidth, 390, wall);
      rect(0, top + 404, C.worldWidth, 143, 0x2b424f);
      rect(0, top + 398, C.worldWidth, 7, 0x8ba5a5);
      rect(0, top + 410, C.worldWidth, 4, 0x182e40);
      for (let x = 0; x < C.worldWidth; x += 96) {
        rect(x, top + 414, 2, 130, 0x425a62);
        rect(x + 5, top + 421, 85, 3, 0x37525b);
      }
      rect(0, ground - 57, C.worldWidth, 57, 0x5a6c73);
      rect(0, ground - 54, C.worldWidth, 3, 0x93a1a0);
      for (let y = ground - 42; y < ground; y += 14) {
        rect(0, y, C.worldWidth, 1, 0x879196, 0.45);
      }
      for (let x = -120; x < C.worldWidth; x += 80) {
        g.lineStyle(1, 0x9da5a1, 0.25);
        g.lineBetween(x + 30, ground - 54, x, ground);
      }
      rect(0, ground, C.worldWidth, 12, 0xc2bfa6);
      rect(0, ground + 4, C.worldWidth, 5, 0x7d8f93);
      rect(0, ground + 12, C.worldWidth, 24, 0x243547);
      rect(0, ground + 34, C.worldWidth, 84, 0x101e31);
      for (let x = 0; x < C.worldWidth; x += 128) {
        rect(x, ground + 15, 2, 21, 0x445465);
        rect(x + 4, ground + 41, 70, 3, 0x233549);
      }
      rect(0, top + 67, C.worldWidth, 10, 0x728b92);
      rect(0, top + 77, C.worldWidth, 5, 0x172b3e);
      for (let x = 70; x < C.worldWidth; x += 470) {
        rect(x, top + 91, 168, 9, 0x182c40);
        rect(x + 5, top + 93, 158, 5, 0xffdfa2);
        rect(x - 18, top + 100, 204, 28, 0xe5be75, 0.035);
        rect(x - 45, top + 128, 260, 150, 0xe5be75, 0.018);
      }
      for (let x = 260; x < 2250; x += 530) {
        this.window(g, x, top + 153, f);
        this.door(g, x + 237, ground - 57, f);
      }
      for (let x = 110; x < C.worldWidth; x += 1060)
        this.lockers(g, x, ground - 57);
      // Bulletin board, layered papers, ventilation and recognizable room signage.
      for (let x = 605; x < 2300; x += 1060) {
        rect(x, top + 248, 140, 102, 0x142a3c);
        rect(x + 5, top + 253, 130, 92, 0xa88970);
        rect(x + 10, top + 258, 120, 82, 0x554a4d);
        for (let i = 0; i < 5; i++) {
          const px = x + 18 + ((i * 23) % 98),
            py = top + 266 + (i % 2) * 27;
          rect(px, py, 23, 32, i % 2 ? 0xa7b8ac : 0xd4c6a0);
          rect(px + 4, py + 6, 14, 2, 0x797d79);
          rect(px + 4, py + 12, 11, 2, 0x797d79);
          rect(px + 9, py - 1, 5, 3, 0xd48c73);
        }
        label(s, x + 4, top + 223, "AFTER SCHOOL", 9, "#b5c7c4");
      }
      for (let x = 425; x < C.worldWidth; x += 740) {
        rect(x, top + 115, 67, 27, 0x203747);
        for (let j = 0; j < 5; j++)
          rect(x + 7, top + 121 + j * 4, 53, 1, 0x677b81);
      }
      label(s, 42, top + 108, `${f + 1}F`, 54, "#8aabb5").setAlpha(0.65);
      label(
        s,
        44,
        top + 173,
        [
          "JUNIOR WING",
          "SCIENCE WING",
          "ARTS WING",
          "LIBRARY WING",
          "SENIOR WING",
        ][f],
        9,
        "#9fb5b9",
      );
      label(
        s,
        1200,
        top + 124,
        "JEREMY’S SCHOOL   /   EST. 1987",
        12,
        "#a5b5b5",
      ).setOrigin(0.5);
      // Subtle alien circuitry and spores, kept behind playable silhouettes.
      for (let i = 0; i < 15; i++) {
        const x = 340 + ((i * 157) % 1800),
          y = top + 190 + ((i * 41) % 280);
        rect(x, y, 2, 6, 0xa6e1be, 0.22);
        rect(x + 3, y + 5, 8, 2, 0xa6e1be, 0.13);
      }
      const ladder = s.add.graphics().setDepth(-5);
      this.ladders.push(ladder);
      this.drawLadder(ladder, f, false);
      label(
        s,
        exitX(f),
        ground + 53,
        "↑ TO " + (f === 4 ? "ROOFTOP" : `${f + 2}F`),
        12,
        "#bdcbbb",
      ).setOrigin(0.5);
      g.restore();
      g.generateTexture(`hall-backdrop-${f}`, 2400, 720);
      g.clear();
      s.add.image(0, top, `hall-backdrop-${f}`).setOrigin(0).setDepth(-20);
      const incoming = f > 0 ? (f % 2 === 0 ? 120 : 2280) : null;
      if (incoming !== null) {
        label(s, incoming, ground + 48, "ONE WAY ↑", 9, "#8aa7a7").setOrigin(
          0.5,
        );
      }
    }
    // Architectural columns in the foreground frame the scene without blocking hitboxes.
    const columns = s.add.graphics().setDepth(-3);
    for (let f = 0; f < 5; f++)
      for (let x = 0; x <= 2400; x += 800) {
        const top = (5 - f) * 720;
        columns.fillStyle(0x1b3043);
        columns.fillRect(x, top + 80, 20, 466);
        columns.fillStyle(0x627c87);
        columns.fillRect(x + 20, top + 80, 4, 466);
      }
  }
  private window(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    f: number,
  ) {
    const r = (
      a: number,
      b: number,
      w: number,
      h: number,
      c: number,
      alpha = 1,
    ) => {
      g.fillStyle(c, alpha);
      g.fillRect(a, b, w, h);
    };
    r(x - 6, y - 6, 190, 195, 0x203547);
    r(x, y, 178, 183, 0x8ba8ad);
    r(x + 5, y + 5, 168, 173, 0x52667e);
    for (let row = 0; row < 3; row++)
      r(x + 7, y + 7 + row * 55, 164, 54, [0x69718c, 0x818395, 0x9b939c][row]);
    for (let i = 0; i < 8; i++) {
      const h = 25 + ((i * 17 + f * 31) % 64);
      r(x + 9 + i * 21, y + 175 - h, 18, h, 0x3c526a);
      r(x + 13 + i * 21, y + 180 - h, 3, 5, 0xe9c691, 0.5);
    }
    r(x + 57, y, 5, 184, 0x233d50);
    r(x + 116, y, 5, 184, 0x233d50);
    r(x, y + 88, 178, 7, 0x233d50);
    r(x + 4, y + 4, 2, 172, 0xc2c9b9);
    r(x - 9, y + 182, 197, 10, 0x81969a);
    r(x - 9, y + 192, 197, 3, 0x172b3e);
    // Moonlight falls below windows, away from collision silhouettes.
    g.fillStyle(0xc3e6dc, 0.035);
    g.fillPoints(
      [
        { x: x + 10, y: y + 193 },
        { x: x + 169, y: y + 193 },
        { x: x + 226, y: y + 380 },
        { x: x + 35, y: y + 380 },
      ],
      true,
    );
  }
  private door(
    g: Phaser.GameObjects.Graphics,
    x: number,
    bottom: number,
    f: number,
  ) {
    const r = (a: number, b: number, w: number, h: number, c: number) => {
      g.fillStyle(c);
      g.fillRect(a, b, w, h);
    };
    const y = bottom - 266;
    r(x - 7, y - 8, 126, 274, 0x182d40);
    r(x - 2, y - 3, 116, 269, 0x819092);
    r(x + 4, y + 3, 104, 263, 0x586671);
    r(x + 11, y + 11, 90, 247, 0x394a5b);
    r(x + 19, y + 22, 73, 85, 0x192f45);
    r(x + 23, y + 26, 65, 77, 0x68828b);
    r(x + 26, y + 28, 59, 29, 0x809b9e);
    r(x + 18, y + 117, 76, 117, 0x45586a);
    r(x + 21, y + 120, 70, 3, 0x627886);
    r(x + 87, y + 143, 7, 18, 0xedcd8b);
    r(x + 90, y + 148, 15, 5, 0xc5b98d);
    r(x + 15, y + 247, 84, 6, 0x293e51);
    r(x + 26, y - 34, 60, 21, 0x182e41);
    r(x + 30, y - 30, 52, 13, 0xbbc7bb);
    label(
      this.scene,
      x + 56,
      y - 30,
      `${f + 1}0${(x % 3) + 1}`,
      10,
      "#304954",
    ).setOrigin(0.5, 0);
  }
  private lockers(g: Phaser.GameObjects.Graphics, x: number, bottom: number) {
    for (let i = 0; i < 3; i++) {
      const a = x + i * 34,
        y = bottom - 185;
      g.fillStyle(0x1b3347);
      g.fillRect(a, y, 34, 185);
      g.fillStyle(i % 2 ? 0x607e86 : 0x557781);
      g.fillRect(a + 2, y + 3, 29, 178);
      g.fillStyle(0x91a5a4);
      g.fillRect(a + 4, y + 4, 25, 2);
      g.fillStyle(0x2a4858);
      for (let j = 0; j < 4; j++) g.fillRect(a + 8, y + 16 + j * 5, 17, 2);
      g.fillStyle(0xb8b99c);
      g.fillRect(a + 24, y + 85, 3, 13);
      g.fillStyle(0x304f5d);
      g.fillRect(a + 7, y + 154, 19, 2);
    }
  }
  private roof(g: Phaser.GameObjects.Graphics, top: number, ground: number) {
    const r = (
      x: number,
      y: number,
      w: number,
      h: number,
      c: number,
      a = 1,
    ) => {
      g.fillStyle(c, a);
      g.fillRect(x, y, w, h);
    };
    for (let i = 0; i < 20; i++)
      r(
        0,
        top + i * 30,
        2400,
        31,
        Phaser.Display.Color.Interpolate.ColorWithColor(
          new Phaser.Display.Color(25, 34, 62),
          new Phaser.Display.Color(153, 111, 118),
          20,
          i,
        ).color,
      );
    for (let i = 0; i < 110; i++) {
      const x = (i * 197 + 41) % 2400,
        y = top + 50 + ((i * 61) % 290);
      r(x, y, i % 3 ? 2 : 3, 2, 0xe3d8c7, 0.15 + (i % 4) * 0.1);
    }
    g.fillStyle(0xf2d4ac, 0.15);
    g.fillCircle(1640, top + 170, 65);
    g.fillStyle(0xe7d6ba, 0.85);
    g.fillCircle(1640, top + 170, 47);
    g.fillStyle(0x41415f);
    g.fillCircle(1621, top + 155, 44);
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 24; i++) {
        const x = i * 113 - 30,
          h = 80 + ((i * 71 + layer * 43) % 190),
          base = ground - 60 + layer * 28;
        r(
          x,
          base - h,
          80 + (i % 3) * 16,
          h,
          [0x4f526e, 0x3e4964, 0x2c3b54][layer],
        );
        r(x + 9, base - h - 7, 20, 8, [0x4f526e, 0x3e4964, 0x2c3b54][layer]);
        for (let yy = base - h + 15; yy < base - 8; yy += 21)
          for (let xx = x + 10; xx < x + 70; xx += 19)
            if ((xx + yy + i) % 4 !== 0)
              r(xx, yy, 5, 7, 0xd4be93, 0.22 + layer * 0.04);
      }
    // A deliberately faint, original saucer silhouette.
    g.fillStyle(0xadb4bd, 0.11);
    g.fillEllipse(2050, top + 128, 174, 19);
    g.fillEllipse(2050, top + 121, 70, 25);
    g.fillStyle(0xbaead6, 0.18);
    for (let i = 0; i < 5; i++) g.fillRect(1998 + i * 24, top + 130, 5, 2);
    r(0, ground - 44, 2400, 34, 0x273e54);
    r(0, ground - 48, 2400, 7, 0x8a9a9e);
    r(0, ground - 10, 2400, 12, 0x4f6172);
    for (let x = 0; x < 2400; x += 110) {
      r(x, ground - 41, 2, 31, 0x476174);
      r(x + 3, ground - 38, 104, 2, 0x3a5265);
    }
    r(0, ground, 2400, 13, 0xb0b1a3);
    r(0, ground + 13, 2400, 107, 0x182a3f);
    for (let x = 0; x < 2400; x += 110) {
      r(x, ground + 19, 108, 3, 0x3b5062);
      r(x + 54, ground + 24, 2, 29, 0x283f54);
    }
    label(this.scene, 42, top + 109, "RF", 54, "#adb9bb").setAlpha(0.65);
    label(this.scene, 45, top + 173, "THE LAST BELL", 10, "#b4b6bd");
  }
  drawLadder(g: Phaser.GameObjects.Graphics, floor: number, open: boolean) {
    g.clear();
    const x = exitX(floor),
      y = floorY(floor),
      top = y - C.band;
    // No solid obstacle: a readable ladder overlays the wall and ends exactly on each walkable surface.
    g.fillStyle(0x0e2637, 0.8);
    g.fillRect(x - 40, top + 8, 80, C.band - 8);
    g.fillStyle(open ? 0x9acabb : 0x627e89);
    g.fillRect(x - 29, top, 6, C.band);
    g.fillRect(x + 23, top, 6, C.band);
    g.fillStyle(open ? 0xd0d6aa : 0x899a9c);
    for (let a = top + 12; a < y; a += 26) g.fillRect(x - 24, a, 48, 5);
    g.fillStyle(0x182e42);
    g.fillRect(x - 44, y - 118, 88, 48);
    g.lineStyle(2, open ? 0xbbe7bb : 0xd0a379);
    g.strokeRect(x - 42, y - 116, 84, 44);
    if (!open) {
      g.fillStyle(0xdbb47a);
      g.fillRect(x - 10, y - 100, 20, 14);
      g.lineStyle(3, 0xdbb47a);
      g.strokeCircle(x, y - 101, 7);
    } else {
      g.lineStyle(3, 0xc8efb1);
      g.lineBetween(x - 11, y - 93, x, y - 104);
      g.lineBetween(x, y - 104, x + 11, y - 93);
      g.lineBetween(x, y - 104, x, y - 82);
    }
  }
}
