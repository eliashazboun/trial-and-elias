import { describe, it, expect } from "vitest";
import { PreviewLoop, type PreviewFrame } from "../src/ui/PreviewLoop";
import {
  COSMETIC_GROUPS,
  availableCosmetic,
  findCosmetic,
} from "../src/ui/CosmeticsCatalog";
import {
  forEachSpritePixel,
  PALETTES,
  tintPixel,
} from "../src/game/rendering/SpriteArt";
import {
  COSMETIC_STYLE,
  ghostTint,
  swordTint,
  trailTint,
} from "../src/game/rendering/CosmeticStyle";
import { WEAPONS } from "../src/game/config";
function fakeClock() {
  let id = 0;
  const queued = new Map<number, FrameRequestCallback>();
  return {
    request: (callback: FrameRequestCallback) => {
      queued.set(++id, callback);
      return id;
    },
    cancel: (id: number) => {
      queued.delete(id);
    },
    step: (time: number) => {
      const callbacks = [...queued.values()];
      queued.clear();
      callbacks.forEach((callback) => callback(time));
    },
    get count() {
      return queued.size;
    },
  };
}
describe("one appearance animation scheduler", () => {
  it("uses one request for all redraws and never multiplies on repeated mount", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(false, true);
    loop.mount(false, true);
    expect(clock.count).toBe(1);
    clock.step(10);
    clock.step(26);
    expect(clock.count).toBe(1);
    expect(frames.at(-1)).toEqual({ elapsedMs: 16, still: false });
    loop.dispose();
    expect(clock.count).toBe(0);
  });
  it("suspends hidden pages without advancing hidden time, then resumes once", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(false, true);
    clock.step(10);
    clock.step(26);
    loop.setVisible(false);
    expect(clock.count).toBe(0);
    const count = frames.length;
    clock.step(10000);
    expect(frames.length).toBe(count);
    loop.setVisible(true);
    loop.setVisible(true);
    expect(clock.count).toBe(1);
    clock.step(12000);
    expect(frames.at(-1)?.elapsedMs).toBe(16);
    clock.step(12016);
    expect(frames.at(-1)?.elapsedMs).toBe(32);
  });
  it("renders useful still frames without scheduling motion and can toggle back", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(true, true);
    expect(frames).toEqual([{ elapsedMs: 0, still: true }]);
    expect(clock.count).toBe(0);
    loop.setReduced(false);
    expect(clock.count).toBe(1);
    clock.step(10);
    clock.step(26);
    loop.setReduced(true);
    expect(clock.count).toBe(0);
    expect(frames.at(-1)).toEqual({ elapsedMs: 16, still: true });
    loop.redraw();
    expect(frames.at(-1)?.still).toBe(true);
  });
  it("does not draw or run while initially hidden", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(false, false);
    expect(frames).toHaveLength(0);
    expect(clock.count).toBe(0);
    loop.setVisible(true);
    expect(frames).toHaveLength(1);
    expect(clock.count).toBe(1);
  });
  it("cancels all work on disposal, including events received afterward", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(false, true);
    loop.dispose();
    const count = frames.length;
    loop.setVisible(false);
    loop.setVisible(true);
    loop.setReduced(true);
    loop.redraw();
    clock.step(100);
    expect(frames).toHaveLength(count);
    expect(clock.count).toBe(0);
    expect(loop.running).toBe(false);
  });
  it("does not reschedule if drawing disposes the mounted page", () => {
    const clock = fakeClock();
    let loop: PreviewLoop;
    loop = new PreviewLoop(clock, () => loop.dispose());
    loop.mount(false, true);
    expect(clock.count).toBe(0);
  });
  it("bounds animation catch-up after a display stall", () => {
    const clock = fakeClock(),
      frames: PreviewFrame[] = [],
      loop = new PreviewLoop(clock, (f) => frames.push(f));
    loop.mount(false, true);
    clock.step(1);
    clock.step(10001);
    expect(frames.at(-1)?.elapsedMs).toBe(50);
  });
});
describe("original cosmetics and faithful shared artwork", () => {
  it("retains the original fourteen options, groups and unlock requirements", () => {
    expect(COSMETIC_GROUPS.map((g) => [g.setting, g.items.length])).toEqual([
      ["skin", 4],
      ["sword", 2],
      ["trail", 3],
      ["ghostColor", 2],
      ["title", 3],
    ]);
    expect(
      COSMETIC_GROUPS.flatMap((g) => g.items).filter((item) =>
        availableCosmetic(item, []),
      ),
    ).toHaveLength(5);
    expect(findCosmetic("skin", "jade")?.option.need).toBe("first");
    expect(findCosmetic("trail", "jade")?.option.need).toBe("challenge");
    expect(findCosmetic("title", "Guardian Slayer")?.option.need).toBe(
      "guardian",
    );
    expect(findCosmetic("skin", "not-a-skin")).toBeUndefined();
  });
  it("only equips known unlocked choices without modifying the unlock list", () => {
    const achievements = ["first"];
    const found = findCosmetic("skin", "jade")!;
    expect(availableCosmetic(found.option, achievements)).toBe(true);
    expect(
      availableCosmetic(findCosmetic("skin", "ivory")!.option, achievements),
    ).toBe(false);
    expect(achievements).toEqual(["first"]);
  });
  it("preserves original knight pixel colors and two-frame bob geometry", () => {
    const a = new Map<string, string>(),
      b = new Map<string, string>();
    forEachSpritePixel("ember", 0, (x, y, c) => a.set(x + "," + y, c));
    forEachSpritePixel("ember", 1, (x, y, c) => b.set(x + "," + y, c));
    expect(a.get("6,2")).toBe("#a53e48");
    expect(b.get("6,3")).toBe("#a53e48");
    expect(a.get("3,17")).toBe("#151d2b");
    expect(b.get("3,17")).toBe("#151d2b");
    for (const name of ["ember", "jade", "violet", "ivory"]) {
      const colors = new Set<string>();
      forEachSpritePixel(name, 0, (_x, _y, color) => colors.add(color));
      expect(colors.has(PALETTES[name]!.c!)).toBe(true);
    }
  });
  it("shares the exact existing ghost, sword and trail presentation values", () => {
    expect(ghostTint("cyan")).toBe(0x63d8f5);
    expect(ghostTint("violet")).toBe(0xc49aff);
    expect(COSMETIC_STYLE.ghostAlpha).toBe(0.35);
    expect(swordTint("steel", WEAPONS.sword.color)).toBe(0xdde8ee);
    expect(swordTint("gold", WEAPONS.sword.color)).toBe(0xffd585);
    expect(trailTint("ember")).toBe(0xd08c9a);
    expect(trailTint("relic")).toBe(0xf4cd89);
    expect(trailTint("jade")).toBe(0x83e4bd);
    expect(tintPixel("#ffffff", 0x63d8f5)).toBe("#63d8f5");
    expect(tintPixel("#000000", 0x63d8f5)).toBe("#000000");
  });
});
