import Phaser from "phaser";
import { useGame, dispatch } from "../store";
import { evaluate, symbols, weight } from "../engine/cards";
import { money, pendingTotal, sum } from "../engine/types";
import { projection } from "../engine/engine";
import type { BetKind, Card, GameState, Projection } from "../engine/types";
const COLORS: Record<number, string> = {
  1: "#f5efe3",
  5: "#b9353c",
  25: "#237b59",
  100: "#202533",
  500: "#75478e",
};
function textures(scene: Phaser.Scene) {
  for (const suit of ["spades", "hearts", "diamonds", "clubs"] as const)
    for (const rank of [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ]) {
      const key = `${rank}-${suit}`;
      if (scene.textures.exists(key)) continue;
      const texture = scene.textures.createCanvas(key, 180, 252)!;
      const ctx = texture.context;
      ctx.fillStyle = "#00000033";
      ctx.beginPath();
      ctx.roundRect(4, 5, 176, 247, 12);
      ctx.fill();
      ctx.fillStyle = "#fbf8ef";
      ctx.beginPath();
      ctx.roundRect(0, 0, 175, 246, 10);
      ctx.fill();
      ctx.strokeStyle = "#d9d4c8";
      ctx.stroke();
      ctx.fillStyle = ["hearts", "diamonds"].includes(suit)
        ? "#ad253d"
        : "#202832";
      ctx.textAlign = "left";
      ctx.font = "bold 35px Georgia";
      ctx.fillText(rank, 12, 39);
      ctx.font = "28px Georgia";
      ctx.fillText(symbols[suit], 12, 68);
      ctx.save();
      ctx.translate(175, 246);
      ctx.rotate(Math.PI);
      ctx.font = "bold 35px Georgia";
      ctx.fillText(rank, 12, 39);
      ctx.font = "28px Georgia";
      ctx.fillText(symbols[suit], 12, 68);
      ctx.restore();
      ctx.textAlign = "center";
      if (["J", "Q", "K"].includes(rank)) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.strokeRect(44, 47, 86, 151);
        ctx.font = "60px Georgia";
        ctx.fillText(rank === "K" ? "♚" : rank === "Q" ? "♛" : "♞", 87, 132);
        ctx.font = "30px Georgia";
        ctx.fillText(symbols[suit], 87, 179);
      } else if (rank === "A") {
        ctx.font = "88px Georgia";
        ctx.fillText(symbols[suit], 87, 155);
      } else {
        const n = Number(rank);
        for (let i = 0; i < n; i++) {
          const col = n <= 3 ? 0 : i % 2,
            row = n <= 3 ? i : Math.floor(i / 2),
            rows = n <= 3 ? n : Math.ceil(n / 2);
          ctx.font = "28px Georgia";
          ctx.fillText(
            symbols[suit],
            n <= 3 ? 87 : col ? 116 : 59,
            85 + row * (rows === 1 ? 0 : 90 / (rows - 1)),
          );
        }
      }
      texture.refresh();
    }
  for (const [name, color] of Object.entries({
    blue: "#244b78",
    red: "#923544",
    gold: "#29252a",
    geometric: "#385960",
    scholar: "#5c4389",
  })) {
    const t = scene.textures.createCanvas(`back-${name}`, 180, 252)!,
      c = t.context;
    c.fillStyle = "#eee8d9";
    c.beginPath();
    c.roundRect(0, 0, 175, 246, 10);
    c.fill();
    c.fillStyle = color;
    c.fillRect(8, 8, 159, 230);
    c.strokeStyle = name === "gold" ? "#d3b77a" : "#e6e0cb99";
    c.lineWidth = 1;
    for (let i = -250; i < 250; i += 12) {
      c.beginPath();
      c.moveTo(9, Math.max(9, i));
      c.lineTo(166, Math.min(237, i + 157));
      c.stroke();
    }
    c.strokeStyle = "#e5ca89";
    c.strokeRect(18, 19, 139, 207);
    c.font = "40px Georgia";
    c.textAlign = "center";
    c.fillStyle = "#eee8d9";
    c.fillText("♠", 87, 139);
    t.refresh();
  }
  for (const [den, color] of Object.entries(COLORS)) {
    const t = scene.textures.createCanvas(`chip-${den}`, 120, 120)!,
      c = t.context;
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(61, 67, 55, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(60, 63, 54, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(60, 56, 54, 45, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = den === "1" ? "#c6ba97" : "#fff8";
    c.lineWidth = 5;
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      c.save();
      c.translate(60, 56);
      c.scale(1, 0.83);
      c.rotate(a);
      c.fillStyle = den === "1" ? "#263043" : "#eee8d9";
      c.fillRect(42, -5, 10, 10);
      c.restore();
    }
    c.strokeStyle = den === "1" ? "#8f8061" : "#fff8";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(60, 56, 34, 28, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = den === "1" ? "#253037" : "#fff7e6";
    c.textAlign = "center";
    c.font = "bold 26px Georgia";
    c.fillText(den, 60, 64);
    t.refresh();
  }
}
export class DesktopLayout {
  readonly portrait: boolean = false;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
  dealer() {
    return { x: this.width / 2, y: 120 };
  }
  position(p: number) {
    return { x: (this.width * (p + 1)) / 4, y: this.height * 0.59 };
  }
}
export class PortraitLayout extends DesktopLayout {
  override readonly portrait = true;
  override dealer() {
    return { x: this.width / 2, y: 115 };
  }
  override position(p: number) {
    return { x: (this.width * (p + 0.5)) / 3, y: this.height * 0.59 };
  }
}
export class LandscapeLayout extends DesktopLayout {
  override dealer() {
    return { x: this.width / 2, y: 100 };
  }
  override position(p: number) {
    return { x: (this.width * (p + 1)) / 4, y: this.height * 0.57 };
  }
}
export class TableScene extends Phaser.Scene {
  private cleanup?: () => void;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private cards = new Map<string, Phaser.GameObjects.Container>();
  private lastRevision = -1;
  private settledVisuals = new Set<string>();
  private lastProjection: Projection | null = null;
  private redrawListener = () => this.render();
  constructor() {
    super("Table");
  }
  create() {
    textures(this);
    this.cleanup = useGame.subscribe((s, p) => {
      if (
        s.state !== p.state ||
        s.preferences !== p.preferences ||
        s.visual !== p.visual ||
        s.chip !== p.chip
      )
        this.render();
    });
    this.scale.on("resize", this.redrawListener);
    this.events.once("shutdown", () => {
      this.cleanup?.();
      this.scale.off("resize", this.redrawListener);
    });
    this.render();
  }
  private text(
    x: number,
    y: number,
    text: string,
    size = 14,
    color = "#efe6c9",
  ) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "Georgia, serif",
        fontSize: size,
        color,
        align: "center",
      })
      .setOrigin(0.5);
    this.objects.push(t);
    return t;
  }
  private card(
    c: Card | null,
    id: string,
    x: number,
    y: number,
    w: number,
    index: number,
    animate: boolean,
  ) {
    const prefs = useGame.getState().preferences;
    const key = c ? `${c.rank}-${c.suit}` : `back-${prefs.cardBack}`;
    let container = this.cards.get(id);
    const isNew = !container;
    if (!container) {
      container = this.add.container(this.scale.width - 60, 70);
      const image = this.add.image(0, 0, key).setDisplaySize(w, w * 1.4);
      container.add(image);
      this.cards.set(id, container);
    }
    const image = container.list[0] as Phaser.GameObjects.Image;
    const faceChanged = image.texture.key !== key;
    this.tweens.killTweensOf(container);
    image.setDisplaySize(w, w * 1.4);
    const duration =
      prefs.reducedMotion || prefs.speed === "instant" || !animate
        ? 0
        : ({ slow: 430, normal: 250, fast: 100 }[prefs.speed] ?? 250);
    if (faceChanged && duration) {
      this.tweens.add({
        targets: container,
        scaleX: 0,
        duration: duration / 2,
        onComplete: () => {
          image.setTexture(key).setDisplaySize(w, w * 1.4);
          this.tweens.add({
            targets: container,
            scaleX: 1,
            duration: duration / 2,
          });
        },
      });
    } else image.setTexture(key);
    container.setDepth(10 + index).setScale(1);
    if (isNew && duration) {
      this.tweens.add({
        targets: container,
        x,
        y,
        angle: 0,
        duration,
        delay: index * duration * 0.35,
        ease: "Cubic.easeOut",
      });
    } else if (duration && (container.x !== x || container.y !== y)) {
      this.tweens.add({
        targets: container,
        x,
        y,
        duration,
        ease: "Cubic.easeOut",
      });
    } else container.setPosition(x, y);
    while (container.list.length > 1)
      container.remove(container.list[1]!, true);
    if (
      c &&
      useGame
        .getState()
        .state?.round?.sideResults.some(
          (result) =>
            result.ratio > 0 && result.cards.some((card) => card.id === c.id),
        )
    ) {
      const outline = this.add
        .rectangle(0, 0, w + 5, w * 1.4 + 5)
        .setStrokeStyle(2, 0xe8ca80);
      container.add(outline);
    }
    if (c && prefs.weights) {
      const t = this.add
        .text(w * 0.27, -w * 0.37, `${weight(c) > 0 ? "+" : ""}${weight(c)}`, {
          fontFamily: "sans-serif",
          fontSize: 13,
          color: "#fff",
          backgroundColor:
            weight(c) > 0 ? "#176347" : weight(c) < 0 ? "#8c2940" : "#444",
        })
        .setPadding(3)
        .setOrigin(0.5);
      container.add(t);
    }
    return container;
  }
  private renderProjection(
    state: GameState,
    view: Projection | null,
    animate: boolean,
  ) {
    const width = this.scale.width,
      height = this.scale.height;
    const layout =
      width < 600
        ? new PortraitLayout(width, height)
        : height < 430
          ? new LandscapeLayout(width, height)
          : new DesktopLayout(width, height);
    const used = new Set<string>();
    const show = (
      cards: (Card | null)[],
      key: string,
      x: number,
      y: number,
      w: number,
    ) => {
      const step = Math.min(
        w * 0.57,
        (width * 0.72 - w) / Math.max(1, cards.length - 1),
      );
      cards.forEach((c, i) => {
        const id = key.endsWith("-dealer")
          ? `${key}-${i}`
          : (c?.id ?? `${key}-hidden`);
        used.add(id);
        this.card(
          c,
          id,
          x - ((cards.length - 1) * step) / 2 + i * step,
          y,
          w,
          i,
          animate,
        );
      });
    };
    if (view) {
      const dealer = layout.dealer();
      show(
        view.dealer,
        `${state.round?.id}-dealer`,
        dealer.x,
        dealer.y,
        layout.portrait ? 65 : 78,
      );
      for (let p = 0; p < 3; p++) {
        const hands = view.hands.filter((h) => h.position === p);
        if (!hands.length) continue;
        const h =
          hands.find((h) => h.id === view.active) ?? hands[hands.length - 1]!;
        const spot = layout.position(p);
        if (layout.portrait && view.phase === "player") {
          if (h.id !== view.active) continue;
          show(h.cards, h.id, width / 2, 285, 86);
          this.text(
            width / 2,
            367,
            `Position ${p + 1} · ${h.split ? "Split hand" : "Original hand"} · ${evaluate(h.cards, false).total}`,
            16,
          );
        } else {
          show(
            h.cards,
            h.id,
            spot.x,
            spot.y - 20,
            layout.portrait ? 53 : Math.min(76, width / 14),
          );
          this.text(
            spot.x,
            spot.y + 53,
            `${h.outcome ?? evaluate(h.cards, false).total} · ${money(h.stake)} chips`,
            layout.portrait ? 13 : 15,
            h.id === view.active ? "#ffe09b" : "#e6dfcf",
          );
          if (hands.length > 1)
            this.text(
              spot.x,
              spot.y + 75,
              `${hands.indexOf(h) + 1} of ${hands.length} hands`,
              13,
            );
        }
      }
    }
    if (view && state.round) {
      for (const position of state.round.positions) {
        const hands = view.hands.filter((h) => h.position === position.index);
        const shown =
          hands.find((h) => h.id === view.active) ?? hands[hands.length - 1];
        if (!shown) continue;
        const spot = layout.position(position.index);
        if (
          layout.portrait &&
          view.phase === "player" &&
          shown.id !== view.active
        )
          continue;
        const settlementKey = state.round.id + shown.id;
        const settling = !!shown.outcome;
        if (settling && (this.settledVisuals.has(settlementKey) || !animate)) {
          this.settledVisuals.add(settlementKey);
          continue;
        }
        if (settling) this.settledVisuals.add(settlementKey);
        const chips = shown.doubled
          ? [...position.bet.main, ...position.bet.main]
          : position.bet.main;
        const x =
            layout.portrait && view.phase === "player"
              ? width / 2 + 100
              : spot.x + 85,
          y = layout.portrait && view.phase === "player" ? 310 : spot.y + 35;
        chips.slice(-9).forEach((chip, index) => {
          const image = this.add
            .image(x, y - index * 3, `chip-${chip}`)
            .setDisplaySize(36, 36)
            .setDepth(5);
          this.objects.push(image);
          if (settling)
            this.tweens.add({
              targets: image,
              x: (shown.net ?? 0) >= 0 ? width - 25 : 45,
              y: 35,
              alpha: 0,
              duration: useGame.getState().preferences.reducedMotion ? 0 : 180,
              ease: "Cubic.easeIn",
            });
        });
      }
    }
    for (const [id, c] of this.cards)
      if (!used.has(id)) {
        c.destroy();
        this.cards.delete(id);
      }
  }
  render() {
    const store = useGame.getState(),
      s = store.state;
    if (!s || !this.add) return;
    const width = this.scale.width,
      height = this.scale.height,
      p = store.preferences;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    const g = this.add.graphics();
    this.objects.push(g);
    g.fillStyle(0x171e21);
    g.fillRect(0, 0, width, height);
    const felt =
      { green: 0x145044, blue: 0x163b58, burgundy: 0x632e40, black: 0x242b30 }[
        p.theme
      ] ?? 0x145044;
    g.fillStyle(0x514035);
    g.fillEllipse(width / 2, height * 0.32, width * 1.45, height * 1.3);
    g.fillStyle(felt);
    g.fillEllipse(width / 2, height * 0.26, width * 1.4, height * 1.28);
    g.lineStyle(2, 0xc1a570, 0.28);
    g.strokeEllipse(width / 2, height * 0.26, width * 1.3, height * 1.15);
    g.lineStyle(1, 0xffffff, 0.018);
    for (let i = 0; i < height; i += 4) g.lineBetween(0, i, width, i);
    this.text(width / 2, 28, "T R I A L   &   E L I A S", 12, "#d1bd8f");
    const mid = width < 600 ? height * 0.46 : height * 0.39;
    this.text(
      width / 2,
      mid,
      "BLACKJACK PAYS 3 TO 2",
      width < 600 ? 15 : 22,
      "#ddc994",
    );
    this.text(
      width / 2,
      mid + 28,
      "DEALER STANDS ON ALL 17s",
      width < 600 ? 11 : 13,
      "#c2b591",
    );
    this.text(width - 51, 57, "SHOE", 11);
    g.fillStyle(0x18232d);
    g.fillRoundedRect(width - 78, 72, 54, 82, 7);
    g.lineStyle(2, 0xb5a37a, 0.65);
    g.strokeRoundedRect(width - 78, 72, 54, 82, 7);
    g.fillStyle(0xd8d6c9);
    g.fillRect(
      width - 72,
      80,
      42,
      Math.max(3, 63 * (1 - s.shoe.cursor / s.shoe.cards.length)),
    );
    this.text(48, 57, "DISCARDS", 10);
    g.fillStyle(0x18252a);
    g.fillRoundedRect(20, 73, 55, 75, 5);
    g.fillStyle(0x9b9c91);
    g.fillRect(
      28,
      81,
      39,
      Math.max(3, (58 * s.shoe.cursor) / s.shoe.cards.length),
    );
    const layout =
      width < 600
        ? new PortraitLayout(width, height)
        : new DesktopLayout(width, height);
    const betting = !s.round;
    const dropZones: {
      x: number;
      y: number;
      position: number;
      kind: BetKind;
    }[] = [];
    if (betting) {
      for (let position = 0; position < 3; position++) {
        const spot = layout.position(position);
        this.text(
          spot.x,
          spot.y - 61,
          `POSITION ${position + 1}`,
          width < 600 ? 11 : 13,
          "#e7d5b0",
        );
        const kinds: BetKind[] = [
          "main",
          ...(s.rules.pairs ? ["pairs" as const] : []),
          ...(s.rules.three ? ["three" as const] : []),
        ];
        for (const kind of kinds) {
          const x =
              kind === "main"
                ? spot.x
                : spot.x +
                  (kind === "pairs" ? -24 : 24) * (width < 600 ? 1 : 1.6),
            y = kind === "main" ? spot.y : spot.y + 67;
          const rw = kind === "main" ? 70 : 44,
            rh = kind === "main" ? 48 : 37;
          g.lineStyle(1.5, 0xd4bf8c, 0.7);
          g.strokeEllipse(x, y, rw, rh);
          dropZones.push({ x, y, position, kind });
          const zone = this.add
            .zone(x, y, rw, Math.max(44, rh))
            .setInteractive({ useHandCursor: true });
          this.objects.push(zone);
          zone.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (pointer.getDistance() < 8 && !store.busy)
              void dispatch(
                { type: "chip", position, kind, chip: useGame.getState().chip },
                s.revision,
              );
          });
          const chips = s.bets[position]![kind];
          chips.slice(-9).forEach((chip, index) => {
            const image = this.add
              .image(x, y - index * 3, `chip-${chip}`)
              .setDisplaySize(
                kind === "main" ? 43 : 30,
                kind === "main" ? 43 : 30,
              )
              .setDepth(2 + index * 0.01);
            this.objects.push(image);
          });
          this.text(
            x,
            y + (kind === "main" ? 30 : 26),
            `${kind === "main" ? "MAIN" : kind === "pairs" ? "PP" : "21+3"} · ${money(sum(chips))}`,
            kind === "main" ? 13 : 11,
          );
          if (chips.length > 9)
            this.text(x + 20, y - 28, `+${chips.length - 9}`, 11);
        }
      }
      const spacing = Math.min(76, (width - 40) / 5);
      for (let i = 0; i < 5; i++) {
        const chip = [1, 5, 25, 100, 500][i]!,
          x = width / 2 + (i - 2) * spacing,
          y = height - 46;
        const image = this.add
          .image(x, y, `chip-${chip}`)
          .setDisplaySize(57, 57)
          .setInteractive({ draggable: true, useHandCursor: true })
          .setDepth(50);
        this.objects.push(image);
        this.input.setDraggable(image);
        image.on("pointerup", (pointer: Phaser.Input.Pointer) => {
          if (pointer.getDistance() < 8) useGame.setState({ chip });
        });
        const marker = this.add.graphics().setDepth(45);
        this.objects.push(marker);
        image.on(
          "drag",
          (_pointer: Phaser.Input.Pointer, dx: number, dy: number) => {
            image.setPosition(dx, dy);
            marker.clear();
            for (const zone of dropZones) {
              if (zone.kind !== "main" && sum(s.bets[zone.position]!.main) < 20)
                continue;
              const near =
                Phaser.Math.Distance.Between(dx, dy, zone.x, zone.y) < 55;
              marker.lineStyle(
                near ? 3 : 1,
                near ? 0xf4d693 : 0x9fceae,
                near ? 1 : 0.35,
              );
              marker.strokeEllipse(
                zone.x,
                zone.y,
                zone.kind === "main" ? 80 : 48,
                zone.kind === "main" ? 58 : 44,
              );
            }
          },
        );
        image.on("dragend", () => {
          marker.clear();
          const zone = dropZones.find(
            (z) =>
              Phaser.Math.Distance.Between(image.x, image.y, z.x, z.y) <
              (z.kind === "main" ? 43 : 30),
          );
          if (zone)
            void dispatch(
              { type: "chip", position: zone.position, kind: zone.kind, chip },
              s.revision,
            );
          image.setPosition(x, y);
        });
        if (chip === store.chip) {
          g.lineStyle(2, 0xf2d490, 1);
          g.strokeCircle(x, y, 31);
        }
      }
      this.text(
        width / 2,
        height - 8,
        `Drag chips to a spot · ${money(s.balance - pendingTotal(s))} available`,
        11,
        "#d6d1bf",
      );
    }
    const round = s.round;
    this.renderProjection(
      s,
      store.visual ?? (round ? projection(round, s.shoe) : null),
      this.lastRevision >= 0,
    );
    this.lastRevision = s.revision;
    this.lastProjection = store.visual;
    void this.lastProjection;
  }
}
export function createTable(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#145044",
    transparent: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    scene: [TableScene],
    render: { antialias: true, roundPixels: false },
    audio: { noAudio: true },
    input: { activePointers: 3 },
  });
}
