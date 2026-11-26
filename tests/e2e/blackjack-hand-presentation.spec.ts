import { test, expect } from "@playwright/test";
import { fixture, install, snapshot, errors } from "./blackjack-fixtures";
import type { Rank } from "../../apps/blackjack-trainer/src/engine/types";
import { between } from "../../apps/blackjack-trainer/src/engine/engine";
import { money } from "../../apps/blackjack-trainer/src/engine/types";
async function begin(
  page: import("@playwright/test").Page,
  order: Rank[],
  options = {},
) {
  const f = fixture(order);
  let s = f.apply(f.state, {
    type: "chip",
    position: 0,
    kind: "main",
    chip: 25,
  });
  s = f.apply(s, { type: "deal" });
  await install(page, s, options);
  return { ...f, s };
}
for (const [name, order, label] of [
  ["win", ["10", "6", "9", "10", "10"], "+$25"],
  ["loss", ["10", "10", "7", "9"], "-$25"],
  ["push", ["10", "10", "8", "8"], "PUSH"],
  ["blackjack", ["A", "9", "K", "8"], "BLACKJACK!+$37.5"],
] as const)
  test(
    name + " result uses net and cleared wagers stay cleared after refresh",
    async ({ page }) => {
      const f = await begin(page, [...order]);
      if (!between(f.s))
        await page.getByRole("button", { name: "Stand", exact: true }).click();
      await expect(page.locator("[data-hand-result]")).toHaveText(label);
      await expect(
        page.locator("[data-wager-id] .normalized-stack"),
      ).toHaveCount(0);
      const s = await snapshot(page);
      await page.reload();
      await expect(page.locator("[data-hand-result]")).toHaveText(label);
      expect((await snapshot(page)).ledger).toEqual(s.ledger);
      await expect(page.locator(".wager-flight")).toHaveCount(0);
      await page.screenshot({
        path: "test-results/hand-outcome-" + name + ".png",
      });
    },
  );

test("soft/hard/bust totals follow hits without obscuring cards", async ({
  page,
}) => {
  await begin(page, ["A", "6", "7", "10", "5", "K"]);
  await expect(page.locator("[data-hand-total]")).toHaveText(/Soft 18$/);
  await page.getByRole("button", { name: "Hit", exact: true }).click();
  await expect(page.locator("[data-hand-total]")).toHaveText(/13$/);
  await page.getByRole("button", { name: "Hit", exact: true }).click();
  await expect(page.locator("[data-hand-total]")).toHaveText(/BUST · 23$/);
  await expect(page.locator("[data-hand-result]")).toHaveText("-$25");
});

test("split hands keep independent totals, doubled wagers and opposite results", async ({
  page,
}) => {
  const failures = errors(page);
  await begin(page, ["8", "6", "8", "10", "3", "10", "10", "4"]);
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator("[data-hand-total]")).toHaveCount(2);
  await page.getByRole("button", { name: "Double", exact: true }).click();
  await expect(page.locator("[data-wager-id]").first()).toHaveAttribute(
    "aria-label",
    "Wager 50 chips",
  );
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator("[data-hand-result]").first()).toHaveText("+$50");
  await expect(page.locator("[data-hand-result]").nth(1)).toHaveText("-$25");
  await expect(page.locator("[data-hand-total]").first()).toHaveText(/21$/);
  await expect(page.locator("[data-hand-total]").nth(1)).toHaveText(/18$/);
  const s = await snapshot(page);
  expect(s.balance).toBe(fixture().state.balance + 50);
  await page.screenshot({ path: "test-results/hand-split-outcomes.png" });
  expect(failures).toEqual([]);
});

test("side bets stay associated with all three seats and settle separately before main hands", async ({
  page,
}) => {
  const f = fixture(["8", "10", "8", "8", "8", "7", "8", "10"]);
  let s = f.state;
  for (let p = 0; p < 3; p++)
    for (const kind of ["main", "pairs", "three"] as const)
      s = f.apply(s, {
        type: "chip",
        position: p,
        kind,
        chip: kind === "main" ? 25 : 5,
      });
  await install(page, s, { speed: "normal" });
  await page.getByRole("button", { name: "Deal", exact: true }).click();
  await expect(page.locator("[data-round-side]")).toHaveCount(6);
  await expect(
    page.locator('[data-wager-id$=":pairs"] .normalized-stack'),
  ).toHaveCount(3);
  await expect(page.locator("[data-side-result]")).toHaveCount(6, {
    timeout: 12000,
  });
  await expect(page.locator("[data-hand-result]")).toHaveCount(0);
  const round = (await snapshot(page)).round!;
  for (const result of round.sideResults) {
    const label =
      (result.net > 0 ? "+$" : result.net < 0 ? "-$" : "") +
      (result.net === 0 ? "PUSH" : money(Math.abs(result.net)));
    await expect(
      page.locator(
        '[data-side-result="' + result.position + ":" + result.kind + '"]',
      ),
    ).toHaveText(label);
  }
  const finalSide = round.sideResults.find(
    (r) => r.position === 2 && r.kind === "three",
  )!;
  const returned = page.locator(
    '[data-wager-id="' +
      round.id +
      ':2:three"] .wager-flight.to-player [data-units]',
  );
  await expect(returned).toHaveAttribute(
    "data-units",
    String(finalSide.stake + finalSide.net),
  );
  const credited = await snapshot(page);
  await expect(page.locator(".wager-flight")).toHaveCount(0);
  expect((await snapshot(page)).ledger).toEqual(credited.ledger);
  await page.screenshot({ path: "test-results/side-bet-results.png" });
  while (!between(await snapshot(page)))
    await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator("[data-hand-result]")).toHaveCount(3);
  await expect(page.locator("[data-round-side]")).toHaveCount(6);
});

test("loss animation targets the dealer collection, clears once and queues next round until readable", async ({
  page,
}) => {
  const f = await begin(page, ["10", "10", "7", "9"], { speed: "normal" });
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator(".wager-flight.to-dealer")).toHaveCount(1);
  const table = page.locator(".table-stage"),
    wager = page.locator("[data-wager-id]");
  expect(await wager.getAttribute("data-target-x")).toBe(
    await table.getAttribute("data-collection-x"),
  );
  expect(await wager.getAttribute("data-target-y")).toBe(
    await table.getAttribute("data-collection-y"),
  );
  const settled = await snapshot(page);
  const started = Date.now();
  await page.getByRole("button", { name: "Rebet & Deal", exact: true }).click();
  await expect(page.locator("[data-hand-result]")).toHaveText("-$25");
  expect((await snapshot(page)).round!.id).toBe(settled.round!.id);
  await expect
    .poll(async () => (await snapshot(page)).round!.id)
    .not.toBe(settled.round!.id);
  expect(Date.now() - started).toBeGreaterThan(700);
  await expect(page.locator("[data-hand-result]")).toHaveCount(0);
  expect(
    (await snapshot(page)).ledger.filter(
      (t) => t.roundId === settled.round!.id,
    ),
  ).toEqual(settled.ledger.filter((t) => t.roundId === settled.round!.id));
  expect(settled.balance).toBe(f.s.balance);
});

test("reduced motion reaches the same authoritative settlement with no flying chips", async ({
  page,
}) => {
  const f = await begin(page, ["10", "6", "9", "10", "10"], {
    speed: "normal",
    reducedMotion: true,
  });
  const expected = f.apply(f.s, {
    type: "action",
    action: "stand",
    handId: f.s.round!.active!,
  });
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator("[data-hand-result]")).toHaveText("+$25");
  await expect(page.locator(".wager-flight")).toHaveCount(0);
  await expect(page.locator("[data-wager-id] .normalized-stack")).toHaveCount(
    0,
  );
  expect((await snapshot(page)).balance).toBe(expected.balance);
  expect((await snapshot(page)).round!.net).toBe(expected.round!.net);
});

test("twelve settled hands with six side bets keep independent totals and outcomes in bounds", async ({
  page,
}) => {
  const f = fixture([
    "8",
    "8",
    "8",
    "6",
    "8",
    "8",
    "8",
    "10",
    ...Array(18).fill("8"),
  ]);
  let s = f.state;
  s.ledgerBase += 8000;
  s.balance += 8000;
  for (let p = 0; p < 3; p++)
    for (const kind of ["main", "pairs", "three"] as const)
      s = f.apply(s, {
        type: "chip",
        position: p,
        kind,
        chip: kind === "main" ? 25 : 5,
      });
  s = f.apply(s, { type: "deal" });
  const { legalActions } = await import(
    "../../apps/blackjack-trainer/src/engine/engine"
  );
  while (s.round!.hands.length < 12)
    s = f.apply(s, {
      type: "action",
      action: legalActions(s).includes("split") ? "split" : "stand",
      handId: s.round!.active!,
    });
  while (!between(s))
    s = f.apply(s, {
      type: "action",
      action: "stand",
      handId: s.round!.active!,
    });
  await install(page, s, { weights: true });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 800],
    [844, 390],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    await expect(page.locator("[data-hand-total]")).toHaveCount(12);
    await expect(page.locator("[data-hand-result]")).toHaveCount(12);
    await expect(page.locator("[data-round-side]")).toHaveCount(6);
    const result = await page.locator(".table-stage").evaluate((el) => {
      const box = el.getBoundingClientRect(),
        rects = Array.from(
          el.querySelectorAll(
            "[data-hand-total],[data-hand-result],[data-round-side]",
          ),
        ).map((e) => e.getBoundingClientRect());
      return {
        inside: rects.every(
          (r) =>
            r.left >= box.left &&
            r.right <= box.right &&
            r.top >= box.top &&
            r.bottom <= box.bottom,
        ),
        overlap: rects.some((r, i) =>
          rects
            .slice(i + 1)
            .some(
              (b) =>
                r.left < b.right &&
                r.right > b.left &&
                r.top < b.bottom &&
                r.bottom > b.top,
            ),
        ),
      };
    });
    await page.screenshot({
      path: "test-results/hand-twelve-settled-" + width + ".png",
    });
    expect(result, JSON.stringify({ width, ...result })).toEqual({
      inside: true,
      overlap: false,
    });
  }
  expect((await snapshot(page)).revision).toBe(s.revision);
});
