import Phaser from "phaser";
import { textures } from "./textures";
import { useGame } from "../store";
import { projection } from "../engine/engine";
import { tableLayout } from "./layout";
import type { CardPlacement } from "./layout";
export class TableScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private decorations: Phaser.GameObjects.GameObject[] = [];
  private cards = new Map<string, Phaser.GameObjects.Image>();
  private resize = () => this.render();
  constructor() {
    super("Table");
  }
  create() {
    textures(this);
    this.unsubscribe = useGame.subscribe((s, p) => {
      if (
        s.state !== p.state ||
        s.visual !== p.visual ||
        s.preferences !== p.preferences
      )
        this.render();
    });
    this.scale.on("resize", this.resize);
    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      this.scale.off("resize", this.resize);
      this.cards.clear();
    });
    this.render();
  }
  private label(
    x: number,
    y: number,
    text: string,
    size: number,
    color = "#dbc998",
  ) {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "Georgia, serif",
        fontSize: size,
        color,
        align: "center",
      })
      .setOrigin(0.5);
    this.decorations.push(label);
  }
  private card(item: CardPlacement, index: number) {
    const p = useGame.getState().preferences,
      texture = item.card
        ? `${item.card.rank}-${item.card.suit}`
        : `back-${p.cardBack}`;
    let image = this.cards.get(item.key);
    const isNew = !image;
    const duration =
      p.reducedMotion || p.speed === "instant"
        ? 0
        : ({ slow: 300, normal: 160, fast: 55 }[p.speed] ?? 160);
    if (!image) {
      image = this.add.image(this.scale.width - 40, 30, texture);
      this.cards.set(item.key, image);
    }
    const flip = image.texture.key !== texture;
    this.tweens.killTweensOf(image);
    image
      .setDepth(10 + index)
      .setOrigin(0, 0)
      .setDisplaySize(item.width, item.height);
    if (flip && duration) {
      this.tweens.add({
        targets: image,
        displayWidth: 0,
        duration: duration / 2,
        onComplete: () => {
          image!.setTexture(texture);
          this.tweens.add({
            targets: image,
            displayWidth: item.width,
            duration: duration / 2,
          });
        },
      });
    } else image.setTexture(texture);
    if (duration && (isNew || image.x !== item.x || image.y !== item.y))
      this.tweens.add({
        targets: image,
        x: item.x,
        y: item.y,
        duration,
        ease: "Cubic.easeOut",
      });
    else image.setPosition(item.x, item.y);
  }
  render() {
    const store = useGame.getState(),
      s = store.state;
    if (!s || !this.add) return;
    for (const d of this.decorations) d.destroy();
    this.decorations = [];
    const width = this.scale.width,
      height = this.scale.height,
      view = store.visual ?? (s.round ? projection(s.round, s.shoe) : null),
      layout = tableLayout(width, height, s, view, store.preferences.weights);
    const g = this.add.graphics();
    this.decorations.push(g);
    const felt =
      { green: 0x164f43, blue: 0x153d59, burgundy: 0x5d2c40, black: 0x242c30 }[
        store.preferences.theme
      ] ?? 0x164f43;
    g.fillStyle(0x171e21);
    g.fillRoundedRect(0, 0, width, height, 24);
    g.fillStyle(0x42342a);
    g.fillRoundedRect(4, 4, width - 8, height - 8, 24);
    g.fillStyle(felt);
    g.fillRoundedRect(12, 12, width - 24, height - 24, 20);
    g.lineStyle(1, 0xd5b96b, 0.4);
    g.strokeRoundedRect(20, 20, width - 40, height - 40, 16);
    g.lineStyle(1, 0xffffff, 0.018);
    for (let y = 24; y < height - 24; y += 4)
      g.lineBetween(23, y, width - 23, y);
    this.label(
      layout.portrait ? width * 0.31 : width / 2,
      30,
      "TRIAL & ELIAS",
      layout.portrait ? 11 : 13,
    );
    if (!s.round) {
      this.label(
        width / 2,
        layout.markY,
        "BLACKJACK PAYS 3 TO 2",
        layout.portrait ? 13 : 20,
      );
      if (!layout.portrait)
        this.label(
          width / 2,
          layout.markY + 23,
          "DEALER STANDS ON ALL 17s",
          12,
        );
    }
    const short = height < 430;
    const shoeX = short ? 101 : layout.portrait ? width - 47 : width - 70,
      shoeY = short ? height - 85 : 78;
    g.fillStyle(0x15232a);
    g.fillRoundedRect(shoeX - 18, shoeY - 7, 36, 60, 5);
    g.fillStyle(0xdcd9cc);
    g.fillRect(
      shoeX - 13,
      shoeY,
      26,
      Math.max(3, 45 * (1 - s.shoe.cursor / s.shoe.cards.length)),
    );
    g.fillStyle(0x12272a);
    const discardX = short ? 28 : width - (layout.portrait ? 110 : 145);
    g.fillRoundedRect(discardX, short ? height - 92 : 71, 35, 60, 5);
    g.fillStyle(0x8b958d);
    g.fillRect(
      discardX + 5,
      short ? height - 84 : 79,
      25,
      Math.max(3, (44 * s.shoe.cursor) / s.shoe.cards.length),
    );
    g.lineStyle(1, 0xd5b96b, 0.4);
    g.strokeEllipse(layout.collection.x, layout.collection.y, 54, 24);
    this.label(layout.collection.x, layout.collection.y, "DEALER", 8);
    const used = new Set<string>();
    for (const [index, item] of [
      ...layout.dealer,
      ...layout.hands.flatMap((h) => h.cards),
    ].entries()) {
      used.add(item.key);
      this.card(item, index);
    }
    for (const [key, image] of this.cards)
      if (!used.has(key)) {
        image.destroy();
        this.cards.delete(key);
      }
    for (const spot of layout.spots)
      if (!s.round) {
        g.lineStyle(1, 0xcdbb86, 0.5);
        g.strokeEllipse(
          spot.x + spot.width / 2,
          spot.y + spot.height / 2,
          spot.width - 5,
          spot.height - 8,
        );
      }
  }
}
export function createTable(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#122923",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    scene: [TableScene],
    render: { antialias: true },
    audio: { noAudio: true },
  });
}
