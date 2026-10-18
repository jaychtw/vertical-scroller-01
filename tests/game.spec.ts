import { test, expect } from "@playwright/test";
import type { OdysseyScene } from "../src/game/scene";
declare global {
  interface Window {
    __odyssey: OdysseyScene;
  }
}
async function boot(page: import("@playwright/test").Page) {
  await page.goto("/?test=1");
  await page.waitForFunction(() => window.__odyssey?.model);
  await page.locator("#game").click();
}
async function skipOpening(page: import("@playwright/test").Page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__odyssey.model.state === "PLAYING");
}

test("1280×720 renderer, real keyboard controls, pause/repeat/cancel and complete reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await expect(page.locator("canvas")).toHaveAttribute("width", "1280");
  await expect(page.locator("canvas")).toHaveAttribute("height", "720");
  await page.screenshot({ path: "test-results/opening.png", fullPage: true });
  await skipOpening(page);
  const x = await page.evaluate(() => window.__odyssey.model.player.x);
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(
    (start) => window.__odyssey.model.player.x > start + 65,
    x,
  );
  await page.keyboard.up("ArrowRight");
  expect(
    await page.evaluate(() => window.__odyssey.model.player.x),
  ).toBeGreaterThan(x + 60);
  await page.keyboard.down("Space");
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(() => window.__odyssey.model.player.grounded),
  ).toBe(false);
  await page.keyboard.up("Space");
  await page.keyboard.down("KeyR");
  await page.waitForFunction(
    () => window.__odyssey.model.state === "RESTART_CONFIRM",
  );
  const paused = await page.evaluate(() => ({
    time: window.__odyssey.model.time,
    x: window.__odyssey.model.player.x,
    enemies: JSON.stringify(window.__odyssey.model.enemies),
    cues: JSON.stringify(window.__odyssey.model.cues),
  }));
  await page.keyboard.down("KeyR");
  await page.waitForTimeout(400);
  expect(
    await page.evaluate(() => ({
      time: window.__odyssey.model.time,
      x: window.__odyssey.model.player.x,
      enemies: JSON.stringify(window.__odyssey.model.enemies),
      cues: JSON.stringify(window.__odyssey.model.cues),
    })),
  ).toEqual(paused);
  await page.screenshot({
    path: "test-results/restart-confirmation.png",
    fullPage: true,
  });
  await page.keyboard.up("KeyR");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.__odyssey.model.state)).toBe(
    "PLAYING",
  );
  await page.keyboard.press("KeyR");
  await page.keyboard.press("KeyR");
  expect(
    await page.evaluate(() => ({
      state: window.__odyssey.model.state,
      floor: window.__odyssey.model.floor,
      lives: window.__odyssey.model.lives,
      charge: window.__odyssey.model.charge,
    })),
  ).toEqual({ state: "OPENING", floor: 0, lives: 1, charge: 0 });
  await page.setViewportSize({ width: 780, height: 900 });
  await page.waitForTimeout(100);
  const bounds = await page.locator("canvas").boundingBox();
  expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 2);
  expect(errors).toEqual([]);
});

test("live encounters, Z charge, X piercing, all five ladders, Ralf, victory and replay", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await skipOpening(page);
  // Position setup is test-only; all combat, spawning, rewards and ladder transitions use the actual simulation and keyboard input.
  for (let floor = 0; floor < 5; floor++) {
    for (let i = 0; i < 4; i++) {
      await page.waitForFunction(() =>
        window.__odyssey.model.enemies.some((e) => e.kind === "brat"),
      );
      await page.evaluate(() => {
        const m = window.__odyssey.model,
          e = m.enemies.find((e) => e.kind === "brat")!;
        m.player.x = e.x - 80 * m.player.facing;
        m.player.y = e.y;
      });
      await page.keyboard.press("KeyZ");
      await page.waitForTimeout(350);
    }
    await page.waitForFunction(() =>
      window.__odyssey.model.enemies.some((e) => e.kind === "teacher"),
    );
    await page.evaluate(() => {
      const m = window.__odyssey.model,
        e = m.enemies.find((e) => e.kind === "teacher")!;
      m.player.x = e.x - 150 * m.player.facing;
    });
    await page.keyboard.press("KeyX");
    await page.waitForFunction(() => window.__odyssey.model.unlocked);
    expect(await page.evaluate(() => window.__odyssey.model.lives)).toBe(
      floor + 2,
    );
    await page.evaluate(() => {
      const m = window.__odyssey.model;
      m.player.x = m.floor % 2 === 0 ? 2280 : 120;
    });
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !window.__odyssey.model.player.grounded);
    expect(await page.evaluate(() => window.__odyssey.model.state)).toBe(
      "PLAYING",
    );
    await page.waitForFunction(() => window.__odyssey.model.player.grounded);
    await page.keyboard.press("ArrowUp");
    await page.waitForFunction(
      () =>
        window.__odyssey.model.transition.kind === "climb" &&
        window.__odyssey.model.state === "TRANSITION",
    );
    if (floor === 1)
      await page.screenshot({
        path: "test-results/climbing.png",
        fullPage: true,
      });
    await page.waitForFunction(
      (f) =>
        window.__odyssey.model.floor === f + 1 &&
        window.__odyssey.model.state === "PLAYING",
      floor,
    );
  }
  await page.screenshot({ path: "test-results/rooftop.png", fullPage: true });
  await page.waitForFunction(
    () => window.__odyssey.model.enemies[0]?.phase === "airborne",
  );
  // No boss or player mutations: stand outside contact reach and jab during safe landing / crouch windows.
  for (let i = 0; i < 3; i++) {
    await page.waitForFunction(() => {
      const m = window.__odyssey.model,
        b = m.enemies[0];
      return (
        b &&
        Math.abs(m.player.x - b.x) < 130 &&
        m.player.cooldown <= 0 &&
        (b.phase === "landing" || b.phase === "telegraph")
      );
    });
    await page.keyboard.press("KeyZ");
    await page.waitForFunction(
      (expected) => window.__odyssey.model.enemies[0]?.hp === expected,
      5 - i,
    );
  }
  expect(await page.evaluate(() => window.__odyssey.model.charge)).toBe(3);
  await page.waitForFunction(() => {
    const m = window.__odyssey.model,
      b = m.enemies[0];
    return (
      b &&
      Math.abs(m.player.x - b.x) < 130 &&
      (b.phase === "landing" || b.phase === "telegraph")
    );
  });
  await page.keyboard.press("KeyX");
  await page.waitForFunction(() => window.__odyssey.model.state === "VICTORY");
  await page.screenshot({ path: "test-results/victory.png", fullPage: true });
  await page.keyboard.press("KeyR");
  expect(await page.evaluate(() => window.__odyssey.model.state)).toBe(
    "OPENING",
  );
  expect(errors).toEqual([]);
});

test("unassisted first encounter is winnable with well spaced light attacks", async ({
  page,
}) => {
  await boot(page);
  await skipOpening(page);
  // No state modification: Jeremy stands his ground and times each jab ahead of contact.
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction(() => {
      const m = window.__odyssey.model;
      return m.enemies.some(
        (e) =>
          e.kind === "brat" && e.x - m.player.x < 95 && e.x - m.player.x > 42,
      );
    });
    await page.keyboard.press("KeyZ");
    await page.waitForTimeout(330);
  }
  await page.waitForFunction(() => {
    const m = window.__odyssey.model;
    return m.enemies.some(
      (e) => e.kind === "teacher" && e.x - m.player.x < 160,
    );
  });
  await page.keyboard.press("KeyX");
  await page.waitForFunction(() => window.__odyssey.model.unlocked);
  expect(
    await page.evaluate(() => ({
      lives: window.__odyssey.model.lives,
      charge: window.__odyssey.model.charge,
      dead: window.__odyssey.model.defeated,
    })),
  ).toEqual({ lives: 2, charge: 0, dead: 4 });
  await page.screenshot({ path: "test-results/hallway.png", fullPage: true });
});

test("window focus loss releases movement, and Game Over supports immediate replay", async ({
  page,
}) => {
  await boot(page);
  await skipOpening(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() => window.__odyssey.model.player.x > 145);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.keyboard.up("ArrowRight");
  expect(await page.evaluate(() => window.__odyssey.model.state)).toBe(
    "RESTART_CONFIRM",
  );
  await page.keyboard.press("Escape");
  const position = await page.evaluate(() => window.__odyssey.model.player.x);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__odyssey.model.player.x)).toBe(
    position,
  );
  await page.evaluate(() => {
    const m = window.__odyssey.model;
    m.enemies.push({
      id: m.nextId++,
      kind: "brat",
      x: m.player.x,
      y: m.player.y,
      hp: 1,
      maxHp: 1,
      facing: 1,
      hurt: 0,
      phase: "grounded",
      cycle: 0,
      from: 0,
      to: 0,
      jumpCount: 0,
    });
  });
  await page.waitForFunction(
    () => window.__odyssey.model.state === "GAME_OVER",
  );
  await page.screenshot({ path: "test-results/game-over.png", fullPage: true });
  await page.keyboard.press("KeyR");
  expect(
    await page.evaluate(() => ({
      state: window.__odyssey.model.state,
      lives: window.__odyssey.model.lives,
      charge: window.__odyssey.model.charge,
    })),
  ).toEqual({ state: "OPENING", lives: 1, charge: 0 });
});
