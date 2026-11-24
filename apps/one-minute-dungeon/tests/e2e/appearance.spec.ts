import { test, expect, type Page } from "@playwright/test";
import { defaults } from "../../src/storage/schemas";
import { STORAGE_KEY } from "../../src/storage/StorageManager";
const canvas = (page: Page, setting: string, value: string) =>
  page.locator(
    'canvas[data-preview-setting="' +
      setting +
      '"][data-preview-value="' +
      value +
      '"]',
  );
const picture = async (page: Page, setting: string, value: string) =>
  canvas(page, setting, value).evaluate((c) =>
    (c as HTMLCanvasElement).toDataURL(),
  );
async function open(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Cosmetics", exact: true }).click();
  await expect(page.locator(".appearance-catalog")).toBeVisible();
}
async function unlock(page: Page) {
  const save = defaults();
  save.achievements = [
    "first",
    "speed",
    "untouchable",
    "bare",
    "treasure",
    "secret",
    "hundred",
    "guardian",
    "challenge",
  ];
  await page.addInitScript(
    ({ key, value }) => {
      if (!sessionStorage.getItem("appearance-fixture")) {
        localStorage.setItem(key, value);
        sessionStorage.setItem("appearance-fixture", "1");
      }
    },
    { key: STORAGE_KEY, value: JSON.stringify(save) },
  );
}
test("shows all fourteen faithful previews, including readable locked rewards, without changing progress", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Cosmetics", exact: true }).waitFor();
  const before = await page.evaluate(
    (key) => ({
      saved: localStorage.getItem(key),
      state: JSON.stringify(
        (window as unknown as { __DUNGEON__: { state: unknown } }).__DUNGEON__
          .state,
      ),
    }),
    STORAGE_KEY,
  );
  await page.getByRole("button", { name: "Cosmetics", exact: true }).click();
  await expect(page.locator(".cosmetic-preview canvas")).toHaveCount(14);
  await expect(page.locator(".cosmetic:disabled")).toHaveCount(9);
  await expect(page.locator('.cosmetic[aria-pressed="true"]')).toHaveCount(5);
  await expect(
    page.locator('[data-setting="skin"][data-value="jade"]'),
  ).toContainText("First Escape");
  await expect(
    page.locator('[data-setting="title"][data-value="Guardian Slayer"]'),
  ).toContainText("Guardian Slayer");
  expect(
    await page
      .locator(".cosmetic:disabled")
      .first()
      .evaluate((node) => getComputedStyle(node).opacity),
  ).toBe("1");
  await expect(page.locator("#game canvas")).toHaveCount(1);
  await page
    .locator('button[data-setting="skin"][data-value="jade"]')
    .dispatchEvent("click");
  await expect(
    page.locator('button[data-setting="skin"][data-value="ember"]'),
  ).toHaveAttribute("aria-pressed", "true");
  const initial = await picture(page, "skin", "ember");
  await expect.poll(() => picture(page, "skin", "ember")).not.toBe(initial);
  const after = await page.evaluate(
    (key) => ({
      saved: localStorage.getItem(key),
      state: JSON.stringify(
        (window as unknown as { __DUNGEON__: { state: unknown } }).__DUNGEON__
          .state,
      ),
    }),
    STORAGE_KEY,
  );
  expect(after).toEqual(before);
  for (const [skin, color] of [
    ["ember", "#a53e48"],
    ["jade", "#339484"],
    ["violet", "#8c5cbb"],
    ["ivory", "#c79b4f"],
  ]) {
    const count = await canvas(page, "skin", skin!).evaluate((c, color) => {
      const data = (c as HTMLCanvasElement)
        .getContext("2d")!
        .getImageData(
          0,
          0,
          (c as HTMLCanvasElement).width,
          (c as HTMLCanvasElement).height,
        ).data;
      const rgb = parseInt(color.slice(1), 16);
      let count = 0;
      for (let i = 0; i < data.length; i += 4)
        if (
          data[i] === ((rgb >>> 16) & 255) &&
          data[i + 1] === ((rgb >>> 8) & 255) &&
          data[i + 2] === (rgb & 255)
        )
          count++;
      return count;
    }, color!);
    expect(count).toBeGreaterThan(20);
  }
  await page.screenshot({
    path: "test-results/appearance-overview.png",
    fullPage: true,
  });
  await page.locator("#appearance-title").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/appearance-ghost-and-titles.png",
  });
  expect(errors).toEqual([]);
});
test("animates every category while reduced motion produces distinct useful stills", async ({
  page,
}) => {
  await open(page);
  for (const [setting, value] of [
    ["skin", "ember"],
    ["sword", "gold"],
    ["trail", "relic"],
    ["ghostColor", "cyan"],
    ["title", "Crypt Wanderer"],
  ]) {
    const before = await picture(page, setting!, value!);
    await expect
      .poll(() => picture(page, setting!, value!), {
        intervals: [60],
        timeout: 1500,
      })
      .not.toBe(before);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".appearance-catalog")).toHaveAttribute(
    "data-preview-motion",
    "still",
  );
  const still = await page
    .locator(".cosmetic-preview canvas")
    .evaluateAll((nodes) =>
      nodes.map((c) => (c as HTMLCanvasElement).toDataURL()),
    );
  await page.waitForTimeout(250);
  expect(
    await page
      .locator(".cosmetic-preview canvas")
      .evaluateAll((nodes) =>
        nodes.map((c) => (c as HTMLCanvasElement).toDataURL()),
      ),
  ).toEqual(still);
  expect(await picture(page, "sword", "steel")).not.toBe(
    await picture(page, "sword", "gold"),
  );
  expect(await picture(page, "trail", "ember")).not.toBe(
    await picture(page, "trail", "relic"),
  );
  expect(await picture(page, "ghostColor", "cyan")).not.toBe(
    await picture(page, "ghostColor", "violet"),
  );
  await expect(page.locator(".preview-title").last()).toHaveText(
    "Guardian Slayer",
  );
  for (const [id, expected] of [
    ["cyan", [38, 64, 54]],
    ["violet", [65, 51, 55]],
  ] as const) {
    const rgba = await canvas(page, "ghostColor", id).evaluate((c) => {
      const canvas = c as HTMLCanvasElement;
      return Array.from(
        canvas
          .getContext("2d")!
          .getImageData(
            Math.floor((52.5 * canvas.width) / 112),
            Math.floor((38.5 * canvas.height) / 84),
            1,
            1,
          ).data,
      );
    });
    for (let channel = 0; channel < 3; channel++)
      expect(Math.abs(rgba[channel]! - expected[channel]!)).toBeLessThanOrEqual(
        2,
      );
  }
  await page.locator("#appearance-title").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/appearance-still.png" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".appearance-catalog")).toHaveAttribute(
    "data-preview-motion",
    "animated",
  );
  const resumed = await picture(page, "skin", "ember");
  await expect.poll(() => picture(page, "skin", "ember")).not.toBe(resumed);
});
test("equips with keyboard, retains focus and persists all categories without changing other progress", async ({
  page,
}) => {
  await unlock(page);
  await open(page);
  const before = await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key)!);
    delete data.settings;
    return data;
  }, STORAGE_KEY);
  for (const [setting, value] of [
    ["skin", "jade"],
    ["sword", "gold"],
    ["trail", "jade"],
    ["ghostColor", "violet"],
    ["title", "Guardian Slayer"],
  ]) {
    const option = page.locator(
      'button[data-setting="' + setting + '"][data-value="' + value + '"]',
    );
    await option.focus();
    await page.keyboard.press("Enter");
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect(option).toBeFocused();
  }
  await page.reload();
  await page.getByRole("button", { name: "Cosmetics", exact: true }).click();
  for (const [setting, value] of [
    ["skin", "jade"],
    ["sword", "gold"],
    ["trail", "jade"],
    ["ghostColor", "violet"],
    ["title", "Guardian Slayer"],
  ])
    await expect(
      page.locator(
        'button[data-setting="' + setting + '"][data-value="' + value + '"]',
      ),
    ).toHaveAttribute("aria-pressed", "true");
  const after = await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key)!);
    delete data.settings;
    return data;
  }, STORAGE_KEY);
  expect(after).toEqual(before);
});
test("suspends hidden previews, disposes on navigation, and reopens safely", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".appearance-catalog")).toHaveAttribute(
    "data-preview-motion",
    "suspended",
  );
  const hidden = await picture(page, "trail", "ember");
  await page.waitForTimeout(250);
  expect(await picture(page, "trail", "ember")).toBe(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".appearance-catalog")).toHaveAttribute(
    "data-preview-motion",
    "animated",
  );
  await expect
    .poll(() => picture(page, "trail", "ember"), {
      timeout: 1500,
      intervals: [60],
    })
    .not.toBe(hidden);
  const host = await page.locator(".appearance-catalog").elementHandle();
  await page.getByRole("button", { name: "← Back", exact: true }).click();
  expect(await host!.getAttribute("data-preview-motion")).toBe("disposed");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Cosmetics", exact: true }).click();
    await expect(page.locator(".cosmetic-preview canvas")).toHaveCount(14);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
  }
  await page.getByRole("button", { name: "Enter the crypt" }).click();
  await expect(page.locator("#countdown")).toBeVisible();
});
test("respects reduced effects and fits high-DPI narrow layouts with readable titles", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const save = defaults();
  save.settings.reduced = true;
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(save) },
  );
  await open(page);
  await expect(page.locator(".appearance-catalog")).toHaveAttribute(
    "data-preview-motion",
    "still",
  );
  expect(await canvas(page, "skin", "ember").getAttribute("width")).toBe("224");
  const before = await picture(page, "trail", "jade");
  await page.waitForTimeout(250);
  expect(await picture(page, "trail", "jade")).toBe(before);
  const failures = await page.locator(".cosmetic").evaluateAll((options) =>
    options.flatMap((option) => {
      const box = option.getBoundingClientRect();
      return Array.from(
        option.querySelectorAll(
          ".cosmetic-preview,.cosmetic-copy,.preview-title",
        ),
      )
        .filter((child) => {
          const r = child.getBoundingClientRect();
          return (
            r.left < box.left ||
            r.right > box.right ||
            child.scrollWidth > child.clientWidth + 1
          );
        })
        .map(() => option.textContent);
    }),
  );
  expect(failures).toEqual([]);
  expect(
    await page
      .locator(".panel-shell")
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/appearance-mobile.png",
    fullPage: true,
  });
  await context.close();
});
