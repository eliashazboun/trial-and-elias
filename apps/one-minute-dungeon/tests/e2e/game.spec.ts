import { test, expect, type Page } from "@playwright/test";
import { solve } from "../routePilot";
import { C } from "../../src/game/config";
import { defaults, recordKey } from "../../src/storage/schemas";
import { STORAGE_KEY } from "../../src/storage/StorageManager";
import { makeRecord } from "../../src/game/systems/RunManager";
import type { RunState } from "../../src/game/types";
const state = async (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          __DUNGEON__: {
            state: RunState;
            mode: string;
            ghost: number;
            options: { seed: number };
          };
        }
      ).__DUNGEON__,
  );
test("menu, live movement, attack, dash, pause invalidation, instant restart and local history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "Enter the crypt" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/menu.png", fullPage: true });
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  await expect(page.locator("#countdown")).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).totals.attempts,
      STORAGE_KEY,
    ),
  ).toBe(1);
  const start = await state(page);
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  expect((await state(page)).state.player.x).toBeGreaterThan(
    start.state.player.x + 10,
  );
  await page.mouse.move(850, 350);
  await page.mouse.click(850, 350);
  await expect
    .poll(async () => (await state(page)).state.player.attackAt)
    .toBeGreaterThan(0);
  await page.keyboard.press("Space");
  await expect
    .poll(async () => (await state(page)).state.player.dashAt)
    .toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/gameplay.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByText("Run paused.")).toBeVisible();
  const paused = (await state(page)).state.tick;
  await page.waitForTimeout(200);
  expect((await state(page)).state.tick).toBe(paused);
  expect((await state(page)).state.valid).toBe(false);
  await page.getByRole("button", { name: "Resume run" }).click();
  await page.keyboard.press("r");
  await expect
    .poll(async () => (await state(page)).state.tick)
    .toBeLessThan(100);
  expect((await state(page)).state.valid).toBe(true);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).totals.attempts,
      STORAGE_KEY,
    ),
  ).toBe(2);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Return to menu" }).click();
  await page.getByRole("button", { name: "Statistics", exact: true }).click();
  await expect(page.getByText("RECENT RUNS")).toBeVisible();
  expect(errors).toEqual([]);
});
test("remaps controls, rejects conflicts, persists accessibility and audio settings", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator('[data-binding="up"]').click();
  await page.keyboard.press("s");
  await expect(
    page.getByText("Already assigned to Move down. Choose another key."),
  ).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-binding="up"]')).toHaveText("Up");
  await page.getByText("Reduced visual effects", { exact: true }).check();
  await page.getByText("Mute all audio", { exact: true }).check();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator('[data-binding="up"]')).toHaveText("Up");
  await expect(page.locator('[data-setting="reduced"]')).toBeChecked();
  await expect(page.locator('[data-setting="mute"]')).toBeChecked();
  await page.getByRole("button", { name: "← Back" }).click();
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  const before = (await state(page)).state.player.y;
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(200);
  await page.keyboard.up("ArrowUp");
  expect((await state(page)).state.player.y).toBeLessThan(before - 10);
});
test("views a validated successful PB replay and races its passive ghost without changing records", async ({
  page,
}) => {
  const { sim, recorder } = solve(C.standardSeed, true);
  const replay = recorder.finish(sim),
    save = defaults(),
    key = recordKey("fixed", "standard");
  const record = makeRecord(sim);
  save.best[key] = record;
  save.replays[key] = replay;
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, data), {
    key: STORAGE_KEY,
    data: JSON.stringify(save),
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Replays", exact: true }).click();
  await page.getByRole("button", { name: "Watch replay" }).click();
  await expect(
    page.locator("[data-action=replay-pause]"),
    (await page.locator("#toast").textContent()) ?? "Replay did not open",
  ).toBeVisible({ timeout: 3000 });
  await page.getByLabel("Replay speed").selectOption("4");
  await expect
    .poll(async () => (await state(page)).state.status, { timeout: 15000 })
    .toBe("won");
  await expect(page.locator("#replay-status")).not.toContainText("diverged");
  const panel = await page.locator(".run-sidebar").boundingBox();
  const playerPoint = await page.evaluate(
    () =>
      (
        window as unknown as {
          __DUNGEON__: { screenPlayer: { x: number; y: number } };
        }
      ).__DUNGEON__.screenPlayer,
  );
  expect(
    panel &&
      playerPoint.x >= panel.x &&
      playerPoint.x <= panel.x + panel.width &&
      playerPoint.y >= panel.y &&
      playerPoint.y <= panel.y + panel.height,
  ).toBe(false);
  await page.screenshot({ path: "test-results/escape-replay.png" });
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).totals.attempts,
    STORAGE_KEY,
  );
  expect(saved).toBe(0);
  await page.getByRole("button", { name: "Close replay" }).click();
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  expect((await state(page)).ghost).toBe(replay.ticks + 1);
  await page.keyboard.press("g");
  await expect(page.locator("#ghost-status")).toContainText("GHOST OFF");
  expect((await state(page)).options.seed).toBe(C.standardSeed);
});
test("offers one Play mode and restarts the same reproducible dungeon", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /Randomized|Challenges|Pacifist/i }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  const seed = (await state(page)).options.seed;
  await expect(page.locator("#objectives")).toContainText(
    "Enemies remaining: 4",
  );
  await expect(page.locator("#diamond-hud")).toContainText("0 / 6");
  await page.keyboard.press("r");
  expect((await state(page)).options.seed).toBe(seed);
  expect((await state(page)).state.bossShielded).toBe(true);
  expect(
    (await state(page)).state.loot.filter((d) => !d.collected),
  ).toHaveLength(6);
});

test("aim stays accurate after resize and at a high device pixel ratio; loaded gameplay works offline", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 900, height: 650 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.waitForTimeout(200);
  const point = await page.evaluate(
    () =>
      (
        window as unknown as {
          __DUNGEON__: { screenPlayer: { x: number; y: number } };
        }
      ).__DUNGEON__.screenPlayer,
  );
  await page.mouse.click(point.x + 70, point.y);
  await expect
    .poll(async () => Math.abs((await state(page)).state.player.attackAngle))
    .toBeLessThan(0.03);
  await context.setOffline(true);
  const before = (await state(page)).state.player.x;
  await page.keyboard.down("d");
  await page.waitForTimeout(150);
  await page.keyboard.up("d");
  expect((await state(page)).state.player.x).toBeGreaterThan(before + 10);
  await page.keyboard.press("r");
  expect((await state(page)).state.valid).toBe(true);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).totals.attempts,
      STORAGE_KEY,
    ),
  ).toBe(2);
  expect(errors).toEqual([]);
  await context.close();
});

test("diamond pickups refund ranked time, pause freezes the combo, and retry restores all six", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  const target = (await state(page)).state.loot[0]!;
  for (const axis of ["x", "y"] as const) {
    const before = (await state(page)).state.player[axis],
      delta = target[axis] - before;
    const key = axis === "x" ? (delta > 0 ? "d" : "a") : delta > 0 ? "s" : "w";
    await page.keyboard.down(key);
    await expect
      .poll(
        async () =>
          Math.abs((await state(page)).state.player[axis] - target[axis]),
        { intervals: [15], timeout: 2500 },
      )
      .toBeLessThan(9);
    await page.keyboard.up(key);
  }
  await expect.poll(async () => (await state(page)).state.lootCount).toBe(1);
  const picked = (await state(page)).state;
  expect(picked.combo).toBe(1);
  expect(picked.refundTicks).toBeGreaterThan(0);
  expect(picked.tick - picked.refundTicks).toBeGreaterThanOrEqual(0);
  await expect(page.locator("#diamond-hud")).toContainText("COMBO ×1");
  await expect(page.locator("#ranked")).toContainText("RANKED");
  await expect(page.locator("#toast")).toContainText("refund");
  await page.screenshot({ path: "test-results/diamond-refund.png" });
  await page.keyboard.press("Escape");
  const paused = (await state(page)).state;
  await page.waitForTimeout(200);
  expect((await state(page)).state.tick).toBe(paused.tick);
  expect((await state(page)).state.combo).toBe(paused.combo);
  expect((await state(page)).state.lastDiamondTick).toBe(
    paused.lastDiamondTick,
  );
  await page.getByRole("button", { name: "Resume run" }).click();
  await page.keyboard.press("r");
  expect((await state(page)).state.refundTicks).toBe(0);
  expect((await state(page)).state.combo).toBe(0);
  expect((await state(page)).state.loot.every((d) => !d.collected)).toBe(true);
});

test("reproduces a protected-boss death with visible shield warnings and no record mutation", async ({
  page,
}) => {
  const { sim, recorder } = solve(C.standardSeed, false, 0, true);
  expect(sim.state.cause).toBe("Struck the shielded guardian.");
  const save = defaults(),
    key = recordKey("fixed", "standard");
  save.replays[key] = recorder.finish(sim);
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, data), {
    key: STORAGE_KEY,
    data: JSON.stringify(save),
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Replays", exact: true }).click();
  await page.getByRole("button", { name: "Watch replay" }).click();
  await page.getByLabel("Replay speed").selectOption("4");
  await expect
    .poll(async () => (await state(page)).state.cause, { timeout: 15000 })
    .toBe("Struck the shielded guardian.");
  expect((await state(page)).state.bossShielded).toBe(true);
  await expect(page.locator("#boss-warning")).toContainText(
    "STRIKING THE SHIELD IS FATAL",
  );
  await page.screenshot({ path: "test-results/guardian-shield.png" });
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).totals.attempts,
      STORAGE_KEY,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Close replay" }).click();
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  expect((await state(page)).state.status).toBe("running");
});

test("renders verified escape results with actual, applied refund and ranked breakdowns", async ({
  page,
}) => {
  const { sim } = solve(C.standardSeed, true),
    record = makeRecord(sim);
  expect(record.won).toBe(true);
  await page.goto("./");
  await page.getByRole("button", { name: "Enter the crypt" }).waitFor();
  await page.evaluate(async (record) => {
    const uiPath = "/one-minute-dungeon/src/ui/UI.ts",
      storagePath = "/one-minute-dungeon/src/storage/StorageManager.ts",
      simPath = "/one-minute-dungeon/src/game/systems/Simulation.ts";
    const [{ UI }, { StorageManager }, { Simulation }] = await Promise.all([
      import(uiPath),
      import(storagePath),
      import(simPath),
    ]);
    // Isolated presentation fixture; it neither changes the live simulation nor commits progress.
    const root = document.createElement("div");
    root.id = "results-fixture";
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      zIndex: "20",
      background: "#0b111b",
    });
    document.body.append(root);
    const game = {
      storage: new StorageManager(null),
      sim: new Simulation(record.options),
      mode: "results",
      ghostMessage: "",
      phaser: { scale: { width: window.innerWidth } },
    };
    new UI(game, root).results(record, { pb: true, unlocked: [] });
  }, record);
  const root = page.locator("#results-fixture");
  await expect(root.locator("#result-actual")).toHaveText(
    (record.ticks / C.hz).toFixed(2) + "s",
  );
  await expect(root.locator("#result-refunds")).toHaveText(
    "−" + (record.refundTicks / C.hz).toFixed(2) + "s",
  );
  await expect(root.locator("#result-ranked")).toHaveText(
    (record.rankedTicks / C.hz).toFixed(2) + "s",
  );
  await expect(root).toContainText("BEST COMBO");
  await page.screenshot({ path: "test-results/ranked-results.png" });
});
