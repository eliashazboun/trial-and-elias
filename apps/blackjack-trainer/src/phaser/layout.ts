import type {
  BetKind,
  Card,
  GameState,
  Hand,
  Projection,
} from "../engine/types";
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface CardPlacement {
  card: Card | null;
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  badgeX: number;
  badgeY: number;
}
export interface HandPlacement extends Rect {
  hand: Hand;
  label: string;
  cards: CardPlacement[];
  wager: { x: number; y: number };
  total: Rect;
  result: Rect;
  compact: boolean;
  actions: Rect | null;
}
export interface Spot extends Rect {
  position: number;
  kind: BetKind;
}
export interface TableLayout {
  width: number;
  height: number;
  portrait: boolean;
  dealer: CardPlacement[];
  hands: HandPlacement[];
  spots: Spot[];
  rack: Rect;
  bettingBar: Rect;
  count: Rect;
  message: Rect;
  dealerLabel: { x: number; y: number };
  collection: { x: number; y: number };
  markY: number;
}
function fan(
  cards: (Card | null)[],
  key: string,
  x: number,
  y: number,
  width: number,
  cardWidth: number,
  weights: boolean,
): CardPlacement[] {
  return cards.map((card, index) => {
    const row = Math.floor(index / 4),
      col = index % 4,
      n = Math.min(4, cards.length - row * 4);
    const step =
      n === 1 ? 0 : Math.min(cardWidth * 0.65, (width - cardWidth) / (n - 1));
    const span = cardWidth + step * (n - 1);
    const px = x + (width - span) / 2 + col * step,
      py = y + row * (cardWidth * 1.4 + (weights ? 19 : 8));
    return {
      card,
      key: key.startsWith("dealer")
        ? `${key}:${index}`
        : (card?.id ?? `${key}:${index}`),
      x: px,
      y: py,
      width: cardWidth,
      height: cardWidth * 1.4,
      badgeX: px + Math.min(8, step / 3),
      badgeY: py - 16,
    };
  });
}
export function tableLayout(
  width: number,
  height: number,
  state: GameState,
  view: Projection | null,
  weights: boolean,
): TableLayout {
  const portrait = width < 600,
    short = height < 430,
    pad = portrait ? 12 : 32;
  const rackHeight = portrait ? 52 : short ? 48 : 66,
    barHeight = portrait ? 94 : short ? 43 : 58;
  const rack = {
    x: pad,
    y: height - rackHeight - 13,
    width: width - 2 * pad,
    height: rackHeight,
  };
  const settled =
    state.round?.phase === "complete" || state.round?.phase === "canceled";
  const hasSides = !!state.round?.positions.some(
    (p) => p.bet.pairs.length || p.bet.three.length,
  );
  const bettingBar = {
    x: pad,
    y: settled ? height - barHeight - 15 : rack.y - barHeight - 5,
    width: width - 2 * pad,
    height: barHeight,
  };
  const dealerW = portrait ? 58 : short ? 55 : 76;
  const dealerY = portrait ? 92 : short ? 94 : 72;
  const dealer = fan(
    view?.dealer ?? [],
    `dealer:${state.round?.id}`,
    short ? 22 : width * 0.3,
    dealerY,
    short ? 104 : width * 0.4,
    dealerW,
    weights,
  );
  const dealerBottom = dealerY + dealerW * 1.4;
  const hands: HandPlacement[] = [];
  const active = view?.active ?? null;
  const groups = [0, 1, 2]
    .map((position) =>
      (view?.hands ?? []).filter((h) => h.position === position),
    )
    .filter((g) => g.length);
  let bodyTop = short ? 50 : dealerBottom + (weights ? 28 : 20);
  const sideY = state.round
    ? settled
      ? bettingBar.y - 56
      : height - 65
    : bettingBar.y - 65;
  const bodyBottom = Math.min(
    height - 28,
    settled ? bettingBar.y - 8 : height - 28,
    hasSides ? sideY - 10 : height - 28,
  );
  const playerStart = short ? 145 : pad;
  const groupWidth = (width - playerStart - pad) / Math.max(1, groups.length);
  const configs = groups.map((group) => {
    const cols = portrait
      ? groups.length === 1 && group.length > 1
        ? Math.min(2, group.length)
        : 1
      : group.length > 1
        ? 2
        : 1;
    return { group, cols, rows: Math.ceil(group.length / cols) };
  });
  const rowCount = Math.max(1, ...configs.map((g) => g.rows));
  if (rowCount === 1 && !short)
    bodyTop = Math.max(bodyTop, Math.min(height * 0.44, bodyBottom - 215));
  const activeRow = Math.max(
    0,
    ...configs.map((g) =>
      Math.floor(
        Math.max(
          0,
          g.group.findIndex((h) => h.id === active),
        ) / g.cols,
      ),
    ),
  );
  const actionH = portrait ? 45 : 48;
  const available = bodyBottom - bodyTop - (active ? actionH : 0);
  const rowH = available / rowCount;
  for (let gi = 0; gi < configs.length; gi++) {
    const { group, cols } = configs[gi]!;
    const cellW = groupWidth / cols;
    group.forEach((hand, index) => {
      const row = Math.floor(index / cols),
        col = index % cols;
      const handWidth = Math.min(cellW - 6, 260);
      const x =
          playerStart +
          gi * groupWidth +
          col * cellW +
          3 +
          (cellW - 6 - handWidth) / 2,
        y = bodyTop + row * rowH + (active && row >= activeRow ? actionH : 0),
        w = handWidth;
      const cardRows = Math.max(1, Math.ceil(hand.cards.length / 4));
      const compact = rowH < 160 || w < 135;
      const topSpace = compact ? (hand.outcome === "BLACKJACK" ? 38 : 26) : 52;
      const totalH = compact ? 14 : 24;
      const cardWidth = Math.max(
        20,
        Math.min(
          portrait ? (groups.length > 1 ? 58 : 78) : 84,
          (w - 8) / 1.9,
          (rowH - topSpace - totalH - 7 - (cardRows - 1) * 7) / cardRows / 1.4,
        ),
      );
      const cards = fan(
        hand.cards,
        hand.id,
        x,
        y + topSpace,
        w,
        cardWidth,
        false,
      );
      for (const card of cards) {
        card.badgeX = card.x + 3;
        card.badgeY = card.y + (compact ? 18 : 27);
      }
      const left = Math.min(...cards.map((c) => c.x)),
        right = Math.max(...cards.map((c) => c.x + c.width));
      const center = cards.length ? (left + right) / 2 : x + w / 2;
      const bottom = cards.length
        ? Math.max(...cards.map((c) => c.y + c.height))
        : y + topSpace;
      const actionWidth = Math.min(width - pad * 2, portrait ? 276 : 310);
      hands.push({
        hand,
        label:
          "P" + (hand.position + 1) + " · " + String.fromCharCode(65 + index),
        x,
        y,
        width: w,
        height: Math.min(rowH - 3, bottom - y + totalH + 6),
        cards,
        compact,
        wager: { x: center, y: y + (compact ? 18 : 34) },
        total: {
          x: center - Math.min(w - 4, 110) / 2,
          y: bottom + (compact ? 3 : 4),
          width: Math.min(w - 4, 110),
          height: totalH,
        },
        result: {
          x: x + 1,
          y: y + (compact ? 0 : 2),
          width: w - 2,
          height: compact ? (hand.outcome === "BLACKJACK" ? 29 : 17) : 26,
        },
        actions:
          hand.id === active
            ? {
                x: Math.max(
                  pad,
                  Math.min(
                    width - pad - actionWidth,
                    x + w / 2 - actionWidth / 2,
                  ),
                ),
                y: y - actionH,
                width: actionWidth,
                height: actionH - 4,
              }
            : null,
      });
    });
  }
  const spots: Spot[] = [];
  for (let position = 0; position < 3; position++) {
    const seatIndex = groups.findIndex(
      (group) => group[0]?.position === position,
    );
    const cell =
      state.round && seatIndex >= 0 ? groupWidth : (width - pad * 2) / 3;
    const x =
      state.round && seatIndex >= 0
        ? playerStart + seatIndex * groupWidth
        : pad + position * cell;
    const mainWidth = Math.min(94, cell - 10),
      mainY = portrait
        ? Math.min(height * 0.47, bettingBar.y - 128)
        : short
          ? 80
          : Math.min(height * 0.5, bettingBar.y - 145);
    spots.push({
      position,
      kind: "main",
      x: x + (cell - mainWidth) / 2,
      y: mainY,
      width: mainWidth,
      height: portrait ? 56 : 62,
    });

    for (const kind of ["pairs", "three"] as const) {
      if (
        (kind === "pairs" && !state.rules.pairs) ||
        (kind === "three" && !state.rules.three)
      )
        continue;
      const sw = Math.min(78, (cell - 12) / 2);
      spots.push({
        position,
        kind,
        x: x + cell / 2 + (kind === "pairs" ? -sw - 3 : 3),
        y: sideY,
        width: sw,
        height: 46,
      });
    }
  }
  return {
    width,
    height,
    portrait,
    dealer,
    hands,
    spots,
    rack,
    bettingBar,
    count: {
      x: short ? 12 : width - (portrait ? 145 : 178) - pad,
      y: 10,
      width: short ? 125 : portrait ? 145 : 178,
      height: 64,
    },
    message: { x: pad, y: height - 32, width: width - pad * 2, height: 26 },
    collection: {
      x: short ? 74 : width / 2 - (portrait ? 101 : 140),
      y: short ? dealerBottom + 34 : dealerY + 32,
    },
    dealerLabel: {
      x: short ? 74 : width / 2,
      y: portrait || short ? dealerBottom + 7 : dealerY - 32,
    },
    markY: state.round
      ? dealerBottom + 12
      : portrait
        ? spots[0]!.y - 76
        : short
          ? 40
          : height * 0.36,
  };
}
