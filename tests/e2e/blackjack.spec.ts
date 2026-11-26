import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { legalActions } from "../../apps/blackjack-trainer/src/engine/engine";
import { fixture, install, snapshot, errors } from "./blackjack-fixtures";
const URL = "/blackjack-trainer/";
test("blackjack is discoverable and completes a saved split/double round with exact ledger and distinct site storage", async ({
  page,
}) => {
  const failures = errors(page),
    f = fixture();
  await install(page, f.state);
  await page.evaluate(() => {
    localStorage.setItem("nato-phonetic-trainer-results", "retained trainer");
    localStorage.setItem("one-minute-dungeon:v1", "retained game");
  });
  await page
    .getByRole("button", { name: "Position 1 Main: 0", exact: true })
    .first()
    .click();
  await expect(page.locator(".wallet-button strong")).toHaveText("975");
  await page.getByRole("button", { name: "Deal", exact: true }).click();
  await expect(page.locator(".floating-actions")).toHaveCount(1);
  await expect(page.locator(".dealer-summary")).toContainText("Face down");
  const before = await snapshot(page);
  expect(before.shoe.revealed).toHaveLength(3);
  await page.reload();
  await expect(page.locator(".table-canvas canvas")).toHaveCount(1);
  const after = await snapshot(page);
  expect(after).toEqual(before);
  await page.getByRole("button", { name: "Split", exact: true }).click();
  await expect(page.locator(".on-table-hand")).toHaveCount(2);
  await page.getByRole("button", { name: "Double", exact: true }).click();
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator(".round-net")).toBeVisible();
  const settled = await snapshot(page);
  expect(settled.totals.hands).toBe(2);
  expect(
    settled.ledgerBase + settled.ledger.reduce((a, t) => a + t.amount, 0),
  ).toBe(settled.balance);
  await page.reload();
  expect((await snapshot(page)).balance).toBe(settled.balance);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("nato-phonetic-trainer-results"),
    ),
  ).toBe("retained trainer");
  expect(
    await page.evaluate(() => localStorage.getItem("one-minute-dungeon:v1")),
  ).toBe("retained game");
  await page.getByRole("link", { name: "Trial & Elias", exact: true }).click();
  await expect(page.locator("#projects .card")).toHaveCount(4);
  await page.getByRole("link", { name: "Take a Seat" }).click();
  await expect(page.locator(".table-canvas canvas")).toHaveCount(1);
  expect(failures).toEqual([]);
});
test("insurance peek pays half-chip insurance correctly and reveals the hole card once", async ({
  page,
}) => {
  const f = fixture(["A", "A", "K", "K"]);
  let s = f.apply(f.state, {
    type: "chip",
    position: 0,
    kind: "main",
    chip: 25,
  });
  s = f.apply(s, { type: "deal" });
  await install(page, s);
  await expect(page.locator(".dealer-summary")).toContainText("Face down");
  await page.getByRole("button", { name: "Insure 12.5", exact: true }).click();
  await expect(page.locator(".round-net")).toBeVisible();
  const state = await snapshot(page);
  expect(state.balance).toBe(2050);
  expect(state.shoe.revealed).toHaveLength(4);
  expect(state.round!.hands[0]!.outcome).toBe("PUSH");
  await page.reload();
  expect((await snapshot(page)).balance).toBe(2050);
});
test("all twelve hands remain inspectable across desktop, portrait and landscape sizes without changing the round", async ({
  page,
}) => {
  const f = fixture(),
    cards = f.state.shoe.cards,
    eights = cards.filter((c) => c.rank === "8"),
    six = cards.find((c) => c.rank === "6")!,
    ten = cards.find((c) => c.rank === "10")!;
  const first = [
    ...eights.slice(0, 3),
    six,
    ...eights.slice(3, 6),
    ten,
    ...eights.slice(6),
  ];
  f.state.shoe.cards = [
    ...first,
    ...cards.filter((c) => !first.some((x) => x.id === c.id)),
  ];
  f.state.balance = 10000;
  f.state.ledgerBase = 8000;
  let s = f.state;
  for (let p = 0; p < 3; p++)
    s = f.apply(s, { type: "chip", position: p, kind: "main", chip: 25 });
  s = f.apply(s, { type: "deal" });
  while (s.round!.hands.length < 12) {
    s = f.apply(s, {
      type: "action",
      action: legalActions(s).includes("split") ? "split" : "stand",
      handId: s.round!.active!,
    });
  }
  const failures = errors(page);
  await install(page, s);
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [320, 568],
    [360, 800],
    [390, 844],
    [430, 932],
    [667, 375],
    [844, 390],
    [932, 430],
    [768, 1024],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    await expect(page.locator(".on-table-hand")).toHaveCount(12);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Stand", exact: true }),
    ).toBeEnabled();
    expect((await snapshot(page)).revision).toBe(s.revision);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `test-results/blackjack-twelve-${width}.png`,
        fullPage: true,
      });
  }
  expect(failures).toEqual([]);
});
test("single writer prevents a second tab spending or claiming; closing the owner allows recovery", async ({
  page,
  context,
}) => {
  const f = fixture();
  await install(page, f.state);
  const second = await context.newPage();
  await second.goto(URL);
  await expect(second.getByRole("alert")).toContainText("Another tab");
  expect(await second.locator(".table-canvas canvas").count()).toBe(0);
  await page.close();
  await expect(async () => {
    await second.getByRole("button", { name: "Retry saved table" }).click();
    await expect(second.locator(".table-canvas canvas")).toHaveCount(1, {
      timeout: 1000,
    });
  }).toPass({ timeout: 12000, intervals: [1000, 2000] });
});
test("strategy, tutorials, skipped count checks, settings, JSON export and malformed imports work", async ({
  page,
}) => {
  const failures = errors(page),
    f = fixture();
  await install(page, f.state);
  await page.getByRole("button", { name: "Learn", exact: true }).click();
  await page.getByLabel("A + 6 + 10 has what total?").selectOption("17");
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(page.getByRole("status")).toContainText("Lesson completed");
  await page.getByRole("button", { name: "Close panel" }).click();
  expect((await snapshot(page)).achievements["First Lesson"]).toBeTruthy();
  await page
    .getByRole("button", { name: "Basic strategy", exact: true })
    .click();
  await expect(page.locator(".strategy-chart")).toHaveCount(3);
  expect(
    await page
      .locator(".table-canvas canvas")
      .evaluate(
        (c) =>
          c.getBoundingClientRect().width <=
          c.parentElement!.getBoundingClientRect().width + 1,
      ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close panel" }).click();
  await page.getByRole("button", { name: "Count check", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skipped" })).toBeVisible();
  await expect(page.locator(".count-popover")).not.toContainText(
    "Correct count:",
  );
  await page.getByRole("button", { name: "Close count check" }).click();
  expect((await snapshot(page)).totals.counts).toBe(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Felt theme").selectOption("burgundy");
  await page.getByLabel("Card back").selectOption("scholar");
  await page.getByRole("button", { name: "Data", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON backup" }).click();
  const backupDownload = await download;
  expect(backupDownload.suggestedFilename()).toBe("blackjack-backup.json");
  const backupText = await readFile((await backupDownload.path())!, "utf8");
  const before = await snapshot(page);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"bad"}'),
  });
  await expect(page.getByRole("alert")).toContainText("Backup rejected");
  expect((await snapshot(page)).balance).toBe(before.balance);
  await page.locator("input[type=file]").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });
  await page
    .getByRole("button", { name: "Confirm restore", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm restore", exact: true }),
  ).toHaveCount(0);
  expect((await snapshot(page)).revision).toBeGreaterThan(before.revision);
  expect(failures).toEqual([]);
});
test("unavailable IndexedDB fails safely and does not create a fake wallet", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw Error("Storage disabled for test");
      },
    });
  });
  await page.goto(URL);
  await expect(page.getByRole("alert")).toContainText(
    "Existing data has been left unchanged",
  );
  await expect(page.locator(".table-canvas canvas")).toHaveCount(0);
});

test("educational feedback survives persistence and confirmation exposure retains the first attempt", async ({
  page,
  context,
}) => {
  const f = fixture();
  let state = f.apply(f.state, {
    type: "chip",
    position: 0,
    kind: "main",
    chip: 25,
  });
  state = f.apply(state, { type: "deal" });
  await install(page, state, { feedback: "educational" });
  await page.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(page.locator(".on-table-message").first()).toContainText(
    "SPLIT",
  );
  await page.close();
  const next = await context.newPage();
  await install(next, state, { feedback: "confirm" });
  await next.getByRole("button", { name: "Stand", exact: true }).click();
  await expect(next.getByRole("dialog")).toContainText("Review your decision");
  await next.getByRole("button", { name: "Choose again", exact: true }).click();
  await next.getByRole("button", { name: "Split", exact: true }).click();
  await expect(next.locator(".on-table-hand")).toHaveCount(2);
  const saved = await snapshot(next);
  expect(saved.round!.decisions[0]).toMatchObject({
    firstSelected: "stand",
    selected: "split",
    assistance: { warning: true },
  });
});
