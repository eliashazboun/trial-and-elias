import Phaser from "phaser";
import { C, WEAPONS } from "../config";
import {
  EXIT,
  FLOOR,
  HEIGHT,
  ROOMS,
  SECRETS,
  START,
  SWITCHES,
  TRAPS,
  WIDTH,
  roomAt,
  tileAt,
  trapPhase,
} from "../maps/dungeon01";
import type { Settings } from "../../storage/schemas";
import type { SimEvent, Vec } from "../types";
import type { Simulation } from "../systems/Simulation";
import {
  COSMETIC_STYLE,
  ghostTint,
  trailTint,
  swordTint,
} from "./CosmeticStyle";
import { createSprites } from "./SpriteFactory";
interface Particle extends Vec {
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: number;
}
export class DungeonRenderer {
  private guardianLabel: Phaser.GameObjects.Text;
  private refundPopups: { text: Phaser.GameObjects.Text; life: number }[] = [];
  private world: Phaser.GameObjects.Graphics;
  private objects: Phaser.GameObjects.Graphics;
  private effects: Phaser.GameObjects.Graphics;
  private player: Phaser.GameObjects.Image;
  private ghost: Phaser.GameObjects.Image;
  private enemies: Phaser.GameObjects.Image[] = [];
  private particles: Particle[] = [];
  private trails: { x: number; y: number; life: number }[] = [];
  private previousTick = -1;
  private torchPoints: Vec[] = [];
  private background: Phaser.GameObjects.RenderTexture;
  constructor(private readonly scene: Phaser.Scene) {
    createSprites(scene);
    this.guardianLabel = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "7px",
        color: "#e1d3ff",
        backgroundColor: "#151c2a",
        align: "center",
        padding: { x: 5, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6)
      .setVisible(false);
    scene.cameras.main.setBounds(0, 0, WIDTH * C.tile, HEIGHT * C.tile);
    scene.cameras.main.setZoom(2);
    this.world = scene.add.graphics();
    this.buildWorld();
    this.background = scene.add
      .renderTexture(0, 0, WIDTH * C.tile, HEIGHT * C.tile)
      .setOrigin(0)
      .draw(this.world)
      .setDepth(-10);
    this.world.destroy();
    this.objects = scene.add.graphics().setDepth(1);
    this.effects = scene.add.graphics().setDepth(5);
    this.player = scene.add
      .image(START.x, START.y, "ember-0")
      .setDepth(4)
      .setOrigin(0.5, 0.7);
    this.ghost = scene.add
      .image(0, 0, "ivory-0")
      .setDepth(3)
      .setOrigin(0.5, 0.7)
      .setTint(COSMETIC_STYLE.ghostCyan)
      .setAlpha(COSMETIC_STYLE.ghostAlpha)
      .setVisible(false);
    scene.cameras.main.startFollow(this.player, true, 0.14, 0.14);
  }
  private buildWorld(): void {
    const g = this.world;
    g.fillStyle(0x101724).fillRect(0, 0, WIDTH * C.tile, HEIGHT * C.tile);
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++) {
        const px = x * C.tile,
          py = y * C.tile,
          n = (x * 31 + y * 17) % 7;
        if (tileAt(x, y)) {
          const room = ROOMS.find(
            (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
          );
          const base = room?.color ?? 0x293441;
          g.fillStyle(base).fillRect(px, py, 24, 24);
          g.fillStyle(0x000000, 0.12)
            .fillRect(px, py, 24, 1)
            .fillRect(px, py, 1, 24);
          g.fillStyle(0x82909c, 0.08).fillRect(px + 2, py + 2, 20, 1);
          if (n < 3)
            g.fillStyle(0x111c28, 0.3)
              .fillRect(px + 5 + n * 3, py + 7 + n * 2, 3, 1)
              .fillRect(px + 8 + n * 3, py + 8 + n * 2, 1, 3);
          if (n === 4)
            g.fillStyle(0x617078, 0.16).fillRect(px + 18, py + 17, 2, 2);
        } else if (
          [
            [0, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
          ].some(([dx, dy]) => tileAt(x + dx!, y + dy!))
        ) {
          g.fillStyle(0x161e2d).fillRect(px, py, 24, 24);
          g.fillStyle(0x455060).fillRect(px + 1, py + 1, 22, 9);
          g.fillStyle(0x333f50).fillRect(px + 1, py + 12, 22, 10);
          g.fillStyle(0x5b6674, 0.5).fillRect(px + 1, py + 1, 22, 2);
          if (tileAt(x, y + 1)) {
            g.fillStyle(0x69717d).fillRect(px, py + 19, 24, 3);
            g.fillStyle(0x0b111b, 0.5).fillRect(px, py + 23, 24, 3);
          }
        }
      }
    for (const r of ROOMS) {
      const x = r.x * 24,
        y = r.y * 24,
        w = r.w * 24,
        h = r.h * 24;
      for (const side of [0, 1]) {
        const tx = x + 24 + (w - 48) * side,
          ty = y + 24;
        this.torchPoints.push({ x: tx, y: ty });
        g.fillStyle(0x0d1720, 0.6).fillRect(tx - 4, ty - 1, 8, 14);
        g.fillStyle(0x9b7850).fillRect(tx - 2, ty + 2, 4, 9);
      }
      if (r.landmark === "books")
        for (let i = 0; i < 6; i++) {
          g.fillStyle(0x2b202d).fillRect(x + 24 + i * 36, y + 2, 32, 13);
          for (let b = 0; b < 6; b++)
            g.fillStyle(
              [0x815c4c, 0x438982, 0x78659a, 0xb19c67][b % 4]!,
            ).fillRect(x + 26 + i * 36 + b * 5, y + 3, 3, 10);
        }
      if (r.landmark === "bones")
        for (let i = 0; i < 5; i++) {
          g.fillStyle(0x1b2431).fillRect(x + 30 + i * 56, y + 3, 24, 32);
          g.fillStyle(0x7b8588).fillRect(x + 33 + i * 56, y + 7, 18, 23);
          g.fillStyle(0xb8b29d).fillRect(x + 38 + i * 56, y + 11, 8, 5);
        }
      if (r.landmark === "ritual") {
        g.lineStyle(1, 0x935f98, 0.7)
          .strokeCircle(x + w * 0.5, y + h * 0.5, 55)
          .strokeCircle(x + w * 0.5, y + h * 0.5, 65);
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5;
          const b = ((i + 2) * Math.PI * 2) / 5;
          g.lineBetween(
            x + w * 0.5 + Math.cos(a) * 55,
            y + h * 0.5 + Math.sin(a) * 55,
            x + w * 0.5 + Math.cos(b) * 55,
            y + h * 0.5 + Math.sin(b) * 55,
          );
        }
      }
      if (r.landmark === "armory")
        for (let i = 0; i < 5; i++) {
          g.fillStyle(0x73555c).fillRect(x + 36 + i * 42, y + 4, 24, 12);
          g.fillStyle(0xb8c1c7).fillRect(x + 47 + i * 42, y + 3, 2, 16);
          g.fillStyle(0xb18d61).fillRect(x + 42 + i * 42, y + 14, 12, 2);
        }
      if (r.landmark === "entrance") {
        g.lineStyle(1, 0x718392, 0.4)
          .strokeCircle(START.x, START.y, 36)
          .strokeCircle(START.x, START.y, 42);
        g.fillStyle(0x654357, 0.5).fillRect(x + w * 0.5 - 18, y + 4, 36, 65);
      }
      if (r.landmark === "junction") {
        g.lineStyle(2, 0x8c8160, 0.4)
          .lineBetween(x + w * 0.5, y + 32, x + w * 0.5, y + h - 32)
          .lineBetween(x + 32, y + h * 0.5, x + w - 32, y + h * 0.5);
      }
      const text = this.scene.add
        .text(x + 12, y + h - 18, r.name.toUpperCase(), {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#91a1ac",
        })
        .setAlpha(0.48);
      text.setDepth(0);
    }
  }
  event(event: SimEvent, settings: Settings): void {
    if (event.type === "loot") {
      const text = this.scene.add
        .text(
          event.x,
          event.y - 22,
          event.detail?.split(" · ")[1]?.replace(" refund", "") ??
            "TIME REFUND",
          {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#a7f1cf",
            backgroundColor: "#172630",
            padding: { x: 4, y: 3 },
          },
        )
        .setOrigin(0.5)
        .setDepth(8);
      this.refundPopups.push({ text, life: 1.1 });
    }
    if (settings.reduced) return;
    const colors: Partial<Record<SimEvent["type"], number>> = {
      key: 0xffd881,
      switch: 0x83e4c0,
      kill: 0xc88a9a,
      impact: 0xffedbb,
      death: 0xed7b88,
      secret: 0xbba4da,
      loot: 0xf5ca7d,
      "guardian-vulnerable": 0x91e5bc,
      escape: 0x83e4c0,
    };
    const color = colors[event.type];
    if (color)
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12;
        this.particles.push({
          x: event.x,
          y: event.y,
          vx: Math.cos(a) * (15 + (i % 3) * 14),
          vy: Math.sin(a) * (15 + (i % 3) * 14),
          life: 0.45,
          max: 0.45,
          color,
        });
      }
    if (this.particles.length > 160)
      this.particles.splice(0, this.particles.length - 160);
    if (settings.shake && (event.type === "death" || event.type === "impact"))
      this.scene.cameras.main.shake(event.type === "death" ? 130 : 45, 0.002);
  }
  reset(): void {
    this.previousTick = -1;
    this.refundPopups.forEach((p) => p.text.destroy());
    this.refundPopups = [];
    this.particles = [];
    this.trails = [];
    this.scene.cameras.main.stopFollow();
    this.scene.cameras.main.startFollow(this.player, true, 0.14, 0.14);
  }
  draw(
    sim: Simulation,
    alpha: number,
    delta: number,
    settings: Settings,
    ghostPosition?: Vec,
  ): void {
    const s = sim.state,
      p = s.player,
      g = this.objects,
      effects = this.effects;
    g.clear();
    effects.clear();
    this.background.setVisible(true);
    for (const popup of this.refundPopups) {
      popup.life -= delta;
      popup.text.y -= delta * 16;
      popup.text.setAlpha(Math.min(1, Math.max(0, popup.life * 2)));
      if (popup.life <= 0) popup.text.destroy();
    }
    this.refundPopups = this.refundPopups.filter((p) => p.life > 0);
    const boss = s.enemies.find((e) => e.kind === "guardian" && e.hp > 0);
    this.guardianLabel.setVisible(!!boss && s.bossShielded);
    if (boss && s.bossShielded) {
      this.guardianLabel.setPosition(boss.x, boss.y - 70);
      const warning =
        "SLAY ALL OTHER ENEMIES FIRST\nEnemies remaining: " +
        s.enemies.filter((e) => e.kind !== "guardian" && e.hp > 0).length +
        "\nSTRIKING THE SHIELD IS FATAL";
      if (this.guardianLabel.text !== warning)
        this.guardianLabel.setText(warning);
    }
    this.player
      .setPosition(
        Phaser.Math.Linear(p.previousX, p.x, alpha),
        Phaser.Math.Linear(p.previousY, p.y, alpha),
      )
      .setTexture(`${settings.skin}-${Math.floor(s.tick / 18) % 2}`);
    if (!["ember", "jade", "violet", "ivory"].includes(settings.skin))
      this.player.setTexture("ember-0");
    this.player
      .setFlipX(Math.cos(p.facing) < -0.1)
      .setAlpha(s.status === "dead" ? 0.35 : 1)
      .setTint(sim.invulnerable ? 0xb6f4fa : 0xffffff);
    this.ghost.setVisible(!!ghostPosition && settings.ghost);
    if (ghostPosition)
      this.ghost
        .setPosition(ghostPosition.x, ghostPosition.y)
        .setTint(ghostTint(settings.ghostColor));
    g.fillStyle(0x080e19, 0.45).fillEllipse(p.x, p.y + 5, 17, 7);
    for (const t of TRAPS) {
      const phase = trapPhase(t, s.tick),
        x = t.x - t.w / 2,
        y = t.y - t.h / 2;
      if (t.kind === "pit") {
        g.fillStyle(0x080e17).fillRect(x, y, t.w, t.h);
        g.lineStyle(2, 0x626577).strokeRect(x, y, t.w, t.h);
        g.lineStyle(1, 0x24263a).strokeRect(x + 4, y + 4, t.w - 8, t.h - 8);
        continue;
      }
      g.fillStyle(
        phase === "active"
          ? 0x773f4a
          : phase === "warning"
            ? 0x725b35
            : 0x1b2632,
      ).fillRect(x, y, t.w, t.h);
      g.lineStyle(
        1,
        phase === "active"
          ? 0xec9a83
          : phase === "warning"
            ? 0xe5bf73
            : 0x576477,
      ).strokeRect(x, y, t.w, t.h);
      for (let i = 0; i < Math.max(1, Math.floor(t.w / 12)); i++)
        for (let j = 0; j < Math.max(1, Math.floor(t.h / 12)); j++) {
          const sx = x + 6 + i * 12,
            sy = y + 6 + j * 12;
          if (t.kind === "fire") {
            g.fillStyle(phase === "active" ? 0xba8df4 : 0x55476c).fillTriangle(
              sx - 4,
              sy + 5,
              sx + 4,
              sy + 5,
              sx,
              sy - (phase === "active" ? 11 : 1),
            );
          } else if (t.kind === "blade") {
            g.lineStyle(1, phase === "active" ? 0xf6c5b2 : 0x677487)
              .strokeCircle(sx, sy, 4)
              .lineBetween(sx - 5, sy, sx + 5, sy)
              .lineBetween(sx, sy - 5, sx, sy + 5);
          } else {
            g.fillStyle(phase === "active" ? 0xf6c5b2 : 0x5b6776).fillTriangle(
              sx - 3,
              sy + 4,
              sx + 3,
              sy + 4,
              sx,
              sy - (phase === "active" ? 5 : 0),
            );
          }
        }
    }
    for (const secret of SECRETS)
      if (!s.secrets.includes(secret.id)) {
        g.fillStyle(secret.id === "bookshelf" ? 0x705852 : 0x596274).fillRect(
          secret.x - 12,
          secret.y - 12,
          24,
          24,
        );
        g.lineStyle(1, 0xc6ae91, 0.7)
          .lineBetween(secret.x - 3, secret.y - 10, secret.x + 2, secret.y - 2)
          .lineBetween(secret.x + 2, secret.y - 2, secret.x - 3, secret.y + 7);
      }
    // Gold key and cyan seals are readable even with effects disabled.
    if (!s.hasKey) {
      const k = s.key;
      g.fillStyle(0xf7d384, 0.08).fillCircle(k.x, k.y, 20);
      g.lineStyle(2, 0xffd88c).strokeCircle(k.x - 3, k.y - 4, 4);
      g.fillStyle(0xffd88c)
        .fillRect(k.x, k.y, 3, 12)
        .fillRect(k.x, k.y + 6, 7, 3);
    }
    SWITCHES.forEach((pos, i) => {
      const on = s.switches[i];
      g.fillStyle(0x111e2b).fillRect(pos.x - 10, pos.y - 12, 20, 24);
      g.lineStyle(1, on ? 0x88e2bd : 0xc6ac7e).strokeRect(
        pos.x - 10,
        pos.y - 12,
        20,
        24,
      );
      g.fillStyle(on ? 0x88e2bd : 0xc6ac7e).fillRect(
        pos.x - 2,
        pos.y - 7,
        4,
        14,
      );
      if (on) g.fillRect(pos.x - 7, pos.y - 2, 14, 4);
    });
    for (const item of s.loot)
      if (!item.collected) {
        g.fillStyle(0xeac680)
          .fillTriangle(
            item.x,
            item.y - 5,
            item.x + 4,
            item.y,
            item.x,
            item.y + 5,
          )
          .fillTriangle(
            item.x,
            item.y - 5,
            item.x - 4,
            item.y,
            item.x,
            item.y + 5,
          );
      }
    for (const item of s.weapons)
      if (!item.collected) {
        g.fillStyle(WEAPONS[item.weapon].color, 0.15).fillCircle(
          item.x,
          item.y,
          13,
        );
        g.fillStyle(WEAPONS[item.weapon].color)
          .fillRect(item.x - 1, item.y - 9, 3, 14)
          .fillRect(item.x - 5, item.y + 3, 11, 2);
      }
    g.fillStyle(s.gateOpen ? 0x244e48 : 0x433442).fillRect(
      51 * 24,
      36 * 24,
      24,
      72,
    );
    for (let i = 0; i < 4; i++)
      g.fillStyle(s.gateOpen ? 0x89e6bd : 0x9b7780).fillRect(
        51 * 24 + 3 + i * 5,
        36 * 24 + 4,
        2,
        s.gateOpen ? 8 : 64,
      );
    g.lineStyle(2, s.gateOpen ? 0x8ae9bd : 0x8c7082).strokeCircle(
      EXIT.x,
      EXIT.y,
      17,
    );
    s.enemies.forEach((enemy, index) => {
      let image = this.enemies[index];
      if (!image) {
        image = this.scene.add
          .image(enemy.x, enemy.y, `${enemy.kind}-0`)
          .setOrigin(0.5, 0.7)
          .setDepth(3);
        this.enemies[index] = image;
      }
      image
        .setVisible(enemy.hp > 0)
        .setPosition(enemy.x, enemy.y)
        .setTexture(`${enemy.kind}-${Math.floor(s.tick / 22) % 2}`)
        .setFlipX(Math.cos(enemy.angle) < 0);
      if (enemy.hp <= 0) return;
      const r =
        enemy.kind === "guardian" ? 46 : enemy.kind === "hound" ? 22 : 24;
      if (enemy.phase === "windup" || enemy.phase === "attack") {
        const color = enemy.phase === "attack" ? 0xff857e : 0xf7c27b;
        g.lineStyle(1, color, 0.9).strokeCircle(enemy.x, enemy.y, r);
        g.fillStyle(color, 0.09)
          .slice(enemy.x, enemy.y, r, enemy.angle - 0.8, enemy.angle + 0.8)
          .fillPath();
        g.lineStyle(1, color, 0.8).lineBetween(
          enemy.x,
          enemy.y,
          enemy.x + Math.cos(enemy.angle) * r,
          enemy.y + Math.sin(enemy.angle) * r,
        );
      }
      if (enemy.kind === "guardian") {
        image.setTint(s.bossShielded ? 0xbca7ff : 0xffffff);
        if (s.bossShielded) {
          g.fillStyle(0x9f8ce1, 0.16).fillCircle(enemy.x, enemy.y, 19);
          g.lineStyle(2, 0xc2adff, 0.95).strokeCircle(enemy.x, enemy.y, 19);
          g.lineStyle(1, 0xe5d9ff).strokeCircle(enemy.x, enemy.y, 22);
          g.fillStyle(0xd6c4ff).fillRect(enemy.x - 2, enemy.y - 28, 4, 5);
        }
        for (let hp = 0; hp < 4; hp++)
          g.fillStyle(hp < enemy.hp ? 0xf1bf85 : 0x49424c).fillRect(
            enemy.x - 11 + hp * 6,
            enemy.y - 20,
            4,
            2,
          );
        if (enemy.phase !== "recovery")
          g.lineStyle(2, 0xc5c6d3)
            .beginPath()
            .arc(enemy.x, enemy.y, 12, enemy.angle - 0.8, enemy.angle + 0.8)
            .strokePath();
        else g.lineStyle(1, 0x83e4bd).strokeCircle(enemy.x, enemy.y, 12);
      }
    });
    for (const b of s.projectiles)
      if (b.active) {
        g.fillStyle(0xc68df1, 0.2).fillCircle(b.x, b.y, 8);
        g.fillStyle(0xe5b9ff).fillRect(b.x - 3, b.y - 3, 6, 6);
      }
    const attackAge = s.tick - p.attackAt;
    if (attackAge < C.swordActiveTicks) {
      const w = WEAPONS[p.weapon],
        a = p.attackAngle;
      g.fillStyle(w.color, 0.1)
        .slice(
          p.x,
          p.y,
          w.range,
          a - (Math.PI * C.swordArcDegrees) / 360,
          a + (Math.PI * C.swordArcDegrees) / 360,
        )
        .fillPath();
      g.lineStyle(2, swordTint(settings.sword, w.color), 0.9)
        .beginPath()
        .arc(p.x, p.y, w.range, a - 0.87, a + 0.87)
        .strokePath();
      const angle = a - 0.87 + (attackAge / C.swordActiveTicks) * 1.74;
      g.lineBetween(
        p.x + Math.cos(angle) * 10,
        p.y + Math.sin(angle) * 10,
        p.x + Math.cos(angle) * w.range,
        p.y + Math.sin(angle) * w.range,
      );
    }
    if (!settings.reduced) {
      if (sim.dashing && this.previousTick !== s.tick)
        this.trails.push({
          x: p.x,
          y: p.y,
          life: COSMETIC_STYLE.trailFadeSeconds,
        });
      for (const t of this.trails) {
        t.life -= delta;
        effects
          .fillStyle(trailTint(settings.trail), Math.max(0, t.life) * 2)
          .fillRect(t.x - 5, t.y - 10, 10, 15);
      }
      this.trails = this.trails.filter((t) => t.life > 0);
      for (const particle of this.particles) {
        particle.life -= delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        effects
          .fillStyle(particle.color, Math.max(0, particle.life / particle.max))
          .fillRect(particle.x, particle.y, 2, 2);
      }
      this.particles = this.particles.filter((p) => p.life > 0);
    }
    for (const torch of this.torchPoints) {
      const flicker = settings.reduced
        ? 0
        : Math.sin(this.scene.time.now * 0.008 + torch.x) * 1.5;
      g.fillStyle(0xffb86e, 0.025)
        .fillCircle(torch.x, torch.y, 45)
        .fillCircle(torch.x, torch.y, 30);
      g.fillStyle(0xe18c61).fillRect(torch.x - 2, torch.y - 4, 5, 7);
      g.fillStyle(0xffdb93).fillRect(torch.x - 1, torch.y - 5 + flicker, 3, 6);
    }
    this.previousTick = s.tick;
  }
  aim(clientX: number, clientY: number, sim: Simulation): number {
    const bounds = this.scene.game.canvas.getBoundingClientRect(),
      camera = this.scene.cameras.main;
    const world = camera.getWorldPoint(
      ((clientX - bounds.left) * this.scene.scale.width) / bounds.width,
      ((clientY - bounds.top) * this.scene.scale.height) / bounds.height,
    );
    return Math.atan2(
      world.y - sim.state.player.y,
      world.x - sim.state.player.x,
    );
  }
  get room(): string {
    return roomAt(this.player)?.name ?? "Crypt corridor";
  }
  minimap(canvas: HTMLCanvasElement, sim: Simulation): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = canvas.width / WIDTH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++)
        if (FLOOR[y * WIDTH + x]) {
          ctx.fillStyle = "#364756";
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    const marker = (p: Vec, color: string, size: number) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        (p.x / 24) * scale - size / 2,
        (p.y / 24) * scale - size / 2,
        size,
        size,
      );
    };
    SWITCHES.forEach((p, i) =>
      marker(p, sim.state.switches[i] ? "#87dfb8" : "#d6ae78", 4),
    );
    if (!sim.state.hasKey) marker(sim.state.key, "#ffd486", 4);
    marker(EXIT, sim.state.gateOpen ? "#87dfb8" : "#b88092", 5);
    marker(sim.state.player, "#ffffff", 5);
  }
}
