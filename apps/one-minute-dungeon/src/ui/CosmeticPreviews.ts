import { C, WEAPONS } from "../game/config";
import { paintSprite } from "../game/rendering/SpriteArt";
import {
  COSMETIC_STYLE,
  cssColor,
  ghostTint,
  swordTint,
  trailTint,
} from "../game/rendering/CosmeticStyle";
import { findCosmetic, type CosmeticSetting } from "./CosmeticsCatalog";
import { PreviewLoop, type PreviewFrame } from "./PreviewLoop";
export const PREVIEW_SIZE = { width: 112, height: 84 } as const;
interface PreviewEntry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  setting: CosmeticSetting;
  id: string;
}
/** Canvas resources belong to this appearance page, never to the dungeon or its simulation. */
class SpriteCache {
  private frames = new Map<string, HTMLCanvasElement>();
  get(skin: string, frame: number, tint?: number): HTMLCanvasElement {
    const key = skin + ":" + frame + ":" + (tint ?? "none");
    let canvas = this.frames.get(key);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 20;
      const ctx = canvas.getContext("2d");
      if (ctx) paintSprite(ctx, skin, frame, tint);
      this.frames.set(key, canvas);
    }
    return canvas;
  }
  dispose(): void {
    for (const canvas of this.frames.values()) {
      canvas.width = 0;
      canvas.height = 0;
    }
    this.frames.clear();
  }
}
export class CosmeticPreviews {
  private readonly entries: PreviewEntry[] = [];
  private readonly sprites = new SpriteCache();
  private readonly loop: PreviewLoop;
  private readonly media = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  private readonly resizeObserver: ResizeObserver;
  private disposed = false;
  constructor(
    private readonly host: HTMLElement,
    private readonly reducedEffects: boolean,
  ) {
    for (const canvas of host.querySelectorAll<HTMLCanvasElement>(
      "canvas[data-preview-setting]",
    )) {
      const found = findCosmetic(
          canvas.dataset.previewSetting ?? "",
          canvas.dataset.previewValue ?? "",
        ),
        ctx = canvas.getContext("2d");
      if (found && ctx)
        this.entries.push({
          canvas,
          ctx,
          setting: found.group.setting,
          id: found.option.id,
        });
    }
    this.loop = new PreviewLoop(
      {
        request: (callback) => window.requestAnimationFrame(callback),
        cancel: (id) => window.cancelAnimationFrame(id),
      },
      this.draw,
    );
    document.addEventListener("visibilitychange", this.visibilityChanged);
    this.media.addEventListener("change", this.motionChanged);
    window.addEventListener("resize", this.resized);
    this.resizeObserver = new ResizeObserver(this.resized);
    this.resizeObserver.observe(host);
    this.resizeBuffers();
    this.loop.mount(this.isReduced, !document.hidden);
    this.updateMotionLabel();
  }
  private get isReduced(): boolean {
    return this.reducedEffects || this.media.matches;
  }
  private updateMotionLabel(): void {
    this.host.dataset.previewMotion = this.disposed
      ? "disposed"
      : document.hidden
        ? "suspended"
        : this.isReduced
          ? "still"
          : "animated";
  }
  private visibilityChanged = (): void => {
    if (this.disposed) return;
    this.loop.setVisible(!document.hidden);
    this.updateMotionLabel();
  };
  private motionChanged = (): void => {
    if (this.disposed) return;
    this.loop.setReduced(this.isReduced);
    this.updateMotionLabel();
  };
  private resized = (): void => {
    if (this.disposed) return;
    this.resizeBuffers();
    this.loop.redraw();
  };
  private resizeBuffers(): void {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    for (const { canvas } of this.entries) {
      const width = Math.round(PREVIEW_SIZE.width * ratio),
        height = Math.round(PREVIEW_SIZE.height * ratio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    }
  }
  private knight(
    ctx: CanvasRenderingContext2D,
    skin: string,
    frame: number,
    x: number,
    y: number,
    scale = 2,
    tint?: number,
    alpha = 1,
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.sprites.get(skin, frame, tint),
      Math.round(x - 8 * scale),
      Math.round(y - 14 * scale),
      16 * scale,
      20 * scale,
    );
    ctx.restore();
  }
  private background(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#111c2a";
    ctx.fillRect(0, 0, 112, 84);
    ctx.fillStyle = "#1b2a39";
    ctx.fillRect(0, 60, 112, 24);
    ctx.strokeStyle = "#243747";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < 112; x += 16) {
      ctx.moveTo(x + 0.5, 60);
      ctx.lineTo(x + 0.5, 84);
    }
    ctx.moveTo(0, 72.5);
    ctx.lineTo(112, 72.5);
    ctx.stroke();
    ctx.fillStyle = "#080f1a";
    ctx.fillRect(39, 68, 34, 5);
  }
  private draw = ({ elapsedMs, still }: PreviewFrame): void => {
    for (const entry of this.entries) {
      const { canvas, ctx, setting, id } = entry;
      ctx.setTransform(canvas.width / 112, 0, 0, canvas.height / 84, 0, 0);
      ctx.imageSmoothingEnabled = false;
      this.background(ctx);
      const frame = still ? 0 : Math.floor(elapsedMs / 150) % 2;
      if (setting === "skin") this.knight(ctx, id, frame, 56, 62, 3);
      else if (setting === "ghostColor") {
        const x = still ? 56 : 56 + Math.sin(elapsedMs / 650) * 20;
        this.knight(
          ctx,
          COSMETIC_STYLE.ghostSkin,
          frame,
          x,
          62,
          2,
          ghostTint(id),
          COSMETIC_STYLE.ghostAlpha,
        );
      } else if (setting === "title")
        this.knight(ctx, "ember", frame, 56, 58, 2);
      else if (setting === "sword") this.sword(ctx, id, elapsedMs, still);
      else this.trail(ctx, id, elapsedMs, still);
    }
  };
  private sword(
    ctx: CanvasRenderingContext2D,
    id: string,
    elapsed: number,
    still: boolean,
  ): void {
    const phase = elapsed % 1500,
      active = still || phase < 480,
      progress = still ? 0.56 : Math.min(1, phase / 480),
      x = 35,
      y = 47,
      range = WEAPONS.sword.range;
    this.knight(ctx, "ember", 0, x, y + 8, 2);
    const color = cssColor(swordTint(id, WEAPONS.sword.color));
    ctx.strokeStyle = color;
    ctx.fillStyle = cssColor(WEAPONS.sword.color);
    if (active) {
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(
        x,
        y,
        range,
        (-Math.PI * 100) / 360,
        (Math.PI * C.swordArcDegrees) / 360,
      );
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, range, -0.87, 0.87);
      ctx.stroke();
      const angle = -0.87 + progress * 1.74;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10);
      ctx.lineTo(x + Math.cos(angle) * range, y + Math.sin(angle) * range);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 9);
      ctx.lineTo(x + 34, y - 10);
      ctx.stroke();
    }
  }
  private trail(
    ctx: CanvasRenderingContext2D,
    id: string,
    elapsed: number,
    still: boolean,
  ): void {
    const phase = elapsed % 1800,
      start = 350,
      duration = 420,
      color = cssColor(trailTint(id));
    const x = still
      ? 82
      : phase < start
        ? 22
        : phase < start + duration
          ? 22 + ((phase - start) / duration) * 60
          : 82;
    ctx.fillStyle = color;
    if (still) {
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = (COSMETIC_STYLE.trailMaxAlpha * (i + 1)) / 5;
        ctx.fillRect(18 + i * 11, 43, 20, 30);
      }
    } else
      for (let i = 0; i <= 16; i++) {
        const born = start + (i * duration) / 16,
          age = phase - born,
          life = COSMETIC_STYLE.trailFadeSeconds * 2000;
        if (age >= 0 && age < life) {
          ctx.globalAlpha = COSMETIC_STYLE.trailMaxAlpha * (1 - age / life);
          ctx.fillRect(Math.round(22 + (i * 60) / 16 - 10), 43, 20, 30);
        }
      }
    ctx.globalAlpha = 1;
    const alpha = still
      ? 1
      : Math.max(0, Math.min(1, phase / 150, (1800 - phase) / 150));
    this.knight(ctx, "ember", 0, x, 62, 2, undefined, alpha);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.dispose();
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.visibilityChanged);
    this.media.removeEventListener("change", this.motionChanged);
    window.removeEventListener("resize", this.resized);
    this.sprites.dispose();
    this.entries.length = 0;
    this.updateMotionLabel();
  }
}
