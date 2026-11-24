import { C } from "../config";
import type { RunState, DiamondEvent } from "../types";
export function rankedTicks(
  state: Pick<RunState, "tick" | "refundTicks">,
): number {
  return state.tick - state.refundTicks;
}
export function remainingTicks(
  state: Pick<RunState, "tick" | "refundTicks">,
): number {
  return Math.max(0, C.deadline - rankedTicks(state));
}
export function diamondRoute(state: Pick<RunState, "diamondEvents">): string {
  return state.diamondEvents
    .map((e) => e.id + ":" + e.combo + ":" + e.appliedTicks)
    .join(",");
}
export function collectDiamond(state: RunState, id: number): DiamondEvent {
  state.combo =
    state.lastDiamondTick >= 0 &&
    state.tick - state.lastDiamondTick <= C.comboTicks
      ? state.combo + 1
      : 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.lastDiamondTick = state.tick;
  const nominalTicks = state.combo * C.refundStepTicks,
    appliedTicks = Math.min(nominalTicks, Math.max(0, rankedTicks(state)));
  state.refundTicks += appliedTicks;
  const event = {
    id,
    tick: state.tick,
    combo: state.combo,
    nominalTicks,
    appliedTicks,
  };
  state.diamondEvents.push(event);
  return event;
}
export function enemiesRemaining(state: Pick<RunState, "enemies">): number {
  return state.enemies.filter((e) => e.kind !== "guardian" && e.hp > 0).length;
}
