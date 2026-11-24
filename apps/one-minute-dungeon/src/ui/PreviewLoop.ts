export interface FrameClock {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}
export interface PreviewFrame {
  readonly elapsedMs: number;
  readonly still: boolean;
}
/** One presentation-only loop for every preview on the mounted page. */
export class PreviewLoop {
  private requestId: number | null = null;
  private mounted = false;
  private visible = true;
  private reduced = false;
  private lastTime: number | null = null;
  private elapsed = 0;
  constructor(
    private readonly clock: FrameClock,
    private readonly draw: (frame: PreviewFrame) => void,
  ) {}
  get running(): boolean {
    return this.requestId !== null;
  }
  mount(reduced: boolean, visible: boolean): void {
    if (this.mounted) return;
    this.mounted = true;
    this.reduced = reduced;
    this.visible = visible;
    this.refresh();
  }
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    this.refresh();
  }
  setReduced(reduced: boolean): void {
    if (this.reduced === reduced) return;
    this.reduced = reduced;
    this.refresh();
  }
  redraw(): void {
    if (this.mounted && this.visible)
      this.draw({ elapsedMs: this.elapsed, still: this.reduced });
  }
  private stop(): void {
    if (this.requestId !== null) this.clock.cancel(this.requestId);
    this.requestId = null;
    this.lastTime = null;
  }
  private refresh(): void {
    this.stop();
    if (!this.mounted || !this.visible) return;
    this.redraw();
    if (this.mounted && this.visible && !this.reduced)
      this.requestId = this.clock.request(this.frame);
  }
  private frame = (now: number): void => {
    this.requestId = null;
    if (!this.mounted || !this.visible || this.reduced) return;
    if (this.lastTime !== null)
      this.elapsed += Math.min(50, Math.max(0, now - this.lastTime));
    this.lastTime = now;
    this.draw({ elapsedMs: this.elapsed, still: false });
    if (this.mounted && this.visible && !this.reduced)
      this.requestId = this.clock.request(this.frame);
  };
  dispose(): void {
    this.mounted = false;
    this.stop();
  }
}
