import type { Effect } from "./model";
export class GameAudio {
  enabled = false;
  private context?: AudioContext;
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      void this.context.resume();
      this.play("ready");
    }
    return this.enabled;
  }
  play(type: Effect["type"]) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context,
      t = ctx.currentTime;
    const note = (
      frequency: number,
      duration: number,
      delay = 0,
      wave: OscillatorType = "triangle",
      volume = 0.045,
    ) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, t + delay);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, frequency * 0.6),
        t + delay + duration,
      );
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(volume, t + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(t + delay);
      oscillator.stop(t + delay + duration);
    };
    if (type === "jab") note(290, 0.08, 0, "triangle");
    if (type === "hit") note(140, 0.1, 0, "square", 0.025);
    if (type === "heavy") {
      note(130, 0.3, 0, "sawtooth", 0.025);
      note(520, 0.2, 0.04);
    }
    if (type === "jump") note(430, 0.12);
    if (type === "land") note(65, 0.22, 0, "triangle", 0.08);
    if (type === "damage") {
      note(170, 0.3, 0, "sawtooth", 0.04);
      note(90, 0.3, 0.15);
    }
    if (type === "reward" || type === "ready" || type === "victory")
      [523, 659, 784, 1046].forEach((n, i) => note(n, 0.2, i * 0.07));
    if (type === "climb") note(620, 0.12);
    if (type === "spawn") note(190, 0.1, 0, "sine", 0.015);
  }
}
