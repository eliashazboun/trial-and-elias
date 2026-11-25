import { useGame } from "../store";
class TableAudio {
  private context: AudioContext | null = null;
  private music: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private started = false;
  private unsubscribe: (() => void) | null = null;
  private visibility = () => {
    if (document.hidden) void this.context?.suspend();
    else if (this.context) void this.context.resume();
  };
  unlock() {
    try {
      if (!this.context) this.context = new AudioContext();
      void this.context.resume();
      if (!this.started) {
        this.started = true;
        this.unsubscribe = useGame.subscribe((s, p) => {
          if (s.state?.revision !== p.state?.revision)
            this.effect(s.state?.round?.phase === "complete" ? 400 : 180);
        });
        document.addEventListener("visibilitychange", this.visibility);
        this.music = setInterval(() => this.background(), 1000);
      }
    } catch {}
  }
  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
  ) {
    const p = useGame.getState().preferences;
    if (!this.context || p.muted || document.hidden || !volume) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(volume, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  effect(frequency: number) {
    this.tone(
      frequency,
      0.09,
      useGame.getState().preferences.effects * 0.08,
      "triangle",
    );
  }
  private background() {
    const p = useGame.getState().preferences;
    this.beat++;
    if (p.music) {
      const notes = [130.81, 164.81, 196, 246.94, 146.83, 174.61, 220, 261.63];
      this.tone(notes[this.beat % notes.length]!, 1.8, p.music * 0.045);
      this.tone(notes[(this.beat + 2) % notes.length]!, 1.5, p.music * 0.025);
    }
    if (p.ambience)
      this.tone(75 + (this.beat % 3) * 7, 1.5, p.ambience * 0.012, "triangle");
  }
  dispose() {
    this.unsubscribe?.();
    document.removeEventListener("visibilitychange", this.visibility);
    this.started = false;
    if (this.music) clearInterval(this.music);
    void this.context?.close();
    this.context = null;
  }
}
export const Audio = new TableAudio();
