import Phaser from "phaser";
import { DungeonRenderer } from "../rendering/DungeonRenderer";
import type { DungeonGame } from "../Game";
export class DungeonScene extends Phaser.Scene {
  dungeonView!: DungeonRenderer;
  constructor(private readonly controller: DungeonGame) {
    super("Dungeon");
  }
  create(): void {
    this.dungeonView = new DungeonRenderer(this);
    this.controller.attach(this);
  }
  update(time: number, delta: number): void {
    if (this.dungeonView) this.controller.frame(time, delta);
  }
}
