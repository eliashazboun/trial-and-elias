export const VERSION = {
  game: "1.1.0",
  map: "crypt-1",
  rules: "diamond-refund-shield-2",
  replay: 2,
} as const;
const TICK_RATE = 120,
  START_SECONDS = 60,
  DIAMOND_COUNT = 6,
  COMBO_SECONDS = 5;
const MAX_REFUND_TICKS =
  ((DIAMOND_COUNT * (DIAMOND_COUNT + 1)) / 2) * TICK_RATE;
export const C = {
  hz: TICK_RATE,
  dt: 1 / TICK_RATE,
  deadline: START_SECONDS * TICK_RATE,
  diamondCount: DIAMOND_COUNT,
  comboTicks: COMBO_SECONDS * TICK_RATE,
  refundStepTicks: TICK_RATE,
  maxRefundTicks: MAX_REFUND_TICKS,
  maxRunTicks: START_SECONDS * TICK_RATE + MAX_REFUND_TICKS,
  tile: 24,
  radius: 6,
  speed: 150,
  dashSpeed: 420,
  dashTicks: 17,
  dashCooldown: 90,
  invulnerableStart: 4,
  invulnerableEnd: 13,
  interactionRange: 30,
  enemyWakeTicks: 60,
  enemyRadius: 7,
  pathUpdateTicks: 24,
  swordActiveTicks: 12,
  swordArcDegrees: 100,
  projectileSpeed: 170,
  projectileLife: 240,
  projectileRadius: 3,
  chargeSpeed: 330,
  shieldHalfArc: 1.1,
  enemyAttackHalfArc: 1,
  standardSeed: 0xc0ffee,
  maxFrameMs: 150,
  maxCatchup: 18,
} as const;
// Legacy mode identifiers are retained only to decode archived saves. New simulations accept fixed/standard.
export type Category = "fixed" | "random";
export type Challenge =
  | "standard"
  | "no-dash"
  | "rusty-blade"
  | "pacifist"
  | "treasure"
  | "guardian-hunt";
export type Weapon = "sword" | "dagger" | "heavy" | "spectral" | "cursed";
export const WEAPONS: Record<
  Weapon,
  {
    name: string;
    range: number;
    cooldown: number;
    damage: number;
    color: number;
  }
> = {
  sword: {
    name: "Iron Sword",
    range: 42,
    cooldown: 36,
    damage: 1,
    color: 0xdde8ee,
  },
  dagger: {
    name: "Swift Dagger",
    range: 31,
    cooldown: 23,
    damage: 1,
    color: 0x69dfbd,
  },
  heavy: {
    name: "Heavy Blade",
    range: 44,
    cooldown: 54,
    damage: 2,
    color: 0xf6ad64,
  },
  spectral: {
    name: "Spectral Sword",
    range: 54,
    cooldown: 36,
    damage: 1,
    color: 0x8dcfff,
  },
  cursed: {
    name: "Cursed Edge",
    range: 46,
    cooldown: 30,
    damage: 2,
    color: 0xd99bff,
  },
};

export const ENEMY_STATS = {
  skeleton: {
    hp: 1,
    speed: 72,
    detection: 190,
    reach: 30,
    windup: 46,
    active: 12,
    recovery: 65,
    damageRange: 24,
  },
  cultist: {
    hp: 1,
    speed: 65,
    detection: 190,
    reach: 170,
    windup: 46,
    active: 0,
    recovery: 100,
    damageRange: 0,
  },
  hound: {
    hp: 2,
    speed: 85,
    detection: 190,
    reach: 125,
    windup: 50,
    active: 30,
    recovery: 65,
    damageRange: 15,
  },
  guardian: {
    hp: 4,
    speed: 48,
    detection: 140,
    reach: 62,
    windup: 72,
    active: 12,
    recovery: 100,
    damageRange: 46,
  },
} as const;
