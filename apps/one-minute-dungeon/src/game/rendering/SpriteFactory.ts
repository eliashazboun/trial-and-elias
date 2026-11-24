import type Phaser from "phaser";
import { PALETTES, paintSprite } from "./SpriteArt";
export function createSprites(scene: Phaser.Scene): void {
  for (const name of Object.keys(PALETTES))
    for (let frame = 0; frame < 2; frame++) {
      const texture = scene.textures.createCanvas(name + "-" + frame, 16, 20)!;
      paintSprite(texture.context, name, frame);
      texture.refresh();
    }
}
