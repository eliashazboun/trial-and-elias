import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ALPHABET, type QuizResult } from "../../apps/nato-trainer/src/quiz";
const TRAINER = "/nato-phonetic-alphabet-trainer/",
  GAME = "/one-minute-dungeon/",
  KEY = "nato-phonetic-trainer-results";
const words = new Map(ALPHABET.map((entry) => [entry.letter, entry.correct]));
function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      ["script", "stylesheet", "font", "image"].includes(
        response.request().resourceType(),
      ) &&
      !response.url().endsWith("/favicon.ico")
    )
      errors.push(response.status() + " " + response.url());
  });
  return errors;
}
function record(id: string, score: number, durationMs: number): QuizResult {
  return {
    id,
    date: "2026-11-24T12:00:00.000Z",
    score,
    total: 26,
    durationMs,
    answers: ALPHABET.map((entry, index) => ({
      letter: entry.letter,
      correct: entry.correct,
      selected: index >= score ? entry.incorrect[0]! : entry.correct,
      isCorrect: index < score,
      timeMs: 100,
    })),
  };
}
async function complete(page: Page, wrongFirst = false) {
  const seen = new Set<string>();
  for (let index = 0; index < 26; index++) {
    const letter = await page.locator(".text-8xl").textContent();
    expect(letter).not.toBeNull();
    expect(seen.has(letter!)).toBe(false);
    seen.add(letter!);
    const buttons = page.locator("button.relative");
    await expect(buttons).toHaveCount(3);
    const options = await buttons.locator("span.text-xl").allTextContents();
    const correctIndex = options.indexOf(words.get(letter!)!);
    expect(correctIndex).toBeGreaterThanOrEqual(0);
    const choice =
      wrongFirst && index === 0 ? (correctIndex + 1) % 3 : correctIndex;
    await page.clock.runFor(120);
    if (index % 2 === 0) await buttons.nth(choice).click();
    else await page.keyboard.press(String(choice + 1));
    await expect(buttons.nth(choice)).toBeDisabled();
    await expect(page.getByRole("status")).toContainText(
      wrongFirst && index === 0 ? "Incorrect." : "Correct!",
    );
    await page.keyboard.press(String(((choice + 1) % 3) + 1));
    await page.clock.runFor(599);
    await expect(page.locator(".text-8xl")).toHaveText(letter!);
    await page.clock.runFor(1);
    if (index < 25)
      await expect(page.locator(".text-8xl")).not.toHaveText(letter!);
  }
  expect(seen.size).toBe(26);
  await expect(
    page.getByRole("heading", { name: "Detailed Results", exact: true }),
  ).toBeVisible();
}
async function clock(page: Page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 60000));
}
test("preserves the original homepage appearance, content and navigation through the Worker", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle("Trial & Elias — A Collection of Experiments");
  await expect(page.locator("header .brand .blue")).toHaveCount(2);
  await expect(page.locator("#projects .card")).toHaveCount(3);
  await expect(
    page.locator("#projects .card").last().locator("a,button"),
  ).toHaveCount(0);
  await expect(page.locator("#year")).toHaveText(
    String(new Date().getFullYear()),
  );
  for (const section of ["header", ".hero"]) {
    const name = section === "header" ? "header" : "hero",
      baseline = path.resolve(".preservation", name + ".png");
    const screenshot = await page
      .locator(section)
      .screenshot({ path: "test-results/preserved-" + name + ".png" });
    if (fs.existsSync(baseline))
      expect(
        screenshot.equals(fs.readFileSync(baseline)),
        name + " should match the live homepage baseline exactly",
      ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/homepage-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explore Projects →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Things I've Built" }),
  ).toBeInViewport();
  await page.getByRole("link", { name: "What's This?", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Why Trial & Elias?" }),
  ).toBeInViewport();
  await page.getByRole("link", { name: "Give It a Try →" }).click();
  await expect(
    page.getByRole("heading", { name: "NATO Phonetic Trainer", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("main")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(241, 245, 249)");
  await page
    .getByRole("link", { name: "← Trial & Elias", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#projects$/);
  expect(
    await page
      .locator("html")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgb(248, 250, 252)");
  await page.getByRole("link", { name: "Enter the Dungeon →" }).click();
  await expect(
    page.getByRole("button", { name: "Enter the crypt" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "← Trial & Elias", exact: true })
    .click();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Enter the crypt" }),
  ).toBeVisible();
  await page.goForward();
  await expect(page.locator("#projects .card")).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#projects .grid")).toHaveCSS(
    "grid-template-columns",
    /^[0-9.]+px$/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/homepage-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("all direct routes refresh correctly, slash redirects preserve queries, and unknown routes return real 404s", async ({
  page,
  request,
}) => {
  for (const route of ["/", TRAINER, GAME]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect((await page.reload())?.status()).toBe(200);
  }
  for (const route of [TRAINER, GAME]) {
    const response = await request.get(
      route.slice(0, -1) + "?source=bookmark",
      { maxRedirects: 0 },
    );
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    const url = new URL(response.headers().location!, "http://127.0.0.1:8787");
    expect(url.pathname).toBe(route);
    expect(url.search).toBe("?source=bookmark");
  }
  for (const route of [
    "/does-not-exist/",
    "/one-minute-dungeon/does-not-exist",
    "/nato-phonetic-alphabet-trainer/does-not-exist",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "404 — Not found." }),
    ).toBeVisible();
  }
});
test("trainer completes all 26 questions, keeps exact feedback timing, prevents duplicate submissions and persists one result", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await clock(page);
  await page.goto(TRAINER);
  await expect(page.getByText("Sales Playbook")).toHaveCount(0);
  await page.getByRole("button", { name: "Start Training →" }).click();
  const first = await page.locator(".text-8xl").textContent();
  await page.evaluate(() => {
    for (const flags of [
      { repeat: true },
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { shiftKey: true },
    ])
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "1", bubbles: true, ...flags }),
      );
    const input = document.createElement("input");
    input.id = "typing-test";
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.press("1");
  await expect(page.locator("button.relative:disabled")).toHaveCount(0);
  await page.evaluate(() => document.getElementById("typing-test")?.remove());
  await expect(page.locator(".text-8xl")).toHaveText(first!);
  await complete(page);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].score).toBe(26);
  expect(saved[0].total).toBe(26);
  expect(saved[0].answers).toHaveLength(26);
  expect(saved[0].durationMs).toBe(26 * 720);
  expect(
    saved[0].answers.every(
      (answer: { timeMs: number }) => answer.timeMs === 120,
    ),
  ).toBe(true);
  await page.keyboard.press("1");
  await page.clock.runFor(1000);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).length,
      KEY,
    ),
  ).toBe(1);
  await page.screenshot({
    path: "test-results/trainer-perfect-results.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByText("26/26 Correct", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /26\/26 Correct/ }).click();
  await expect(
    page.getByRole("heading", { name: "Detailed Results" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Train Again →" }).click();
  await expect(page.locator(".text-8xl")).toBeVisible();
  expect(errors).toEqual([]);
});
test("trainer preserves old histories, excludes imperfect times from the perfect PB and reviews incorrect answers", async ({
  page,
}) => {
  const history = [
    record("fast-imperfect", 25, 1000),
    record("perfect", 26, 20000),
    record("older-perfect", 26, 30000),
  ];
  await page.addInitScript(
    ({ key, history }) => {
      if (!sessionStorage.getItem("legacy-loaded")) {
        localStorage.setItem(key, JSON.stringify(history));
        sessionStorage.setItem("legacy-loaded", "1");
      }
    },
    { key: KEY, history },
  );
  await clock(page);
  await page.goto(TRAINER);
  await expect(
    page.getByText("Best Perfect Time", { exact: true }).locator(".."),
  ).toContainText("00:20.0");
  await page.getByRole("button", { name: /25\/26 Correct/ }).click();
  await expect(
    page.getByText("Letters to Review", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your answer:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "View History" }).click();
  await page.getByRole("button", { name: "Start Training →" }).click();
  await complete(page, true);
  await expect(
    page.getByText("Letters to Review", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(saved).toHaveLength(4);
  expect(saved.slice(1)).toEqual(history);
  await page.getByRole("button", { name: "View History" }).click();
  await expect(
    page.getByText("Best Perfect Time", { exact: true }).locator(".."),
  ).toContainText("00:20.0");
});
test("trainer handles malformed history and touch input without secure-context APIs", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    launchOptions: undefined,
  } as Parameters<typeof browser.newContext>[0]);
  const page = await context.newPage(),
    errors = captureErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: undefined,
    });
    localStorage.setItem(
      "nato-phonetic-trainer-results",
      '[{"invalid":"preserve me"}]',
    );
  });
  await clock(page);
  await page.goto("http://insecure.test:8787" + TRAINER);
  expect(await page.evaluate(() => window.isSecureContext)).toBe(false);
  await expect(
    page.getByText("Some saved entries could not be displayed.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Training →" }).tap();
  const buttons = page.locator("button.relative");
  await buttons.first().tap();
  await expect(buttons.first()).toBeDisabled();
  await page.clock.runFor(600);
  for (let i = 1; i < 26; i++) {
    await page.locator("button.relative").first().tap();
    await page.clock.runFor(600);
  }
  await expect(
    page.getByRole("heading", { name: "Detailed Results" }),
  ).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(stored).toHaveLength(2);
  expect(stored[1]).toEqual({ invalid: "preserve me" });
  expect(typeof stored[0].id).toBe("string");
  await page.screenshot({
    path: "test-results/trainer-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await context.close();
});
test("compiled dungeon starts, pauses, retries, preserves separate storage and returns home without HUD navigation", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const probe = { contexts: [] as AudioContext[], tones: 0 };
    Object.assign(window, { __audioProbe: probe });
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts.push(this);
      }
      createOscillator() {
        probe.tones++;
        return super.createOscillator();
      }
    };
  });
  await page.goto(GAME);
  await expect(page).toHaveTitle("One Minute Dungeon | Trial & Elias");
  await expect(page.locator("#game canvas")).toHaveCount(1);
  expect(await page.evaluate(() => Object.hasOwn(window, "__DUNGEON__"))).toBe(
    false,
  );
  await page.evaluate(
    ({ key, history }) => localStorage.setItem(key, JSON.stringify(history)),
    { key: KEY, history: [record("retained", 26, 20000)] },
  );
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  await expect(page.locator("#countdown")).toBeVisible();
  await expect(page.getByRole("link", { name: "← Trial & Elias" })).toHaveCount(
    0,
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(200);
  await page.keyboard.up("d");
  await page.mouse.click(900, 450);
  await page.keyboard.press("Space");
  await expect(page.locator("#dash-label")).toContainText("DASH");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __audioProbe: { tones: number } })
            .__audioProbe.tones,
      ),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __audioProbe: { contexts: AudioContext[] } })
          .__audioProbe.contexts[0]?.state,
    ),
  ).toBe("running");

  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByText("Run paused.")).toBeVisible();
  const paused = await page.locator("#countdown").textContent();
  await page.waitForTimeout(150);
  expect(await page.locator("#countdown").textContent()).toBe(paused);
  await page.keyboard.press("r");
  await expect(page.locator("#validity")).toHaveText("COMPETITIVE");
  expect(
    Number(await page.locator("#countdown").textContent()),
  ).toBeGreaterThan(59);
  await page.screenshot({ path: "test-results/integrated-dungeon.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Return to menu" }).click();
  await page.getByRole("button", { name: "Cosmetics", exact: true }).click();
  await expect(page.locator(".cosmetic-preview canvas")).toHaveCount(14);
  await page.getByRole("button", { name: "← Back", exact: true }).click();
  await page
    .getByRole("link", { name: "← Trial & Elias", exact: true })
    .click();
  await expect(page.locator("#projects .card")).toHaveCount(3);
  const saved = await page.evaluate(
    (key) => ({
      trainer: JSON.parse(localStorage.getItem(key)!),
      game: !!localStorage.getItem("one-minute-dungeon:v1"),
    }),
    KEY,
  );
  expect(saved.trainer[0].id).toBe("retained");
  expect(saved.game).toBe(true);
  expect(errors).toEqual([]);
});
