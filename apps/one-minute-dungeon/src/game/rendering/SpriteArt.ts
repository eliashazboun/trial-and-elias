export const PALETTES: Record<string, Record<string, string>> = {
  ember: {
    a: "#f8c47b",
    b: "#e9e4d4",
    c: "#a53e48",
    d: "#293444",
    e: "#8397a1",
    f: "#151d2b",
  },
  jade: {
    a: "#b5efc6",
    b: "#d2eadb",
    c: "#339484",
    d: "#203d42",
    e: "#95bcb2",
    f: "#102c30",
  },
  violet: {
    a: "#ecd3ff",
    b: "#e2dbea",
    c: "#8c5cbb",
    d: "#37304f",
    e: "#bfa4ce",
    f: "#22162e",
  },
  ivory: {
    a: "#fff3c9",
    b: "#f3e9cf",
    c: "#c79b4f",
    d: "#48443e",
    e: "#c2bfb0",
    f: "#242b34",
  },
  skeleton: {
    a: "#fff0cb",
    b: "#d0c5a4",
    c: "#684f5e",
    d: "#3b3745",
    e: "#9e977c",
    f: "#1a2031",
  },
  cultist: {
    a: "#eab9fd",
    b: "#baa7cf",
    c: "#8155ae",
    d: "#392a54",
    e: "#a377d1",
    f: "#161d30",
  },
  hound: {
    a: "#ffaf6b",
    b: "#997a80",
    c: "#7e3c4e",
    d: "#3a3544",
    e: "#6a5865",
    f: "#171e2b",
  },
  guardian: {
    a: "#f5b577",
    b: "#c5b7ae",
    c: "#ab7550",
    d: "#424858",
    e: "#7e8391",
    f: "#17202d",
  },
};
const KNIGHT = [
  "      cccc      ",
  "     cccccc     ",
  "    cbbbbbbc    ",
  "    bbeeeeeb    ",
  "    bffaaafb    ",
  "    bffaaaab    ",
  "     bbbbb      ",
  "   eeeccccdee   ",
  "  eebcccccbdee  ",
  "  ebbccccbbdee  ",
  "  ebbccccbbdee  ",
  "  efbbbbbbdf e  ",
  "   fbbbbbbdf    ",
  "    ddddddd     ",
  "    dd  ddd     ",
  "   fff  fff     ",
];
const SKELETON = [
  "                ",
  "     bbbbb      ",
  "    bbaabb b    ",
  "    bffbffb     ",
  "     bbbbb      ",
  "      beb       ",
  "   bb bbbb bb   ",
  "  b   beeb   b  ",
  "  b   bbbb   b  ",
  "  b    bb    b  ",
  "  b   bbbb   b  ",
  "      b  b      ",
  "     b    b     ",
  "     b    b     ",
  "    bb    bb    ",
  "                ",
];
const CULTIST = [
  "      cc        ",
  "     cccc       ",
  "    cccccc      ",
  "   cffffffc     ",
  "   cfaffafc     ",
  "   cffffffc     ",
  "    cccccc      ",
  "    ccddcc      ",
  "   cccddccc     ",
  "  ccccddcccc    ",
  " cccccddccccc   ",
  " cccccddccccc   ",
  "   cccccccc     ",
  "  cccccccccc    ",
  " cccccccccccc   ",
  "   ff    ff     ",
];
const HOUND = [
  "                ",
  "                ",
  "                ",
  "  c         c   ",
  "  bc       cb   ",
  "  bbbaaaabbb    ",
  "  baffffafab    ",
  "   bbbbbbbb     ",
  "   dbbbbbbd     ",
  "  dddbbbbddd    ",
  " ddddbbbbdddd   ",
  " ddddbbbbdddd   ",
  "  dd      dd    ",
  "  ff      ff    ",
  "                ",
  "                ",
];

/** Pure pixel artwork shared by Phaser textures and the appearance page. */
export function forEachSpritePixel(
  name: string,
  frame: number,
  paint: (x: number, y: number, color: string) => void,
): void {
  const palette = PALETTES[name] ?? PALETTES.ember!;
  const rows =
    name === "skeleton"
      ? SKELETON
      : name === "cultist"
        ? CULTIST
        : name === "hound"
          ? HOUND
          : KNIGHT;
  rows.forEach((row, y) =>
    [...row].forEach((pixel, x) => {
      const color = palette[pixel];
      if (color) paint(x, y + 2 + (frame && y < 12 ? 1 : 0), color);
    }),
  );
}
export function paintSprite(
  ctx: Pick<CanvasRenderingContext2D, "fillStyle" | "fillRect">,
  name: string,
  frame: number,
  tint?: number,
): void {
  forEachSpritePixel(name, frame, (x, y, color) => {
    ctx.fillStyle = tint === undefined ? color : tintPixel(color, tint);
    ctx.fillRect(x, y, 1, 1);
  });
}
/** Phaser's multiplicative sprite tint, applied once to cached preview pixels. */
export function tintPixel(color: string, tint: number): string {
  const source = parseInt(color.slice(1), 16);
  let out = "#";
  for (const shift of [16, 8, 0])
    out += Math.round(
      (((source >>> shift) & 255) * ((tint >>> shift) & 255)) / 255,
    )
      .toString(16)
      .padStart(2, "0");
  return out;
}
