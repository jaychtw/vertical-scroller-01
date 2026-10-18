import { describe, it, expect } from "vitest";
import {
  STORY_LANGUAGE_KEY,
  STORY_MESSAGES,
  StoryLanguage,
  wrapStoryText,
} from "./story";

describe("story language preference", () => {
  it("defaults to Traditional Chinese and preserves the exact English narrative", () => {
    const story = new StoryLanguage({ getItem: () => null, setItem: () => {} });
    expect(story.locale).toBe("zh-TW");
    expect(story.messages).toBe(STORY_MESSAGES["zh-TW"]);
    expect(STORY_MESSAGES.en.opening).toEqual([
      "The gate is locked. You need the key to get out. Principal Ralf got the key, and he's on the rooftop.",
      "Go, Jeremy. Go get the key, and go home.",
    ]);
    expect(STORY_MESSAGES.en.victory).toBe(
      "You got the key. Now, you can go home, Jeremy.",
    );
    expect(STORY_MESSAGES.en.over).toBe("Jeremy couldn't escape the school.");
  });
  it("remembers both choices across subsequent visits", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const story = new StoryLanguage(storage);
    story.toggle();
    expect(story.locale).toBe("en");
    expect(values.get(STORY_LANGUAGE_KEY)).toBe("en");
    const revisit = new StoryLanguage(storage);
    expect(revisit.locale).toBe("en");
    revisit.toggle();
    expect(new StoryLanguage(storage).locale).toBe("zh-TW");
  });
  it("ignores unsupported saved languages and survives blocked storage", () => {
    expect(
      new StoryLanguage({ getItem: () => "zh-CN", setItem: () => {} }).locale,
    ).toBe("zh-TW");
    const story = new StoryLanguage({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => story.toggle()).not.toThrow();
    expect(story.locale).toBe("en");
    expect(story.messages).toBe(STORY_MESSAGES.en);
  });
  it("contains only the requested story/dialogue messages", () => {
    for (const messages of Object.values(STORY_MESSAGES))
      expect(Object.keys(messages).sort()).toEqual([
        "opening",
        "over",
        "victory",
      ]);
  });
});
describe("Chinese story wrapping", () => {
  it("fits unspaced Chinese without losing characters or starting lines with closing punctuation", () => {
    const text = "天地玄黃，宇宙洪荒。";
    const wrapped = wrapStoryText(text, (line) => Array.from(line).length, 4);
    expect(wrapped.replaceAll("\n", "")).toBe(text);
    for (const line of wrapped.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(4);
      expect(line).not.toMatch(/^[，。！？；：、）》」』]/u);
    }
  });
  it("preserves short messages and explicit paragraph breaks", () => {
    const text = "回家。\n去吧。";
    expect(wrapStoryText(text, (line) => line.length, 12)).toBe(text);
  });
});
