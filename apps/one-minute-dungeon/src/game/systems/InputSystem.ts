import type { Action, Settings } from "../../storage/schemas";
import type { InputFrame } from "../types";
export class InputSystem {
  private held = new Set<string>();
  private edges = new Set<string>();
  mouse = { x: 0, y: 0 };
  active = false;
  constructor(
    private readonly settings: () => Settings,
    private readonly action: (action: Action) => void,
    canvas: HTMLCanvasElement,
  ) {
    window.addEventListener("keydown", (e) => {
      if (!this.active) return;
      if (this.bound(e.code)) {
        e.preventDefault();
        if (!e.repeat) this.press(e.code);
      }
    });
    window.addEventListener("keyup", (e) => {
      this.held.delete(e.code);
      if (this.active && this.bound(e.code)) e.preventDefault();
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (this.active) {
        e.preventDefault();
        this.press(`Mouse${e.button}`);
      }
    });
    window.addEventListener("pointerup", (e) =>
      this.held.delete(`Mouse${e.button}`),
    );
    canvas.addEventListener("pointermove", (e) => {
      this.mouse = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("contextmenu", (e) => {
      if (this.active) e.preventDefault();
    });
    window.addEventListener("blur", () => this.clear());
  }
  private bound(code: string): boolean {
    return Object.values(this.settings().bindings).includes(code);
  }
  private press(code: string): void {
    this.held.add(code);
    this.edges.add(code);
    const bindings = this.settings().bindings;
    for (const action of ["restart", "pause", "ghost", "splits"] as const)
      if (bindings[action] === code) this.action(action);
  }
  clear(): void {
    this.held.clear();
    this.edges.clear();
  }
  sample(aim: number): InputFrame {
    const b = this.settings().bindings;
    const frame: InputFrame = {
      mx: Number(this.held.has(b.right)) - Number(this.held.has(b.left)),
      my: Number(this.held.has(b.down)) - Number(this.held.has(b.up)),
      aim,
      attack: this.edges.has(b.attack),
      dash: this.edges.has(b.dash),
      interact: this.edges.has(b.interact),
    };
    this.edges.clear();
    return frame;
  }
}
