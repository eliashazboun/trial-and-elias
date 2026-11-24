export type CosmeticSetting =
  | "skin"
  | "sword"
  | "trail"
  | "ghostColor"
  | "title";
export interface CosmeticOption {
  readonly id: string;
  readonly name: string;
  readonly need?: string;
}
export interface CosmeticGroup {
  readonly name: string;
  readonly setting: CosmeticSetting;
  readonly items: readonly CosmeticOption[];
}
export const COSMETIC_GROUPS: readonly CosmeticGroup[] = [
  {
    name: "KNIGHT",
    setting: "skin",
    items: [
      { id: "ember", name: "Ember" },
      { id: "jade", name: "Jade", need: "first" },
      { id: "violet", name: "Violet", need: "speed" },
      { id: "ivory", name: "Ivory", need: "untouchable" },
    ],
  },
  {
    name: "SWORD APPEARANCE",
    setting: "sword",
    items: [
      { id: "steel", name: "Steel" },
      { id: "gold", name: "Gilded", need: "bare" },
    ],
  },
  {
    name: "DASH TRAIL",
    setting: "trail",
    items: [
      { id: "ember", name: "Ash" },
      { id: "relic", name: "Relic", need: "treasure" },
      { id: "jade", name: "Jade", need: "challenge" },
    ],
  },
  {
    name: "GHOST",
    setting: "ghostColor",
    items: [
      { id: "cyan", name: "Cyan" },
      { id: "violet", name: "Violet", need: "secret" },
    ],
  },
  {
    name: "PROFILE TITLE",
    setting: "title",
    items: [
      { id: "Crypt Wanderer", name: "Crypt Wanderer" },
      { id: "Crypt Veteran", name: "Crypt Veteran", need: "hundred" },
      { id: "Guardian Slayer", name: "Guardian Slayer", need: "guardian" },
    ],
  },
];
export function availableCosmetic(
  option: CosmeticOption,
  achievements: readonly string[],
): boolean {
  return !option.need || achievements.includes(option.need);
}
export function findCosmetic(
  setting: string,
  id: string,
): { group: CosmeticGroup; option: CosmeticOption } | undefined {
  const group = COSMETIC_GROUPS.find((g) => g.setting === setting),
    option = group?.items.find((item) => item.id === id);
  return group && option ? { group, option } : undefined;
}
