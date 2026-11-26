import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { normalizeChips, chipColors } from "../engine/chips";
import { money } from "../engine/types";
export function Stack({
  units,
  compact = false,
}: {
  units: number;
  compact?: boolean;
}) {
  const normalized = normalizeChips(units),
    chips = normalized.chips.slice(0, 9);
  return (
    <span
      data-units={units}
      className={`normalized-stack ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      {chips.map((chip, i) => (
        <span
          key={i}
          data-denomination={chip}
          className="physical-chip"
          style={
            {
              "--chip-color": chipColors[chip],
              transform: `translateY(${-i * 2}px)`,
            } as CSSProperties
          }
        >
          <span>{chip.toLocaleString()}</span>
        </span>
      ))}
      {normalized.halfChip && <span className="half-chip">½</span>}
      {units > 0 && (
        <strong
          className="stack-total"
          style={{
            transform: `translateY(${-Math.max(0, chips.length - 1) * 2}px)`,
          }}
        >
          {money(units)}
        </strong>
      )}
    </span>
  );
}

export function resultLabel(net: number | undefined, outcome?: string) {
  if (net === undefined) return null;
  if (outcome === "REFUNDED") return "REFUNDED";
  if (net === 0) return "PUSH";
  const amount = (net > 0 ? "+$" : "-$") + money(Math.abs(net));
  return (outcome === "BLACKJACK" ? "BLACKJACK! " : "") + amount;
}
export function WagerVisual({
  id,
  stake,
  net,
  source,
  collection,
  playerY,
  skip,
  compact = false,
}: {
  id: string;
  stake: number;
  net?: number;
  source: { x: number; y: number };
  collection: { x: number; y: number };
  playerY: number;
  skip: boolean;
  compact?: boolean;
}) {
  const previous = useRef(net);
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (net !== undefined && previous.current === undefined && !skip) {
      setFlying(true);
      timer = setTimeout(() => setFlying(false), 900);
    } else if (net === undefined || skip) setFlying(false);
    previous.current = net;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [net, skip]);
  const lost = net !== undefined && net < 0;
  const target = lost ? collection : { x: source.x, y: playerY };
  const units = net === undefined || lost ? stake : stake + net;
  const style = {
    left: source.x - 24,
    top: source.y - 17,
    "--travel-x": target.x - source.x + "px",
    "--travel-y": target.y - source.y + "px",
  } as CSSProperties;
  return (
    <div
      data-wager-id={id}
      data-settlement={
        net === undefined ? "pending" : flying ? "moving" : "cleared"
      }
      data-target-x={target.x}
      data-target-y={target.y}
      className={"wager-visual " + (compact ? "dense-wager" : "")}
      style={style}
      aria-label={"Wager " + money(stake) + " chips"}
    >
      {net === undefined ? (
        <Stack units={stake} compact />
      ) : flying ? (
        <span
          className={"wager-flight " + (lost ? "to-dealer" : "to-player")}
          aria-hidden="true"
        >
          <Stack units={units} compact />
        </span>
      ) : null}
    </div>
  );
}
