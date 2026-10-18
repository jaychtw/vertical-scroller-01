/** Narrative copy only. HUD, controls, prompts and restart confirmation stay in English. */
export type StoryLocale = "en" | "zh-TW";
interface StoryMessages {
  readonly opening: readonly [string, string];
  readonly victory: string;
  readonly over: string;
}
export const STORY_MESSAGES: Readonly<Record<StoryLocale, StoryMessages>> = {
  en: {
    opening: [
      "The gate is locked. You need the key to get out. Principal Ralf got the key, and he's on the rooftop.",
      "Go, Jeremy. Go get the key, and go home.",
    ],
    victory: "You got the key. Now, you can go home, Jeremy.",
    over: "Jeremy couldn't escape the school.",
  },
  "zh-TW": {
    opening: [
      "校門鎖住了。你需要鑰匙才能出去。拉爾夫校長拿著鑰匙，他就在屋頂上。",
      "去吧，傑瑞米。去拿回鑰匙，然後回家。",
    ],
    victory: "你拿到鑰匙了。現在，你可以回家了，傑瑞米。",
    over: "傑瑞米沒能逃出學校。",
  },
};
export const STORY_LANGUAGE_KEY = "jeremys-odyssey.story-language";
export const STORY_FONT = '"Noto Sans TC", sans-serif';
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;
function browserStorage(): PreferenceStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
export class StoryLanguage {
  locale: StoryLocale = "zh-TW";
  constructor(
    private storage: PreferenceStorage | undefined = browserStorage(),
  ) {
    try {
      const saved = storage?.getItem(STORY_LANGUAGE_KEY);
      if (saved === "en" || saved === "zh-TW") this.locale = saved;
    } catch {
      /* Private browsing or blocked storage must not prevent play. */
    }
  }
  get messages(): StoryMessages {
    return STORY_MESSAGES[this.locale];
  }
  toggle(): void {
    this.locale = this.locale === "en" ? "zh-TW" : "en";
    try {
      this.storage?.setItem(STORY_LANGUAGE_KEY, this.locale);
    } catch {
      /* Keep the in-memory choice when persistence is unavailable. */
    }
  }
}

/** Canvas word wrapping does not split unspaced Chinese; retain punctuation with its preceding character. */
export function wrapStoryText(
  text: string,
  measure: (text: string) => number,
  width: number,
): string {
  const lines: string[] = [];
  let line = "";
  for (const character of text) {
    if (character === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    if (line && measure(line + character) > width) {
      if (/[，。！？；：、）》」』]/u.test(character) && line.length > 1) {
        const characters = Array.from(line);
        const preceding = characters.pop()!;
        lines.push(characters.join(""));
        line = preceding;
      } else {
        lines.push(line);
        line = "";
      }
    }
    line += character;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
