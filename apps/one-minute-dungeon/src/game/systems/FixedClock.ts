import { C } from "../config";
/** Render timing is deliberately separate from the authoritative simulation. */
export class FixedClock {
  accumulator = 0;
  catchups = 0;
  last = 0;
  reset(now: number): void {
    this.last = now;
    this.accumulator = 0;
  }
  advance(
    now: number,
    step: () => void,
    invalidate: (reason: string) => void,
    rate = 1,
  ): number {
    if (!this.last) {
      this.last = now;
      return 0;
    }
    const delta = Math.max(0, now - this.last);
    this.last = now;
    if (delta > C.maxFrameMs) {
      invalidate("Simulation interrupted by a browser stall");
      this.accumulator = 0;
      return 0;
    }
    this.accumulator += (delta / 1000) * rate;
    let steps = 0;
    const limit = Math.ceil(C.maxCatchup * rate);
    while (this.accumulator + 1e-10 >= C.dt && steps < limit) {
      step();
      this.accumulator -= C.dt;
      steps++;
    }
    if (steps > 3) this.catchups++;
    if (this.accumulator >= C.dt) {
      invalidate("Simulation catch-up limit exceeded");
      this.accumulator = 0;
    }
    return Math.max(0, Math.min(1, this.accumulator / C.dt));
  }
}
