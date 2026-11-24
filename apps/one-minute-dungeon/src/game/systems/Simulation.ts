import { C, WEAPONS, ENEMY_STATS, type Weapon } from "../config";
import {
  ENEMY_SPOTS,
  EXIT,
  GUARDIAN,
  KEY_SPOTS,
  LOOT_SPOTS,
  LOOT_ALTERNATES,
  SECRETS,
  START,
  SWITCHES,
  TRAPS,
  WEAPON_SPOTS,
  WIDTH,
  HEIGHT,
  at,
  insideRect,
  trapPhase,
} from "../maps/dungeon01";
import type {
  Enemy,
  EnemyKind,
  InputFrame,
  RunOptions,
  RunState,
  SimEvent,
  Vec,
} from "../types";
import {
  angleDifference,
  collides,
  distance,
  isSolid,
  lineClear,
  move,
} from "./CollisionSystem";
import { Random } from "./RandomSystem";
import { assertDungeon } from "../maps/validation";
import {
  collectDiamond,
  diamondRoute,
  enemiesRemaining,
  rankedTicks,
} from "./TimerSystem";
export function quantizeInput(input: InputFrame): InputFrame {
  const aim = Number.isFinite(input.aim) ? input.aim : 0;
  return {
    mx: Math.sign(input.mx || 0),
    my: Math.sign(input.my || 0),
    aim: Math.round(aim * 4096) / 4096,
    attack: !!input.attack,
    dash: !!input.dash,
    interact: !!input.interact,
  };
}
export function createEnemy(id: number, kind: EnemyKind, p: Vec): Enemy {
  return {
    ...p,
    id,
    kind,
    hp: ENEMY_STATS[kind].hp,
    phase: "idle",
    until: 0,
    angle: Math.PI / 2,
    dx: 0,
    dy: 0,
    hit: false,
    born: 0,
  };
}
export class Simulation {
  readonly state: RunState;
  readonly events: SimEvent[] = [];
  constructor(readonly options: RunOptions) {
    assertDungeon();
    if (options.category !== "fixed" || options.challenge !== "standard")
      throw Error("Only the standard game mode is supported.");
    const random = new Random(options.seed),
      kinds: EnemyKind[] = ["skeleton", "cultist", "hound", "skeleton"];
    const key = { ...KEY_SPOTS[random.int(KEY_SPOTS.length)]! };
    const enemies = ENEMY_SPOTS.map((p, id) =>
      createEnemy(id, kinds[(id + random.int(3)) % kinds.length]!, p),
    );
    // Guarantee every encounter class is represented, independently of curated variation.
    enemies[0]!.kind = "skeleton";
    enemies[0]!.hp = 1;
    enemies[1]!.kind = "cultist";
    enemies[1]!.hp = 1;
    enemies[2]!.kind = "hound";
    enemies[2]!.hp = 2;
    enemies.push(createEnemy(4, "guardian", GUARDIAN));
    const weaponKinds: Weapon[] = ["dagger", "heavy", "spectral", "cursed"];
    this.state = {
      tick: 0,
      status: "running",
      cause: "",
      valid: true,
      invalidReasons: [],
      player: {
        ...START,
        previousX: START.x,
        previousY: START.y,
        facing: -Math.PI / 2,
        dashAt: -1000,
        dashReady: 0,
        dashX: 0,
        dashY: -1,
        attackAt: -1000,
        attackReady: 0,
        attackAngle: 0,
        hitIds: [],
        weapon: "sword",
        weaponUntil: 0,
      },
      key,
      hasKey: false,
      switches: [false, false, false],
      gateOpen: false,
      enemies,
      projectiles: [],
      loot: LOOT_SPOTS.map((p, id) => ({
        ...(random.int(2) ? LOOT_ALTERNATES[id]! : p),
        id,
        collected: false,
      })),
      weapons: WEAPON_SPOTS.map((p, id) => ({
        ...p,
        id,
        collected: false,
        weapon: weaponKinds[random.int(weaponKinds.length)]!,
      })),
      kills: 0,
      lootCount: 0,
      refundTicks: 0,
      combo: 0,
      maxCombo: 0,
      lastDiamondTick: -1,
      diamondEvents: [],
      bossShielded: true,
      splits: [],
      secrets: [],
      dashDodges: 0,
      usedWeapon: false,
    };
  }
  invalidate(reason: string): void {
    this.state.valid = false;
    if (!this.state.invalidReasons.includes(reason))
      this.state.invalidReasons.push(reason);
  }
  get invulnerable(): boolean {
    const age = this.state.tick - this.state.player.dashAt;
    return age >= C.invulnerableStart && age < C.invulnerableEnd;
  }
  get dashing(): boolean {
    return this.state.tick - this.state.player.dashAt < C.dashTicks;
  }
  emit(type: SimEvent["type"], p: Vec, detail?: string): void {
    this.events.push({ type, ...p, detail });
  }
  split(id: string): void {
    if (!this.state.splits.some((s) => s.id === id))
      this.state.splits.push({
        id,
        tick: this.state.tick,
        refundTicks: this.state.refundTicks,
        rankedTicks: rankedTicks(this.state),
        diamondRoute: diamondRoute(this.state),
      });
  }
  die(cause: string): void {
    if (this.state.status !== "running") return;
    this.state.status = "dead";
    this.state.cause = cause;
    this.emit("death", this.state.player, cause);
  }
  damage(cause: string): void {
    if (this.invulnerable) {
      this.state.dashDodges++;
      return;
    }
    this.die(cause);
  }
  step(raw: InputFrame): void {
    const s = this.state,
      p = s.player;
    this.events.length = 0;
    if (s.status !== "running") return;
    try {
      const input = quantizeInput(raw);
      if (s.combo > 0 && s.tick + 1 - s.lastDiamondTick > C.comboTicks)
        s.combo = 0;
      p.previousX = p.x;
      p.previousY = p.y;
      s.tick++;
      // Deadline wins over every interaction on the deadline tick.
      if (rankedTicks(s) >= C.deadline) {
        this.die("Time expired");
        return;
      }
      if ([5400, 6000, 6600, 6720, 6840, 6960, 7080].includes(rankedTicks(s)))
        this.emit("warning", p);
      if (p.weapon === "cursed" && s.tick >= p.weaponUntil) p.weapon = "sword";
      if (s.tick === p.dashReady && p.dashReady > 0) this.emit("ready", p);
      const length = Math.hypot(input.mx, input.my);
      if (length > 0 && !this.dashing)
        p.facing = Math.atan2(input.my, input.mx);
      if (input.dash && s.tick >= p.dashReady) {
        p.dashAt = s.tick;
        p.dashReady = s.tick + C.dashCooldown;
        p.dashX = length ? input.mx / length : Math.cos(p.facing);
        p.dashY = length ? input.my / length : Math.sin(p.facing);
        this.emit("dash", p);
      }
      const speed = this.dashing ? C.dashSpeed : C.speed;
      move(
        p,
        (this.dashing ? p.dashX : length ? input.mx / length : 0) *
          speed *
          C.dt,
        (this.dashing ? p.dashY : length ? input.my / length : 0) *
          speed *
          C.dt,
        C.radius,
        s.secrets,
      );
      if (input.attack && s.tick >= p.attackReady) {
        p.attackAt = s.tick;
        p.attackReady = s.tick + WEAPONS[p.weapon].cooldown;
        p.attackAngle = input.aim;
        p.hitIds.length = 0;
        this.emit("swing", p);
      }
      this.releaseGuardian();
      this.sword();
      if (s.status !== "running") return;
      this.releaseGuardian();
      for (const enemy of s.enemies) {
        if (s.status !== "running") break;
        this.enemyStep(enemy);
      }
      this.projectiles();
      for (const trap of TRAPS) {
        if (s.status !== "running") break;
        if (
          !insideRect(p, trap, C.radius - 2) ||
          trapPhase(trap, s.tick) !== "active"
        )
          continue;
        if (trap.kind === "pit") {
          if (!this.dashing) this.die("Fell into the collapsed pit");
        } else
          this.damage(
            trap.kind === "blade"
              ? "Swinging blade"
              : trap.kind === "fire"
                ? "Arcane flame"
                : "Floor spikes",
          );
      }
      if (s.status !== "running") return;
      if (!s.hasKey && distance(p, s.key) < 17) {
        s.hasKey = true;
        this.split("key");
        this.emit("key", s.key);
      }
      for (const loot of s.loot)
        if (!loot.collected && distance(p, loot) < 16) {
          loot.collected = true;
          s.lootCount++;
          const refund = collectDiamond(s, loot.id);
          this.emit(
            "loot",
            loot,
            `Diamond ×${refund.combo} · +${(refund.appliedTicks / C.hz).toFixed(2)}s refund`,
          );
        }
      for (const pickup of s.weapons) {
        if (!pickup.collected && distance(p, pickup) < 16) {
          pickup.collected = true;
          p.weapon = pickup.weapon;
          p.weaponUntil = s.tick + 1200;
          s.usedWeapon = true;
          this.emit("weapon", p, WEAPONS[p.weapon].name);
        }
      }
      if (input.interact)
        for (let i = 0; i < SWITCHES.length; i++) {
          if (
            s.switches[i] ||
            distance(p, SWITCHES[i]!) > C.interactionRange ||
            !lineClear(p, SWITCHES[i]!, s.secrets)
          )
            continue;
          if (
            i === 2 &&
            s.enemies.some((e) => e.kind === "guardian" && e.hp > 0)
          )
            continue;
          s.switches[i] = true;
          this.split(`switch-${i + 1}`);
          this.emit("switch", SWITCHES[i]!);
        }
      const guardianDead = s.enemies.every(
        (e) => e.kind !== "guardian" || e.hp <= 0,
      );
      if (
        !s.gateOpen &&
        s.hasKey &&
        s.switches.every(Boolean) &&
        guardianDead &&
        !s.bossShielded
      ) {
        s.gateOpen = true;
        s.secrets.push("gate-open");
        this.emit("unlock", EXIT);
      }
      if (s.gateOpen && distance(p, EXIT) < 19) {
        s.status = "won";
        this.split("exit");
        this.emit("escape", p);
      }
    } finally {
      this.snapState();
    }
  }
  private snapState(): void {
    const q = (n: number) => Math.round(n * 65536) / 65536;
    const angle = (n: number) => Math.round(n * 4096) / 4096;
    const p = this.state.player;
    p.x = q(p.x);
    p.y = q(p.y);
    p.facing = angle(p.facing);
    p.dashX = q(p.dashX);
    p.dashY = q(p.dashY);
    for (const e of this.state.enemies) {
      e.x = q(e.x);
      e.y = q(e.y);
      e.dx = q(e.dx);
      e.dy = q(e.dy);
      e.angle = angle(e.angle);
    }
    for (const b of this.state.projectiles) {
      b.x = q(b.x);
      b.y = q(b.y);
      b.dx = q(b.dx);
      b.dy = q(b.dy);
    }
  }
  private releaseGuardian(): void {
    if (this.state.bossShielded && enemiesRemaining(this.state) === 0) {
      this.state.bossShielded = false;
      this.emit(
        "guardian-vulnerable",
        this.state.enemies.find((e) => e.kind === "guardian") ??
          this.state.player,
        "Guardian vulnerable",
      );
    }
  }
  private sword(): void {
    const s = this.state,
      p = s.player;
    if (s.tick - p.attackAt >= C.swordActiveTicks) return;
    const weapon = WEAPONS[p.weapon];
    const validHit = (enemy: Enemy) =>
      enemy.hp > 0 &&
      !p.hitIds.includes(enemy.id) &&
      distance(p, enemy) <= weapon.range + C.enemyRadius &&
      lineClear(p, enemy, s.secrets) &&
      Math.abs(
        angleDifference(
          Math.atan2(enemy.y - p.y, enemy.x - p.x),
          p.attackAngle,
        ),
      ) <=
        (Math.PI * C.swordArcDegrees) / 360;
    // Preflight before damaging ANY enemy: the same swing cannot defeat the last mob and bypass the shield.
    if (
      s.bossShielded &&
      s.enemies.some((e) => e.kind === "guardian" && validHit(e))
    ) {
      this.die("Struck the shielded guardian.");
      return;
    }
    for (const secret of SECRETS) {
      if (
        !s.secrets.includes(secret.id) &&
        distance(p, secret) < weapon.range + 8 &&
        Math.abs(
          angleDifference(
            Math.atan2(secret.y - p.y, secret.x - p.x),
            p.attackAngle,
          ),
        ) <=
          (Math.PI * C.swordArcDegrees) / 360
      ) {
        s.secrets.push(secret.id);
        this.emit("secret", secret, secret.id);
      }
    }
    for (const enemy of s.enemies) {
      if (
        enemy.hp <= 0 ||
        p.hitIds.includes(enemy.id) ||
        distance(p, enemy) > weapon.range + C.enemyRadius ||
        !lineClear(p, enemy, s.secrets)
      )
        continue;
      if (
        Math.abs(
          angleDifference(
            Math.atan2(enemy.y - p.y, enemy.x - p.x),
            p.attackAngle,
          ),
        ) >
        (Math.PI * C.swordArcDegrees) / 360
      )
        continue;
      p.hitIds.push(enemy.id);
      const front =
        Math.abs(
          angleDifference(
            Math.atan2(p.y - enemy.y, p.x - enemy.x),
            enemy.angle,
          ),
        ) < C.shieldHalfArc;
      if (enemy.kind === "guardian" && front && enemy.phase !== "recovery") {
        this.emit("impact", enemy, "Blocked! Strike its flank or recovery.");
        continue;
      }
      enemy.hp -= weapon.damage;
      this.emit("impact", enemy);
      if (enemy.hp <= 0) {
        enemy.phase = "dead";
        s.kills++;
        this.emit("kill", enemy, enemy.kind);
        if (enemy.kind === "guardian") this.split("guardian");
      }
    }
  }
  private enemyStep(e: Enemy): void {
    if (e.hp <= 0) return;
    const s = this.state,
      p = s.player,
      d = distance(e, p),
      visible = lineClear(e, p, s.secrets);
    const tuning = ENEMY_STATS[e.kind];
    if (s.tick - e.born < C.enemyWakeTicks) return;
    if (e.phase === "windup") {
      if (s.tick < e.until) return;
      e.phase = "attack";
      e.hit = false;
      this.emit("enemy-attack", e, e.kind);
      if (e.kind === "cultist") {
        let projectile = s.projectiles.find((b) => !b.active);
        if (!projectile) {
          projectile = {
            id: s.projectiles.length,
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            life: 0,
            active: false,
          };
          s.projectiles.push(projectile);
        }
        Object.assign(projectile, {
          x: e.x,
          y: e.y,
          dx: Math.cos(e.angle) * C.projectileSpeed * C.dt,
          dy: Math.sin(e.angle) * C.projectileSpeed * C.dt,
          life: C.projectileLife,
          active: true,
        });
        e.phase = "recovery";
        e.until = s.tick + tuning.recovery;
      } else {
        e.until = s.tick + tuning.active;
        e.dx = Math.cos(e.angle);
        e.dy = Math.sin(e.angle);
      }
      return;
    }
    if (e.phase === "attack") {
      if (s.tick >= e.until) {
        e.phase = "recovery";
        e.until = s.tick + tuning.recovery;
        return;
      }
      if (e.kind === "hound")
        move(
          e,
          e.dx * C.chargeSpeed * C.dt,
          e.dy * C.chargeSpeed * C.dt,
          C.enemyRadius,
          s.secrets,
        );
      const range = tuning.damageRange;
      if (
        !e.hit &&
        distance(e, p) < range &&
        visible &&
        (e.kind === "hound" ||
          Math.abs(angleDifference(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) <
            C.enemyAttackHalfArc)
      ) {
        e.hit = true;
        this.damage(
          e.kind === "guardian"
            ? "Guardian cleave"
            : e.kind === "hound"
              ? "Crypt hound charge"
              : "Skeleton slash",
        );
      }
      return;
    }
    if (e.phase === "recovery") {
      if (e.kind === "cultist" && visible && d < 80 && d > 0) {
        move(
          e,
          ((e.x - p.x) / d) * tuning.speed * C.dt,
          ((e.y - p.y) / d) * tuning.speed * C.dt,
          C.enemyRadius,
          s.secrets,
        );
      }
      if (s.tick >= e.until) e.phase = "idle";
      return;
    }
    const detection = tuning.detection;
    if (d > detection) {
      e.phase = "idle";
      return;
    }
    e.phase = "chase";
    const reach = tuning.reach;
    if (visible && d < reach) {
      e.phase = "windup";
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.until = s.tick + tuning.windup;
      return;
    }
    if (
      s.tick % C.pathUpdateTicks === e.id % C.pathUpdateTicks ||
      (e.dx === 0 && e.dy === 0)
    ) {
      const target = visible ? p : this.nextPathPoint(e, p);
      const len = distance(e, target);
      e.dx = len > 0 ? (target.x - e.x) / len : 0;
      e.dy = len > 0 ? (target.y - e.y) / len : 0;
      e.angle = Math.atan2(e.dy, e.dx);
    }
    const speed = tuning.speed;
    move(e, e.dx * speed * C.dt, e.dy * speed * C.dt, C.enemyRadius, s.secrets);
  }
  private nextPathPoint(from: Vec, to: Vec): Vec {
    const start =
        Math.floor(from.y / C.tile) * WIDTH + Math.floor(from.x / C.tile),
      goal = Math.floor(to.y / C.tile) * WIDTH + Math.floor(to.x / C.tile);
    const parents = new Int32Array(WIDTH * HEIGHT).fill(-1),
      queue = [start];
    parents[start] = start;
    for (let i = 0; i < queue.length && i < 500; i++) {
      const current = queue[i]!;
      if (current === goal) break;
      for (const neighbor of [
        current - WIDTH,
        current + 1,
        current + WIDTH,
        current - 1,
      ]) {
        const x = neighbor % WIDTH,
          y = Math.floor(neighbor / WIDTH);
        if (
          neighbor < 0 ||
          neighbor >= parents.length ||
          parents[neighbor] !== -1 ||
          isSolid(x, y, this.state.secrets)
        )
          continue;
        parents[neighbor] = current;
        queue.push(neighbor);
      }
    }
    if (parents[goal] === -1) return from;
    let n = goal;
    while (parents[n] !== start && n !== start) n = parents[n]!;
    return at(n % WIDTH, Math.floor(n / WIDTH));
  }
  private projectiles(): void {
    const s = this.state;
    for (const b of s.projectiles) {
      if (!b.active) continue;
      b.life--;
      b.x += b.dx;
      b.y += b.dy;
      if (b.life <= 0 || collides(b.x, b.y, C.projectileRadius, s.secrets)) {
        b.active = false;
        continue;
      }
      if (distance(b, s.player) < C.radius + C.projectileRadius) {
        b.active = false;
        this.damage("Cultist bolt");
      }
    }
  }
  hash(): string {
    const { previousX: _x, previousY: _y, ...player } = this.state.player;
    const data = JSON.stringify({ ...this.state, player });
    let hash = 2166136261;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
}
