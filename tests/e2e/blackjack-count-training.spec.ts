import { test, expect } from "@playwright/test";
import { fixture, install, snapshot, errors } from "./blackjack-fixtures";
import { between } from "../../apps/blackjack-trainer/src/engine/engine";
import type { Command } from "../../apps/blackjack-trainer/src/engine/types";
function training(rounds = 10) {
  const f = fixture();
  let s = f.state;
  function send(c: Command) {
    s = f.apply(s, c);
  }
  for (let n = 0; n < rounds; n++) {
    if (s.round) send({ type: "next" });
    send({ type: "chip", position: 0, kind: "main", chip: 25 });
    send({ type: "deal" });
    while (!between(s))
      s.round!.phase === "insurance"
        ? send({ type: "insurance", position: 0, choice: "decline" })
        : send({ type: "action", action: "stand", handId: s.round!.active! });
  }
  return { ...f, s };
}
const show = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Show running count", exact: true });
const hide = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Hide running count", exact: true });

test("nine saved rounds stay locked; the tenth unlocks current integer guesses without revealing", async ({
  page,
}) => {
  const f = training(9),
    failures = errors(page);
  await install(page, f.s);
  await expect(page.locator(".count-guess")).toContainText(
    "Guess unlocks in 1 rounds.",
  );
  await expect(
    page.getByLabel("Running count guess", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".count-guess")).toContainText("1 rounds");
  await page.getByRole("button", { name: "Rebet & Deal", exact: true }).click();
  while (!between(await snapshot(page))) {
    const s = await snapshot(page);
    if (s.round!.phase === "insurance")
      await page
        .getByRole("button", { name: /Decline/ })
        .first()
        .click();
    else await page.getByRole("button", { name: "Stand", exact: true }).click();
  }
  const input = page.getByLabel("Running count guess", { exact: true }),
    submit = page.getByRole("button", { name: "Submit Guess", exact: true });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(submit).toBeDisabled();
  await input.fill("1.5");
  await expect(submit).toBeDisabled();
  await input.fill("");
  await expect(submit).toBeDisabled();
  const actual = (await snapshot(page)).shoe.running;
  await input.fill(String(actual));
  await submit.click();
  await expect(page.locator(".count-guess")).toContainText("Correct!");
  await expect(
    page.getByLabel("Running count concealed", { exact: true }),
  ).toHaveText("•••");
  await input.fill(String(actual - 1));
  await submit.click();
  await expect(page.locator(".count-guess")).toContainText(
    "Incorrect. Try again.",
  );
  expect((await snapshot(page)).checks.at(-1)).toMatchObject({
    actual,
    correct: false,
  });
  expect((await snapshot(page)).countTraining.hiddenRounds).toBe(10);
  expect(failures).toEqual([]);
});

test("eligible peek invalidates input, survives refresh and charges exactly once on hide", async ({
  page,
}) => {
  const f = training();
  await install(page, f.s);
  const balance = (await snapshot(page)).balance;
  await page.getByLabel("Running count guess", { exact: true }).fill("123");
  await show(page).click();
  await expect(page.locator(".count-guess")).toHaveText(
    "You can only guess the count when count is hidden",
  );
  await expect(
    page.getByLabel("Running count guess", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Running count " + (await snapshot(page)).shoe.running, {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(hide(page)).toBeVisible();
  await hide(page).click();
  await expect(page.locator(".count-guess")).toContainText(
    "Cheaters never prosper",
  );
  await expect(page.locator(".guess-penalty span")).toHaveText("−100 chips");
  expect((await snapshot(page)).balance).toBe(balance - 200);
  await page.reload();
  await expect(show(page)).toBeVisible();
  for (let n = 0; n < 3; n++) {
    await show(page).click();
    await expect(hide(page)).toBeVisible();
    await hide(page).click();
    await expect(show(page)).toBeVisible();
  }
  const s = await snapshot(page);
  expect(s.balance).toBe(balance - 200);
  expect(s.ledger.filter((t) => t.kind === "count peek penalty")).toHaveLength(
    1,
  );
  expect(s.countTraining.hiddenRounds).toBe(0);
});

test("ordinary early toggles are free and Settings cannot bypass an eligible peek", async ({
  page,
}) => {
  const f = training(9);
  await install(page, f.s);
  const balance = f.s.balance;
  await show(page).click();
  await expect(hide(page)).toBeVisible();
  await hide(page).click();
  await expect(show(page)).toBeVisible();
  expect((await snapshot(page)).balance).toBe(balance);
  expect((await snapshot(page)).countTraining.hiddenRounds).toBe(0);
  const g = training();
  await page.goto("/");
  await install(page, g.s);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await page.getByLabel("Running count", { exact: true }).click();
  await expect(page.getByLabel("Running count", { exact: true })).toBeChecked();
  await page.getByLabel("Running count", { exact: true }).click();
  await expect(
    page.getByLabel("Running count", { exact: true }),
  ).not.toBeChecked();
  expect((await snapshot(page)).balance).toBe(g.s.balance - 200);
  expect(
    (await snapshot(page)).ledger.filter(
      (t) => t.kind === "count peek penalty",
    ),
  ).toHaveLength(1);
});

test("inline guesses and warning fit existing table at desktop, portrait and landscape sizes", async ({
  page,
}) => {
  const f = training();
  await install(page, f.s);
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 800],
    [844, 390],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    const result = await page.locator(".count-instrument").evaluate((el) => {
      const r = el.getBoundingClientRect(),
        table = el.closest(".table-stage")!.getBoundingClientRect();
      return {
        inside:
          r.left >= table.left &&
          r.right <= table.right &&
          r.top >= table.top &&
          r.bottom <= table.bottom,
        overflow: el.scrollWidth > el.clientWidth + 1,
      };
    });
    expect(result).toEqual({ inside: true, overflow: false });
    await expect(
      page.getByLabel("Running count guess", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/count-guess-" + width + ".png",
    });
  }
  await show(page).click();
  await expect(page.locator(".guess-warning")).toBeVisible();
  await page.screenshot({ path: "test-results/count-peek-warning.png" });
  await hide(page).click();
  await expect(page.locator(".guess-penalty")).toBeVisible();
  await page.screenshot({ path: "test-results/count-peek-penalty.png" });
});

test("low bankroll never becomes negative; reset clears saved eligibility", async ({
  page,
}) => {
  const f = training();
  f.s.ledgerBase += 75 - f.s.balance;
  f.s.balance = 75;
  await install(page, f.s);
  await show(page).click();
  await expect(hide(page)).toBeVisible();
  await hide(page).click();
  await expect(page.locator(".guess-penalty span")).toHaveText("−37.5 chips");
  expect((await snapshot(page)).balance).toBe(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Data", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Reset balance", exact: true })
    .click();
  await expect.poll(async () => (await snapshot(page)).balance).toBe(2000);
  expect((await snapshot(page)).countTraining.hiddenRounds).toBe(0);
  await page.reload();
  await expect(page.locator(".count-guess")).toContainText(
    "Guess unlocks in 10 rounds.",
  );
});
