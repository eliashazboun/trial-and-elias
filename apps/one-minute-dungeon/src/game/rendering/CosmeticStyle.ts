/** Presentation data only. These values are shared with the actual dungeon renderer. */
export const COSMETIC_STYLE = {
  ghostAlpha: 0.35,
  ghostSkin: "ivory",
  ghostCyan: 0x63d8f5,
  ghostViolet: 0xc49aff,
  swordGold: 0xffd585,
  trailAsh: 0xd08c9a,
  trailRelic: 0xf4cd89,
  trailJade: 0x83e4bd,
  trailFadeSeconds: 0.16,
  trailMaxAlpha: 0.32,
} as const;
export function ghostTint(id: string): number {
  return id === "violet"
    ? COSMETIC_STYLE.ghostViolet
    : COSMETIC_STYLE.ghostCyan;
}
export function trailTint(id: string): number {
  return id === "jade"
    ? COSMETIC_STYLE.trailJade
    : id === "relic"
      ? COSMETIC_STYLE.trailRelic
      : COSMETIC_STYLE.trailAsh;
}
export function swordTint(id: string, baseColor: number): number {
  return id === "gold" ? COSMETIC_STYLE.swordGold : baseColor;
}
export function cssColor(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}
