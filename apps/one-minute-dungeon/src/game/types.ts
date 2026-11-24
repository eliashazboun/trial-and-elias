import type { Category, Challenge, Weapon } from "./config";
export interface Vec {
  x: number;
  y: number;
}
export interface InputFrame {
  mx: number;
  my: number;
  aim: number;
  attack: boolean;
  dash: boolean;
  interact: boolean;
}
export const EMPTY_INPUT: InputFrame = {
  mx: 0,
  my: 0,
  aim: 0,
  attack: false,
  dash: false,
  interact: false,
};
export type EnemyKind = "skeleton" | "cultist" | "hound" | "guardian";
export type EnemyPhase =
  | "idle"
  | "chase"
  | "windup"
  | "attack"
  | "recovery"
  | "dead";
export interface Enemy extends Vec {
  id: number;
  kind: EnemyKind;
  hp: number;
  phase: EnemyPhase;
  until: number;
  angle: number;
  dx: number;
  dy: number;
  hit: boolean;
  born: number;
}
export interface Projectile extends Vec {
  id: number;
  dx: number;
  dy: number;
  life: number;
  active: boolean;
}
export interface Player extends Vec {
  previousX: number;
  previousY: number;
  facing: number;
  dashAt: number;
  dashReady: number;
  dashX: number;
  dashY: number;
  attackAt: number;
  attackReady: number;
  attackAngle: number;
  hitIds: number[];
  weapon: Weapon;
  weaponUntil: number;
}
export interface Split {
  id: string;
  tick: number;
  refundTicks: number;
  rankedTicks: number;
  diamondRoute: string;
}
export interface DiamondEvent {
  id: number;
  tick: number;
  combo: number;
  nominalTicks: number;
  appliedTicks: number;
}
export interface SimEvent {
  type:
    | "dash"
    | "ready"
    | "swing"
    | "impact"
    | "kill"
    | "enemy-attack"
    | "key"
    | "switch"
    | "unlock"
    | "death"
    | "escape"
    | "loot"
    | "weapon"
    | "secret"
    | "warning"
    | "guardian-vulnerable";
  x: number;
  y: number;
  detail?: string;
}
export interface RunOptions {
  seed: number;
  category: Category;
  challenge: Challenge;
}
export interface Pickup extends Vec {
  id: number;
  collected: boolean;
}
export interface WeaponPickup extends Pickup {
  weapon: Weapon;
}
export interface RunState {
  tick: number;
  status: "running" | "dead" | "won";
  cause: string;
  valid: boolean;
  invalidReasons: string[];
  player: Player;
  key: Vec;
  hasKey: boolean;
  switches: boolean[];
  gateOpen: boolean;
  enemies: Enemy[];
  projectiles: Projectile[];
  loot: Pickup[];
  weapons: WeaponPickup[];
  kills: number;
  lootCount: number;
  refundTicks: number;
  combo: number;
  maxCombo: number;
  lastDiamondTick: number;
  diamondEvents: DiamondEvent[];
  bossShielded: boolean;
  splits: Split[];
  secrets: string[];
  dashDodges: number;
  usedWeapon: boolean;
}
export interface Checkpoint {
  tick: number;
  hash: string;
}
export interface Replay {
  format: number;
  game: string;
  map: string;
  rules: string;
  hz: number;
  options: RunOptions;
  frames: number[][];
  checkpoints: Checkpoint[];
  ticks: number;
  refundTicks: number;
  rankedTicks: number;
  maxCombo: number;
  splits: Split[];
  finalHash: string;
}
export interface RunRecord {
  id: string;
  date: string;
  options: RunOptions;
  game: string;
  map: string;
  rules: string;
  ticks: number;
  refundTicks: number;
  rankedTicks: number;
  maxCombo: number;
  won: boolean;
  valid: boolean;
  reasons: string[];
  cause: string;
  splits: Split[];
  kills: number;
  loot: number;
  secrets: string[];
  dashDodges: number;
  usedWeapon: boolean;
}
