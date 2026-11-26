import { test, expect } from "@playwright/test";
import { fixture, install, snapshot, errors } from "./blackjack-fixtures";
import { legalActions } from "../../apps/blackjack-trainer/src/engine/engine";
const spot = (
  page: import("@playwright/test").Page,
  p: number,
  kind = "main",
) => page.locator(`[data-betspot="${p}:${kind}"]`);
function dealt(order?: Parameters<typeof fixture>[0]) {
  const f = fixture(order);
  let s = f.apply(f.state, {
    type: "chip",
    position: 0,
    kind: "main",
    chip: 25,
  });
  s = f.apply(s, { type: "deal" });
  return { ...f, s };
}
function completed(order?: Parameters<typeof fixture>[0]) {
  const f = dealt(order);
  while (f.s.round!.phase === "player" || f.s.round!.phase === "insurance") {
    f.s =
      f.s.round!.phase === "insurance"
        ? f.apply(f.s, { type: "insurance", position: 0, choice: "decline" })
        : f.apply(f.s, {
            type: "action",
            action: "stand",
            handId: f.s.round!.active!,
          });
  }
  return f;
}
test("rapid alternating occupied spots preserve every placement, selection and normalized undo", async ({
  page,
}) => {
  const f = fixture(),
    failures = errors(page);
  await install(page, f.state);
  await page.evaluate(() => {
    const order = [0, 1, 2, 0];
    for (let n = 0; n < 3; n++)
      for (const p of order)
        (
          document.querySelector(
            `[data-betspot="${p}:main"]`,
          ) as HTMLButtonElement
        ).click();
  });
  await expect
    .poll(async () => (await snapshot(page)).bets.map((b) => b.main.length))
    .toEqual([6, 3, 3]);
  expect((await snapshot(page)).ledger).toEqual(f.state.ledger);
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("150");
  expect(await spot(page, 0).locator('[data-denomination="100"]').count()).toBe(
    1,
  );
  await page.getByRole("button", { name: "1 chip", exact: true }).click();
  await page.evaluate(() => {
    for (let n = 0; n < 8; n++)
      for (const p of [0, 1, 2])
        for (const kind of ["main", "pairs", "three"])
          (
            document.querySelector(
              `[data-betspot="${p}:${kind}"]`,
            ) as HTMLButtonElement
          ).click();
  });
  await expect
    .poll(async () => (await snapshot(page)).bets.map((b) => b.pairs.length))
    .toEqual([8, 8, 8]);
  expect((await snapshot(page)).bets.map((b) => b.main.length)).toEqual([
    14, 11, 11,
  ]);
  await spot(page, 0).click({ button: "right" });
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("157");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("158");
  expect(failures).toEqual([]);
});
test("seven denominations update affordability from pending reservations and disabled chips cannot place", async ({
  page,
}) => {
  await install(page, fixture().state);
  await expect(page.locator(".rack-chip")).toHaveCount(7);
  await expect(
    page.getByRole("button", { name: "1,000 chip", exact: true }),
  ).toBeEnabled();
  await spot(page, 0).click();
  await expect(
    page.getByRole("button", {
      name: "1,000 chip, insufficient available chips",
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: "5,000 chip, insufficient available chips",
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "1,000 chip", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "1,000 chip", exact: true }).click();
  await spot(page, 1).click();
  await expect(spot(page, 1).locator(".stack-total")).toHaveText("1,000");
  await expect(page.locator(".rack-chip:not(:disabled)")).toHaveCount(0);
});
test("native chip dragging places once and an invalid canceled drop does not reserve funds", async ({
  page,
}) => {
  await install(page, fixture().state);
  const chip = page.getByRole("button", { name: "25 chip", exact: true }),
    target = spot(page, 2);
  const a = (await chip.boundingBox())!,
    b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(target.locator(".stack-total")).toHaveText("25");
  expect((await snapshot(page)).bets[2]!.main).toEqual([25]);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(8, 8, { steps: 10 });
  await page.mouse.up();
  expect((await snapshot(page)).bets[2]!.main).toEqual([25]);
});
test("mobile long-press removes only the latest spot placement without a second tap", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await install(page, fixture().state);
  for (let i = 0; i < 4; i++) await spot(page, 0).tap();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("100");
  const b = (await spot(page, 0).boundingBox())!,
    cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
  });
  await page.waitForTimeout(650);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(100);
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("75");
  await page.getByRole("button", { name: "Undo", exact: true }).tap();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("100");
  await context.close();
});
test("rebet, doubled review and explicit rebet/deal are immediately on the settled table", async ({
  page,
}) => {
  const f = completed();
  await install(page, f.s);
  await page.getByRole("button", { name: "Double bet", exact: true }).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("50");
  expect((await snapshot(page)).round).toBeNull();
  await page.getByRole("button", { name: "Rebet", exact: true }).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("25");
  await page.getByRole("button", { name: "Rebet & Deal", exact: true }).click();
  await expect(page.locator(".floating-actions")).toHaveCount(1);
  expect((await snapshot(page)).round!.id).not.toBe(f.s.round!.id);
});
test("hint is concealed for 2999 ms, appears at 3000 ms, and restarts after a hit", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.clock.pauseAt(new Date());
  const f = dealt();
  await install(page, f.s, { strategy: true, highlight: true });
  await expect(
    page.locator(".floating-actions .strategy-suggestion"),
  ).toHaveCount(0);
  await page.clock.runFor(2999);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Split", exact: true }),
  ).toHaveClass(/strategy-suggestion/);
  await page.getByRole("button", { name: "Hit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hit", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
  await page.clock.runFor(2999);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(
    page.getByRole("button", { name: "Stand", exact: true }),
  ).toHaveClass(/strategy-suggestion/);
  expect((await snapshot(page)).round!.decisions[0]!.assistance).toMatchObject({
    recommendation: true,
    strategyEnabled: true,
  });
});
test("acting before the delay is independent; no stale recommendation appears after settlement", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.clock.pauseAt(new Date());
  const f = dealt();
  await install(page, f.s, { strategy: true });
  await page.clock.runFor(2999);
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator(".round-net")).toBeVisible();
  expect((await snapshot(page)).round!.decisions[0]!.assistance).toMatchObject({
    recommendation: false,
    strategyEnabled: true,
  });
  await page.clock.runFor(6000);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
});
test("disabling assistance cancels the timer and unavailable doubles highlight the legal fallback", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.clock.pauseAt(new Date());
  const f = dealt(["5", "6", "5", "10", "9"]);
  f.s.balance = 0;
  f.s.ledgerBase -= f.state.balance - 50;
  await install(page, f.s, { strategy: true });
  await expect(
    page.getByRole("button", { name: "Double", exact: true }),
  ).toBeDisabled();
  await page.clock.runFor(3000);
  await expect(
    page.getByRole("button", { name: "Hit", exact: true }),
  ).toHaveClass(/strategy-suggestion/);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await page.getByLabel("Basic strategy indicator", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.clock.runFor(6000);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
});
for (const [answer, order] of [
  [0, ["10", "7", "8", "9", "5"]],
  [-1, ["K", "K", "Q", "5", "3"]],
] as const)
  test(`anchored count check grades ${answer} and eye masking preserves counting state`, async ({
    page,
  }) => {
    const f = completed([...order]);
    expect(f.s.shoe.running).toBe(answer);
    await install(page, f.s);
    const concealed = page.getByLabel("Running count concealed", {
      exact: true,
    });
    await expect(concealed).toHaveText("•••");
    await page
      .getByRole("button", { name: "Show running count", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Hide running count", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Hide running count", exact: true })
      .click();
    expect((await snapshot(page)).shoe).toEqual(f.s.shoe);
    await page
      .getByRole("button", { name: "Count check", exact: true })
      .click();
    await expect(page.locator(".count-popover")).toBeVisible();
    await expect(
      page.getByLabel("Your running count", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Check answer", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".count-popover")).toContainText(
      "10 completed rounds",
    );
    expect((await snapshot(page)).countTraining.hiddenRounds).toBe(0);
  });
test("all twelve hands and every exposed weight remain on table across the required viewports", async ({
  page,
}) => {
  const f = fixture(),
    eights = f.state.shoe.cards.filter((c) => c.rank === "8"),
    six = f.state.shoe.cards.find((c) => c.rank === "6")!,
    ten = f.state.shoe.cards.find((c) => c.rank === "10")!;
  const first = [
    ...eights.slice(0, 3),
    six,
    ...eights.slice(3, 6),
    ten,
    ...eights.slice(6),
  ];
  f.state.shoe.cards = [
    ...first,
    ...f.state.shoe.cards.filter((c) => !first.some((x) => x.id === c.id)),
  ];
  f.state.balance = 10000;
  f.state.ledgerBase = 8000;
  let s = f.state;
  for (let p = 0; p < 3; p++)
    s = f.apply(s, { type: "chip", position: p, kind: "main", chip: 25 });
  s = f.apply(s, { type: "deal" });
  while (s.round!.hands.length < 12)
    s = f.apply(s, {
      type: "action",
      action: legalActions(s).includes("split") ? "split" : "stand",
      handId: s.round!.active!,
    });
  await install(page, s, { weights: true });
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
    [844, 390],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(250);
    await expect(page.locator(".on-table-hand")).toHaveCount(12);
    await expect(page.locator("[data-card-weight]")).toHaveCount(
      s.round!.hands.reduce((total, h) => total + h.cards.length, 0) + 1,
    );
    await expect(page.locator(".floating-actions")).toHaveCount(1);
    const result = await page.locator(".table-stage").evaluate((stage) => {
      const box = stage.getBoundingClientRect();
      const inside = (r: DOMRect) =>
        r.left >= box.left - 1 &&
        r.top >= box.top - 1 &&
        r.right <= box.right + 1 &&
        r.bottom <= box.bottom + 1;
      const interactive = Array.from(
        stage.querySelectorAll("button:not(:disabled)"),
      )
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height);
      const badges = Array.from(
        stage.querySelectorAll("[data-card-weight]"),
      ).map((el) => el.getBoundingClientRect());
      const overlaps = badges.some((a, i) =>
        badges
          .slice(i + 1)
          .some(
            (b) =>
              a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top,
          ),
      );
      return {
        controls: interactive.every(inside),
        badges: badges.every(inside),
        overlaps,
        horizontal: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(result).toEqual({
      controls: true,
      badges: true,
      overlaps: false,
      horizontal: false,
    });
    expect((await snapshot(page)).revision).toBe(s.revision);
    await page.screenshot({
      path: `test-results/overhaul-twelve-${width}.png`,
    });
  }
});

test("count submissions without prior visible help are independent", async ({
  page,
}) => {
  const f = completed(["10", "7", "8", "9", "5"]);
  f.s.countTraining.hiddenRounds = 10;
  await install(page, f.s);
  await page.getByRole("button", { name: "Count check", exact: true }).click();
  await page.getByLabel("Your running count", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".count-popover")).toContainText("Correct");
  const checks = (await snapshot(page)).checks;
  expect(checks[checks.length - 1]).toMatchObject({
    correct: true,
    assisted: false,
  });
});
test("Double Bet doubles pending wagers before any previous round exists", async ({
  page,
}) => {
  await install(page, fixture().state);
  await spot(page, 0).click();
  await page.getByRole("button", { name: "Double bet", exact: true }).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("50");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("25");
});

test("large three-position wagers, ordinary hands, settlement and count popover remain readable", async ({
  page,
}) => {
  const f = fixture();
  f.state.balance = 400000;
  f.state.ledgerBase += 398000;
  await install(page, f.state);
  await page.getByRole("button", { name: "5,000 chip", exact: true }).click();
  await page.evaluate(() => {
    for (let p = 0; p < 3; p++)
      for (let n = 0; n < 10; n++)
        (
          document.querySelector(
            '[data-betspot="' + p + ':main"]',
          ) as HTMLButtonElement
        ).click();
  });
  for (let p = 0; p < 3; p++)
    await expect(spot(page, p).locator(".stack-total")).toHaveText("50,000");
  await page.screenshot({ path: "test-results/overhaul-large-wagers.png" });
  await page.getByRole("button", { name: "Deal", exact: true }).click();
  await expect(page.locator(".on-table-hand")).toHaveCount(3);
  await page.screenshot({ path: "test-results/overhaul-ordinary-play.png" });
  while ((await snapshot(page)).round?.phase === "player") {
    await page.getByRole("button", { name: "Stand", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Stand", exact: true }),
    ).toHaveCount((await snapshot(page)).round?.phase === "player" ? 1 : 0);
  }
  await expect(page.locator(".round-net")).toBeVisible();
  await page.screenshot({ path: "test-results/overhaul-settlement.png" });
  await page.getByRole("button", { name: "Count check", exact: true }).click();
  await expect(page.locator(".count-popover")).toContainText(
    "10 completed rounds",
  );
  await page.screenshot({ path: "test-results/overhaul-count-popover.png" });
});

test("normal-speed deal finishes presentation before the three-second hint countdown", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.clock.pauseAt(new Date());
  await install(page, fixture().state, {
    strategy: true,
    highlight: true,
    speed: "normal",
  });
  await spot(page, 0).click();
  await expect(spot(page, 0).locator(".stack-total")).toHaveText("25");
  await page.getByRole("button", { name: "Deal", exact: true }).click();
  await expect
    .poll(async () => (await snapshot(page)).round?.phase)
    .toBe("player");
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
  // Run one presentation frame at a time, letting each persisted event publish.
  for (
    let n = 0;
    n < 40 &&
    !(await page.getByRole("button", { name: "Hit", exact: true }).count());
    n++
  )
    await page.clock.runFor(100);
  await expect(
    page.getByRole("button", { name: "Hit", exact: true }),
  ).toBeEnabled();
  await page.clock.runFor(2899);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(0);
  await page.clock.runFor(101);
  await expect(page.locator(".strategy-suggestion")).toHaveCount(1);
});
