import type { Settings } from "../../storage/schemas";
import type { SimEvent } from "../types";
const NOTES: Record<SimEvent["type"] | "pb" | "achievement", number[]> = {
  dash: [170, 440],
  ready: [660],
  swing: [230, 120],
  impact: [90, 60],
  kill: [240, 100],
  "enemy-attack": [140, 70],
  key: [660, 880, 1320],
  switch: [330, 440, 660],
  unlock: [220, 330, 440, 660],
  death: [220, 180, 120, 60],
  escape: [440, 550, 660, 880],
  loot: [880, 1100],
  weapon: [440, 660],
  secret: [330, 550, 770],
  warning: [180],
  "guardian-vulnerable": [330, 495, 660, 990],
  pb: [660, 880, 1100, 1320],
  achievement: [550, 660, 880],
};
export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private nextBeat = 0;
  private beat = 0;
  constructor(private readonly settings: () => Settings) {}
  async unlock(): Promise<void> {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.sfxGain = this.context.createGain();
        this.musicGain.connect(this.master);
        this.sfxGain.connect(this.master);
        this.master.connect(this.context.destination);
      }
      await this.context.resume();
      this.apply();
    } catch {
      /* Audio is optional when the device has no output. */
    }
  }
  apply(): void {
    const s = this.settings();
    if (this.master) this.master.gain.value = s.mute ? 0 : 1;
    if (this.musicGain) this.musicGain.gain.value = s.music * 0.18;
    if (this.sfxGain) this.sfxGain.gain.value = s.sfx * 0.18;
  }
  private tone(
    freq: number,
    time: number,
    duration: number,
    gain: GainNode,
    type: OscillatorType = "square",
  ): void {
    const c = this.context;
    if (!c) return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, time);
    g.gain.exponentialRampToValueAtTime(0.5, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    o.connect(g);
    g.connect(gain);
    o.start(time);
    o.stop(time + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  sound(name: keyof typeof NOTES): void {
    if (!this.context || !this.sfxGain) return;
    NOTES[name].forEach((n, i) =>
      this.tone(
        n,
        this.context!.currentTime + i * 0.045,
        0.1,
        this.sfxGain!,
        name === "dash" ? "sawtooth" : "square",
      ),
    );
  }
  update(playing: boolean): void {
    const c = this.context;
    if (!c || !this.musicGain) return;
    if (!playing) {
      this.nextBeat = c.currentTime;
      return;
    }
    if (this.nextBeat < c.currentTime) this.nextBeat = c.currentTime;
    const melody = [0, 7, 12, 3, 10, 7, 3, 7, 0, 7, 12, 14, 10, 7, 3, -2],
      bass = [146.83, 130.81, 116.54, 130.81];
    while (this.nextBeat < c.currentTime + 0.05) {
      const root = bass[Math.floor(this.beat / 16) % 4]!;
      this.tone(
        root * Math.pow(2, melody[this.beat % 16]! / 12),
        this.nextBeat,
        0.09,
        this.musicGain,
        "triangle",
      );
      if (this.beat % 4 === 0)
        this.tone(root / 2, this.nextBeat, 0.22, this.musicGain, "square");
      this.beat++;
      this.nextBeat += 0.115;
    }
  }
}
