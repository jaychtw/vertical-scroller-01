import { test, expect, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { OdysseyScene } from "../src/game/scene";
import { STORY_MESSAGES, STORY_LANGUAGE_KEY } from "../src/game/story";
declare global {
  interface Window {
    __odyssey: OdysseyScene;
  }
}
async function boot(page: Page) {
  await page.goto("/?test=1");
  await page.waitForFunction(() => window.__odyssey?.model);
}
async function renderedText(page: Page, expected: string) {
  return page.evaluate((text) => {
    const texts = window.__odyssey.children.list
      .filter((child) => child.type === "Container")
      .flatMap((child) => (child as Phaser.GameObjects.Container).list)
      .filter((child) => child.type === "Text") as Phaser.GameObjects.Text[];
    const match = texts.find((item) => item.text.replaceAll("\n", "") === text);
    return match
      ? {
          text: match.text,
          font: match.style.fontFamily,
          width: match.width,
          visible: match.parentContainer?.visible,
        }
      : null;
  }, expected);
}

test("story toggle renders Chinese and English immediately and remembers the choice", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await boot(page);
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES["zh-TW"].opening[0],
  );
  await expect(page.locator("#story-message")).toHaveAttribute("lang", "zh-TW");
  const chinese = await renderedText(page, STORY_MESSAGES["zh-TW"].opening[0]);
  expect(chinese?.font).toContain("Noto Sans TC");
  expect(chinese?.width).toBeLessThanOrEqual(802);
  expect(chinese?.visible).toBe(true);
  expect(
    await page.evaluate(() =>
      document.fonts.check('400 23px "Noto Sans TC"', "校門鑰匙傑瑞米"),
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/story-zh-TW.png",
    fullPage: true,
  });
  await page.locator("#story-language").click();
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.opening[0],
  );
  expect(
    (await renderedText(page, STORY_MESSAGES.en.opening[0]))?.font,
  ).toContain("Space Grotesk");
  await page.keyboard.press("Enter");
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.opening[1],
  );
  await page.locator("#story-language").click();
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES["zh-TW"].opening[1],
  );
  await page.reload();
  await page.waitForFunction(() => window.__odyssey?.model);
  await expect(page.locator("#story-language")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#story-language").click();
  await page.reload();
  await page.waitForFunction(() => window.__odyssey?.model);
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.opening[0],
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORY_LANGUAGE_KEY),
  ).toBe("en");
  await page.setViewportSize({ width: 780, height: 900 });
  const button = await page.locator("#story-language").boundingBox();
  expect(button!.x + button!.width).toBeLessThanOrEqual(780);
  expect(errors).toEqual([]);
});

test("end-screen dialogue translates while headings, prompts and game progress remain unchanged", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    const m = window.__odyssey.model;
    m.state = "GAME_OVER";
    m.floor = 4;
    m.lives = 0;
    m.charge = 2;
  });
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES["zh-TW"].over,
  );
  expect(await renderedText(page, "GAME OVER")).not.toBeNull();
  expect(await renderedText(page, "Press R to try again.")).not.toBeNull();
  await page.locator("#story-language").click();
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.over,
  );
  await page.evaluate(() => {
    window.__odyssey.model.state = "VICTORY";
  });
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.victory,
  );
  await page.locator("#story-language").click();
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES["zh-TW"].victory,
  );
  expect(await renderedText(page, "HOME IS CALLING")).not.toBeNull();
  expect(await renderedText(page, "Press R to play again.")).not.toBeNull();
  expect(
    await page.evaluate(() => ({
      floor: window.__odyssey.model.floor,
      lives: window.__odyssey.model.lives,
      charge: window.__odyssey.model.charge,
    })),
  ).toEqual({ floor: 4, lives: 0, charge: 2 });
  expect(
    (await renderedText(page, STORY_MESSAGES["zh-TW"].victory))?.width,
  ).toBeLessThanOrEqual(802);
  await page.screenshot({
    path: "test-results/victory-zh-TW.png",
    fullPage: true,
  });
  await page.keyboard.press("KeyR");
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES["zh-TW"].opening[0],
  );
});

test("switching language during restart confirmation preserves the paused simulation and English UI", async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__odyssey.model.opening >= 4.6);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__odyssey.model.state === "PLAYING");
  await page.keyboard.press("KeyR");
  await page.waitForFunction(
    () => window.__odyssey.model.state === "RESTART_CONFIRM",
  );
  const paused = await page.evaluate(() =>
    JSON.stringify(window.__odyssey.model),
  );
  await page.locator("#story-language").click();
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => JSON.stringify(window.__odyssey.model)),
  ).toBe(paused);
  expect(
    await renderedText(
      page,
      "Pressing R restarts the game. Press R again if you're sure.",
    ),
  ).not.toBeNull();
  expect(await renderedText(page, "CURRENT FLOOR")).not.toBeNull();
  await expect(page.locator("#story-message")).toBeEmpty();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__odyssey.model.state === "PLAYING");
  await page.keyboard.press("KeyR");
  await page.keyboard.press("KeyR");
  await expect(page.locator("#story-message")).toHaveText(
    STORY_MESSAGES.en.opening[0],
  );
});
